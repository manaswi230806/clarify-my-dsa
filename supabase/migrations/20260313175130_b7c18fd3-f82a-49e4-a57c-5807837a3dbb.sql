-- Keep mastered topics re-playable and unlock next topic server-side
-- so users can always retake arrays/strings even after 100%

CREATE OR REPLACE FUNCTION public.normalize_topic_progress_for_retake()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Normalize numeric fields
  NEW.best_score := GREATEST(COALESCE(NEW.best_score, 0), 0);
  NEW.progress := LEAST(GREATEST(COALESCE(NEW.progress, 0), 0), 100);
  NEW.tests_taken := GREATEST(COALESCE(NEW.tests_taken, 0), 0);

  -- Never keep "completed" as a blocking status; keep mastered topics available for retake
  IF NEW.status = 'completed' THEN
    NEW.status := 'available';
  END IF;

  -- Arrays should never be locked
  IF NEW.topic = 'arrays' AND NEW.status = 'locked' THEN
    NEW.status := 'available';
  END IF;

  -- Mastery state (100%) should stay available + completed_at set
  IF NEW.best_score >= 100 OR NEW.progress >= 100 THEN
    NEW.best_score := 100;
    NEW.progress := 100;
    NEW.status := 'available';
    NEW.completed_at := COALESCE(NEW.completed_at, now());
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.unlock_next_topic_on_mastery()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF COALESCE(NEW.best_score, 0) >= 100 OR COALESCE(NEW.progress, 0) >= 100 THEN
    IF NEW.topic = 'arrays' THEN
      UPDATE public.topic_progress
      SET status = 'available',
          unlocked_at = COALESCE(unlocked_at, now()),
          updated_at = now()
      WHERE user_id = NEW.user_id
        AND topic = 'strings'
        AND status = 'locked';
    ELSIF NEW.topic = 'strings' THEN
      UPDATE public.topic_progress
      SET status = 'available',
          unlocked_at = COALESCE(unlocked_at, now()),
          updated_at = now()
      WHERE user_id = NEW.user_id
        AND topic = 'linked-lists'
        AND status = 'locked';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_topic_progress_normalize_retake ON public.topic_progress;
CREATE TRIGGER trg_topic_progress_normalize_retake
BEFORE INSERT OR UPDATE ON public.topic_progress
FOR EACH ROW
EXECUTE FUNCTION public.normalize_topic_progress_for_retake();

DROP TRIGGER IF EXISTS trg_topic_progress_unlock_next ON public.topic_progress;
CREATE TRIGGER trg_topic_progress_unlock_next
AFTER INSERT OR UPDATE OF best_score, progress ON public.topic_progress
FOR EACH ROW
EXECUTE FUNCTION public.unlock_next_topic_on_mastery();

-- Backfill existing mastered rows to be re-playable (available)
UPDATE public.topic_progress
SET status = 'available',
    best_score = 100,
    progress = 100,
    completed_at = COALESCE(completed_at, now()),
    updated_at = now()
WHERE status = 'completed'
   OR best_score >= 100
   OR progress >= 100;

-- Ensure arrays is always available
UPDATE public.topic_progress
SET status = 'available',
    unlocked_at = COALESCE(unlocked_at, now()),
    updated_at = now()
WHERE topic = 'arrays'
  AND status = 'locked';

-- If arrays is mastered, strings must be available
UPDATE public.topic_progress tp
SET status = 'available',
    unlocked_at = COALESCE(tp.unlocked_at, now()),
    updated_at = now()
WHERE tp.topic = 'strings'
  AND tp.status = 'locked'
  AND EXISTS (
    SELECT 1
    FROM public.topic_progress p
    WHERE p.user_id = tp.user_id
      AND p.topic = 'arrays'
      AND (p.best_score >= 100 OR p.progress >= 100)
  );

-- If strings is mastered, linked-lists must be available
UPDATE public.topic_progress tp
SET status = 'available',
    unlocked_at = COALESCE(tp.unlocked_at, now()),
    updated_at = now()
WHERE tp.topic = 'linked-lists'
  AND tp.status = 'locked'
  AND EXISTS (
    SELECT 1
    FROM public.topic_progress p
    WHERE p.user_id = tp.user_id
      AND p.topic = 'strings'
      AND (p.best_score >= 100 OR p.progress >= 100)
  );
import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BookOpen, ArrowRight, Lightbulb, Code2 } from "lucide-react";

interface LearningContent {
  title: string;
  content: string;
  codeExample?: string;
  keyTakeaway: string;
}

export default function Learning() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as any;
  const [content, setContent] = useState<LearningContent[]>([]);
  const [currentLesson, setCurrentLesson] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!state) { navigate("/topics"); return; }
    generateLearningContent();
  }, []);

  const generateLearningContent = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("ai-analysis", {
        body: { topic: state.topic, gapType: state.gapType, analysisResults: state.analysisResults, score: state.score },
      });
      if (!error && data?.lessons) {
        setContent(data.lessons);
      } else {
        setContent(getFallbackContent(state.topic, state.gapType));
      }
    } catch {
      setContent(getFallbackContent(state.topic, state.gapType));
    } finally {
      setLoading(false);
    }
  };

  if (!state) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground">Generating personalized lessons...</p>
      </div>
    );
  }

  const lesson = content[currentLesson];

  const handleNext = () => {
    if (currentLesson < content.length - 1) {
      setCurrentLesson(currentLesson + 1);
    } else {
      navigate(`/test?topic=${state.topic}&type=retest`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-lg sticky top-0 z-20">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold">Personalized Learning</h1>
          </div>
          <span className="text-sm text-muted-foreground">Lesson {currentLesson + 1}/{content.length}</span>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 max-w-3xl">
        {/* Progress */}
        <div className="w-full h-2 rounded-full bg-muted mb-8">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${((currentLesson + 1) / content.length) * 100}%` }} />
        </div>

        {lesson && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">{lesson.title}</h2>
            <div className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{lesson.content}</div>
            
            {lesson.codeExample && (
              <div className="rounded-xl border bg-card p-6">
                <div className="flex items-center gap-2 text-sm font-medium text-primary mb-3">
                  <Code2 className="w-4 h-4" /> Code Example
                </div>
                <pre className="code-block overflow-x-auto whitespace-pre-wrap">{lesson.codeExample}</pre>
              </div>
            )}

            <div className="rounded-xl border border-accent/30 bg-accent/5 p-5">
              <div className="flex items-center gap-2 text-sm font-medium text-accent mb-2">
                <Lightbulb className="w-4 h-4" /> Key Takeaway
              </div>
              <p className="text-sm text-muted-foreground">{lesson.keyTakeaway}</p>
            </div>
          </div>
        )}

        <button
          onClick={handleNext}
          className="w-full h-12 mt-8 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
        >
          {currentLesson < content.length - 1 ? "Next Lesson" : "Start Re-test"}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function getFallbackContent(topic: string, gapType: string): LearningContent[] {
  return [
    {
      title: `Understanding ${topic} - Core Concepts`,
      content: `Let's review the fundamental concepts of ${topic} that you need to master.\n\nBased on your test results, we identified a ${gapType || "conceptual"} gap. This means you need to focus on strengthening your understanding of how ${topic} work at a fundamental level.`,
      keyTakeaway: `Focus on understanding WHY things work, not just HOW to use them.`,
    },
    {
      title: `Common Misconceptions in ${topic}`,
      content: `Many students struggle with ${topic} because of common misconceptions. Let's address the ones most relevant to your test results.\n\nRemember: making mistakes is part of learning. The key is understanding why your initial thinking was incorrect.`,
      codeExample: `// Example: Understanding the difference\n// between what you might expect\n// and what actually happens`,
      keyTakeaway: `Test your assumptions by tracing through code step by step.`,
    },
    {
      title: `Practice Strategy for ${topic}`,
      content: `Now that you understand the concepts better, here's how to practice effectively:\n\n1. Trace through code manually before running it\n2. Predict the output before checking\n3. Explain your reasoning out loud\n4. Focus on edge cases`,
      keyTakeaway: `You're ready for the re-test. Apply what you've learned!`,
    },
  ];
}

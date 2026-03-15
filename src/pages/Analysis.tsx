import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle, XCircle, Clock, TrendingUp, ArrowRight, MessageSquare } from "lucide-react";

interface AnalysisResult {
  questionNumber: number;
  question: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation: string;
  misconception?: string;
  userExplanation?: string;
  aiAnalysis?: string;
}

export default function Analysis() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as any;
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [gapType, setGapType] = useState("");
  const [loading, setLoading] = useState(true);
  const [aiSummary, setAiSummary] = useState("");

  useEffect(() => {
    if (!state) { navigate("/topics"); return; }
    analyzeResults();
  }, []);

  const analyzeResults = async () => {
    const { questions, answers, score, topic, testType, correctCount, totalQuestions } = state;

    // Build question breakdown
    const breakdown: AnalysisResult[] = questions.map((q: any, i: number) => {
      const a = answers[i];
      return {
        questionNumber: i + 1,
        question: q.question,
        userAnswer: q.options[a?.selectedOption] || "Not answered",
        correctAnswer: q.options[q.correctAnswer],
        isCorrect: a?.isCorrect || false,
        explanation: q.explanation,
        misconception: q.misconception,
        userExplanation: a?.explanation || "",
      };
    });
    setAnalysisResults(breakdown);

    // Try AI analysis
    try {
      const { data, error } = await supabase.functions.invoke("analyze-gaps", {
        body: { questions, answers, topic, score },
      });
      if (!error && data) {
        setGapType(data.gapType || "conceptual");
        setAiSummary(data.summary || "");
        // Update gap type in test session
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from("test_sessions")
            .update({ gap_type: data.gapType })
            .eq("user_id", user.id)
            .eq("topic", topic)
            .order("created_at", { ascending: false })
            .limit(1);
        }
      }
    } catch {
      setGapType("conceptual");
    } finally {
      setLoading(false);
    }
  };

  if (!state) return null;

  const { score, topic, testType, timeSpent, correctCount, totalQuestions } = state;
  const isPassed = score >= 100;

  const handleContinue = () => {
    if (isPassed) {
      toast.success("Congratulations! You've mastered this topic!");
      navigate("/topics");
    } else {
      navigate("/learning", { state: { topic, gapType, analysisResults, score } });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-lg sticky top-0 z-20">
        <div className="container mx-auto px-6 h-16 flex items-center">
          <h1 className="text-xl font-bold">Test Analysis</h1>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 max-w-3xl">
        {/* Score overview */}
        <div className={`rounded-2xl border p-8 mb-8 text-center ${
          isPassed ? "bg-green-500/5 border-green-500/30" : "bg-card border-border"
        }`}>
          <div className={`text-6xl font-bold mb-2 ${isPassed ? "text-green-500" : "text-primary"}`}>
            {score}%
          </div>
          <p className="text-muted-foreground mb-4">
            {correctCount}/{totalQuestions} correct • {Math.floor(timeSpent / 60)}m {timeSpent % 60}s
          </p>
          {isPassed ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 text-green-500 font-medium">
              <CheckCircle className="w-4 h-4" /> Topic Mastered!
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium">
              <TrendingUp className="w-4 h-4" /> Keep going — you'll get there!
            </div>
          )}
        </div>

        {/* AI Summary */}
        {loading ? (
          <div className="rounded-2xl border bg-card p-6 mb-8 flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-muted-foreground">AI is analyzing your responses...</span>
          </div>
        ) : aiSummary ? (
          <div className="rounded-2xl border bg-card p-6 mb-8">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> AI Analysis
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{aiSummary}</p>
            {gapType && (
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                Gap Type: {gapType}
              </div>
            )}
          </div>
        ) : null}

        {/* Question breakdown */}
        <h3 className="text-lg font-semibold mb-4">Question Breakdown</h3>
        <div className="space-y-4 mb-8">
          {analysisResults.map((r) => (
            <div key={r.questionNumber} className={`rounded-xl border p-5 ${
              r.isCorrect ? "bg-green-500/5 border-green-500/20" : "bg-destructive/5 border-destructive/20"
            }`}>
              <div className="flex items-start gap-3 mb-3">
                {r.isCorrect ? (
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="font-medium text-sm mb-2">Q{r.questionNumber}: {r.question}</p>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-muted-foreground">Your answer:</span> {r.userAnswer}</p>
                    {!r.isCorrect && <p><span className="text-muted-foreground">Correct answer:</span> <span className="text-green-500">{r.correctAnswer}</span></p>}
                    <p className="text-muted-foreground mt-2">{r.explanation}</p>
                  </div>
                </div>
              </div>
              {r.userExplanation && (
                <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <div className="flex items-center gap-2 text-xs text-primary font-medium mb-1">
                    <MessageSquare className="w-3 h-3" /> Your Explanation
                  </div>
                  <p className="text-sm text-muted-foreground">{r.userExplanation}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Action button */}
        <button
          onClick={handleContinue}
          className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
        >
          {isPassed ? "Back to Topics" : "Start Personalized Learning"}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

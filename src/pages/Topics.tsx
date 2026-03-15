import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Lock, CheckCircle, PlayCircle, ArrowRight, LogOut } from "lucide-react";

const TOPIC_ORDER = ["arrays", "strings", "linked-lists"];
const TOPIC_LABELS: Record<string, string> = { arrays: "Arrays", strings: "Strings", "linked-lists": "Linked Lists" };
const TOPIC_DESCRIPTIONS: Record<string, string> = {
  arrays: "Master array operations, indexing, searching and sorting techniques.",
  strings: "Learn string manipulation, pattern matching, and common algorithms.",
  "linked-lists": "Understand node-based data structures, traversal and pointer manipulation.",
};

interface TopicProgress {
  topic: string;
  status: string;
  best_score: number;
  progress: number;
  tests_taken: number;
  completed_at: string | null;
}

export default function Topics() {
  const [topics, setTopics] = useState<TopicProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadTopics();
  }, []);

  const loadTopics = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from("topic_progress")
      .select("topic, status, best_score, progress, tests_taken, completed_at")
      .eq("user_id", user.id);
    if (error) { toast.error("Failed to load topics"); return; }
    setTopics(data || []);
    setLoading(false);
  };

  const handleTopicClick = (topic: string) => {
    const tp = topics.find((t) => t.topic === topic);
    if (!tp || tp.status === "locked") {
      toast.error("Complete the previous topic first to unlock this one.");
      return;
    }
    // Always navigate to the selected topic's test - never redirect to next topic
    navigate(`/test?topic=${topic}`);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const getTopicStatus = (topic: string) => {
    const tp = topics.find((t) => t.topic === topic);
    if (!tp) return "locked";
    return tp.status;
  };

  const getTopicProgress = (topic: string) => {
    const tp = topics.find((t) => t.topic === topic);
    return tp?.progress || 0;
  };

  const isMastered = (topic: string) => {
    const tp = topics.find((t) => t.topic === topic);
    return tp && (tp.best_score >= 100 || tp.completed_at !== null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-lg sticky top-0 z-20">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold">ClarifyMyDSA</h1>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/dashboard")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Dashboard</button>
            <button onClick={handleSignOut} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-2">Select a Topic</h2>
          <p className="text-muted-foreground">Choose a topic to practice. Complete each with 100% to unlock the next.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {TOPIC_ORDER.map((topic) => {
            const status = getTopicStatus(topic);
            const progress = getTopicProgress(topic);
            const mastered = isMastered(topic);
            const isLocked = status === "locked";

            return (
              <button
                key={topic}
                onClick={() => handleTopicClick(topic)}
                disabled={isLocked}
                className={`rounded-2xl border p-6 text-left transition-all duration-300 ${
                  isLocked
                    ? "bg-card/30 border-border/30 opacity-50 cursor-not-allowed"
                    : mastered
                    ? "bg-green-500/5 border-green-500/30 hover:border-green-500/50 hover:-translate-y-1"
                    : "bg-card border-border hover:border-primary/50 hover:-translate-y-1"
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-bold">{TOPIC_LABELS[topic]}</h3>
                  {isLocked ? (
                    <Lock className="w-5 h-5 text-muted-foreground" />
                  ) : mastered ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <PlayCircle className="w-5 h-5 text-primary" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-4">{TOPIC_DESCRIPTIONS[topic]}</p>
                
                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-muted mb-2">
                  <div
                    className={`h-full rounded-full transition-all ${mastered ? "bg-green-500" : "bg-primary"}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{progress}% complete</span>
                  {mastered && <span className="text-green-500 font-medium">Mastered ✓</span>}
                </div>

                {!isLocked && (
                  <div className="mt-4 flex items-center gap-1 text-sm text-primary font-medium">
                    {mastered ? "Practice Again" : progress > 0 ? "Continue" : "Start Diagnostic Test"}
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

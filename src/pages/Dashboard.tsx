import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TrendingUp, Clock, Target, Award, ArrowLeft } from "lucide-react";

interface TestSession {
  id: string;
  topic: string;
  test_type: string;
  score: number;
  correct_count: number;
  total_questions: number;
  time_spent_seconds: number;
  passed: boolean;
  created_at: string;
  gap_type: string | null;
}

export default function Dashboard() {
  const [sessions, setSessions] = useState<TestSession[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from("test_sessions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) { toast.error("Failed to load sessions"); return; }
    setSessions(data || []);
    setLoading(false);
  };

  const avgScore = sessions.length > 0
    ? Math.round(sessions.reduce((sum, s) => sum + s.score, 0) / sessions.length)
    : 0;
  const totalTime = sessions.reduce((sum, s) => sum + s.time_spent_seconds, 0);

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
        <div className="container mx-auto px-6 h-16 flex items-center gap-4">
          <button onClick={() => navigate("/topics")} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">Dashboard</h1>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Target, label: "Tests Taken", value: sessions.length },
            { icon: TrendingUp, label: "Avg Score", value: `${avgScore}%` },
            { icon: Award, label: "Passed", value: sessions.filter((s) => s.passed).length },
            { icon: Clock, label: "Total Time", value: `${Math.round(totalTime / 60)}m` },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border bg-card p-4">
              <stat.icon className="w-5 h-5 text-primary mb-2" />
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Test history */}
        <h3 className="text-lg font-semibold mb-4">Test History</h3>
        {sessions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No tests taken yet. Start by selecting a topic!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((s) => (
              <div key={s.id} className="rounded-xl border bg-card p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium capitalize">{s.topic.replace("-", " ")}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {s.test_type} • {new Date(s.created_at).toLocaleDateString()} • {Math.round(s.time_spent_seconds / 60)}m
                  </p>
                </div>
                <div className={`text-lg font-bold ${s.passed ? "text-green-500" : "text-primary"}`}>
                  {s.score}%
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

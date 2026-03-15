import { useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle, TrendingUp } from "lucide-react";

export default function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as any;

  if (!state) {
    navigate("/topics");
    return null;
  }

  const { score, topic, correctCount, totalQuestions, timeSpent } = state;
  const isPassed = score >= 100;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className={`rounded-2xl border p-8 text-center ${
          isPassed ? "bg-green-500/5 border-green-500/30" : "bg-card border-border"
        }`}>
          <div className={`text-7xl font-bold mb-4 ${isPassed ? "text-green-500" : "text-primary"}`}>
            {score}%
          </div>
          <h2 className="text-2xl font-bold mb-2">
            {isPassed ? "Topic Mastered!" : "Keep Practicing!"}
          </h2>
          <p className="text-muted-foreground mb-6">
            {correctCount}/{totalQuestions} correct • {Math.floor((timeSpent || 0) / 60)}m {(timeSpent || 0) % 60}s
          </p>
          {isPassed ? (
            <div className="inline-flex items-center gap-2 text-green-500 mb-6">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Congratulations!</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 text-primary mb-6">
              <TrendingUp className="w-5 h-5" />
              <span className="font-medium">You're making progress!</span>
            </div>
          )}
          <button
            onClick={() => navigate("/topics")}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            Back to Topics <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

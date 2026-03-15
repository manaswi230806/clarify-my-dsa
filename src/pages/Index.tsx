import { useNavigate } from "react-router-dom";
import { ArrowRight, Brain, Target, Zap, TrendingUp, BookOpen, Award, Sparkles } from "lucide-react";

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 hero-gradient" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: "1s" }} />

        <div className="absolute top-32 left-20 animate-float">
          <div className="p-4 rounded-2xl bg-card/50 backdrop-blur-lg border border-border/50">
            <Brain className="w-8 h-8 text-primary" />
          </div>
        </div>
        <div className="absolute bottom-40 right-32 animate-float" style={{ animationDelay: "2s" }}>
          <div className="p-4 rounded-2xl bg-card/50 backdrop-blur-lg border border-border/50">
            <Target className="w-8 h-8 text-accent" />
          </div>
        </div>

        <div className="container mx-auto px-6 pt-24 relative z-10">
          <div className="max-w-4xl mx-auto text-center animate-slide-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-8">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">AI-Powered Personalized Learning</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6">
              Master DSA Through <span className="text-gradient">Understanding</span>,{" "}
              <br className="hidden md:block" />Not Memorization
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              We diagnose your <span className="text-accent font-semibold">misconceptions</span>, not just wrong answers.
              Get personalized learning paths that address
              <span className="text-primary font-semibold"> exactly where you're stuck</span>.
            </p>
            <button
              onClick={() => navigate("/auth")}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-accent text-accent-foreground font-bold h-16 rounded-2xl px-10 text-lg shadow-[var(--shadow-button)] hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 group"
            >
              Start Learning Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm">Misconception Detection</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-sm">Personalized Paths</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent" />
                <span className="text-sm">Confidence Tracking</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Why DSA<span className="text-primary">Mind</span> Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">Unlike traditional courses, we focus on diagnosing and fixing your specific gaps.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Brain, title: "Misconception Detection", desc: "Our AI identifies exactly where your understanding breaks down, not just which answers are wrong." },
              { icon: Target, title: "Targeted Learning", desc: "Learn only what you need. No wasted time on concepts you already understand." },
              { icon: Zap, title: "Code-Based MCQs", desc: "Real code snippets test your ability to trace, debug, and understand program behavior." },
              { icon: TrendingUp, title: "Confidence Tracking", desc: "Track your confidence trends, not just accuracy. True mastery comes from understanding." },
              { icon: BookOpen, title: "Step-by-Step Reasoning", desc: "Visual explanations and dry runs help you see exactly how algorithms work." },
              { icon: Award, title: "Progression System", desc: "Clear criteria for moving forward. You'll know exactly when you're ready for the next topic." },
            ].map((f, i) => (
              <div key={i} className="rounded-2xl border bg-card/50 backdrop-blur-xl border-border/50 group hover:border-primary/50 transition-all duration-300 hover:-translate-y-1">
                <div className="p-8">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                    <f.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{f.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">How It <span className="text-primary">Works</span></h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">A systematic approach to finding and fixing your knowledge gaps.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {[
              { step: "01", title: "Take Diagnostic Test", desc: "Answer 5 code-based MCQs designed to reveal specific misconceptions.", items: ["Read-only code snippets", "Explain your thinking", "Timed responses"] },
              { step: "02", title: "AI Analyzes Your Gaps", desc: "We classify your difficulty into conceptual gaps, logical errors, or implementation issues.", items: ["Pattern recognition", "Misconception mapping", "Confidence analysis"] },
              { step: "03", title: "Learn What You Need", desc: "Receive targeted micro-lessons addressing only your specific gap.", items: ["Visual explanations", "Step-by-step reasoning", "No filler content"] },
              { step: "04", title: "Prove Your Understanding", desc: "Take a follow-up test to verify your misconception has been resolved.", items: ["Focused questions", "Measure improvement", "Clear progression"] },
            ].map((s) => (
              <div key={s.step} className="rounded-2xl border bg-card shadow-[var(--shadow-card)] relative overflow-hidden group hover:border-primary/50 transition-all duration-300">
                <div className="absolute -right-4 -top-4 text-[120px] font-bold text-primary/5 select-none">{s.step}</div>
                <div className="p-8 relative z-10">
                  <div className="text-sm font-bold text-primary mb-2">STEP {s.step}</div>
                  <h3 className="text-2xl font-bold mb-3">{s.title}</h3>
                  <p className="text-muted-foreground mb-6">{s.desc}</p>
                  <ul className="space-y-2">
                    {s.items.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm">
                        <div className="w-4 h-4 rounded-full bg-accent/20 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                        </div>
                        <span className="text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-background to-accent/10" />
        <div className="container mx-auto px-6 relative z-10 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to <span className="text-primary">Master</span> DSA?</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Join students who are learning DSA through understanding, not memorization.
          </p>
          <button
            onClick={() => navigate("/auth")}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-accent text-accent-foreground font-bold h-14 rounded-2xl px-8 text-lg shadow-[var(--shadow-button)] hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 group"
          >
            Get Started Now <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border/50">
        <div className="container mx-auto px-6 text-center text-muted-foreground text-sm">
          © 2026 ClarifyMyDSA. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

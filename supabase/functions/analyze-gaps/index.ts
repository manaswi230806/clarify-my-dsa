import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { questions, answers, topic, score } = await req.json();

    const incorrectQuestions = questions.filter((_: any, i: number) => !answers[i]?.isCorrect);
    const misconceptions = incorrectQuestions.map((q: any) => q.misconception).filter(Boolean);

    let gapType = "conceptual";
    if (misconceptions.some((m: string) => m.includes("complexity") || m.includes("space"))) {
      gapType = "complexity-analysis";
    } else if (misconceptions.some((m: string) => m.includes("off-by-one") || m.includes("bounds") || m.includes("indexing"))) {
      gapType = "implementation";
    } else if (misconceptions.some((m: string) => m.includes("comparison") || m.includes("mutability"))) {
      gapType = "language-specifics";
    }

    let summary = "";
    if (score >= 100) {
      summary = `Excellent! You've demonstrated complete mastery of ${topic}. All concepts are well understood.`;
    } else if (score >= 60) {
      summary = `Good progress on ${topic}! You have a solid foundation but need to strengthen your understanding of ${gapType.replace("-", " ")}. Focus on the questions you missed and review the underlying concepts.`;
    } else {
      summary = `You're building your understanding of ${topic}. The main gap identified is in ${gapType.replace("-", " ")}. Don't worry — the personalized learning module will help you address these specific areas.`;
    }

    return new Response(JSON.stringify({ gapType, summary, misconceptions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

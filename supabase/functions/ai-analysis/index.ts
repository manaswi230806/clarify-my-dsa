import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { topic, gapType, analysisResults, score } = await req.json();

    const lessons = generateLessons(topic, gapType, score);

    return new Response(JSON.stringify({ lessons }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function generateLessons(topic: string, gapType: string, score: number) {
  const topicLabel = topic.replace("-", " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
  
  return [
    {
      title: `Understanding ${topicLabel} — Core Concepts`,
      content: `Let's strengthen your understanding of ${topicLabel}.\n\nBased on your test (score: ${score}%), we identified a "${gapType}" gap. This lesson focuses on the fundamentals you need to solidify.\n\nKey principles:\n• Understand the underlying data structure\n• Know time & space complexity for common operations\n• Trace through code step by step before predicting output`,
      keyTakeaway: `Focus on understanding WHY operations have their specific time complexities, not just memorizing them.`,
    },
    {
      title: `Common Pitfalls in ${topicLabel}`,
      content: `These are the most common mistakes students make with ${topicLabel}:\n\n1. Off-by-one errors in indexing\n2. Confusing time complexity of different operations\n3. Not considering edge cases (empty, single element)\n4. Misunderstanding mutability\n\nFor each mistake, ask yourself: "What did I assume, and why was it wrong?"`,
      codeExample: `// Always trace through examples:\n// Step 1: What is the initial state?\n// Step 2: What changes at each step?\n// Step 3: What is the final result?`,
      keyTakeaway: `The best way to avoid mistakes is to trace through code manually before making assumptions.`,
    },
    {
      title: `Practice & Mastery`,
      content: `You're almost ready for the re-test! Here's your strategy:\n\n1. For each question, read ALL options before choosing\n2. Trace through any code snippets line by line\n3. Use your voice explanation to articulate your reasoning\n4. Pay special attention to edge cases\n\nRemember: understanding beats memorization every time.`,
      keyTakeaway: `You've reviewed the concepts — now prove your understanding in the re-test!`,
    },
  ];
}

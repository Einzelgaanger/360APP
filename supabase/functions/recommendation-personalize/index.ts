import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/growth-hub.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const CLAUDE_API_KEY = Deno.env.get("CLAUDE_API_KEY");
    if (!CLAUDE_API_KEY) throw new Error("CLAUDE_API_KEY not configured");

    const body = await req.json().catch(() => ({}));
    const focusArea = String(body.focusArea || "").slice(0, 200);
    const rankedItems = Array.isArray(body.rankedItems) ? body.rankedItems.slice(0, 8) : [];
    if (!focusArea || rankedItems.length === 0) {
      return new Response(JSON.stringify({ narratives: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `You are improving "${focusArea}".
For each ranked item below, write one short "why_picked" sentence and one "why_relevant" sentence.
Return ONLY JSON array with: resource_id, why_picked, why_relevant.

Items:
${JSON.stringify(rankedItems.map((i: Record<string, unknown>) => ({
  resource_id: i.resource_id,
  title: i.title,
  source: i.source,
  score_breakdown: i.score_breakdown,
  reason_codes: i.reason_codes,
})))}`;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: Deno.env.get("CLAUDE_MODEL") || "claude-3-5-sonnet-20241022",
        max_tokens: 1200,
        system: "Return valid JSON only. Keep each sentence concise and actionable.",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Claude personalization error: ${res.status} ${text}`);
    }

    const payload = await res.json();
    const text = payload?.content?.[0]?.text || "[]";
    const match = text.match(/\[[\s\S]*\]/);
    const narratives = match ? JSON.parse(match[0]) : [];

    return new Response(JSON.stringify({ narratives: Array.isArray(narratives) ? narratives : [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("recommendation-personalize error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});


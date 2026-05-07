// Personalized growth research engine — uses Gemini with Google Search grounding
// to find real, current articles, videos, books, and courses for a user's growth area.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { focusArea, feedbackContext, currentScore } = await req.json();

    if (!focusArea || typeof focusArea !== "string" || focusArea.length > 200) {
      return new Response(JSON.stringify({ error: "focusArea required (max 200 chars)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const userPrompt = `I'm working on improving my "${focusArea}" skill at work. ${
      currentScore ? `My current peer-rated score is ${currentScore}/5.` : ""
    }

Here's the qualitative feedback from my colleagues about this area:
${(feedbackContext || "").slice(0, 1500) || "(no specific feedback provided)"}

Find me 6-8 highly specific, real, currently-available learning resources that directly address my growth area. Mix the formats:
- 2-3 in-depth articles or essays from credible sources (HBR, MIT Sloan, McKinsey, First Round Review, well-known thought leaders)
- 1-2 books with author and short reason it's relevant
- 1-2 talks/videos (TED, YouTube, conference talks)
- 1 framework, model, or practical exercise I can do this week

For each resource, return a JSON object with fields: title, type ("article" | "book" | "video" | "exercise"), source (publisher/platform/author), url (if available), why_relevant (2 sentences tying it directly to my feedback), time_commitment (e.g. "10 min read", "6 hr book", "18 min watch"), and difficulty ("foundational" | "intermediate" | "advanced").

Return ONLY a JSON array, no prose, no markdown fences.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: "You are a senior leadership coach and learning curator. You only recommend real, currently-existing resources. Use web search to verify resources before recommending. Never invent URLs." },
          { role: "user", content: userPrompt },
        ],
        tools: [{ type: "google_search" }],
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, try again in a minute." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: "AI workspace credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await aiRes.text();
      throw new Error(`AI gateway: ${aiRes.status} ${t}`);
    }

    const data = await aiRes.json();
    const text = data.choices?.[0]?.message?.content || "";

    // Extract JSON array
    const match = text.match(/\[[\s\S]*\]/);
    let resources: any[] = [];
    if (match) {
      try { resources = JSON.parse(match[0]); } catch {/* fallthrough */}
    }
    if (!Array.isArray(resources) || resources.length === 0) {
      return new Response(JSON.stringify({ error: "Could not parse resources", raw: text.slice(0, 500) }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Sanitize
    resources = resources.slice(0, 10).map((r) => ({
      title: String(r.title || "").slice(0, 200),
      type: ["article", "book", "video", "exercise"].includes(r.type) ? r.type : "article",
      source: String(r.source || "").slice(0, 100),
      url: typeof r.url === "string" && r.url.startsWith("http") ? r.url : null,
      why_relevant: String(r.why_relevant || "").slice(0, 400),
      time_commitment: String(r.time_commitment || "").slice(0, 50),
      difficulty: ["foundational", "intermediate", "advanced"].includes(r.difficulty) ? r.difficulty : "intermediate",
    }));

    return new Response(JSON.stringify({ resources }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("research-resources error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// adaptive-resources — personalised learning recommender.
// Reads the user's interactions, feedback, reflections, and 360 scores;
// builds a preference profile; asks Lovable AI to generate a fresh batch
// of recommendations tailored to that profile, returning each item with
// an explanation of *why* it was picked.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Validate JWT (function deploys with verify_jwt = true by default)
    const authHeader = req.headers.get("Authorization") || "";
    const jwt = authHeader.replace("Bearer ", "");

    const userClient = createClient(SUPABASE_URL, jwt, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });
    const adminClient = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const body = await req.json().catch(() => ({}));
    const focusArea: string = String(body.focusArea || "").slice(0, 200);
    const currentScore: number | undefined = typeof body.currentScore === "number" ? body.currentScore : undefined;
    const feedbackContext: string = String(body.feedbackContext || "").slice(0, 1500);

    if (!focusArea) {
      return new Response(JSON.stringify({ error: "focusArea required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Build preference profile from past interactions + feedback + reflections
    const [interactions, feedbackRows, reflections] = await Promise.all([
      adminClient.from("learning_interactions").select("resource_format, focus_area, action, duration_seconds, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(200),
      adminClient.from("resource_feedback").select("resource_title, focus_area, relevance_score, reason_tag, note, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(100),
      adminClient.from("learning_reflections").select("week_starting, what_i_learned, what_changed, what_next").eq("user_id", userId).order("week_starting", { ascending: false }).limit(6),
    ]);

    const formatScores: Record<string, { sum: number; n: number }> = {};
    const focusScores: Record<string, { sum: number; n: number }> = {};
    const dismissedTitles = new Set<string>();
    const greatFitTitles = new Set<string>();
    const tooBasic: string[] = [];
    const offTopic: string[] = [];

    (feedbackRows.data || []).forEach((f: any) => {
      const title = String(f.resource_title || "").slice(0, 120);
      if (f.relevance_score >= 4 || f.reason_tag === "great_fit") greatFitTitles.add(title);
      if (f.reason_tag === "too_basic") tooBasic.push(title);
      if (f.reason_tag === "off_topic") offTopic.push(title);
    });

    (interactions.data || []).forEach((i: any) => {
      const fmt = i.resource_format || "article";
      if (!formatScores[fmt]) formatScores[fmt] = { sum: 0, n: 0 };
      const weight = i.action === "completed" ? 3 : i.action === "opened" ? 2 : i.action === "saved" ? 2 : i.action === "dismissed" ? -2 : 0.5;
      formatScores[fmt].sum += weight;
      formatScores[fmt].n += 1;

      if (i.focus_area) {
        if (!focusScores[i.focus_area]) focusScores[i.focus_area] = { sum: 0, n: 0 };
        focusScores[i.focus_area].sum += weight;
        focusScores[i.focus_area].n += 1;
      }
      if (i.action === "dismissed" && i.focus_area === focusArea) dismissedTitles.add(String(i.metadata?.resource_title || ""));
    });

    const preferredFormats = Object.entries(formatScores)
      .map(([k, v]) => ({ format: k, score: v.sum / Math.max(1, v.n), n: v.n }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(x => x.format);

    const profile = {
      preferredFormats: preferredFormats.length ? preferredFormats : ["article", "video", "exercise"],
      strongFocusAreas: Object.entries(focusScores).filter(([, v]) => v.sum / Math.max(1, v.n) > 1.5).map(([k]) => k).slice(0, 3),
      tooBasicSignals: tooBasic.slice(0, 5),
      offTopicSignals: offTopic.slice(0, 5),
      lovedTitles: Array.from(greatFitTitles).slice(0, 5),
      dismissedTitles: Array.from(dismissedTitles).slice(0, 10),
      reflections: (reflections.data || []).slice(0, 3).map((r: any) => ({
        learned: (r.what_i_learned || "").slice(0, 200),
        changed: (r.what_changed || "").slice(0, 200),
        next: (r.what_next || "").slice(0, 200),
      })),
    };

    // 2. Ask AI for personalised recs
    const userPrompt = `I'm working on improving "${focusArea}" at work.${currentScore ? ` Peer-rated score: ${currentScore}/5.` : ""}

QUALITATIVE FEEDBACK FROM COLLEAGUES:
${feedbackContext || "(none provided)"}

MY LEARNING PROFILE (built from my past interactions — use this to personalise):
${JSON.stringify(profile, null, 2)}

INSTRUCTIONS:
- Generate 6-8 fresh, real, currently-available learning resources tied to "${focusArea}".
- Heavily prefer formats in profile.preferredFormats.
- If profile.tooBasicSignals exist, push difficulty up (intermediate / advanced).
- Avoid anything similar to profile.dismissedTitles or items rated off_topic.
- If profile.lovedTitles exist, recommend in the same vein (same authors, publishers, depth).
- Use profile.reflections.next to bias toward what they said they want next.
- Each item must include "why_picked" — 1 sentence explaining which signal in the profile drove it ("Picked because you completed 3 videos and rated them 5★", etc.).

Return ONLY a JSON array. Each object has: title, type ("article"|"book"|"video"|"exercise"), source, url (or null), why_relevant (2 sentences tying to feedback), why_picked (1 sentence on the signal), time_commitment, difficulty ("foundational"|"intermediate"|"advanced").`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: "You are a senior leadership coach and adaptive learning curator. You only recommend real, currently-existing resources. Use web search to verify them. Never invent URLs. Always personalise based on the user's profile." },
          { role: "user", content: userPrompt },
        ],
        tools: [{ type: "google_search" }],
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) return new Response(JSON.stringify({ error: "Rate limited, try again in a minute." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (aiRes.status === 402) return new Response(JSON.stringify({ error: "AI workspace credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await aiRes.text();
      throw new Error(`AI gateway: ${aiRes.status} ${t}`);
    }

    const data = await aiRes.json();
    const text = data.choices?.[0]?.message?.content || "";
    const match = text.match(/\[[\s\S]*\]/);
    let resources: any[] = [];
    if (match) {
      try { resources = JSON.parse(match[0]); } catch { /* ignore */ }
    }
    if (!Array.isArray(resources) || resources.length === 0) {
      return new Response(JSON.stringify({ error: "Could not parse resources", raw: text.slice(0, 300) }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    resources = resources.slice(0, 10).map((r) => ({
      title: String(r.title || "").slice(0, 200),
      type: ["article", "book", "video", "exercise"].includes(r.type) ? r.type : "article",
      source: String(r.source || "").slice(0, 100),
      url: typeof r.url === "string" && r.url.startsWith("http") ? r.url : null,
      why_relevant: String(r.why_relevant || "").slice(0, 400),
      why_picked: String(r.why_picked || "").slice(0, 240),
      time_commitment: String(r.time_commitment || "").slice(0, 50),
      difficulty: ["foundational", "intermediate", "advanced"].includes(r.difficulty) ? r.difficulty : "intermediate",
    }));

    return new Response(JSON.stringify({ resources, profile }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("adaptive-resources error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  CandidateResource,
  buildResourceId,
  corsHeaders,
  domainFromUrl,
  normalizeUrl,
} from "../_shared/growth-hub.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    if (!PERPLEXITY_API_KEY) throw new Error("PERPLEXITY_API_KEY not configured");

    const authHeader = req.headers.get("Authorization") || "";
    const jwt = authHeader.replace("Bearer ", "");
    const userClient = createClient(SUPABASE_URL, jwt, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });
    const adminClient = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: authData, error: authErr } = await userClient.auth.getUser();
    if (authErr || !authData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = authData.user.id;
    const body = await req.json().catch(() => ({}));
    const focusArea = String(body.focusArea || "").slice(0, 200);
    const feedbackContext = String(body.feedbackContext || "").slice(0, 1500);
    const currentScore = typeof body.currentScore === "number" ? body.currentScore : undefined;
    if (!focusArea) {
      return new Response(JSON.stringify({ error: "focusArea is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const interactionsRes = await adminClient
      .from("learning_interactions")
      .select("resource_format, action, focus_area, metadata")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(150);
    const preferredFormats = new Set<string>();
    for (const row of interactionsRes.data || []) {
      if ((row.action === "opened" || row.action === "completed") && row.resource_format) {
        preferredFormats.add(row.resource_format);
      }
    }

    const userPrompt = `Find 10 real learning resources to improve "${focusArea}".
Current score: ${currentScore ?? "unknown"}/5.
Feedback context:
${feedbackContext || "(none)"}

Return ONLY JSON array with fields:
title,type(article|book|video|exercise),source,url,time_commitment,difficulty(foundational|intermediate|advanced),why_relevant.
Use reputable real URLs only.`;

    const perplexityRes = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: Deno.env.get("PERPLEXITY_MODEL") || "sonar",
        temperature: 0.2,
        max_tokens: 1600,
        messages: [
          {
            role: "system",
            content:
              "You are a leadership learning curator. Use live web research. Return valid JSON only. Never fabricate URLs.",
          },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!perplexityRes.ok) {
      const text = await perplexityRes.text();
      throw new Error(`Perplexity API error: ${perplexityRes.status} ${text}`);
    }

    const perplexityData = await perplexityRes.json();
    const text = perplexityData?.choices?.[0]?.message?.content || "[]";
    const match = text.match(/\[[\s\S]*\]/);
    const parsed = match ? JSON.parse(match[0]) : [];
    if (!Array.isArray(parsed)) throw new Error("Claude response not array");

    const candidates: CandidateResource[] = parsed
      .slice(0, 16)
      .map((item: Record<string, unknown>) => {
        const typeRaw = String(item.type || "article").toLowerCase();
        const type = (["article", "book", "video", "exercise"].includes(typeRaw) ? typeRaw : "article") as CandidateResource["type"];
        const normalizedUrl = normalizeUrl(typeof item.url === "string" ? item.url : null);
        const domain = domainFromUrl(normalizedUrl);
        const title = String(item.title || "").slice(0, 200);
        return {
          resource_id: buildResourceId(type, title, normalizedUrl),
          title,
          source: String(item.source || "").slice(0, 120),
          url: normalizedUrl,
          normalized_domain: domain,
          type,
          difficulty: (["foundational", "intermediate", "advanced"].includes(String(item.difficulty))
            ? String(item.difficulty)
            : "intermediate") as CandidateResource["difficulty"],
          time_commitment: String(item.time_commitment || "").slice(0, 50),
          why_relevant: String(item.why_relevant || "").slice(0, 420),
          why_picked: preferredFormats.has(type) ? "Matches your preferred learning format from past interactions." : undefined,
        };
      })
      .filter((c) => c.title && c.url && c.normalized_domain);

    return new Response(JSON.stringify({ candidates }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("recommendation-candidates error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});


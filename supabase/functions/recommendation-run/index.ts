import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  CandidateResource,
  baselineTrustScore,
  buildResourceId,
  computeDeterministicScore,
  corsHeaders,
  difficultyFitScore,
  domainFromUrl,
  normalizeUrl,
} from "../_shared/growth-hub.ts";

async function fetchPerplexityResources(params: {
  apiKey: string;
  focusArea: string;
  feedbackContext: string;
  currentScore?: number;
}) {
  const prompt = `Find 10 high-quality, real, currently available learning resources for "${params.focusArea}".
Peer score: ${params.currentScore ?? "unknown"}/5.
Feedback:
${params.feedbackContext || "(none provided)"}

Return ONLY JSON array with fields:
title,type(article|book|video|exercise),source,url,time_commitment,difficulty(foundational|intermediate|advanced),why_relevant.`;

  const res = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
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
            "You are a leadership development researcher. Use live web search. Use only real URLs. Return JSON only.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Perplexity fetch failed: ${res.status} ${text}`);
  }
  const payload = await res.json();
  const text = payload?.choices?.[0]?.message?.content || "[]";
  const match = text.match(/\[[\s\S]*\]/);
  const parsed = match ? JSON.parse(match[0]) : [];
  return Array.isArray(parsed) ? parsed : [];
}

async function personalizeWithClaude(params: {
  apiKey: string;
  focusArea: string;
  items: Array<Record<string, unknown>>;
}) {
  const prompt = `Focus area: "${params.focusArea}".
For each item below, produce a concise why_picked and why_relevant sentence.
Return ONLY JSON array with fields: resource_id, why_picked, why_relevant.

Items:
${JSON.stringify(params.items.map((i) => ({
  resource_id: i.resource_id,
  title: i.title,
  source: i.source,
  reason_codes: i.reason_codes,
  score_breakdown: i.score_breakdown,
})))}
`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": params.apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: Deno.env.get("CLAUDE_MODEL") || "claude-3-5-sonnet-20241022",
      max_tokens: 1000,
      system: "Return strict JSON only. Keep output concise.",
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) return [];
  const payload = await res.json();
  const text = payload?.content?.[0]?.text || "[]";
  const match = text.match(/\[[\s\S]*\]/);
  const parsed = match ? JSON.parse(match[0]) : [];
  return Array.isArray(parsed) ? parsed : [];
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const CLAUDE_API_KEY = Deno.env.get("CLAUDE_API_KEY");
    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    if (!CLAUDE_API_KEY) throw new Error("CLAUDE_API_KEY not configured");
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

    const [interactionsRes, reflectionsRes] = await Promise.all([
      adminClient
        .from("learning_interactions")
        .select("resource_format, action")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(120),
      adminClient
        .from("learning_reflections")
        .select("what_next")
        .eq("user_id", userId)
        .order("week_starting", { ascending: false })
        .limit(3),
    ]);
    const preferredFormats = new Set<string>();
    for (const row of interactionsRes.data || []) {
      if ((row.action === "opened" || row.action === "completed") && row.resource_format) {
        preferredFormats.add(row.resource_format);
      }
    }
    const reflectionHints = (reflectionsRes.data || [])
      .map((r) => String(r.what_next || "").trim())
      .filter(Boolean)
      .slice(0, 3);

    const rawCandidates = await fetchPerplexityResources({
      apiKey: PERPLEXITY_API_KEY,
      focusArea,
      feedbackContext,
      currentScore,
    });

    const domains = new Set<string>();
    const candidates: CandidateResource[] = rawCandidates
      .slice(0, 16)
      .map((raw: Record<string, unknown>) => {
        const typeRaw = String(raw.type || "article").toLowerCase();
        const type = (["article", "book", "video", "exercise"].includes(typeRaw) ? typeRaw : "article") as CandidateResource["type"];
        const url = normalizeUrl(typeof raw.url === "string" ? raw.url : null);
        const domain = domainFromUrl(url);
        if (domain) domains.add(domain);
        const title = String(raw.title || "").slice(0, 200);
        return {
          resource_id: buildResourceId(type, title, url),
          title,
          source: String(raw.source || "").slice(0, 120),
          url,
          normalized_domain: domain,
          type,
          difficulty: (["foundational", "intermediate", "advanced"].includes(String(raw.difficulty))
            ? String(raw.difficulty)
            : "intermediate") as CandidateResource["difficulty"],
          time_commitment: String(raw.time_commitment || "").slice(0, 50),
          why_relevant: String(raw.why_relevant || "").slice(0, 420),
          why_picked: "",
        };
      })
      .filter((c) => c.title && c.url && c.normalized_domain);

    const domainPolicyRes = await adminClient
      .from("source_domain_policy")
      .select("domain, policy")
      .in("domain", [...domains]);
    const policyMap = new Map<string, string>();
    for (const row of domainPolicyRes.data || []) policyMap.set(row.domain, row.policy);

    let ranked = candidates
      .map((candidate, idx) => {
        const trust = baselineTrustScore(candidate.normalized_domain);
        let trustScore = trust.score;
        const trustFlags = [...trust.flags];
        const policy = candidate.normalized_domain ? policyMap.get(candidate.normalized_domain) : undefined;
        if (policy === "allow") {
          trustScore = Math.max(trustScore, 90);
          trustFlags.push("allowlisted_domain");
        }
        if (policy === "deny") {
          trustScore = 0;
          trustFlags.push("policy_deny");
        }
        const novelty = Math.max(0.2, Math.min(1, 1 - idx * 0.05));
        const dFit = difficultyFitScore(currentScore, candidate.difficulty);
        const formatBoost = preferredFormats.has(candidate.type) ? 1 : 0.55;
        const reflectionBoost = reflectionHints.some((hint) =>
          candidate.title.toLowerCase().includes(hint.toLowerCase().slice(0, 16))
        )
          ? 1
          : 0.5;
        const scored = computeDeterministicScore({
          trust: trustScore / 100,
          novelty,
          difficultyFit: dFit,
          preferredFormatBoost: formatBoost,
          reflectionBoost,
        });
        return {
          ...candidate,
          trust_score: trustScore,
          trust_flags: trustFlags,
          deterministic_score: scored.score,
          score_breakdown: scored.breakdown,
          reason_codes: scored.reasonCodes,
          why_picked:
            scored.reasonCodes.length > 0
              ? `Picked for ${scored.reasonCodes.join(", ").replaceAll("_", " ")}.`
              : "Picked for profile fit.",
        };
      })
      .filter((r) => r.trust_score > 0)
      .sort((a, b) => b.deterministic_score - a.deterministic_score)
      .slice(0, 8)
      .map((item, index) => ({ ...item, rank_position: index + 1 }));

    const personalized = await personalizeWithClaude({
      apiKey: CLAUDE_API_KEY,
      focusArea,
      items: ranked,
    });
    const personalizedMap = new Map<string, { why_picked?: string; why_relevant?: string }>();
    for (const row of personalized) {
      const key = String((row as Record<string, unknown>).resource_id || "");
      if (!key) continue;
      personalizedMap.set(key, {
        why_picked: String((row as Record<string, unknown>).why_picked || ""),
        why_relevant: String((row as Record<string, unknown>).why_relevant || ""),
      });
    }
    ranked = ranked.map((item) => {
      const p = personalizedMap.get(item.resource_id);
      if (!p) return item;
      return {
        ...item,
        why_picked: p.why_picked || item.why_picked,
        why_relevant: p.why_relevant || item.why_relevant,
      };
    });

    const snapshot = {
      focusArea,
      currentScore: currentScore ?? null,
      feedbackContext,
      preferredFormats: [...preferredFormats],
      reflectionHints,
    };
    const hashInput = JSON.stringify(snapshot);
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(hashInput));
    const inputHash = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");

    const runInsert = await adminClient
      .from("recommendation_runs")
      .insert({
        user_id: userId,
        focus_area: focusArea,
        input_snapshot: snapshot,
        input_snapshot_hash: inputHash,
        provider: "claude+perplexity",
        model: Deno.env.get("CLAUDE_MODEL") || "claude-3-5-sonnet-20241022",
        pipeline_version: "v2",
        status: "succeeded",
      })
      .select("id, generated_at")
      .single();
    if (runInsert.error || !runInsert.data) throw runInsert.error || new Error("Failed to store run");
    const runId = runInsert.data.id;

    const itemRows: Record<string, unknown>[] = [];
    for (const item of ranked) {
      const catalogUpsert = await adminClient
        .from("resource_catalog")
        .upsert(
          {
            canonical_url: item.url,
            normalized_domain: item.normalized_domain,
            title: item.title,
            source: item.source,
            resource_type: item.type,
            verification_status: item.trust_score >= 80 ? "verified" : "pending",
            trust_score: item.trust_score,
            last_seen_at: new Date().toISOString(),
            metadata: { trust_flags: item.trust_flags },
          },
          { onConflict: "canonical_url" },
        )
        .select("id")
        .single();
      const catalogId = catalogUpsert.data?.id ?? null;
      itemRows.push({
        run_id: runId,
        user_id: userId,
        resource_catalog_id: catalogId,
        resource_id: item.resource_id,
        rank_position: item.rank_position,
        title: item.title,
        source: item.source,
        url: item.url,
        type: item.type,
        difficulty: item.difficulty,
        time_commitment: item.time_commitment,
        why_relevant: item.why_relevant,
        why_picked: item.why_picked,
        deterministic_score: item.deterministic_score,
        score_breakdown: item.score_breakdown,
        reason_codes: item.reason_codes,
        trust_score: item.trust_score,
        trust_flags: item.trust_flags,
        pipeline_version: "v2",
      });
    }

    const itemsInsert = await adminClient
      .from("recommendation_items")
      .insert(itemRows)
      .select("*");
    if (itemsInsert.error) throw itemsInsert.error;
    const insertedItems = itemsInsert.data || [];

    if (insertedItems.length > 0) {
      const eventRows = insertedItems.map((item) => ({
        user_id: userId,
        run_id: runId,
        item_id: item.id,
        event_type: "impression",
        position: item.rank_position,
        focus_area: focusArea,
        metadata: { source: item.source },
      }));
      await adminClient.from("recommendation_events").insert(eventRows);
    }

    return new Response(
      JSON.stringify({
        run: {
          id: runId,
          generated_at: runInsert.data.generated_at,
          pipeline_version: "v2",
          provider: "claude+perplexity",
        },
        items: insertedItems,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("recommendation-run error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});


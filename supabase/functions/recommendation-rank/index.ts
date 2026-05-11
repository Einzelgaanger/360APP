import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  CandidateResource,
  baselineTrustScore,
  computeDeterministicScore,
  corsHeaders,
  difficultyFitScore,
} from "../_shared/growth-hub.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(SUPABASE_URL, SERVICE_KEY);

    const body = await req.json().catch(() => ({}));
    const candidates = (Array.isArray(body.candidates) ? body.candidates : []) as CandidateResource[];
    const currentScore = typeof body.currentScore === "number" ? body.currentScore : undefined;
    const preferredFormats = new Set<string>(Array.isArray(body.preferredFormats) ? body.preferredFormats : []);
    const reflectionHints = Array.isArray(body.reflectionHints) ? body.reflectionHints.map(String) : [];

    if (!candidates.length) {
      return new Response(JSON.stringify({ ranked: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const domains = [...new Set(candidates.map((c) => c.normalized_domain).filter(Boolean))];
    const domainPolicyRes = await adminClient
      .from("source_domain_policy")
      .select("domain, policy")
      .in("domain", domains as string[]);
    const policyMap = new Map<string, string>();
    for (const row of domainPolicyRes.data || []) policyMap.set(row.domain, row.policy);

    const ranked = candidates.map((candidate, index) => {
      const trustBaseline = baselineTrustScore(candidate.normalized_domain);
      const explicitPolicy = candidate.normalized_domain ? policyMap.get(candidate.normalized_domain) : undefined;
      let trustScore = trustBaseline.score;
      const trustFlags = [...trustBaseline.flags];
      if (explicitPolicy === "allow") {
        trustScore = Math.max(trustScore, 90);
        trustFlags.push("allowlisted_domain");
      }
      if (explicitPolicy === "deny") {
        trustScore = 0;
        trustFlags.push("policy_deny");
      }

      const novelty = Math.max(0.2, Math.min(1, 1 - index * 0.04));
      const dFit = difficultyFitScore(currentScore, candidate.difficulty);
      const formatBoost = preferredFormats.has(candidate.type) ? 1 : 0.55;
      const reflectionBoost = reflectionHints.some((hint) =>
        candidate.title.toLowerCase().includes(hint.toLowerCase().slice(0, 16))
      )
        ? 1
        : 0.5;

      const score = computeDeterministicScore({
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
        deterministic_score: score.score,
        score_breakdown: score.breakdown,
        reason_codes: score.reasonCodes,
      };
    })
      .filter((c) => c.trust_score > 0)
      .sort((a, b) => b.deterministic_score - a.deterministic_score)
      .map((item, idx) => ({ ...item, rank_position: idx + 1 }));

    return new Response(JSON.stringify({ ranked }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("recommendation-rank error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});


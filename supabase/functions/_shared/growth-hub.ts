export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

export type ResourceType = "article" | "book" | "video" | "exercise";
export type Difficulty = "foundational" | "intermediate" | "advanced";

export interface CandidateResource {
  resource_id: string;
  title: string;
  source: string;
  url: string | null;
  normalized_domain: string | null;
  type: ResourceType;
  difficulty: Difficulty;
  time_commitment: string;
  why_relevant: string;
  why_picked?: string;
}

const blockedProtocols = new Set(["javascript:", "data:"]);
const denyDomains = new Set(["example.com", "localhost", "127.0.0.1"]);

export function normalizeUrl(input: string | null | undefined): string | null {
  if (!input || typeof input !== "string") return null;
  const trimmed = input.trim();
  if (!trimmed) return null;
  try {
    const u = new URL(trimmed);
    if (blockedProtocols.has(u.protocol)) return null;
    u.hash = "";
    if (u.pathname.endsWith("/")) u.pathname = u.pathname.slice(0, -1);
    return u.toString();
  } catch {
    return null;
  }
}

export function domainFromUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function buildResourceId(type: ResourceType, title: string, url: string | null): string {
  const base = (url || title || "resource").toLowerCase().replace(/\s+/g, "_").slice(0, 120);
  return `${type}::${base}`;
}

export function baselineTrustScore(domain: string | null): { score: number; flags: string[] } {
  if (!domain) return { score: 20, flags: ["missing_domain"] };
  if (denyDomains.has(domain)) return { score: 0, flags: ["denylisted_domain"] };
  if (domain.endsWith(".gov") || domain.endsWith(".edu")) return { score: 95, flags: ["trusted_domain"] };
  if (domain.includes("hbr.org") || domain.includes("mckinsey.com") || domain.includes("mitsmr.com")) {
    return { score: 90, flags: ["trusted_publisher"] };
  }
  return { score: 65, flags: ["unverified_domain"] };
}

export function difficultyFitScore(currentScore?: number, difficulty?: Difficulty): number {
  if (!currentScore || !difficulty) return 0.5;
  if (currentScore < 2.5) return difficulty === "foundational" ? 1 : difficulty === "intermediate" ? 0.7 : 0.4;
  if (currentScore < 3.8) return difficulty === "intermediate" ? 1 : 0.75;
  return difficulty === "advanced" ? 1 : 0.7;
}

export function computeDeterministicScore(params: {
  trust: number;
  novelty: number;
  difficultyFit: number;
  preferredFormatBoost: number;
  reflectionBoost: number;
}): { score: number; breakdown: Record<string, number>; reasonCodes: string[] } {
  const breakdown = {
    trust: params.trust * 0.35,
    novelty: params.novelty * 0.2,
    difficulty_fit: params.difficultyFit * 0.2,
    preferred_format: params.preferredFormatBoost * 0.15,
    reflection_alignment: params.reflectionBoost * 0.1,
  };
  const score = Object.values(breakdown).reduce((a, b) => a + b, 0);
  const reasonCodes: string[] = [];
  if (params.trust >= 80) reasonCodes.push("high_trust_source");
  if (params.novelty >= 0.8) reasonCodes.push("novel_resource");
  if (params.difficultyFit >= 0.9) reasonCodes.push("difficulty_match");
  if (params.preferredFormatBoost >= 0.9) reasonCodes.push("preferred_format");
  if (params.reflectionBoost >= 0.9) reasonCodes.push("reflection_aligned");
  return { score, breakdown, reasonCodes };
}


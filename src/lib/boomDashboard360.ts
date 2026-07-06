import { supabase } from '@/integrations/supabase/client';
import { defaultQuarterPeriod } from '@/lib/boomPeriods';

export type Boom360CategoryScore = {
  category: string;
  myScore: number;
  orgAvg: number;
};

export type Boom360DashboardState = {
  released: boolean;
  peerCount: number;
  minPeersRequired: number;
  scores: Boom360CategoryScore[];
  qualitative: {
    startDoing: { text: string; direction: string }[];
    stopDoing: { text: string; direction: string }[];
    continueDoing: { text: string; direction: string }[];
  };
  /** All anonymous written peer feedback (incl. optional per-question comments). */
  themes: { text: string }[];
};

export type RankedEmployeeScore = {
  employee_id: string;
  name: string;
  subsidiary: string;
  avgScore: number;
  totalReviews: number;
};

/**
 * Aggregated peer 360 about the current user (BOOM); updates live as peers submit.
 */
export async function fetchMyAggregatedPeer360Scores(
  period: string = defaultQuarterPeriod(),
): Promise<{ scores: Boom360CategoryScore[]; maxPeerResponsesHint: number } | null> {
  const { data: boom360, error } = await supabase.rpc('get_my_360_results', { _period: period });
  if (error || !boom360?.length) return null;

  const bySection: Record<string, { wsum: number; w: number }> = {};
  for (const row of boom360 as {
    section: string;
    avg_score: number;
    response_count: number;
  }[]) {
    const sec = row.section?.trim() || '360 feedback';
    if (!bySection[sec]) bySection[sec] = { wsum: 0, w: 0 };
    bySection[sec].wsum += Number(row.avg_score) * row.response_count;
    bySection[sec].w += row.response_count;
  }
  const avgSec = (wsum: number, w: number) => (w ? parseFloat((wsum / w).toFixed(2)) : 0);
  const scores = Object.entries(bySection).map(([category, v]) => ({
    category,
    myScore: avgSec(v.wsum, v.w),
    orgAvg: 0,
  }));
  const maxR = Math.max(...(boom360 as { response_count: number }[]).map((r) => r.response_count), 0);
  return { scores, maxPeerResponsesHint: maxR };
}

/** Full anonymous 360 dashboard payload (scores + narrative) for My Dashboard. */
export async function fetchMy360Dashboard(
  period: string = defaultQuarterPeriod(),
): Promise<Boom360DashboardState | null> {
  const { data, error } = await supabase.rpc('get_my_360_dashboard', { _period: period });
  if (error || !data || typeof data !== 'object') return null;

  const row = data as {
    released?: boolean;
    peer_count?: number;
    min_peers_required?: number;
    sections?: { section: string; avg_score: number; response_count: number }[];
    start_doing?: { text: string; direction?: string }[];
    stop_doing?: { text: string; direction?: string }[];
    continue_doing?: { text: string; direction?: string }[];
    themes?: { text: string }[];
  };

  const sections = row.sections ?? [];
  const scores = sections.map((s) => ({
    category: s.section?.trim() || '360 feedback',
    myScore: Number(s.avg_score),
    orgAvg: 0,
  }));

  const mapItems = (arr: { text: string; direction?: string }[] | undefined) =>
    (arr ?? []).map((x) => ({ text: x.text, direction: x.direction ?? 'peer' }));

  return {
    released: !!row.released,
    peerCount: row.peer_count ?? 0,
    minPeersRequired: row.min_peers_required ?? 1,
    scores,
    qualitative: {
      startDoing: mapItems(row.start_doing),
      stopDoing: mapItems(row.stop_doing),
      continueDoing: mapItems(row.continue_doing),
    },
    themes: (row.themes ?? []).map((x) => ({ text: x.text })).filter((x) => x.text?.trim()),
  };
}

export type GrowthHubPulseMode = 'self' | 'team_pulse';

export type GrowthHubPulse = {
  mode: GrowthHubPulseMode;
  pulseLabel: string;
  peerCount: number;
  subjectCount: number;
  scores: Boom360CategoryScore[];
  qualitative: {
    startDoing: { text: string; direction: string }[];
    stopDoing: { text: string; direction: string }[];
    continueDoing: { text: string; direction: string }[];
  };
  themes: { text: string }[];
};

/** Personal 360 or L0/L1 team pulse for Growth Hub + dashboard. */
export async function fetchGrowthHubPulse(
  period: string = defaultQuarterPeriod(),
): Promise<GrowthHubPulse | null> {
  const { data, error } = await supabase.rpc('get_eo_growth_hub_pulse', { _period: period });
  if (error || !data || typeof data !== 'object') return null;

  const row = data as {
    mode?: GrowthHubPulseMode;
    pulse_label?: string;
    peer_count?: number;
    subject_count?: number;
    sections?: { section: string; avg_score: number; response_count: number }[];
    start_doing?: { text: string; direction?: string }[];
    stop_doing?: { text: string; direction?: string }[];
    continue_doing?: { text: string; direction?: string }[];
    themes?: { text: string }[];
  };

  const sections = row.sections ?? [];
  if (!sections.length) return null;

  const mapItems = (arr: { text: string; direction?: string }[] | undefined) =>
    (arr ?? []).map((x) => ({ text: x.text, direction: x.direction ?? 'peer' }));

  return {
    mode: row.mode === 'team_pulse' ? 'team_pulse' : 'self',
    pulseLabel: row.pulse_label?.trim() || 'Your peer 360 feedback',
    peerCount: row.peer_count ?? 0,
    subjectCount: row.subject_count ?? 1,
    scores: sections.map((s) => ({
      category: s.section?.trim() || '360 feedback',
      myScore: Number(s.avg_score),
      orgAvg: 0,
    })),
    qualitative: {
      startDoing: mapItems(row.start_doing),
      stopDoing: mapItems(row.stop_doing),
      continueDoing: mapItems(row.continue_doing),
    },
    themes: (row.themes ?? []).map((x) => ({ text: x.text })).filter((x) => x.text?.trim()),
  };
}

export function buildBoomGrowthAiContext(pulse: GrowthHubPulse, period: string): string {
  const lines = [
    pulse.mode === 'team_pulse'
      ? `BOOM Executive Office team pulse (${period}): ${pulse.pulseLabel}.`
      : `BOOM Executive Office peer 360 (${period}): personal anonymous feedback.`,
    `Peer reviews in pool: ${pulse.peerCount}. Team members represented: ${pulse.subjectCount}.`,
    '',
    'Section averages (1–5):',
    ...pulse.scores.map((s) => `• ${s.category}: ${s.myScore}/5`),
  ];

  const appendQual = (label: string, items: { text: string }[]) => {
    if (!items.length) return;
    lines.push('', `${label} (${items.length}):`, ...items.slice(0, 12).map((f) => `• ${f.text}`));
  };

  appendQual('Start doing themes', pulse.qualitative.startDoing);
  appendQual('Stop doing themes', pulse.qualitative.stopDoing);
  appendQual('Continue doing themes', pulse.qualitative.continueDoing);
  appendQual('Other written themes', pulse.themes);

  return lines.join('\n').slice(0, 1500);
}

/**
 * Org leaderboard: legacy subsidiary survey + submitted BOOM peer_360 Likert scores.
 */
export async function fetchOrgPerformanceRankings(): Promise<RankedEmployeeScore[]> {
  const [empsRes, subsRes, responsesRes] = await Promise.all([
    supabase.from('employees').select('id, name, subsidiary_id'),
    supabase.from('subsidiaries').select('id, name'),
    supabase.from('survey_responses').select('id, employee_id'),
  ]);

  if (!empsRes.data || !responsesRes.data || !subsRes.data) return [];

  const subMap: Record<string, string> = {};
  subsRes.data.forEach((s: { id: string; name: string }) => {
    subMap[s.id] = s.name;
  });

  const empResponseIds: Record<string, string[]> = {};
  responsesRes.data.forEach((r: { id: string; employee_id: string }) => {
    if (!empResponseIds[r.employee_id]) empResponseIds[r.employee_id] = [];
    empResponseIds[r.employee_id].push(r.id);
  });

  const allResponseIds = responsesRes.data.map((r: { id: string }) => r.id);
  const batchSize = 500;
  let allScores: { response_id: string; score: number }[] = [];
  for (let i = 0; i < allResponseIds.length; i += batchSize) {
    const batch = allResponseIds.slice(i, i + batchSize);
    const { data } = await supabase
      .from('survey_answers')
      .select('response_id, score')
      .in('response_id', batch)
      .not('score', 'is', null);
    if (data) allScores = allScores.concat(data as { response_id: string; score: number }[]);
  }

  const responseScoreMap: Record<string, number[]> = {};
  allScores.forEach((a) => {
    if (!responseScoreMap[a.response_id]) responseScoreMap[a.response_id] = [];
    responseScoreMap[a.response_id].push(a.score);
  });

  const scoreMap: Record<string, { scores: number[]; count: number }> = {};
  Object.entries(empResponseIds).forEach(([empId, rIds]) => {
    scoreMap[empId] = { scores: [], count: rIds.length };
    rIds.forEach((rId) => {
      if (responseScoreMap[rId]) scoreMap[empId].scores.push(...responseScoreMap[rId]);
    });
  });

  const { data: boomRows, error: boomErr } = await supabase.rpc('list_peer_360_ranking_detail');
  if (!boomErr && boomRows?.length) {
    const boomAgg: Record<string, { scores: number[]; responses: Set<string> }> = {};
    for (const row of boomRows as { reviewee_id: string; response_id: string; score: number }[]) {
      if (!boomAgg[row.reviewee_id]) {
        boomAgg[row.reviewee_id] = { scores: [], responses: new Set() };
      }
      boomAgg[row.reviewee_id].scores.push(row.score);
      boomAgg[row.reviewee_id].responses.add(row.response_id);
    }
    Object.entries(boomAgg).forEach(([empId, b]) => {
      if (!scoreMap[empId]) scoreMap[empId] = { scores: [], count: 0 };
      scoreMap[empId].scores.push(...b.scores);
      scoreMap[empId].count += b.responses.size;
    });
  }

  return empsRes.data
    .filter((e: { id: string }) => scoreMap[e.id]?.scores.length > 0)
    .map((e: { id: string; name: string; subsidiary_id: string }) => ({
      employee_id: e.id,
      name: e.name,
      subsidiary: subMap[e.subsidiary_id] || 'Unknown',
      avgScore: parseFloat(
        (scoreMap[e.id].scores.reduce((a: number, b: number) => a + b, 0) / scoreMap[e.id].scores.length).toFixed(2),
      ),
      totalReviews: scoreMap[e.id].count,
    }))
    .sort((a, b) => b.avgScore - a.avgScore);
}

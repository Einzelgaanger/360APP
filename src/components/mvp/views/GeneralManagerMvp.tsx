import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AttentionList,
  GapMeter,
  HeatBar,
  Initials,
  MetricStrip,
  MvpCallout,
  MvpPanel,
  PageHeader,
  PageHero,
  ScoreRing,
  SplitStage,
  StatusPill,
  TimelineRail,
} from '../MvpPrimitives';
import {
  gmCompletionByWeek,
  gmCycleMilestones,
  gmDirectReports,
  gmDiscussions,
  gmInsightsBullets,
  gmKpis,
  gmTalentRisk,
  gmThemes,
  gmUnitHealth,
  MVP_PERIOD,
} from '../mvpMockData';

export default function GeneralManagerMvp({ nav }: { nav: string }) {
  if (nav === 'units') return <Units />;
  if (nav === 'reports') return <Reports />;
  if (nav === 'talent') return <Talent />;
  if (nav === 'themes') return <Themes />;
  if (nav === 'discussions') return <Discussions />;
  if (nav === 'cycle') return <Cycle />;
  if (nav === 'insights') return <Insights />;
  return <Command />;
}

function Command() {
  const hotUnits = gmUnitHealth.filter((u) => u.risk !== 'Healthy');
  const hotThreads = gmDiscussions.filter((d) => d.priority === 'Critical' || d.priority === 'High').slice(0, 3);

  return (
    <div className="space-y-6">
      <PageHero
        tone="ink"
        kicker={`${MVP_PERIOD} · command`}
        title="Where does the organisation need you?"
        detail="Altitude view — completion pressure, unit risk, and leadership conversations. Not every individual form."
        aside={
          <div className="rounded-lg bg-white/10 px-4 py-3 text-background">
            <p className="text-[10px] uppercase tracking-wider text-background/55 font-mono">Org peer avg</p>
            <p className="font-display text-3xl font-semibold tabular-nums mt-1">3.82</p>
            <p className="text-xs text-background/65 mt-1">78% complete</p>
          </div>
        }
      />

      <MetricStrip items={gmKpis.slice(0, 4)} />

      <SplitStage
        main={
          <>
            <MvpPanel title="Completion velocity (self · manager · peer)">
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={gmCompletionByWeek}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="self" name="Self" fill="hsl(202 65% 46%)" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="manager" name="Manager" fill="hsl(107 52% 49%)" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="peer" name="Peer" fill="hsl(204 32% 28%)" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </MvpPanel>

            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-2">Units needing a look</p>
              <div className="grid gap-3 sm:grid-cols-3">
                {hotUnits.map((u) => (
                  <div key={u.unit} className="rounded-lg border border-border bg-card p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-sm">{u.unit}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{u.head}</p>
                      </div>
                      <StatusPill status={u.risk} />
                    </div>
                    <div className="mt-3 flex items-end justify-between gap-2">
                      <p className="font-display text-xl font-semibold tabular-nums">{u.avgScore.toFixed(1)}</p>
                      <HeatBar value={u.completion} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        }
        rail={
          <>
            <AttentionList title="Decide this week" items={gmInsightsBullets.slice(0, 3)} />
            <MvpPanel title="Escalated threads" flush>
              <ul className="divide-y divide-border">
                {hotThreads.map((d) => (
                  <li key={d.topic} className="px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{d.who}</p>
                      <StatusPill status={d.priority} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-snug">{d.topic}</p>
                  </li>
                ))}
              </ul>
            </MvpPanel>
          </>
        }
      />
    </div>
  );
}

function Units() {
  const sorted = [...gmUnitHealth].sort((a, b) => {
    const rank = (r: string) => (r === 'At risk' ? 0 : r === 'Watch' ? 1 : 2);
    return rank(a.risk) - rank(b.risk);
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Unit health"
        title="Seven units, one roll-up"
        detail="Sorted by risk. Intervene with the unit lead — not every IC form."
      />
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left">
              {['Unit', 'Lead', 'HC', 'Completion', 'Avg', 'Trend', 'Risk'].map((h) => (
                <th key={h} className="px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((u) => (
              <tr key={u.unit} className="border-t border-border/80 hover:bg-muted/20">
                <td className="px-4 py-3 font-medium">{u.unit}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Initials name={u.head} className="h-7 w-7 text-[9px]" />
                    <span className="text-muted-foreground">{u.head}</span>
                  </div>
                </td>
                <td className="px-4 py-3 tabular-nums text-muted-foreground">{u.headcount}</td>
                <td className="px-4 py-3"><HeatBar value={u.completion} /></td>
                <td className="px-4 py-3 font-display font-semibold tabular-nums">{u.avgScore.toFixed(1)}</td>
                <td className="px-4 py-3 tabular-nums text-muted-foreground">{u.trend}</td>
                <td className="px-4 py-3"><StatusPill status={u.risk} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Reports() {
  const sorted = [...gmDirectReports].sort(
    (a, b) => Math.abs(b.selfScore - b.upward360) - Math.abs(a.selfScore - a.upward360),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Direct reports"
        title="Your leadership layer"
        detail="Sorted by self–upward gap. Coaching status and team completion sit beside perception."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {sorted.map((r) => (
          <div key={r.name} className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-start gap-3">
              <Initials name={r.name} className="h-11 w-11 text-sm" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold tracking-tight">{r.name}</p>
                    <p className="text-xs text-muted-foreground">{r.title} · team of {r.teamSize}</p>
                  </div>
                  <StatusPill status={r.coaching} />
                </div>
                <div className="mt-4">
                  <GapMeter self={r.selfScore} upward={r.upward360} />
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-4">
                  <ScoreRing value={r.teamAvg} label="Team avg" />
                  <div className="flex-1 min-w-[8rem]">
                    <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">Team completion</p>
                    <HeatBar value={r.completion} />
                  </div>
                </div>
                {r.flags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {r.flags.map((f) => (
                      <StatusPill key={f} status={f} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <MvpPanel title="You typically do">
          <ul className="text-sm text-muted-foreground space-y-1.5 list-disc pl-4">
            <li>Coach unit leads</li>
            <li>Act on perception gaps</li>
            <li>Watch completion without opening every form</li>
          </ul>
        </MvpPanel>
        <MvpPanel title="You typically don’t">
          <ul className="text-sm text-muted-foreground space-y-1.5 list-disc pl-4">
            <li>Fill peer 360s for every IC</li>
            <li>Replace line-manager evals</li>
            <li>See named peer reviewers</li>
          </ul>
        </MvpPanel>
        <MvpPanel title="Optional">
          <ul className="text-sm text-muted-foreground space-y-1.5 list-disc pl-4">
            <li>Assessor layer on leadership forms</li>
            <li>Skip-level threads</li>
            <li>Calibration notes before release</li>
          </ul>
        </MvpPanel>
      </div>
    </div>
  );
}

function Talent() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Talent & risk"
        title="Name risks before release"
        detail="Performance dips, perception gaps, flight-risk language, stretch opportunities."
      />
      <div className="space-y-3">
        {gmTalentRisk.map((t) => (
          <div
            key={t.person}
            className={`rounded-lg border bg-card p-5 ${
              t.severity === 'Critical' ? 'border-[hsl(var(--score-poor)/0.45)]' : 'border-border'
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <Initials name={t.person} className="h-10 w-10" />
                <div>
                  <p className="font-semibold">{t.person}</p>
                  <p className="text-xs text-muted-foreground">{t.unit}</p>
                </div>
              </div>
              <StatusPill status={t.severity} />
            </div>
            <p className="mt-3 font-medium">{t.signal}</p>
            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{t.evidence}</p>
            <p className="mt-3 text-sm rounded-sm bg-muted/50 px-3 py-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Next · </span>
              {t.suggested}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Themes() {
  const max = Math.max(...gmThemes.map((t) => t.mentions));
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="360 themes"
        title="What the organisation is saying"
        detail="Anonymous clusters — strengths to copy, friction to turn into operating agreements."
      />
      <div className="space-y-2 max-w-3xl">
        {gmThemes.map((t) => (
          <div key={t.theme} className="rounded-lg border border-border bg-card px-4 py-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium">{t.theme}</p>
              <StatusPill status={t.polarity === 'Strength' ? 'Strength' : 'Concern'} />
            </div>
            <div className="mt-2.5 flex items-center gap-3">
              <div className="flex-1 h-2 rounded-sm bg-muted overflow-hidden">
                <div
                  className={`h-full ${t.polarity === 'Strength' ? 'bg-[hsl(var(--score-excellent))]' : 'bg-[hsl(var(--score-average))]'}`}
                  style={{ width: `${(t.mentions / max) * 100}%` }}
                />
              </div>
              <span className="text-sm tabular-nums font-medium w-7 text-right">{t.mentions}</span>
            </div>
            <p className="mt-1.5 text-[11px] text-muted-foreground">{t.units}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Discussions() {
  const sorted = [...gmDiscussions].sort((a, b) => {
    const rank = (p: string) => (p === 'Critical' ? 0 : p === 'High' ? 1 : p === 'Med' ? 2 : 3);
    return rank(a.priority) - rank(b.priority);
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Discussion queue"
        title="Leadership conversations"
        detail="Priority first — coaching and turnarounds that need you."
      />
      <div className="space-y-2">
        {sorted.map((d) => (
          <div
            key={d.topic}
            className={`flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border bg-card px-4 py-3.5 ${
              d.priority === 'Critical' ? 'border-[hsl(var(--score-poor)/0.4)]' : 'border-border'
            }`}
          >
            <Initials name={d.who} />
            <div className="flex-1 min-w-0">
              <p className="font-medium">{d.who}</p>
              <p className="text-sm text-muted-foreground truncate">{d.topic}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill status={d.status} />
              <StatusPill status={d.priority} />
              <span className="text-xs text-muted-foreground tabular-nums">{d.updated}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Cycle() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Cycle"
        title="Runway to close"
        detail="People Ops often owns the release gate; you watch whether the timeline still holds."
      />
      <MvpPanel>
        <TimelineRail items={gmCycleMilestones} />
      </MvpPanel>
    </div>
  );
}

function Insights() {
  return (
    <div className="space-y-6">
      <PageHero
        tone="ink"
        kicker="ELT-ready"
        title="What you’d say in the room"
        detail="Narrative from this cycle’s data — not generic advice."
      />
      <AttentionList title="Talking points" items={gmInsightsBullets} />
      <MvpCallout title="Altitude is tunable">
        Some orgs give GMs full insights. Others keep deep analytics with People Ops. Same product, different depth.
      </MvpCallout>
    </div>
  );
}

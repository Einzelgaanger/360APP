import {
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BookOpen, ChevronRight, Clock, Lock, MessageSquare, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Initials,
  MvpCallout,
  MvpPanel,
  MvpProgressRow,
  PageHeader,
  StatusPill,
} from '../MvpPrimitives';
import {
  teamMemberCompetencies,
  teamMemberDiscussions,
  teamMemberFeedback,
  teamMemberMonthlyPulse,
  teamMemberTasks,
} from '../mvpMockData';

export default function TeamMemberMvp({ nav }: { nav: string }) {
  if (nav === 'dashboard') return <Dashboard />;
  if (nav === 'feedback') return <Feedback />;
  if (nav === 'growth') return <Growth />;
  if (nav === 'discussions') return <Discussions />;
  return <Tasks />;
}

function Tasks() {
  const primary = teamMemberTasks[0];
  const queued = teamMemberTasks.slice(1);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="My tasks"
        title="What you still owe this cycle"
        detail="One place for self, peer 360s, and any locked leadership form — generated from your relationships."
        aside={
          <div className="text-right">
            <p className="font-display text-3xl font-semibold tabular-nums leading-none">4</p>
            <p className="text-[11px] text-muted-foreground mt-1">open · 2 due this week</p>
          </div>
        }
      />

      {/* Focus task */}
      <div className="rounded-lg border-2 border-primary/35 bg-card">
        <div className="px-4 py-2 border-b border-border bg-primary/5 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">Continue now</p>
        </div>
        <div className="p-5 sm:p-6 grid gap-5 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <div className="flex flex-wrap gap-2 items-center">
              <StatusPill status={primary.status} />
              <span className="text-xs text-muted-foreground">{primary.type}</span>
            </div>
            <h3 className="font-display text-xl font-semibold mt-3 tracking-tight">{primary.title}</h3>
            <p className="text-sm text-muted-foreground mt-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Due {primary.due} · about 4 minutes left
            </p>
            <div className="mt-4 max-w-sm">
              <MvpProgressRow label="Progress" value={primary.progress} />
            </div>
          </div>
          <Button className="rounded-sm gap-1 sm:min-w-[8.5rem]">
            Continue <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-2">Queue</p>
        <div className="rounded-lg border border-border bg-card divide-y divide-border">
          {queued.map((t) => {
            const locked = t.status.toLowerCase().includes('locked');
            return (
              <div key={t.id} className="flex items-center gap-3 px-4 py-3.5">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-sm ${
                    locked ? 'bg-muted' : 'bg-primary/10 text-primary'
                  }`}
                >
                  {locked ? <Lock className="w-4 h-4 text-muted-foreground" /> : <Clock className="w-4 h-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{t.title}</p>
                  <p className="text-xs text-muted-foreground">{t.type} · Due {t.due}</p>
                </div>
                <StatusPill status={t.status} />
                {!locked && (
                  <Button variant="outline" size="sm" className="hidden sm:inline-flex rounded-sm h-8">
                    Open
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  const overall = 4.0;
  const strongest = teamMemberCompetencies.reduce((a, b) => (a.myScore > b.myScore ? a : b));
  const watch = teamMemberCompetencies.reduce((a, b) => (a.myScore < b.myScore ? a : b));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="My dashboard"
        title="Your picture after release"
        detail="Private to you. Team average is context — not a public leaderboard."
      />

      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <div className="rounded-lg border border-border bg-card p-5 flex flex-col justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Overall</p>
            <p className="font-display text-5xl font-semibold tabular-nums text-primary mt-2 leading-none">{overall.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground mt-2">vs team 3.7</p>
          </div>
          <div className="mt-6 space-y-2 text-sm border-t border-border pt-4">
            <p className="flex justify-between gap-2">
              <span className="text-muted-foreground">Strongest</span>
              <span className="font-medium">{strongest.category}</span>
            </p>
            <p className="flex justify-between gap-2">
              <span className="text-muted-foreground">Watch</span>
              <span className="font-medium">{watch.category}</span>
            </p>
          </div>
        </div>

        <MvpPanel title="Competency shape">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={teamMemberCompetencies}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="category" tick={{ fontSize: 11 }} />
                <Radar dataKey="myScore" name="You" stroke="hsl(202 65% 46%)" fill="hsl(202 65% 46%)" fillOpacity={0.28} />
                <Radar dataKey="teamAvg" name="Team" stroke="hsl(107 52% 49%)" fill="hsl(107 52% 49%)" fillOpacity={0.08} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </MvpPanel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <MvpPanel title="Vs team (detail)" flush>
          <div className="divide-y divide-border">
            {teamMemberCompetencies.map((c) => {
              const delta = c.myScore - c.teamAvg;
              return (
                <div key={c.category} className="flex items-center gap-3 px-5 py-2.5">
                  <span className="text-sm w-28 shrink-0">{c.category}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${(c.myScore / 5) * 100}%` }} />
                  </div>
                  <span className="font-display text-sm font-semibold tabular-nums w-8 text-right">{c.myScore.toFixed(1)}</span>
                  <span
                    className={`text-xs tabular-nums w-10 text-right ${
                      delta >= 0 ? 'text-[hsl(var(--score-excellent))]' : 'text-[hsl(var(--score-average))]'
                    }`}
                  >
                    {delta >= 0 ? '+' : ''}
                    {delta.toFixed(1)}
                  </span>
                </div>
              );
            })}
          </div>
        </MvpPanel>

        <MvpPanel title="Monthly self pulse">
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={teamMemberMonthlyPulse}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis domain={[3, 5]} tick={{ fontSize: 11 }} width={28} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="hsl(202 65% 46%)" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </MvpPanel>
      </div>
    </div>
  );
}

function Feedback() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="My feedback"
        title="What landed for you"
        detail="Peer themes are anonymous aggregates. Manager comments can carry a name."
      />

      <div className="max-w-2xl space-y-4">
        {teamMemberFeedback.map((f) => {
          const peer = f.source.toLowerCase().includes('peer');
          return (
            <article key={f.theme} className="rounded-lg border border-border bg-card overflow-hidden">
              <div className={`h-1 ${peer ? 'bg-primary' : 'bg-[hsl(var(--score-excellent))]'}`} />
              <div className="p-5 sm:p-6">
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{f.source}</p>
                <h3 className="font-display text-lg font-semibold mt-2 tracking-tight">{f.theme}</h3>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{f.detail}</p>
              </div>
            </article>
          );
        })}
      </div>

      <MvpCallout title="How to use this">
        Strengths to keep doing. The handoff note is the one to turn into a Growth Hub goal.
      </MvpCallout>
    </div>
  );
}

function Growth() {
  const goals = [
    { text: 'Share context earlier on Risk handoffs', from: 'Peer theme', done: false },
    { text: 'Document recovery playbooks for the pod', from: 'Manager comment', done: false },
    { text: 'Shadow one VIP merchant escalation', from: 'Your stretch ask', done: true },
  ];
  const resources = [
    { title: 'Giving better async updates', kind: 'Guide', mins: 8 },
    { title: 'SLA playbook — settlement exceptions', kind: 'Playbook', mins: 12 },
    { title: 'Ops ↔ risk handoff clinic', kind: 'Live session', mins: 45 },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Growth hub"
        title="A few concrete moves from this cycle"
        detail="Goals linked to your feedback — not a random course dump."
        aside={<Sparkles className="w-7 h-7 text-[hsl(var(--score-excellent))]" />}
      />

      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <MvpPanel title="Focus this quarter">
          <ul className="space-y-3">
            {goals.map((g, i) => (
              <li key={g.text} className="flex gap-3">
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-sm text-[10px] font-mono border ${
                    g.done
                      ? 'bg-[hsl(var(--score-excellent))] border-transparent text-white'
                      : 'border-border text-muted-foreground'
                  }`}
                >
                  {g.done ? '✓' : i + 1}
                </span>
                <div>
                  <p className={`text-sm font-medium ${g.done ? 'line-through text-muted-foreground' : ''}`}>{g.text}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{g.from}</p>
                </div>
              </li>
            ))}
          </ul>
        </MvpPanel>

        <MvpPanel title="Suggested resources" flush>
          <ul className="divide-y divide-border">
            {resources.map((r) => (
              <li key={r.title} className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/25">
                <BookOpen className="w-4 h-4 text-primary shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{r.title}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {r.kind} · {r.mins} min
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </li>
            ))}
          </ul>
        </MvpPanel>
      </div>
    </div>
  );
}

function Discussions() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Discussions"
        title="Talk about the results"
        detail="With your manager or People Partner — not the whole company."
      />

      <div className="max-w-2xl space-y-3">
        {teamMemberDiscussions.map((d) => {
          const needsYou = d.status.toLowerCase().includes('await');
          return (
            <div
              key={d.topic}
              className={`rounded-lg border bg-card p-4 ${needsYou ? 'border-primary/45' : 'border-border'}`}
            >
              <div className="flex gap-3">
                <Initials name={d.with} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">{d.with}</p>
                    <StatusPill status={d.status} />
                  </div>
                  <p className="text-sm font-medium mt-1">{d.topic}</p>
                  <p className="mt-2 text-sm text-muted-foreground bg-muted/40 rounded-sm px-3 py-2 leading-relaxed">
                    {d.preview}
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <MessageSquare className="w-3.5 h-3.5" />
                    Updated {d.updated}
                    {needsYou && (
                      <Button size="sm" variant="outline" className="ml-auto rounded-sm h-7 text-xs">
                        Reply
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

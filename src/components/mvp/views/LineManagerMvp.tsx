import { AlertCircle, ChevronRight, FileEdit, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Initials,
  MvpCallout,
  MvpPanel,
  PageHeader,
  StatusPill,
  TaskCard,
} from '../MvpPrimitives';
import {
  lineManagerComments,
  lineManagerDirects,
  lineManagerReviews,
  lineManagerWeekPlan,
  teamMemberTasks,
} from '../mvpMockData';

export default function LineManagerMvp({ nav }: { nav: string }) {
  if (nav === 'reviews') return <Reviews />;
  if (nav === 'comments') return <Comments />;
  if (nav === 'discussions') return <Discussions />;
  if (nav === 'tasks') return <OwnTasks />;
  return <Team />;
}

function Team() {
  const sorted = [...lineManagerDirects].sort((a, b) => {
    const rank = (r: string) => (r === 'High' ? 0 : r === 'Med' ? 1 : 2);
    return rank(a.risk) - rank(b.risk);
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="My team"
        title="Merchant Ops · 6 directs"
        detail="Who needs you this week — risk and blockers rise to the top."
        aside={
          <div className="flex gap-2">
            <StatChip label="Evals in" value="1/6" />
            <StatChip label="Overdue" value="1" danger />
          </div>
        }
      />

      <div className="flex gap-3 rounded-lg border border-[hsl(var(--score-average)/0.45)] bg-[hsl(var(--score-average)/0.08)] px-4 py-3">
        <AlertCircle className="w-4 h-4 text-[hsl(var(--score-average))] mt-0.5 shrink-0" />
        <p className="text-sm text-muted-foreground leading-relaxed">
          <span className="font-medium text-foreground">Ibrahim’s self is overdue</span> — your eval stays blocked.
          Jordan still has no draft.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_220px]">
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left">
                {['Person', 'Self', 'Your eval', '360', 'Risk', 'Signal', ''].map((h) => (
                  <th key={h || 'a'} className="px-3 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((d) => (
                <tr key={d.name} className="border-t border-border/80 hover:bg-muted/20">
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2.5">
                      <Initials name={d.name} className="h-8 w-8 text-[10px]" />
                      <div>
                        <p className="font-medium leading-tight">{d.name}</p>
                        <p className="text-[11px] text-muted-foreground">{d.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3"><StatusPill status={d.self} /></td>
                  <td className="px-3 py-3"><StatusPill status={d.ea} /></td>
                  <td className="px-3 py-3 tabular-nums text-muted-foreground">{d.peer360}</td>
                  <td className="px-3 py-3"><StatusPill status={d.risk === 'High' ? 'Critical' : d.risk === 'Med' ? 'Watch' : 'Healthy'} /></td>
                  <td className="px-3 py-3 font-display font-semibold tabular-nums">{d.score.toFixed(1)}</td>
                  <td className="px-3 py-3 text-right">
                    <Button variant="ghost" size="sm" className="rounded-sm h-8 gap-1 text-xs">
                      Open <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <MvpPanel title="This week">
          <ol className="space-y-3">
            {lineManagerWeekPlan.map((w) => (
              <li key={w.day} className="text-sm">
                <span className="font-mono text-[10px] uppercase tracking-wider text-primary">{w.day}</span>
                <p className="text-muted-foreground mt-0.5 leading-snug">{w.focus}</p>
              </li>
            ))}
          </ol>
        </MvpPanel>
      </div>
    </div>
  );
}

function Reviews() {
  const cols = [
    {
      title: 'Ready to write',
      items: lineManagerReviews.filter((r) => r.status === 'Not started' || r.status.includes('Draft')),
      action: true,
    },
    {
      title: 'Blocked',
      items: lineManagerReviews.filter((r) => r.status.toLowerCase().includes('waiting')),
      action: false,
    },
    {
      title: 'Submitted',
      items: lineManagerReviews.filter((r) => r.status === 'Submitted'),
      action: false,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Team reviews"
        title="Manager evaluation pipeline"
        detail="One form per direct · due 10 Jul · drafts save as you go"
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {cols.map((col) => (
          <div key={col.title} className="rounded-lg border border-border bg-muted/25 p-3 min-h-[17rem]">
            <div className="flex items-center justify-between px-1 pb-3">
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{col.title}</p>
              <span className="text-xs tabular-nums text-muted-foreground">{col.items.length}</span>
            </div>
            <div className="space-y-2">
              {col.items.map((r) => (
                <div key={r.subject} className="rounded-md border border-border bg-card p-3">
                  <div className="flex items-center gap-2">
                    <Initials name={r.subject} className="h-7 w-7 text-[9px]" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{r.subject}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{r.status}</p>
                    </div>
                  </div>
                  {col.action && (
                    <Button size="sm" variant="outline" className="w-full mt-3 rounded-sm h-8 gap-1 text-xs">
                      <FileEdit className="w-3.5 h-3.5" /> Write eval
                    </Button>
                  )}
                </div>
              ))}
              {col.items.length === 0 && <p className="text-xs text-muted-foreground text-center py-10">None</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Comments() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Comments"
        title="Downward narrative"
        detail="Short written feedback for people who receive comments from you — separate from scored evals."
      />
      <div className="grid gap-4 lg:grid-cols-3">
        {lineManagerComments.map((c) => (
          <div key={c.to} className="rounded-lg border border-border bg-card flex flex-col min-h-[14rem]">
            <div className="p-4 border-b border-border flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <Initials name={c.to} />
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{c.to}</p>
                  <p className="text-[11px] text-muted-foreground">{c.type}</p>
                </div>
              </div>
              <StatusPill status={c.status} />
            </div>
            <div className="p-4 flex-1">
              <p className="text-sm text-muted-foreground leading-relaxed italic border-l-2 border-primary/40 pl-3">
                “{c.preview}”
              </p>
            </div>
            <div className="p-3 border-t border-border">
              <Button variant="outline" size="sm" className="w-full rounded-sm gap-1">
                <MessageSquare className="w-3.5 h-3.5" />
                {c.status === 'Sent' ? 'View sent' : 'Edit draft'}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Discussions() {
  const rows = [
    {
      with: 'Ibrahim Yusuf',
      topic: 'Performance reset conversation',
      status: 'Draft',
      updated: 'Today',
      preview: 'Want to frame expectations before the eval lands…',
    },
    {
      with: 'Amara Okonkwo',
      topic: 'Q2 delivery stretch goals',
      status: 'Awaiting reply',
      updated: '2d ago',
      preview: 'Happy to take playbook ownership if we define July success…',
    },
    {
      with: 'People Partner',
      topic: 'Career path — ops → product ops',
      status: 'Open',
      updated: '5d ago',
      preview: 'Amara asked about a bridge role…',
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Discussions" title="Coaching threads" detail="Tied to the cycle — not lost in chat." />
      <div className="max-w-2xl space-y-3">
        {rows.map((d) => (
          <div key={d.topic} className="rounded-lg border border-border bg-card p-4">
            <div className="flex gap-3">
              <Initials name={d.with} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{d.with}</p>
                  <StatusPill status={d.status} />
                </div>
                <p className="text-sm font-medium mt-1">{d.topic}</p>
                <p className="mt-2 text-sm text-muted-foreground bg-muted/40 rounded-sm px-3 py-2">{d.preview}</p>
                <p className="mt-2 text-[11px] text-muted-foreground">{d.updated}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OwnTasks() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Your participation"
        title="You’re on the cycle too"
        detail="Managers still owe self and peer work — beside team duties, not instead of them."
      />
      <div className="grid gap-3 lg:grid-cols-2 max-w-3xl">
        {teamMemberTasks.slice(0, 3).map((t) => (
          <TaskCard key={t.id} title={t.title} meta={`${t.type} · Due ${t.due}`} status={t.status} progress={t.progress} />
        ))}
      </div>
      <MvpCallout title="Why this list exists">
        If managers only see team work, their own forms slip. Keeping both visible raises completion.
      </MvpCallout>
    </div>
  );
}

function StatChip({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className={`rounded-sm border bg-card px-3 py-2 text-center min-w-[4.25rem] ${danger ? 'border-[hsl(var(--score-poor)/0.4)]' : 'border-border'}`}>
      <p className={`font-display text-lg font-semibold tabular-nums ${danger ? 'text-[hsl(var(--score-poor))]' : ''}`}>{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

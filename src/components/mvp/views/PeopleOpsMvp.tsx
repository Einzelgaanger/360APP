import { AlertTriangle, Bell, CheckCircle2, Lock, Mail, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  MvpCallout,
  MvpPanel,
  PageHeader,
  StatusPill,
  TimelineRail,
} from '../MvpPrimitives';
import {
  gmCycleMilestones,
  peopleOpsCompletion,
  peopleOpsRosterIssues,
} from '../mvpMockData';

export default function PeopleOpsMvp({ nav }: { nav: string }) {
  if (nav === 'roster') return <Roster />;
  if (nav === 'completion') return <Completion />;
  if (nav === 'fairness') return <Fairness />;
  if (nav === 'comms') return <Comms />;
  return <Cycle />;
}

function Cycle() {
  const checks = [
    { label: 'Roster exceptions cleared', ok: false },
    { label: 'Peer window closed or extended', ok: false },
    { label: 'Fairness flags reviewed', ok: false },
    { label: 'Manager evals ≥ 80%', ok: false },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Cycle control"
        title="Operate the runway"
        detail="Windows, quality bar, release gate — not individual questionnaires."
        aside={
          <div className="flex items-center gap-3 rounded-lg border border-[hsl(var(--score-average)/0.45)] bg-card px-3.5 py-2.5">
            <Lock className="w-5 h-5 text-[hsl(var(--score-average))]" />
            <div>
              <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Release gate</p>
              <p className="font-semibold text-sm">Locked</p>
            </div>
          </div>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <MvpPanel title="Milestones">
          <TimelineRail items={gmCycleMilestones} />
        </MvpPanel>
        <MvpPanel title="Before release">
          <ul className="space-y-3">
            {checks.map((c) => (
              <li key={c.label} className="flex items-center gap-3 text-sm">
                {c.ok ? (
                  <CheckCircle2 className="w-4 h-4 text-[hsl(var(--score-excellent))] shrink-0" />
                ) : (
                  <span className="h-4 w-4 rounded-sm border border-border shrink-0" />
                )}
                <span>{c.label}</span>
              </li>
            ))}
          </ul>
          <Button className="w-full mt-5 rounded-sm" disabled>
            Release results to individuals
          </Button>
          <p className="text-[11px] text-muted-foreground mt-2 text-center">Enabled when checks pass</p>
        </MvpPanel>
      </div>

      <MvpCallout title="Human gate vs auto">
        Some tenants auto-release at a threshold. This view assumes People Ops confirms so exceptions get handled.
      </MvpCallout>
    </div>
  );
}

function Roster() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Roster & mapping"
        title="Fix the map before you chase people"
        detail="Wrong manager or missing peer links create wrong assignments — and noisy completion %."
      />
      <div className="rounded-lg border border-border bg-card divide-y divide-border">
        {peopleOpsRosterIssues.map((r, i) => (
          <div key={r.person} className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-4">
            <span className="font-mono text-xs text-[hsl(var(--score-poor))] tabular-nums w-6">
              {String(i + 1).padStart(2, '0')}
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-medium">{r.person}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{r.issue}</p>
            </div>
            <p className="text-[11px] font-mono uppercase tracking-wider text-[hsl(var(--score-poor))] sm:max-w-[11rem] sm:text-right">
              {r.impact}
            </p>
            <Button size="sm" variant="outline" className="rounded-sm shrink-0">
              Fix mapping
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function Completion() {
  const maxPct = Math.max(...peopleOpsCompletion.map((c) => (c.done / c.total) * 100));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Completion ops"
        title="Chase by form type"
        detail="One vanity percentage hides where the real lag is."
      />
      <div className="space-y-3">
        {peopleOpsCompletion.map((c) => {
          const pct = Math.round((c.done / c.total) * 100);
          return (
            <div key={c.form} className="rounded-lg border border-border bg-card p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{c.form}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Due {c.due} · {c.done}/{c.total}
                    {c.overdue > 0 ? ` · ${c.overdue} overdue` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusPill status={c.overdue > 0 ? 'Watch' : 'Healthy'} />
                  {c.overdue > 0 && (
                    <Button size="sm" variant="outline" className="rounded-sm h-8 gap-1 text-xs">
                      <Bell className="w-3.5 h-3.5" /> Nudge
                    </Button>
                  )}
                </div>
              </div>
              <div className="mt-4 flex items-center gap-4">
                <div className="flex-1 h-2.5 rounded-sm bg-muted overflow-hidden">
                  <div
                    className={`h-full ${
                      pct >= 80
                        ? 'bg-[hsl(var(--score-excellent))]'
                        : pct >= 60
                          ? 'bg-primary'
                          : 'bg-[hsl(var(--score-average))]'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="font-display text-lg font-semibold tabular-nums w-12 text-right">{pct}%</span>
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                {pct === Math.round(maxPct)
                  ? 'Leading form type this cycle'
                  : `${Math.round(maxPct - pct)} pts behind the leading form`}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Fairness() {
  const flags = [
    { text: '7 people below minimum peer responses', severity: 'High', action: 'Extend or hold release' },
    { text: '2 managers scored all directs identically', severity: 'Med', action: 'Flag for calibration' },
    { text: '1 unit under 40% peer coverage', severity: 'High', action: 'Reassign pairs' },
    { text: '3 leavers still on assignment lists', severity: 'Med', action: 'Exclude from cycle' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Fairness"
        title="Pre-release quality checks"
        detail="Catch thin samples and odd patterns before individuals see results."
      />
      <div className="rounded-lg border border-border bg-card divide-y divide-border">
        {flags.map((f) => (
          <div key={f.text} className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3.5">
            <AlertTriangle
              className={`w-4 h-4 shrink-0 ${
                f.severity === 'High' ? 'text-[hsl(var(--score-poor))]' : 'text-[hsl(var(--score-average))]'
              }`}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{f.text}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Suggested: {f.action}</p>
            </div>
            <StatusPill status={f.severity === 'High' ? 'Critical' : 'Watch'} />
            <Button size="sm" variant="outline" className="rounded-sm shrink-0">
              Resolve
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function Comms() {
  const rows = [
    { audience: 'Finance Ops (all)', message: 'Peer 360 window closes Friday', channel: 'In-app + email', status: 'Scheduled', Icon: Mail },
    { audience: 'Managers with drafts', message: 'Submit evaluations by 10 Jul', channel: 'In-app', status: 'Sent', Icon: Bell },
    { audience: 'Ibrahim Yusuf', message: 'Complete overdue monthly self', channel: 'Email', status: 'Sent', Icon: Mail },
    { audience: 'GM + People Ops', message: 'Weekly cycle digest', channel: 'Email', status: 'Recurring', Icon: Send },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Nudges & comms"
        title="Outbound queue"
        detail="Target by unit, role, or overdue set."
        aside={
          <Button className="rounded-sm gap-1.5">
            <Send className="w-4 h-4" /> New nudge
          </Button>
        }
      />
      <div className="max-w-2xl rounded-lg border border-border bg-card divide-y divide-border">
        {rows.map((r) => (
          <div key={r.message} className="flex items-start gap-3 px-4 py-3.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-muted">
              <r.Icon className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-sm">{r.audience}</p>
                <StatusPill status={r.status} />
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">{r.message}</p>
              <p className="text-[11px] text-muted-foreground mt-1">{r.channel}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

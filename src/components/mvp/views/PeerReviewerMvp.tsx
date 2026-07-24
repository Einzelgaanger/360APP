import { ChevronRight, Eye, EyeOff, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Initials,
  MvpCallout,
  MvpPanel,
  PageHeader,
  StatusPill,
  TaskCard,
} from '../MvpPrimitives';
import { peerAssignments, teamMemberTasks } from '../mvpMockData';

export default function PeerReviewerMvp({ nav }: { nav: string }) {
  if (nav === 'guide') return <Guide />;
  if (nav === 'tasks') return <OtherTasks />;
  return <Assignments />;
}

function Assignments() {
  const done = peerAssignments.filter((a) => a.progress === 100).length;
  const sorted = [...peerAssignments].sort((a, b) => a.progress - b.progress);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="360 assignments"
        title="People you actually work with"
        detail="Routed from collaboration — including across units — not only your reporting box. Due 5 Jul."
        aside={
          <div className="text-right">
            <p className="font-display text-3xl font-semibold tabular-nums leading-none">
              {done}/{peerAssignments.length}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">submitted</p>
          </div>
        }
      />

      <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2 text-sm text-muted-foreground">
        <Shield className="w-4 h-4 text-primary shrink-0" />
        Subjects never see your name — only aggregates and themes.
      </div>

      <div className="rounded-lg border border-border bg-card divide-y divide-border">
        {sorted.map((a) => {
          const doneItem = a.progress === 100;
          return (
            <div key={a.reviewee} className={`flex flex-col sm:flex-row sm:items-stretch ${doneItem ? 'opacity-70' : ''}`}>
              <div className="flex-1 p-4 sm:p-5">
                <div className="flex gap-3">
                  <Initials name={a.reviewee} className="h-10 w-10" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-semibold tracking-tight">{a.reviewee}</h3>
                      <StatusPill
                        status={doneItem ? 'Submitted' : a.progress > 0 ? 'In progress' : 'Not started'}
                      />
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <span className="rounded-sm bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">{a.relationship}</span>
                      <span className="rounded-sm bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">{a.dept}</span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{a.note}</p>
                    {!doneItem && a.progress > 0 && (
                      <div className="mt-3 h-1.5 max-w-xs rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${a.progress}%` }} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="sm:w-36 border-t sm:border-t-0 sm:border-l border-border bg-muted/20 flex items-center p-3">
                <Button size="sm" variant={doneItem ? 'outline' : 'default'} className="rounded-sm gap-1 w-full" disabled={doneItem}>
                  {doneItem ? 'Done' : a.progress > 0 ? 'Resume' : 'Start'}
                  {!doneItem && <ChevronRight className="w-3.5 h-3.5" />}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Guide() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Anonymity"
        title="What they see vs what you see"
        detail="Peer 360 only works if people trust it won’t be used to hunt individuals."
      />

      <div className="grid md:grid-cols-2 rounded-lg border border-border overflow-hidden bg-card">
        <div className="p-6 border-b md:border-b-0 md:border-r border-border">
          <div className="flex items-center gap-2 text-primary mb-4">
            <Eye className="w-4 h-4" />
            <p className="font-mono text-[10px] uppercase tracking-wider">Subject sees</p>
          </div>
          <ul className="space-y-3.5 text-sm text-muted-foreground">
            {[
              'Aggregated competency scores',
              'Clustered qualitative themes',
              'Results only after a response threshold',
              'No named peer list',
            ].map((x, i) => (
              <li key={x} className="flex gap-3">
                <span className="font-mono text-[11px] text-primary">{String(i + 1).padStart(2, '0')}</span>
                {x}
              </li>
            ))}
          </ul>
        </div>
        <div className="p-6 bg-muted/25">
          <div className="flex items-center gap-2 text-[hsl(var(--score-excellent))] mb-4">
            <EyeOff className="w-4 h-4" />
            <p className="font-mono text-[10px] uppercase tracking-wider">You see</p>
          </div>
          <ul className="space-y-3.5 text-sm text-muted-foreground">
            {[
              'Who you still owe',
              'Why you were paired',
              'Draft / resume anytime',
              'Confirmation you stay anonymous',
            ].map((x, i) => (
              <li key={x} className="flex gap-3">
                <span className="font-mono text-[11px] text-[hsl(var(--score-excellent))]">{String(i + 1).padStart(2, '0')}</span>
                {x}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <MvpPanel title="Example of what they get after release">
        <div className="rounded-md border border-dashed border-border bg-muted/30 p-4 space-y-2">
          <p className="text-sm font-medium">Collaboration · 4.1 <span className="text-muted-foreground font-normal">(n=5)</span></p>
          <p className="text-sm text-muted-foreground italic">“Reliable under pressure on settlement exceptions…”</p>
          <p className="text-[11px] text-muted-foreground">Peer identities not shown</p>
        </div>
      </MvpPanel>

      <MvpCallout title="Configurable">
        Thresholds and release timing are tenant settings. The safety principle stays the same.
      </MvpCallout>
    </div>
  );
}

function OtherTasks() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Other tasks"
        title="Your own forms"
        detail="Peer review sits on top of being a participant yourself."
      />
      <div className="grid gap-3 lg:grid-cols-2 max-w-3xl">
        {teamMemberTasks.slice(0, 2).map((t) => (
          <TaskCard key={t.id} title={t.title} meta={`${t.type} · Due ${t.due}`} status={t.status} progress={t.progress} />
        ))}
      </div>
    </div>
  );
}

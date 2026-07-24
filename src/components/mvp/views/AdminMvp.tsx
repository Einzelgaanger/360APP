import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Download, FileSpreadsheet, Settings2, ToggleLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  MvpCallout,
  MvpPanel,
  PageHeader,
  PageHero,
  StatusPill,
} from '../MvpPrimitives';
import { adminAnalytics, adminConfig, adminForms } from '../mvpMockData';

export default function AdminMvp({ nav }: { nav: string }) {
  if (nav === 'config') return <Config />;
  if (nav === 'forms') return <Forms />;
  if (nav === 'analytics') return <Analytics />;
  if (nav === 'export') return <ExportView />;
  return <Overview />;
}

function Overview() {
  return (
    <div className="space-y-6">
      <PageHero
        tone="ink"
        kicker="Platform admin"
        title="Configure the machine — don’t run the cycle"
        detail="Levels, forms, anonymity, gates, modules. Day-to-day leadership stays on GM and manager screens."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Participants', value: '98' },
          { label: 'Active forms', value: '4' },
          { label: 'Open config', value: '2' },
          { label: 'Responses', value: '412' },
        ].map((m) => (
          <div key={m.label} className="rounded-lg border border-border bg-card px-4 py-4">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{m.label}</p>
            <p className="font-display text-2xl font-semibold tabular-nums mt-2">{m.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <MvpPanel title="Needs attention" flush>
          <ul className="divide-y divide-border">
            {[
              'Dual-manager mapping incomplete for Shared Ops trio',
              'Email channel not verified in this environment',
            ].map((x) => (
              <li key={x} className="px-5 py-3.5 text-sm text-muted-foreground flex gap-2">
                <Settings2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                {x}
              </li>
            ))}
          </ul>
        </MvpPanel>
        <MvpCallout title="Admin ≠ GM">
          Keep configuration here. Put unit health, talent flags, and coaching queues on the General Manager seat.
        </MvpCallout>
      </div>
    </div>
  );
}

function Config() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Configuration"
        title="Tenant knobs"
        detail="What usually gets set when a subsidiary adopts the platform."
      />
      <div className="rounded-lg border border-border bg-card divide-y divide-border max-w-3xl">
        {adminConfig.map((c) => (
          <div key={c.knobs} className="px-5 py-4 flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-6">
            <p className="text-sm font-medium sm:w-40 shrink-0">{c.knobs}</p>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-primary">{c.current}</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{c.note}</p>
            </div>
            <Button variant="ghost" size="sm" className="rounded-sm shrink-0 self-start">
              Edit
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function Forms() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Forms & cadence"
        title="Catalogue"
        detail="Enable only what this subsidiary needs. Cadence is per form."
      />
      <div className="max-w-3xl rounded-lg border border-border bg-card divide-y divide-border">
        {adminForms.map((f) => (
          <div key={f.code} className="px-4 py-4 flex items-center gap-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-primary/10 text-primary">
              <ToggleLeft className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">{f.name}</p>
                <code className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-sm">{f.code}</code>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {f.cadence} · {f.audience}
              </p>
            </div>
            <StatusPill status="Healthy" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 max-w-3xl">
        <MvpPanel title="Common add-ons">
          <ul className="text-sm text-muted-foreground space-y-1.5 list-disc pl-4">
            <li>Assessor layer on leadership forms</li>
            <li>OKR-linked sections</li>
            <li>Comment-only flows</li>
            <li>Project-based 360</li>
          </ul>
        </MvpPanel>
        <MvpPanel title="Often left off">
          <ul className="text-sm text-muted-foreground space-y-1.5 list-disc pl-4">
            <li>Public rankings</li>
            <li>Growth hub until culture is ready</li>
            <li>Email (in-app only)</li>
            <li>Monthly self (quarterly-only tenants)</li>
          </ul>
        </MvpPanel>
      </div>
    </div>
  );
}

function Analytics() {
  const chartData = [
    { name: 'Responses', value: 412 },
    { name: 'People', value: 98 },
    { name: 'Threads', value: 47 },
    { name: 'Exports', value: 6 },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Analytics"
        title="Process health"
        detail="Adoption and throughput — not people scores."
      />
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {adminAnalytics.map((a) => (
          <div key={a.metric} className="rounded-lg border border-border bg-card px-3 py-3">
            <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground leading-snug">{a.metric}</p>
            <p className="font-display text-xl font-semibold tabular-nums mt-2">{a.value}</p>
          </div>
        ))}
      </div>
      <MvpPanel title="Volume snapshot">
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" fill="hsl(202 65% 46%)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </MvpPanel>
    </div>
  );
}

function ExportView() {
  const rows = [
    { name: 'Cycle completion workbook', desc: 'By unit · form · person', status: 'Ready', Icon: FileSpreadsheet },
    { name: 'Peer theme extract', desc: 'Anonymised clusters', status: 'Ready', Icon: FileSpreadsheet },
    { name: 'Manager evaluation pack', desc: 'Directs · scores · comments', status: 'Queued', Icon: FileSpreadsheet },
    { name: 'Audit trail', desc: 'Who submitted when', status: 'Ready', Icon: Download },
  ];

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Exports" title="Offline packs" detail="Calibration meetings, board packs, archive." />
      <div className="grid gap-3 sm:grid-cols-2 max-w-3xl">
        {rows.map((r) => (
          <div key={r.name} className="rounded-lg border border-border bg-card p-5 flex flex-col">
            <div className="flex items-start justify-between gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-muted">
                <r.Icon className="w-5 h-5 text-muted-foreground" />
              </div>
              <StatusPill status={r.status} />
            </div>
            <p className="font-semibold mt-4">{r.name}</p>
            <p className="text-xs text-muted-foreground mt-1 flex-1">{r.desc}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 rounded-sm gap-1.5 w-full"
              disabled={r.status === 'Queued'}
            >
              <Download className="w-3.5 h-3.5" />
              {r.status === 'Queued' ? 'Generating…' : 'Download'}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

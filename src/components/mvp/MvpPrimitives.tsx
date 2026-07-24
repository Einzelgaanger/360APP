import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export function PageHeader({
  eyebrow,
  title,
  detail,
  aside,
}: {
  eyebrow: string;
  title: string;
  detail?: string;
  aside?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
      <div className="min-w-0 max-w-2xl">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{eyebrow}</p>
        <h2 className="font-display text-2xl font-semibold tracking-tight mt-1 text-foreground">{title}</h2>
        {detail && <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{detail}</p>}
      </div>
      {aside && <div className="shrink-0">{aside}</div>}
    </div>
  );
}

export function GapMeter({
  self,
  upward,
  label = 'Self vs upward',
}: {
  self: number;
  upward: number;
  label?: string;
}) {
  const gap = Number((self - upward).toFixed(1));
  const wide = Math.abs(gap) >= 0.3;
  return (
    <div className="rounded-sm border border-border bg-muted/30 px-3 py-2.5">
      <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="mt-1.5 flex items-baseline gap-2">
        <span className="font-display text-lg font-semibold tabular-nums">{self.toFixed(1)}</span>
        <span className="text-muted-foreground text-xs">→</span>
        <span className="font-display text-lg font-semibold tabular-nums">{upward.toFixed(1)}</span>
        <span
          className={cn(
            'ml-auto text-xs font-medium tabular-nums',
            wide ? 'text-[hsl(var(--score-poor))]' : 'text-muted-foreground',
          )}
        >
          {gap > 0 ? '+' : ''}
          {gap} gap
        </span>
      </div>
    </div>
  );
}

export function MvpSection({
  eyebrow,
  title,
  subtitle,
  children,
  className,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('space-y-5', className)}>
      <div className="max-w-3xl">
        {eyebrow && (
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary mb-2">{eyebrow}</p>
        )}
        <h3 className="font-display text-xl sm:text-2xl font-semibold tracking-tight text-foreground">{title}</h3>
        {subtitle && <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

export function PageHero({
  kicker,
  title,
  detail,
  aside,
  tone = 'default',
}: {
  kicker?: string;
  title: string;
  detail?: string;
  aside?: React.ReactNode;
  tone?: 'default' | 'ink' | 'alert' | 'calm';
}) {
  const tones = {
    default: 'from-primary/15 via-card to-accent/20 border-primary/20',
    ink: 'from-foreground/95 via-foreground to-[hsl(204_32%_22%)] text-background border-foreground',
    alert: 'from-[hsl(var(--score-poor)/0.12)] via-card to-card border-[hsl(var(--score-poor)/0.35)]',
    calm: 'from-[hsl(var(--score-excellent)/0.12)] via-card to-accent/30 border-[hsl(var(--score-excellent)/0.3)]',
  };
  const isInk = tone === 'ink';

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 sm:p-7',
        tones[tone],
      )}
    >
      <div
        className={cn(
          'pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full blur-3xl opacity-40',
          isInk ? 'bg-primary' : 'bg-primary/50',
        )}
      />
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 max-w-2xl">
          {kicker && (
            <p
              className={cn(
                'font-mono text-[10px] uppercase tracking-[0.22em] mb-2',
                isInk ? 'text-background/60' : 'text-muted-foreground',
              )}
            >
              {kicker}
            </p>
          )}
          <h2
            className={cn(
              'font-display text-2xl sm:text-3xl font-semibold tracking-tight leading-tight',
              isInk ? 'text-background' : 'text-foreground',
            )}
          >
            {title}
          </h2>
          {detail && (
            <p className={cn('mt-2 text-sm leading-relaxed max-w-xl', isInk ? 'text-background/70' : 'text-muted-foreground')}>
              {detail}
            </p>
          )}
        </div>
        {aside && <div className="shrink-0">{aside}</div>}
      </div>
    </div>
  );
}

export function MetricStrip({
  items,
}: {
  items: { label: string; value: string; sub?: string; tone?: 'good' | 'warn' | 'bad' | 'neutral' }[];
}) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 overflow-hidden rounded-2xl border border-border bg-card divide-x divide-y xl:divide-y-0 divide-border">
      {items.map((item) => (
        <div key={item.label} className="p-4 sm:p-5 min-w-0">
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground truncate">{item.label}</p>
          <p
            className={cn(
              'mt-2 font-display text-2xl font-semibold tabular-nums tracking-tight',
              item.tone === 'good' && 'text-[hsl(var(--score-excellent))]',
              item.tone === 'warn' && 'text-[hsl(var(--score-average))]',
              item.tone === 'bad' && 'text-[hsl(var(--score-poor))]',
              (!item.tone || item.tone === 'neutral') && 'text-foreground',
            )}
          >
            {item.value}
          </p>
          {item.sub && <p className="mt-1 text-[11px] text-muted-foreground leading-snug">{item.sub}</p>}
        </div>
      ))}
    </div>
  );
}

/** @deprecated prefer MetricStrip — kept for gradual migration */
export function MvpStatGrid({
  items,
}: {
  items: { label: string; value: string; sub?: string; tone?: 'good' | 'warn' | 'bad' | 'neutral' }[];
}) {
  return <MetricStrip items={items} />;
}

export function MvpPanel({
  title,
  action,
  children,
  className,
  flush,
}: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  flush?: boolean;
}) {
  return (
    <div className={cn('rounded-2xl border border-border bg-card/90 backdrop-blur-sm shadow-[0_1px_0_hsl(var(--border))]', className)}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 border-b border-border/80 px-5 py-3.5">
          {title ? <h4 className="text-sm font-semibold tracking-tight text-foreground">{title}</h4> : <span />}
          {action}
        </div>
      )}
      <div className={flush ? '' : 'p-5'}>{children}</div>
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const lower = status.toLowerCase();
  const tone =
    lower.includes('done') ||
    lower.includes('submitted') ||
    lower.includes('healthy') ||
    lower.includes('completed') ||
    lower.includes('sent') ||
    lower.includes('ready') ||
    lower.includes('strength')
      ? 'bg-[hsl(var(--score-excellent)/0.15)] text-[hsl(var(--score-excellent))]'
      : lower.includes('overdue') ||
          lower.includes('critical') ||
          lower.includes('at risk') ||
          lower.includes('escalat') ||
          lower.includes('concern')
        ? 'bg-[hsl(var(--score-poor)/0.12)] text-[hsl(var(--score-poor))]'
        : lower.includes('draft') ||
            lower.includes('progress') ||
            lower.includes('watch') ||
            lower.includes('await') ||
            lower.includes('scheduled') ||
            lower.includes('opportunity')
          ? 'bg-[hsl(var(--score-average)/0.15)] text-[hsl(var(--score-average))]'
          : 'bg-muted text-muted-foreground';

  return (
    <Badge variant="secondary" className={cn('font-normal rounded-full px-2.5', tone)}>
      {status}
    </Badge>
  );
}

export function MvpProgressRow({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <span className="text-muted-foreground tabular-nums">{hint ?? `${value}%`}</span>
      </div>
      <Progress value={Math.min(100, Math.max(0, value))} className="h-2" />
    </div>
  );
}

export function ScoreRing({
  value,
  label,
  max = 5,
}: {
  value: number;
  label: string;
  max?: number;
}) {
  const pct = Math.min(1, Math.max(0, value / max));
  const r = 34;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct);
  const color =
    value >= 4 ? 'hsl(var(--score-excellent))' : value >= 3.3 ? 'hsl(var(--primary))' : 'hsl(var(--score-average))';

  return (
    <div className="inline-flex flex-col items-center">
      <div className="relative h-[88px] w-[88px]">
        <svg width="88" height="88" viewBox="0 0 88 88" className="-rotate-90">
          <circle cx="44" cy="44" r={r} fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
          <circle
            cx="44"
            cy="44"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center rotate-0">
          <span className="font-display text-xl font-semibold tabular-nums">{value.toFixed(1)}</span>
        </div>
      </div>
      <p className="mt-1.5 text-[11px] text-muted-foreground text-center">{label}</p>
    </div>
  );
}

export function Initials({ name, className }: { name: string; className?: string }) {
  const parts = name.trim().split(/\s+/);
  const letters = ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
  return (
    <div
      className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary',
        className,
      )}
    >
      {letters}
    </div>
  );
}

export function SplitStage({
  main,
  rail,
}: {
  main: React.ReactNode;
  rail: React.ReactNode;
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0 space-y-5">{main}</div>
      <aside className="space-y-4 xl:sticky xl:top-28 xl:self-start">{rail}</aside>
    </div>
  );
}

export function AttentionList({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <MvpPanel title={title} flush>
      <ol className="divide-y divide-border">
        {items.map((item, i) => (
          <li key={item} className="flex gap-3 px-5 py-3.5 text-sm">
            <span className="font-mono text-[11px] text-primary tabular-nums pt-0.5">{String(i + 1).padStart(2, '0')}</span>
            <span className="text-muted-foreground leading-relaxed">{item}</span>
          </li>
        ))}
      </ol>
    </MvpPanel>
  );
}

export function TimelineRail({
  items,
}: {
  items: { name: string; date: string; done: boolean }[];
}) {
  return (
    <div className="relative pl-2">
      <div className="absolute left-[19px] top-3 bottom-3 w-px bg-border" />
      <ul className="space-y-0">
        {items.map((m) => (
          <li key={m.name} className="relative flex gap-4 py-3">
            <span
              className={cn(
                'relative z-10 mt-1 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-background ring-2',
                m.done ? 'bg-[hsl(var(--score-excellent))] ring-[hsl(var(--score-excellent)/0.35)]' : 'bg-muted ring-border',
              )}
            />
            <div className="flex flex-1 items-start justify-between gap-3 min-w-0">
              <div>
                <p className={cn('text-sm font-medium', m.done ? 'text-foreground' : 'text-muted-foreground')}>{m.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{m.date}</p>
              </div>
              <StatusPill status={m.done ? 'Done' : 'Upcoming'} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function HeatBar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const tone =
    pct >= 85 ? 'bg-[hsl(var(--score-excellent))]' : pct >= 65 ? 'bg-primary' : pct >= 45 ? 'bg-[hsl(var(--score-average))]' : 'bg-[hsl(var(--score-poor))]';
  return (
    <div className="flex items-center gap-2 min-w-[7rem]">
      <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', tone)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs tabular-nums text-muted-foreground w-8 text-right">{Math.round(pct)}%</span>
    </div>
  );
}

export function MvpTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: React.ReactNode[][];
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            {headers.map((h) => (
              <th
                key={h}
                className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-medium"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-border/80 hover:bg-muted/25 transition-colors">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3 align-top text-foreground">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function MvpCallout({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-primary/30 bg-gradient-to-r from-primary/5 to-transparent px-5 py-4">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <div className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{children}</div>
    </div>
  );
}

export function TaskCard({
  title,
  meta,
  status,
  progress,
  accent,
}: {
  title: string;
  meta: string;
  status: string;
  progress: number;
  accent?: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-md">
      <div className={cn('absolute inset-y-0 left-0 w-1', accent ?? 'bg-primary')} />
      <div className="p-5 pl-6">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-medium text-foreground">{title}</p>
            <p className="text-xs text-muted-foreground mt-1">{meta}</p>
          </div>
          <StatusPill status={status} />
        </div>
        <div className="mt-4">
          <MvpProgressRow label="Progress" value={progress} />
        </div>
      </div>
    </div>
  );
}

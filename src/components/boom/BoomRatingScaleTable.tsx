import { BOOM_RATING_SCALE } from '@/lib/boomRatingScale';
import { cn } from '@/lib/utils';

interface BoomRatingScaleTableProps {
  title?: string;
  showPctRange?: boolean;
  className?: string;
}

const ROW_TONE: Record<number, string> = {
  5: 'bg-emerald-500/15 border-emerald-500/25',
  4: 'bg-sky-500/10 border-sky-500/20',
  3: 'bg-amber-500/10 border-amber-500/20',
  2: 'bg-orange-500/10 border-orange-500/20',
  1: 'bg-rose-500/10 border-rose-500/25',
};

export default function BoomRatingScaleTable({
  title = 'Rating scale — applies to all questions',
  showPctRange = false,
  className,
}: BoomRatingScaleTableProps) {
  return (
    <div className={cn('rounded-xl border border-border overflow-hidden', className)}>
      <div className="bg-slate-900 text-white px-4 py-2.5">
        <p className="text-xs font-semibold tracking-wide">{title}</p>
      </div>
      <div className="divide-y divide-border/60">
        {BOOM_RATING_SCALE.map((row) => (
          <div
            key={row.value}
            className={cn(
              'grid grid-cols-[2.5rem_1fr] sm:grid-cols-[2.5rem_8rem_1fr] gap-x-3 gap-y-1 px-3 py-2.5 text-xs border-l-4',
              ROW_TONE[row.value],
            )}
          >
            <span className="font-bold text-foreground">{row.value}</span>
            <span className="font-semibold text-foreground sm:col-start-2">{row.label}</span>
            <span className="text-muted-foreground leading-relaxed col-span-2 sm:col-span-1 sm:col-start-3">
              {row.meaning}
              {showPctRange && row.pctRange && (
                <span className="block text-[10px] mt-0.5 opacity-80">Band: {row.pctRange}</span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

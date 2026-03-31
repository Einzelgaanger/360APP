import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface CategoryScore {
  category: string;
  myScore: number;
  orgAvg: number;
}

interface DetailedCategoryBreakdownProps {
  scores: CategoryScore[];
}

export default function DetailedCategoryBreakdown({ scores }: DetailedCategoryBreakdownProps) {
  if (scores.length === 0) return null;

  const sorted = [...scores].sort((a, b) => b.myScore - a.myScore);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-panel p-6">
      <h2 className="text-sm font-semibold mb-1">Detailed Category Breakdown</h2>
      <p className="text-[10px] text-muted-foreground mb-4">Your performance across all competency areas</p>

      {/* Best & Worst highlights */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-[10px] font-semibold text-emerald-600">Strongest Area</span>
          </div>
          <p className="text-xs font-bold text-foreground truncate">{best.category}</p>
          <p className="text-lg font-bold text-emerald-600">{best.myScore}<span className="text-xs font-normal text-muted-foreground">/5</span></p>
        </div>
        <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/20">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingDown className="w-3.5 h-3.5 text-red-500" />
            <span className="text-[10px] font-semibold text-red-500">Growth Area</span>
          </div>
          <p className="text-xs font-bold text-foreground truncate">{worst.category}</p>
          <p className="text-lg font-bold text-red-500">{worst.myScore}<span className="text-xs font-normal text-muted-foreground">/5</span></p>
        </div>
      </div>

      {/* All categories with bars */}
      <div className="space-y-3">
        {sorted.map((score, i) => {
          const diff = score.orgAvg > 0 ? score.myScore - score.orgAvg : 0;
          const isAbove = diff > 0.1;
          const isBelow = diff < -0.1;
          return (
            <motion.div
              key={score.category}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * i }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-medium text-foreground">{score.category}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold">{score.myScore}</span>
                  {score.orgAvg > 0 && (
                    <span className={`text-[9px] flex items-center gap-0.5 ${isAbove ? 'text-emerald-600' : isBelow ? 'text-red-500' : 'text-muted-foreground'}`}>
                      {isAbove ? <TrendingUp className="w-2.5 h-2.5" /> : isBelow ? <TrendingDown className="w-2.5 h-2.5" /> : <Minus className="w-2.5 h-2.5" />}
                      {diff > 0 ? '+' : ''}{diff.toFixed(1)} vs org
                    </span>
                  )}
                </div>
              </div>
              <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(score.myScore / 5) * 100}%` }}
                  transition={{ duration: 0.6, delay: 0.05 * i }}
                  className="absolute inset-y-0 left-0 rounded-full bg-primary"
                />
                {score.orgAvg > 0 && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-muted-foreground/50"
                    style={{ left: `${(score.orgAvg / 5) * 100}%` }}
                    title={`Org avg: ${score.orgAvg}`}
                  />
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="flex items-center gap-4 mt-4 text-[10px] text-muted-foreground justify-center">
        <span className="flex items-center gap-1"><span className="w-3 h-1.5 bg-primary rounded" /> Your Score</span>
        <span className="flex items-center gap-1"><span className="w-0.5 h-3 bg-muted-foreground/50" /> Org Average</span>
      </div>
    </motion.div>
  );
}

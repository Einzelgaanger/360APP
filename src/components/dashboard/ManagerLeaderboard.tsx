import { motion } from 'framer-motion';
import { ManagerSummary } from '@/types/appraisal';
import { cn } from '@/lib/utils';
import { Trophy, TrendingUp, Users, ChevronRight } from 'lucide-react';

interface ManagerLeaderboardProps {
  managers: ManagerSummary[];
  onSelectManager: (manager: ManagerSummary) => void;
  selectedManager?: string | null;
}

function getScoreColor(score: number): string {
  if (score >= 3.5) return 'text-success';
  if (score >= 2.5) return 'text-primary';
  if (score >= 2) return 'text-warning';
  return 'text-destructive';
}

function getScoreBg(score: number): string {
  if (score >= 3.5) return 'bg-success/20 border-success/30';
  if (score >= 2.5) return 'bg-primary/20 border-primary/30';
  if (score >= 2) return 'bg-warning/20 border-warning/30';
  return 'bg-destructive/20 border-destructive/30';
}

function getRankBadge(rank: number) {
  if (rank === 1) return { icon: '🥇', class: 'bg-yellow-500/20 text-yellow-400' };
  if (rank === 2) return { icon: '🥈', class: 'bg-gray-400/20 text-gray-300' };
  if (rank === 3) return { icon: '🥉', class: 'bg-orange-500/20 text-orange-400' };
  return { icon: rank.toString(), class: 'bg-muted text-muted-foreground' };
}

export default function ManagerLeaderboard({
  managers,
  onSelectManager,
  selectedManager,
}: ManagerLeaderboardProps) {
  return (
    <div className="glass-card overflow-hidden">
      <div className="p-6 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <Trophy className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Manager Leaderboard</h3>
              <p className="text-xs text-muted-foreground">{managers.length} managers ranked</p>
            </div>
          </div>
          <TrendingUp className="w-5 h-5 text-muted-foreground" />
        </div>
      </div>

      <div className="max-h-[500px] overflow-y-auto scrollbar-thin">
        {managers.map((manager, index) => {
          const rank = getRankBadge(index + 1);
          const isSelected = selectedManager === manager.manager_name;
          
          return (
            <motion.div
              key={manager.manager_name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onSelectManager(manager)}
              className={cn(
                'flex items-center gap-4 p-4 cursor-pointer transition-all border-l-2',
                'hover:bg-secondary/50',
                isSelected 
                  ? 'bg-primary/10 border-l-primary' 
                  : 'border-l-transparent'
              )}
            >
              {/* Rank Badge */}
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                rank.class
              )}>
                {index < 3 ? rank.icon : rank.icon}
              </div>

              {/* Manager Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{manager.manager_name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Users className="w-3 h-3" />
                  <span>{manager.total_responses} reviews</span>
                </div>
              </div>

              {/* Scores */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className={cn(
                    'text-lg font-bold',
                    getScoreColor(manager.overall_score)
                  )}>
                    {manager.overall_score.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">Overall</p>
                </div>
                <div className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center border',
                  getScoreBg(manager.overall_score)
                )}>
                  <span className={cn('text-sm font-bold', getScoreColor(manager.overall_score))}>
                    {((manager.overall_score / 4) * 100).toFixed(0)}%
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
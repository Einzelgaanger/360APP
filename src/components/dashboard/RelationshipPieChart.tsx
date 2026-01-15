import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';

interface RelationshipPieChartProps {
  distribution: Record<string, number>;
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--accent))',
  'hsl(var(--chart-3))',
  'hsl(var(--success))',
  'hsl(var(--chart-5))',
];

function shortenLabel(label: string): string {
  if (label.includes('direct report')) return 'Direct Report';
  if (label.includes('executive in charge')) return 'Executive';
  if (label.includes('worked a few times')) return 'Occasional';
  if (label.includes('not have direct')) return 'No Direct';
  if (label === 'Colleague') return 'Colleague';
  return label.slice(0, 15) + '...';
}

export default function RelationshipPieChart({ distribution }: RelationshipPieChartProps) {
  const data = Object.entries(distribution)
    .filter(([_, count]) => count > 0)
    .map(([name, value]) => ({
      name: shortenLabel(name),
      fullName: name,
      value,
    }));

  const total = data.reduce((acc, item) => acc + item.value, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-card p-6"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-chart-3/20">
          <Users className="w-5 h-5 text-chart-3" />
        </div>
        <div>
          <h3 className="font-semibold">Reviewer Relationships</h3>
          <p className="text-xs text-muted-foreground">{total} reviews by relationship type</p>
        </div>
      </div>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((_, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]}
                  stroke="hsl(var(--background))"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip
              content={({ payload }) => {
                if (!payload || !payload[0]) return null;
                const data = payload[0].payload;
                const percentage = ((data.value / total) * 100).toFixed(1);
                return (
                  <div className="glass-card p-3 shadow-xl max-w-xs">
                    <p className="font-medium text-sm">{data.fullName}</p>
                    <p className="text-lg font-bold text-primary">{data.value}</p>
                    <p className="text-xs text-muted-foreground">{percentage}% of reviews</p>
                  </div>
                );
              }}
            />
            <Legend 
              verticalAlign="bottom"
              height={36}
              formatter={(value) => (
                <span className="text-xs text-muted-foreground">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
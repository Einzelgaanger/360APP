import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Users, Eye } from 'lucide-react';
import { defaultMonthPeriod, defaultQuarterPeriod } from '@/lib/boomPeriods';

const EO_SUBSIDIARY = '11111111-1111-1111-1111-111111111111';

type RosterRow = {
  employee_id: string;
  name: string;
  email: string | null;
  role: string | null;
  department: string | null;
  department_code: string | null;
  manager_name: string | null;
};

type Insight = {
  monthly_self_status?: string;
  executive_self_status?: string;
  peer_360_released?: boolean;
  peer_360_sections?: { section: string; avg_score: number; response_count: number }[];
  peer_360_by_relation?: { relation: string; avg_score: number; response_count: number }[];
};

const RELATION_LABELS: Record<string, string> = {
  up: 'From leaders (up)',
  down: 'From team (down)',
  lateral: 'From peers (lateral)',
  self: 'Self',
};

interface BoomDirectoryPanelProps {
  viewerHierarchyLevel: number | null;
  isAdmin: boolean;
}

export default function BoomDirectoryPanel({ viewerHierarchyLevel, isAdmin }: BoomDirectoryPanelProps) {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<RosterRow[]>([]);
  const [selected, setSelected] = useState<RosterRow | null>(null);
  const [insight, setInsight] = useState<Insight | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);

  const canView = isAdmin || (viewerHierarchyLevel !== null && viewerHierarchyLevel <= 1);

  const load = useCallback(async () => {
    if (!canView) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.rpc('get_eo_directory_roster');
    if (!error && data?.length) {
      setRows(data as RosterRow[]);
    } else if (isAdmin || viewerHierarchyLevel === 0) {
      const { data: fallback } = await supabase
        .from('employees')
        .select('id, name, email, role, department, department_code, manager:manager_id(name)')
        .eq('subsidiary_id', EO_SUBSIDIARY)
        .eq('hierarchy_level', 2)
        .eq('eo_appraisal_active', true)
        .order('name');
      setRows(
        (fallback ?? []).map((e: Record<string, unknown>) => ({
          employee_id: e.id as string,
          name: e.name as string,
          email: e.email as string | null,
          role: e.role as string | null,
          department: e.department as string | null,
          department_code: e.department_code as string | null,
          manager_name: (e.manager as { name?: string } | null)?.name ?? null,
        })),
      );
    } else {
      setRows([]);
    }
    setLoading(false);
  }, [canView, isAdmin, viewerHierarchyLevel]);

  useEffect(() => {
    void load();
  }, [load]);

  const openInsight = async (row: RosterRow) => {
    setSelected(row);
    setInsightLoading(true);
    const { data, error } = await supabase.rpc('get_eo_employee_insight', {
      _employee_id: row.employee_id,
      _period_quarter: defaultQuarterPeriod,
      _period_month: defaultMonthPeriod,
    });
    setInsight(error ? null : (data as Insight));
    setInsightLoading(false);
  };

  if (!canView) {
    return (
      <p className="text-sm text-muted-foreground">
        The team directory is available to Executive leadership (L0/L1) and admins.
      </p>
    );
  }

  return (
    <>
      <div className="glass-panel p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          <h4 className="text-sm font-semibold">Team directory</h4>
          <Badge variant="outline" className="text-[10px]">Level 2 · masked 360</Badge>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Open a colleague to see monthly self-assessment status, performance self-assessment status, and
          aggregated anonymous 360 (no reviewer names).
        </p>
        {loading ? (
          <p className="text-xs text-muted-foreground flex items-center gap-2">
            <Loader2 className="w-3 h-3 animate-spin" /> Loading roster…
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {rows.map((row) => (
              <button
                key={row.employee_id}
                type="button"
                onClick={() => void openInsight(row)}
                className="text-left rounded-xl border border-border p-3 hover:border-primary/40 hover:bg-muted/30 transition-colors"
              >
                <p className="font-medium text-sm">{row.name}</p>
                <p className="text-[11px] text-muted-foreground">{row.role ?? '—'}</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {row.department_code ?? row.department ?? '—'}
                  {row.manager_name ? ` · ${row.manager_name}` : ''}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              {selected?.name}
            </DialogTitle>
          </DialogHeader>
          {insightLoading ? (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading…
            </p>
          ) : insight ? (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg border p-2">
                  <p className="text-[10px] uppercase text-muted-foreground">Monthly self</p>
                  <p className="font-medium">{insight.monthly_self_status ?? '—'}</p>
                </div>
                <div className="rounded-lg border p-2">
                  <p className="text-[10px] uppercase text-muted-foreground">Performance self</p>
                  <p className="font-medium">{insight.executive_self_status ?? '—'}</p>
                </div>
              </div>
              <div>
                <p className="text-[10px] uppercase text-muted-foreground mb-2">360 (anonymous aggregate)</p>
                {!insight.peer_360_released ? (
                  <p className="text-xs text-muted-foreground">Withheld until HR release for this quarter.</p>
                ) : !insight.peer_360_sections?.length ? (
                  <p className="text-xs text-muted-foreground">No peer scores yet (or below minimum responses).</p>
                ) : (
                  <>
                    {insight.peer_360_by_relation && insight.peer_360_by_relation.length > 0 && (
                      <div className="mb-3 space-y-1">
                        <p className="text-[10px] text-muted-foreground mb-1">By relation</p>
                        {insight.peer_360_by_relation.map((r) => (
                          <div
                            key={r.relation}
                            className="flex justify-between text-xs border-b border-border/40 py-1"
                          >
                            <span>{RELATION_LABELS[r.relation] ?? r.relation}</span>
                            <span className="font-mono">
                              {r.avg_score} ({r.response_count})
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    <ul className="space-y-1">
                      {insight.peer_360_sections?.map((s) => (
                        <li key={s.section} className="flex justify-between text-xs border-b border-border/40 py-1">
                          <span>{s.section}</span>
                          <span className="font-mono">
                            {s.avg_score} ({s.response_count})
                          </span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Could not load insight data.</p>
          )}
          <Button variant="outline" size="sm" onClick={() => setSelected(null)}>
            Close
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}

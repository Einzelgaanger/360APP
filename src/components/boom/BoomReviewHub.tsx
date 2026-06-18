import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ClipboardList, Loader2, Sparkles, TrendingUp, UserCircle, Mail, MessageSquare, Users, LayoutDashboard, MessagesSquare } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BoomCommentsPanel from './BoomCommentsPanel';
import BoomDirectoryPanel from './BoomDirectoryPanel';
import BoomInsightsPanel from './BoomInsightsPanel';
import BoomDiscussionsPanel from './BoomDiscussionsPanel';
import { toast } from 'sonner';
import { boomFormPurpose, boomHierarchyLabel, boomPeerFormHint, boomTasksIntro } from '@/lib/boomRoleLabels';
import { isEoTeamMember } from '@/lib/eoPilot';
import {
  defaultMonthPeriod,
  defaultQuarterPeriod,
  quarterOptions,
  monthOptions,
} from '@/lib/boomPeriods';
import AssessmentRunner from './AssessmentRunner';
import ExecutiveAssessorRunner from './ExecutiveAssessorRunner';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

export type AssignmentRow = {
  form_code: string;
  form_title: string;
  reviewee_id: string;
  reviewee_name: string;
  reviewee_role: string | null;
  reviewee_department: string | null;
  anonymous: boolean;
  response_id: string | null;
  status: string;
};

export type AssessorTaskRow = {
  reviewee_id: string;
  reviewee_name: string;
  reviewee_role: string | null;
  self_response_id: string;
  assessor_review_id: string | null;
  assessor_status: string;
};

const FORM_LABELS: Record<string, string> = {
  executive: 'Executive assessment',
  peer_360: '360 Peer review',
  monthly_self: 'Monthly self-assessment',
  ea_quarterly: 'EA quarterly (manager)',
  epa_gceo_assessor: 'Executive Performance Assessment (GCEO)',
};

/** Stable card order so every role sees the same structure */
const FORM_ORDER = ['executive', 'epa_gceo_assessor', 'ea_quarterly', 'peer_360', 'monthly_self'];
const TEAM_MEMBER_FORM_ORDER = ['monthly_self', 'ea_quarterly', 'peer_360'];
/** L2+ team members never receive executive self-assessment via assignments */
const TEAM_MEMBER_BLOCKED_FORMS = new Set(['executive']);

function statusBadge(status: string) {
  if (status === 'submitted') return <Badge className="text-[10px] bg-emerald-600">Done</Badge>;
  if (status === 'draft') return <Badge variant="secondary" className="text-[10px]">In progress</Badge>;
  if (status === 'waiting_self') return <Badge variant="outline" className="text-[10px]">Awaiting self</Badge>;
  return <Badge variant="outline" className="text-[10px]">To do</Badge>;
}

interface BoomReviewHubProps {
  reviewerEmployeeId: string | null;
  reviewerHierarchyLevel: number | null;
  reviewerName?: string | null;
  reviewerRole?: string | null;
  reviewerDepartment?: string | null;
  reviewerEmail?: string | null;
  isPlatformAdmin?: boolean;
}

export default function BoomReviewHub({
  reviewerEmployeeId,
  reviewerHierarchyLevel,
  reviewerName,
  reviewerRole,
  reviewerDepartment,
  reviewerEmail,
  isPlatformAdmin = false,
}: BoomReviewHubProps) {
  const [searchParams] = useSearchParams();
  const initialBoomTab = searchParams.get('boomTab');
  const [periodQuarter, setPeriodQuarter] = useState(defaultQuarterPeriod);
  const [givesComments, setGivesComments] = useState(false);
  const [receivesComments, setReceivesComments] = useState(false);
  const [boomTab, setBoomTab] = useState(
    () => (initialBoomTab === 'discussions' ? 'discussions' : 'tasks'),
  );
  const [periodMonth, setPeriodMonth] = useState(defaultMonthPeriod);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<AssignmentRow[]>([]);
  const teamMemberView = isEoTeamMember(reviewerHierarchyLevel);
  const [results360, setResults360] = useState<
    { question_id: string; question_text: string; section: string; avg_score: number; response_count: number }[]
  >([]);
  const [loading360, setLoading360] = useState(false);
  const [released360, setReleased360] = useState<boolean | null>(null);

  const [runnerOpen, setRunnerOpen] = useState(false);
  const [runner, setRunner] = useState<{
    formCode: string;
    formTitle: string;
    revieweeId: string;
    revieweeName: string;
    period: string;
    anonymous: boolean;
  } | null>(null);

  const [assessorTasks, setAssessorTasks] = useState<AssessorTaskRow[]>([]);
  const [assessorRunnerOpen, setAssessorRunnerOpen] = useState(false);
  const [assessorRunner, setAssessorRunner] = useState<{
    selfResponseId: string;
    revieweeName: string;
  } | null>(null);

  const loadAssignments = useCallback(async () => {
    if (!reviewerEmployeeId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_review_assignments', {
        _period_quarter: periodQuarter,
        _period_month: periodMonth,
      });
      if (error) {
        toast.error(error.message || 'Could not load BOOM assignments');
        setRows([]);
        return;
      }
      setRows((data ?? []) as AssignmentRow[]);
    } finally {
      setLoading(false);
    }
  }, [reviewerEmployeeId, periodQuarter, periodMonth]);

  const loadAssessorTasks = useCallback(async () => {
    if (!reviewerEmployeeId || teamMemberView) return;
    try {
      const { data, error } = await supabase.rpc('get_epa_assessor_tasks', { _period: periodQuarter });
      if (error) {
        setAssessorTasks([]);
        return;
      }
      setAssessorTasks((data ?? []) as AssessorTaskRow[]);
    } catch {
      setAssessorTasks([]);
    }
  }, [reviewerEmployeeId, periodQuarter, teamMemberView]);

  useEffect(() => {
    if (teamMemberView && boomTab !== 'tasks' && boomTab !== 'discussions' && boomTab !== 'feedback') {
      setBoomTab('tasks');
    }
  }, [teamMemberView, boomTab]);

  useEffect(() => {
    void loadAssignments();
  }, [loadAssignments]);

  useEffect(() => {
    if (!reviewerEmployeeId) return;
    void supabase
      .from('employees')
      .select('appraisal_gives_comments, appraisal_receives_comments, hierarchy_level')
      .eq('id', reviewerEmployeeId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setGivesComments(!!data.appraisal_gives_comments);
          setReceivesComments(!!data.appraisal_receives_comments);
        }
      });
  }, [reviewerEmployeeId]);

  useEffect(() => {
    void loadAssessorTasks();
  }, [loadAssessorTasks]);

  const load360 = useCallback(async () => {
    if (!reviewerEmployeeId) return;
    setLoading360(true);
    try {
      const [{ data: rel, error: relErr }, { data, error }] = await Promise.all([
        supabase.rpc('peer_360_results_released', { _period: periodQuarter }),
        supabase.rpc('get_my_360_results', { _period: periodQuarter }),
      ]);
      if (!relErr && rel !== null && rel !== undefined) {
        setReleased360(!!rel);
      } else {
        // Migration not applied or RPC error: do not block employees with “withheld” copy.
        setReleased360(true);
      }
      if (error) {
        setResults360([]);
        return;
      }
      setResults360((data ?? []) as typeof results360);
    } finally {
      setLoading360(false);
    }
  }, [reviewerEmployeeId, periodQuarter]);

  useEffect(() => {
    void load360();
  }, [load360]);

  const grouped = useMemo(() => {
    const m = new Map<string, AssignmentRow[]>();
    for (const r of rows) {
      const k = r.form_code;
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(r);
    }
    return m;
  }, [rows]);

  const sortedFormGroups = useMemo(() => {
    const order = teamMemberView ? TEAM_MEMBER_FORM_ORDER : FORM_ORDER;
    const entries = teamMemberView
      ? [...grouped.entries()].filter(([code]) => !TEAM_MEMBER_BLOCKED_FORMS.has(code))
      : [...grouped.entries()];
    return entries.sort((a, b) => {
      const ia = order.indexOf(a[0]);
      const ib = order.indexOf(b[0]);
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    });
  }, [grouped, teamMemberView]);

  const epaGceoRevieweeIds = useMemo(
    () => new Set(rows.filter((r) => r.form_code === 'epa_gceo_assessor').map((r) => r.reviewee_id)),
    [rows],
  );

  const filteredAssessorTasks = useMemo(
    () => assessorTasks.filter((t) => !epaGceoRevieweeIds.has(t.reviewee_id)),
    [assessorTasks, epaGceoRevieweeIds],
  );

  const assignmentStats = useMemo(() => {
    let todo = 0;
    let draft = 0;
    let done = 0;
    for (const r of rows) {
      if (r.status === 'submitted') done++;
      else if (r.status === 'draft') draft++;
      else todo++;
    }
    return { todo, draft, done, total: rows.length };
  }, [rows]);

  const openRunner = async (a: AssignmentRow) => {
    if (a.form_code === 'epa_gceo_assessor') {
      if (a.status === 'waiting_self') {
        toast.message(`${a.reviewee_name} has not submitted their Executive Performance self-assessment yet.`);
        return;
      }
      const { data, error } = await supabase.rpc('resolve_epa_self_response', {
        _reviewee: a.reviewee_id,
        _period: periodQuarter,
      });
      if (error) {
        toast.error(error.message || 'Could not load executive self assessment');
        return;
      }
      const row = (data as { self_response_id: string; self_status: string }[] | null)?.[0];
      if (!row?.self_response_id) {
        toast.message(`${a.reviewee_name} has not started their Executive Performance self-assessment for ${periodQuarter}.`);
        return;
      }
      setAssessorRunner({
        selfResponseId: row.self_response_id,
        revieweeName: a.reviewee_name,
      });
      setAssessorRunnerOpen(true);
      return;
    }
    const period = a.form_code === 'monthly_self' ? periodMonth : periodQuarter;
    setRunner({
      formCode: a.form_code,
      formTitle: a.form_title,
      revieweeId: a.reviewee_id,
      revieweeName: a.reviewee_name,
      period,
      anonymous: a.anonymous,
    });
    setRunnerOpen(true);
  };

  const openAssessorRunner = (t: AssessorTaskRow) => {
    setAssessorRunner({
      selfResponseId: t.self_response_id,
      revieweeName: t.reviewee_name,
    });
    setAssessorRunnerOpen(true);
  };

  function assessorStatusBadge(status: string) {
    if (status === 'submitted') return <Badge className="text-[10px] bg-emerald-600">Done</Badge>;
    if (status === 'draft') return <Badge variant="secondary" className="text-[10px]">In progress</Badge>;
    return <Badge variant="outline" className="text-[10px]">To do</Badge>;
  }

  if (!reviewerEmployeeId) {
    return (
      <div className="rounded-2xl border border-dashed border-amber-500/30 bg-amber-500/5 p-6 space-y-2">
        <p className="text-sm font-medium text-foreground">No Executive Office employee linked to this login</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Assignments are resolved from your profile email matching an <code className="text-[10px] px-1 rounded bg-muted">employees</code> row.
          Ask an admin to confirm your account email matches your EO record, or complete your profile if your app supports it.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 mb-8">
      {/* Reviewer context — each login/email maps to one employee; RPC returns only their assignments */}
      <div className="glass-panel p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start gap-4 border-primary/10">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
          <UserCircle className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-bold tracking-tight">Your BOOM workspace</h2>
            <Badge variant="secondary" className="text-[10px] font-normal">
              {boomHierarchyLabel(reviewerHierarchyLevel)}
            </Badge>
          </div>
          <p className="text-sm text-foreground/90">
            <span className="font-semibold">{reviewerName ?? 'Signed-in user'}</span>
            {reviewerRole && <span className="text-muted-foreground"> · {reviewerRole}</span>}
            {reviewerDepartment && <span className="text-muted-foreground"> · {reviewerDepartment}</span>}
          </p>
          {reviewerEmail && (
            <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Mail className="h-3 w-3 shrink-0 opacity-70" />
              <span className="truncate">{reviewerEmail}</span>
            </p>
          )}
          <p className="text-[11px] text-muted-foreground leading-relaxed border-t border-border/50 pt-2 mt-1">
            {boomPeerFormHint(reviewerHierarchyLevel)} Forms and questions below are only those assigned to{' '}
            <strong>your</strong> role for the selected periods.
          </p>
        </div>
        {assignmentStats.total > 0 && (
          <div className="flex flex-wrap gap-2 sm:flex-col sm:items-end sm:text-right shrink-0">
            <Badge variant="outline" className="text-[10px] justify-center">
              {assignmentStats.todo} to do
            </Badge>
            <Badge variant="secondary" className="text-[10px] justify-center">
              {assignmentStats.draft} in progress
            </Badge>
            <Badge className="text-[10px] bg-emerald-600/90 justify-center">{assignmentStats.done} submitted</Badge>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-wide text-muted-foreground">Quarter</label>
          <Select value={periodQuarter} onValueChange={setPeriodQuarter}>
            <SelectTrigger className="w-[140px] h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {quarterOptions().map((q) => (
                <SelectItem key={q} value={q} className="text-xs">
                  {q}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-wide text-muted-foreground">Month (self)</label>
          <Select value={periodMonth} onValueChange={setPeriodMonth}>
            <SelectTrigger className="w-[140px] h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions().map((m) => (
                <SelectItem key={m} value={m} className="text-xs">
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-9"
          onClick={() => {
            void loadAssignments();
            void loadAssessorTasks();
            void load360();
          }}
        >
          Refresh
        </Button>
      </div>

      <Tabs value={boomTab} onValueChange={setBoomTab} className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
          <TabsTrigger value="tasks" className="text-xs gap-1">
            <ClipboardList className="w-3 h-3" /> Tasks
          </TabsTrigger>
          <TabsTrigger value="discussions" className="text-xs gap-1">
            <MessagesSquare className="w-3 h-3" /> Discussions
          </TabsTrigger>
          <TabsTrigger value="feedback" className="text-xs gap-1">
            <TrendingUp className="w-3 h-3" /> My 360 feedback
          </TabsTrigger>
          {!teamMemberView && (
            <TabsTrigger value="comments" className="text-xs gap-1">
              <MessageSquare className="w-3 h-3" /> Comments
            </TabsTrigger>
          )}
          {(isPlatformAdmin || (reviewerHierarchyLevel !== null && reviewerHierarchyLevel <= 1)) && (
            <TabsTrigger value="directory" className="text-xs gap-1">
              <Users className="w-3 h-3" /> Directory
            </TabsTrigger>
          )}
          {(isPlatformAdmin || reviewerHierarchyLevel === 0) && (
            <TabsTrigger value="insights" className="text-xs gap-1">
              <LayoutDashboard className="w-3 h-3" /> Insights
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="tasks" className="mt-0 space-y-6">
      <p className="text-xs text-muted-foreground max-w-xl">
        {boomTasksIntro(reviewerHierarchyLevel)}
      </p>

      {!teamMemberView && filteredAssessorTasks.length > 0 && (
        <div className="glass-panel p-5 shadow-sm border-primary/15">
          <div className="mb-4 space-y-1">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-primary" />
              <h4 className="text-sm font-semibold">EPA assessor tasks</h4>
              <span className="text-[10px] text-muted-foreground">({filteredAssessorTasks.length})</span>
            </div>
            <p className="text-[11px] text-muted-foreground pl-6 leading-snug">
              Independent 1–5 ratings on executives who have submitted their quarterly executive self assessment for{' '}
              <span className="font-mono">{periodQuarter}</span>. Stored separately from their self scores.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] text-muted-foreground">
                  <th className="pb-2 pr-3 font-medium">Executive</th>
                  <th className="pb-2 pr-3 font-medium hidden sm:table-cell">Role</th>
                  <th className="pb-2 pr-3 font-medium">Your assessor sheet</th>
                  <th className="pb-2 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssessorTasks.map((t) => (
                  <tr key={t.self_response_id} className="border-b border-border/40 last:border-0">
                    <td className="py-2.5 pr-3 font-medium">{t.reviewee_name}</td>
                    <td className="py-2.5 pr-3 hidden sm:table-cell text-muted-foreground text-xs">
                      {t.reviewee_role ?? '—'}
                    </td>
                    <td className="py-2.5 pr-3">{assessorStatusBadge(t.assessor_status)}</td>
                    <td className="py-2.5 text-right">
                      <Button
                        size="sm"
                        variant={t.assessor_status === 'submitted' ? 'outline' : 'default'}
                        className="h-8 text-xs"
                        onClick={() => openAssessorRunner(t)}
                      >
                        {t.assessor_status === 'submitted' ? 'View' : t.assessor_status === 'draft' ? 'Continue' : 'Start'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-8">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading assignments…
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-border bg-muted/20 p-6 space-y-2 text-sm text-muted-foreground">
          <p>No assignments for these periods.</p>
          <p className="text-xs leading-relaxed">
            {teamMemberView
              ? 'You should see a monthly self-assessment and 360 peer reviews for each colleague. Try changing the month or quarter above, or refresh.'
              : 'That often means this quarter/month has no open tasks for your role, or periods need changing. Executives, managers, and team members each receive different forms.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedFormGroups.map(([code, list]) => (
            <div key={code} className="glass-panel p-5 shadow-sm">
              <div className="mb-4 space-y-1">
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-primary" />
                  <h4 className="text-sm font-semibold">{FORM_LABELS[code] ?? code}</h4>
                  <span className="text-[10px] text-muted-foreground">({list.length})</span>
                </div>
                <p className="text-[11px] text-muted-foreground pl-6 leading-snug">{boomFormPurpose(code)}</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-[11px] text-muted-foreground">
                      <th className="pb-2 pr-3 font-medium">
                        {code === 'monthly_self' ? 'Person' : 'Reviewee'}
                      </th>
                      <th className="pb-2 pr-3 font-medium hidden sm:table-cell">Role</th>
                      <th className="pb-2 pr-3 font-medium hidden md:table-cell">Dept</th>
                      <th className="pb-2 pr-3 font-medium">Status</th>
                      <th className="pb-2 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((a) => (
                      <tr key={`${a.form_code}-${a.reviewee_id}`} className="border-b border-border/40 last:border-0">
                        <td className="py-2.5 pr-3 font-medium">
                          <span>{a.reviewee_name}</span>
                          {a.form_code === 'monthly_self' && a.reviewee_id === reviewerEmployeeId && (
                            <Badge variant="outline" className="ml-2 text-[9px] py-0 px-1.5">
                              You
                            </Badge>
                          )}
                        </td>
                        <td className="py-2.5 pr-3 hidden sm:table-cell text-muted-foreground text-xs">
                          {a.reviewee_role ?? '—'}
                        </td>
                        <td className="py-2.5 pr-3 hidden md:table-cell text-muted-foreground text-xs">
                          {a.reviewee_department ?? '—'}
                        </td>
                        <td className="py-2.5 pr-3">{statusBadge(a.status)}</td>
                        <td className="py-2.5 text-right">
                          <Button size="sm" variant={a.status === 'submitted' ? 'outline' : 'default'} className="h-8 text-xs" onClick={() => void openRunner(a)}>
                            {a.form_code === 'epa_gceo_assessor' && a.status === 'waiting_self'
                              ? 'Awaiting self'
                              : a.status === 'submitted'
                                ? 'View'
                                : a.status === 'draft'
                                  ? 'Continue'
                                  : 'Start'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

        </TabsContent>

        <TabsContent value="discussions" className="mt-0">
          <BoomDiscussionsPanel
            reviewerEmployeeId={reviewerEmployeeId}
            reviewerEmail={reviewerEmail}
            periodQuarter={periodQuarter}
            periodMonth={periodMonth}
          />
        </TabsContent>

        <TabsContent value="feedback" className="mt-0">
      <div className="glass-panel p-5 border-accent/10">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-semibold">My 360 results (about you)</h3>
          <Badge variant="outline" className="text-[10px]">
            {periodQuarter}
          </Badge>
        </div>
        <p className="text-[11px] text-muted-foreground mb-3 leading-relaxed">
          Anonymous aggregated peer scores by behaviour section. Individual reviewers are never shown.
        </p>
        {loading360 ? (
          <p className="text-xs text-muted-foreground flex items-center gap-2">
            <Loader2 className="w-3 h-3 animate-spin" /> Loading…
          </p>
        ) : released360 === false ? (
          <p className="text-xs text-muted-foreground leading-relaxed">
            Your aggregated 360 scores are withheld until HR or an administrator reviews submissions and{' '}
            <strong>releases</strong> results for <span className="font-mono">{periodQuarter}</span>. Individual peer
            responses stay anonymous; only consolidated averages are shown after release.
          </p>
        ) : results360.length === 0 ? (
          <p className="text-xs text-muted-foreground leading-relaxed">
            Results for this quarter are released, but either not enough peer reviews about you have been submitted yet
            (minimum before averages show), or there are no scored items. Complete any 360 assignments you still have
            open.
          </p>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={results360.map((r) => ({ name: r.section.slice(0, 22), score: r.avg_score }))}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-25} textAnchor="end" height={70} />
                <YAxis domain={[0, 5]} tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ fontSize: 11 }}
                  formatter={(v: number) => [v.toFixed(2), 'Avg']}
                />
                <Bar dataKey="score" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
        </TabsContent>

        {!teamMemberView && (
        <TabsContent value="comments" className="mt-0">
          <BoomCommentsPanel
            reviewerEmployeeId={reviewerEmployeeId}
            periodQuarter={periodQuarter}
            givesComments={givesComments}
            receivesComments={receivesComments}
          />
        </TabsContent>
        )}

        <TabsContent value="directory" className="mt-0">
          <BoomDirectoryPanel
            viewerHierarchyLevel={reviewerHierarchyLevel}
            isAdmin={isPlatformAdmin}
          />
        </TabsContent>

        <TabsContent value="insights" className="mt-0">
          <BoomInsightsPanel
            viewerHierarchyLevel={reviewerHierarchyLevel}
            isAdmin={isPlatformAdmin}
          />
        </TabsContent>
      </Tabs>

      {runner && (
        <AssessmentRunner
          key={`${runner.formCode}-${runner.revieweeId}-${runner.period}`}
          open={runnerOpen}
          onOpenChange={setRunnerOpen}
          formCode={runner.formCode}
          formTitle={runner.formTitle}
          revieweeId={runner.revieweeId}
          revieweeName={runner.revieweeName}
          period={runner.period}
          reviewerEmployeeId={reviewerEmployeeId}
          reviewerHierarchyLevel={reviewerHierarchyLevel}
          reviewerRoleSummary={boomHierarchyLabel(reviewerHierarchyLevel)}
          anonymous={runner.anonymous}
          onCompleted={() => {
            void loadAssignments();
            void loadAssessorTasks();
            void load360();
          }}
        />
      )}

      {assessorRunner && (
        <ExecutiveAssessorRunner
          key={assessorRunner.selfResponseId}
          open={assessorRunnerOpen}
          onOpenChange={setAssessorRunnerOpen}
          selfResponseId={assessorRunner.selfResponseId}
          revieweeName={assessorRunner.revieweeName}
          period={periodQuarter}
          reviewerEmployeeId={reviewerEmployeeId}
          reviewerHierarchyLevel={reviewerHierarchyLevel}
          variant="gceo"
          onCompleted={() => {
            void loadAssignments();
            void loadAssessorTasks();
          }}
        />
      )}
    </div>
  );
}

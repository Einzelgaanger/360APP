import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useEmployeeAuth } from '@/contexts/EmployeeAuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import PlatformSidebar from '@/components/PlatformSidebar';
import {
  CheckCircle2, ChevronRight, ChevronLeft,
  Building2, User, ClipboardList, Send, Loader2, Shield,
  BarChart3, Trophy, Star, Users, Search, X, ArrowUp, ArrowDown, ArrowLeftRight, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import QualitativeFeedback from '@/components/employee-dashboard/QualitativeFeedback';
import AIInsightsCarousel from '@/components/employee-dashboard/AIInsightsCarousel';
import DetailedCategoryBreakdown from '@/components/employee-dashboard/DetailedCategoryBreakdown';
import AnonymityBanner from '@/components/employee-dashboard/AnonymityBanner';
import GrowthResources from '@/components/employee-dashboard/GrowthResources';
import DevelopmentPlans from '@/components/employee-dashboard/DevelopmentPlans';
import SelfDebrief from '@/components/employee-dashboard/SelfDebrief';

interface FeedbackItem {
  text: string;
  direction: string;
}

interface Subsidiary { id: string; name: string; }
interface Employee { id: string; name: string; role: string | null; department: string | null; subsidiary_id: string; email: string | null; hierarchy_level: number | null; }
interface Category { id: string; name: string; sort_order: number; }
interface Question { id: string; category_id: string; question_text: string; question_type: string; sort_order: number; }
interface CategoryScore { category: string; myScore: number; orgAvg: number; }
interface DirectionScores { above: CategoryScore[]; peer: CategoryScore[]; below: CategoryScore[]; }

const HIERARCHY_LABELS: Record<number, string> = {
  0: 'Intern', 1: 'Junior', 2: 'Analyst', 3: 'Associate', 4: 'Senior Associate',
  5: 'Manager', 6: 'Principal/Head', 7: 'C-Suite', 8: 'Partner',
};

function getFeedbackDirection(reviewerLevel: number, revieweeLevel: number): string {
  if (reviewerLevel > revieweeLevel) return 'above';
  if (reviewerLevel < revieweeLevel) return 'below';
  return 'peer';
}
interface RankedEmployee { employee_id: string; name: string; subsidiary: string; avgScore: number; totalReviews: number; }

const SCALE_OPTIONS = [
  { value: 5, label: 'Most Likely' },
  { value: 4, label: 'Likely' },
  { value: 3, label: 'Neutral' },
  { value: 2, label: 'Unlikely' },
  { value: 1, label: 'Least Likely' },
];

const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.2 },
};

export default function EmployeeHub() {
  const { user, profile, isAdmin, logout } = useEmployeeAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'survey';

  // Survey state
  const [step, setStep] = useState<'subsidiary' | 'employee' | 'questions' | 'submitted'>('subsidiary');
  const [subsidiaries, setSubsidiaries] = useState<Subsidiary[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedSubsidiary, setSelectedSubsidiary] = useState<Subsidiary | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [answers, setAnswers] = useState<Record<string, number | string>>({});
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [completedEmployees, setCompletedEmployees] = useState<Set<string>>(new Set());
  const [employeeSearch, setEmployeeSearch] = useState('');

  // Dashboard state
  const [myScores, setMyScores] = useState<CategoryScore[]>([]);
  const [directionScores, setDirectionScores] = useState<DirectionScores>({ above: [], peer: [], below: [] });
  const [directionCounts, setDirectionCounts] = useState<{ above: number; peer: number; below: number }>({ above: 0, peer: 0, below: 0 });
  const [totalReviews, setTotalReviews] = useState(0);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [qualitativeFeedback, setQualitativeFeedback] = useState<{ startDoing: FeedbackItem[]; stopDoing: FeedbackItem[]; continueDoing: FeedbackItem[] }>({ startDoing: [], stopDoing: [], continueDoing: [] });
  const [aiDataContext, setAiDataContext] = useState('');

  // Rankings state
  const [rankings, setRankings] = useState<RankedEmployee[]>([]);
  const [rankingsLoading, setRankingsLoading] = useState(true);

  // All employees for department counts
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);

  const normalizedProfileEmail = profile?.email?.trim().toLowerCase() ?? '';

  const currentEmployee = useMemo(() => {
    if (profile?.employee_id) {
      const matchedById = allEmployees.find(employee => employee.id === profile.employee_id);
      if (matchedById) return matchedById;
    }

    if (!normalizedProfileEmail) return null;

    return allEmployees.find(employee => (employee.email ?? '').trim().toLowerCase() === normalizedProfileEmail) ?? null;
  }, [allEmployees, normalizedProfileEmail, profile?.employee_id]);

  // Load completions from database
  useEffect(() => {
    if (user) {
      supabase
        .from('review_completions')
        .select('employee_id')
        .eq('reviewer_id', user.id)
        .then(({ data }) => {
          if (data) setCompletedEmployees(new Set(data.map(d => d.employee_id)));
        });
    }
  }, [user]);

  const markEmployeeCompleted = async (employeeId: string) => {
    if (user) {
      await supabase.from('review_completions').insert({
        reviewer_id: user.id,
        employee_id: employeeId,
      });
    }
    setCompletedEmployees(prev => {
      const next = new Set(prev);
      next.add(employeeId);
      return next;
    });
  };

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [subRes, catRes, qRes, allEmpRes] = await Promise.all([
        supabase.from('subsidiaries').select('*').order('name'),
        supabase.from('survey_categories').select('*').order('sort_order'),
        supabase.from('survey_questions').select('*').order('sort_order'),
        supabase.from('employees').select('*').order('name'),
      ]);
      if (subRes.data) setSubsidiaries(subRes.data);
      if (catRes.data) setCategories(catRes.data);
      if (qRes.data) setQuestions(qRes.data);
      if (allEmpRes.data) setAllEmployees(allEmpRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  // Load dashboard data
  useEffect(() => {
    if (activeTab !== 'dashboard') return;

    if (!user) {
      setDashboardLoading(false);
      return;
    }

    if (!currentEmployee?.id) {
      setMyScores([]);
      setDirectionScores({ above: [], peer: [], below: [] });
      setDirectionCounts({ above: 0, peer: 0, below: 0 });
      setQualitativeFeedback({ startDoing: [], stopDoing: [], continueDoing: [] });
      setAiDataContext('');
      setTotalReviews(0);
      setDashboardLoading(false);
      return;
    }

    void loadDashboardData(currentEmployee.id);
  }, [activeTab, currentEmployee?.id, user]);

  const loadDashboardData = async (employeeId: string) => {
    if (!user) return;
    setDashboardLoading(true);
    try {
      const { data: myResponses } = await supabase
        .from('survey_responses')
        .select('id, feedback_direction')
        .eq('employee_id', employeeId);

      if (myResponses?.length) {
        const responseIds = myResponses.map(r => r.id);

        // Build direction map
        const directionMap: Record<string, string> = {};
        myResponses.forEach(r => { directionMap[r.id] = r.feedback_direction || 'peer'; });

        const counts = { above: 0, peer: 0, below: 0 };
        myResponses.forEach(r => {
          const dir = (r.feedback_direction || 'peer') as keyof typeof counts;
          if (counts[dir] !== undefined) counts[dir]++;
        });
        setDirectionCounts(counts);

        // Fetch only MY answers (not all org answers) - batch if needed
        const batchSize = 200;
        let allMyAnswers: any[] = [];
        for (let i = 0; i < responseIds.length; i += batchSize) {
          const batch = responseIds.slice(i, i + batchSize);
          const { data } = await supabase
            .from('survey_answers')
            .select('score, response_id, question_id')
            .in('response_id', batch)
            .not('score', 'is', null);
          if (data) allMyAnswers = allMyAnswers.concat(data);
        }

        // Fetch questions with categories for mapping
        const { data: questionsWithCats } = await supabase
          .from('survey_questions')
          .select('id, survey_categories(name)');

        const questionCatMap: Record<string, string> = {};
        (questionsWithCats as any[])?.forEach(q => {
          if (q.survey_categories?.name) questionCatMap[q.id] = q.survey_categories.name;
        });

        // Overall scores
        const myCatScores: Record<string, number[]> = {};
        const dirCatScores: Record<string, Record<string, number[]>> = { above: {}, peer: {}, below: {} };

        allMyAnswers.forEach(a => {
          const cat = questionCatMap[a.question_id];
          if (cat && a.score) {
            if (!myCatScores[cat]) myCatScores[cat] = [];
            myCatScores[cat].push(a.score);

            const dir = directionMap[a.response_id] || 'peer';
            if (!dirCatScores[dir]) dirCatScores[dir] = {};
            if (!dirCatScores[dir][cat]) dirCatScores[dir][cat] = [];
            dirCatScores[dir][cat].push(a.score);
          }
        });

        const cats = Object.keys(myCatScores);
        const avgArr = (arr: number[]) => arr.length ? parseFloat((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2)) : 0;

        // For org average, use a lightweight RPC or just compute from limited sample
        // Instead of fetching ALL answers, we'll skip org avg or use a rough estimate
        // For now, set org avg to 0 and compute it in background
        const scores = cats.map(cat => ({
          category: cat,
          myScore: avgArr(myCatScores[cat]),
          orgAvg: 0,
        }));
        setMyScores(scores);

        const buildDirScores = (dir: string): CategoryScore[] =>
          cats.map(cat => ({
            category: cat,
            myScore: dirCatScores[dir]?.[cat] ? avgArr(dirCatScores[dir][cat]) : 0,
            orgAvg: 0,
          })).filter(s => s.myScore > 0);

        setDirectionScores({
          above: buildDirScores('above'),
          peer: buildDirScores('peer'),
          below: buildDirScores('below'),
        });
        setTotalReviews(myResponses.length);

        // Fetch qualitative (text) answers
        let allTextAnswers: any[] = [];
        for (let i = 0; i < responseIds.length; i += batchSize) {
          const batch = responseIds.slice(i, i + batchSize);
          const { data } = await supabase
            .from('survey_answers')
            .select('text_answer, response_id, question_id')
            .in('response_id', batch)
            .not('text_answer', 'is', null);
          if (data) allTextAnswers = allTextAnswers.concat(data);
        }

        // Map questions to their text to identify start/stop/continue
        const { data: allQs } = await supabase.from('survey_questions').select('id, question_text').eq('question_type', 'open_ended');
        const qTextMap: Record<string, string> = {};
        (allQs as any[])?.forEach(q => { qTextMap[q.id] = (q.question_text || '').toLowerCase(); });

        const fb = { startDoing: [] as FeedbackItem[], stopDoing: [] as FeedbackItem[], continueDoing: [] as FeedbackItem[] };
        allTextAnswers.forEach(a => {
          if (!a.text_answer?.trim()) return;
          const dir = directionMap[a.response_id] || 'peer';
          const qText = qTextMap[a.question_id] || '';
          const item: FeedbackItem = { text: a.text_answer.trim(), direction: dir };
          if (qText.includes('stop')) fb.stopDoing.push(item);
          else if (qText.includes('start')) fb.startDoing.push(item);
          else if (qText.includes('continue')) fb.continueDoing.push(item);
          else fb.continueDoing.push(item); // default bucket
        });
        setQualitativeFeedback(fb);

        // Build AI context
        const contextParts = [
          `Employee Performance Data:`,
          `Overall Score: ${avgArr(Object.values(myCatScores).flat())}/5`,
          `Total Reviews: ${myResponses.length} (Above: ${counts.above}, Peer: ${counts.peer}, Below: ${counts.below})`,
          `\nCategory Scores:`,
          ...cats.map(cat => `• ${cat}: ${avgArr(myCatScores[cat])}/5`),
          `\nScores by Source:`,
          ...(['above', 'peer', 'below'] as const).map(dir => {
            const ds = dirCatScores[dir] || {};
            const entries = Object.entries(ds).map(([c, arr]) => `${c}: ${avgArr(arr)}`).join(', ');
            return `• ${dir}: ${entries || 'No data'}`;
          }),
          `\nQualitative Feedback:`,
          `Continue Doing (${fb.continueDoing.length}): ${fb.continueDoing.slice(0, 10).map(f => f.text).join(' | ')}`,
          `Start Doing (${fb.startDoing.length}): ${fb.startDoing.slice(0, 10).map(f => f.text).join(' | ')}`,
          `Stop Doing (${fb.stopDoing.length}): ${fb.stopDoing.slice(0, 10).map(f => f.text).join(' | ')}`,
        ];
        setAiDataContext(contextParts.join('\n'));

        // Load org averages in background (sample-based for speed)
        supabase
          .from('survey_answers')
          .select('score, question_id')
          .not('score', 'is', null)
          .limit(5000)
          .then(({ data: sampleAnswers }) => {
            if (!sampleAnswers) return;
            const orgCatScores: Record<string, number[]> = {};
            (sampleAnswers as any[]).forEach(a => {
              const cat = questionCatMap[a.question_id];
              if (cat && a.score) {
                if (!orgCatScores[cat]) orgCatScores[cat] = [];
                orgCatScores[cat].push(a.score);
              }
            });
            setMyScores(prev => prev.map(s => ({
              ...s,
              orgAvg: orgCatScores[s.category] ? avgArr(orgCatScores[s.category]) : 0,
            })));
          });
      } else {
        setMyScores([]);
        setDirectionScores({ above: [], peer: [], below: [] });
        setDirectionCounts({ above: 0, peer: 0, below: 0 });
        setTotalReviews(0);
        setQualitativeFeedback({ startDoing: [], stopDoing: [], continueDoing: [] });
        setAiDataContext('');
      }
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setDashboardLoading(false);
    }
  };

  // Load rankings
  useEffect(() => {
    if (activeTab === 'rankings') {
      loadRankings();
    }
  }, [activeTab]);

  const loadRankings = async () => {
    setRankingsLoading(true);
    try {
      // Fetch employees and responses separately to avoid massive nested joins
      const [empsRes, responsesRes] = await Promise.all([
        supabase.from('employees').select('id, name, subsidiary_id'),
        supabase.from('survey_responses').select('id, employee_id'),
      ]);

      if (!empsRes.data || !responsesRes.data) return;

      // Get subsidiary names
      const subMap: Record<string, string> = {};
      subsidiaries.forEach(s => { subMap[s.id] = s.name; });

      // Build a map of employee_id -> response_ids
      const empResponseIds: Record<string, string[]> = {};
      responsesRes.data.forEach((r: any) => {
        if (!empResponseIds[r.employee_id]) empResponseIds[r.employee_id] = [];
        empResponseIds[r.employee_id].push(r.id);
      });

      // Only fetch scores for employees that have responses
      const allResponseIds = responsesRes.data.map((r: any) => r.id);
      
      // Batch fetch scores
      const batchSize = 500;
      let allScores: any[] = [];
      for (let i = 0; i < allResponseIds.length; i += batchSize) {
        const batch = allResponseIds.slice(i, i + batchSize);
        const { data } = await supabase
          .from('survey_answers')
          .select('response_id, score')
          .in('response_id', batch)
          .not('score', 'is', null);
        if (data) allScores = allScores.concat(data);
      }

      // Map response scores back to employees
      const responseScoreMap: Record<string, number[]> = {};
      allScores.forEach((a: any) => {
        if (!responseScoreMap[a.response_id]) responseScoreMap[a.response_id] = [];
        responseScoreMap[a.response_id].push(a.score);
      });

      const scoreMap: Record<string, { scores: number[]; count: number }> = {};
      Object.entries(empResponseIds).forEach(([empId, rIds]) => {
        scoreMap[empId] = { scores: [], count: rIds.length };
        rIds.forEach(rId => {
          if (responseScoreMap[rId]) scoreMap[empId].scores.push(...responseScoreMap[rId]);
        });
      });

      const ranked: RankedEmployee[] = empsRes.data
        .filter((e: any) => scoreMap[e.id]?.scores.length > 0)
        .map((e: any) => ({
          employee_id: e.id,
          name: e.name,
          subsidiary: subMap[e.subsidiary_id] || 'Unknown',
          avgScore: parseFloat((scoreMap[e.id].scores.reduce((a: number, b: number) => a + b, 0) / scoreMap[e.id].scores.length).toFixed(2)),
          totalReviews: scoreMap[e.id].count,
        }))
        .sort((a: RankedEmployee, b: RankedEmployee) => b.avgScore - a.avgScore);

      setRankings(ranked);
    } catch (err) { console.error(err); }
    finally { setRankingsLoading(false); }
  };

  // Realtime subscriptions for live data
  useEffect(() => {
    const channel = supabase
      .channel('employee-hub-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'survey_responses' }, () => {
        if (activeTab === 'dashboard' && currentEmployee?.id) void loadDashboardData(currentEmployee.id);
        if (activeTab === 'rankings') void loadRankings();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'survey_answers' }, () => {
        if (activeTab === 'dashboard' && currentEmployee?.id) void loadDashboardData(currentEmployee.id);
        if (activeTab === 'rankings') void loadRankings();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeTab, currentEmployee?.id]);

  const loadEmployees = async (subsidiaryId: string) => {
    const { data } = await supabase.from('employees').select('*').eq('subsidiary_id', subsidiaryId).order('name');
    if (data) setEmployees(data);
  };

  const handleSelectSubsidiary = (sub: Subsidiary) => {
    setSelectedSubsidiary(sub);
    loadEmployees(sub.id);
    setStep('employee');
    setEmployeeSearch('');
  };

  const handleSelectEmployee = (emp: Employee) => {
    setSelectedEmployee(emp);
    setStep('questions');
    setCurrentCategoryIndex(0);
  };

  const currentCategory = categories[currentCategoryIndex];
  const currentQuestions = currentCategory ? questions.filter(q => q.category_id === currentCategory.id) : [];

  const isCurrentCategoryComplete = () => {
    if (!currentCategory) return false;
    return currentQuestions.every(q => q.question_type === 'open_ended' || answers[q.id] !== undefined);
  };

  const totalScoredQuestions = questions.filter(q => q.question_type === 'scored').length;
  const answeredScoredQuestions = questions.filter(q => q.question_type === 'scored' && answers[q.id] !== undefined).length;
  const progress = totalScoredQuestions > 0 ? (answeredScoredQuestions / totalScoredQuestions) * 100 : 0;

  const handleSubmit = async () => {
    if (!selectedEmployee || !selectedSubsidiary || !user) return;
    setSubmitting(true);
    try {
      // Get reviewer's hierarchy level from their profile's employee record
      const reviewerEmp = currentEmployee;
      const reviewerLevel = reviewerEmp?.hierarchy_level ?? 3;
      const revieweeLevel = selectedEmployee.hierarchy_level ?? 3;
      const direction = getFeedbackDirection(reviewerLevel, revieweeLevel);

      const { data: responseData, error: responseError } = await supabase
        .from('survey_responses')
        .insert({
          employee_id: selectedEmployee.id,
          subsidiary_id: selectedSubsidiary.id,
          reviewer_hierarchy_level: reviewerLevel,
          reviewee_hierarchy_level: revieweeLevel,
          feedback_direction: direction,
        })
        .select('id')
        .single();
      if (responseError) throw responseError;

      const answerRows = Object.entries(answers).map(([questionId, value]) => ({
        response_id: responseData.id,
        question_id: questionId,
        score: typeof value === 'number' ? value : null,
        text_answer: typeof value === 'string' ? value : null,
      }));
      const { error: answersError } = await supabase.from('survey_answers').insert(answerRows);
      if (answersError) throw answersError;

      markEmployeeCompleted(selectedEmployee.id);
      setStep('submitted');
      toast.success('Response submitted successfully.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit. Please try again.');
    } finally { setSubmitting(false); }
  };

  // Department counts for the selected subsidiary
  const departmentCounts = useMemo(() => {
    const emps = selectedSubsidiary ? allEmployees.filter(e => e.subsidiary_id === selectedSubsidiary.id) : [];
    const counts: Record<string, number> = {};
    emps.forEach(e => {
      const dept = e.department || 'Unassigned';
      counts[dept] = (counts[dept] || 0) + 1;
    });
    return counts;
  }, [selectedSubsidiary, allEmployees]);

  // Get the logged-in user's hierarchy level
  const myHierarchyLevel = useMemo(() => {
    return currentEmployee?.hierarchy_level ?? 3;
  }, [currentEmployee]);

  // Subsidiary employee counts
  const subsidiaryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allEmployees.forEach(e => { counts[e.subsidiary_id] = (counts[e.subsidiary_id] || 0) + 1; });
    return counts;
  }, [allEmployees]);

  // Filter employees by search
  const filteredEmployees = useMemo(() => {
    if (!employeeSearch.trim()) return employees;
    const q = employeeSearch.toLowerCase();
    return employees.filter(e =>
      e.name.toLowerCase().includes(q) ||
      (e.email && e.email.toLowerCase().includes(q)) ||
      (e.department && e.department.toLowerCase().includes(q))
    );
  }, [employees, employeeSearch]);

  // Group employees into hierarchy pools: Above, Peers, Below
  const hierarchyPools = useMemo(() => {
    const above: Employee[] = [];
    const peers: Employee[] = [];
    const below: Employee[] = [];

    filteredEmployees.forEach(emp => {
      if (emp.id === currentEmployee?.id) return;
      const level = emp.hierarchy_level ?? 3;
      if (level > myHierarchyLevel) above.push(emp);
      else if (level < myHierarchyLevel) below.push(emp);
      else peers.push(emp);
    });

    return { above, peers, below };
  }, [currentEmployee?.id, filteredEmployees, myHierarchyLevel]);

  // Pool counts across ALL employees (not just selected subsidiary)
  const globalPoolCounts = useMemo(() => {
    let above = 0, peers = 0, below = 0;
    allEmployees.forEach(emp => {
      if (emp.id === currentEmployee?.id) return;
      const level = emp.hierarchy_level ?? 3;
      if (level > myHierarchyLevel) above++;
      else if (level < myHierarchyLevel) below++;
      else peers++;
    });
    return { above, peers, below, total: above + peers + below };
  }, [allEmployees, currentEmployee?.id, myHierarchyLevel]);

  const overallScore = useMemo(() => {
    if (!myScores.length) return 0;
    return parseFloat((myScores.reduce((s, c) => s + c.myScore, 0) / myScores.length).toFixed(2));
  }, [myScores]);

  const orgOverall = useMemo(() => {
    if (!myScores.length) return 0;
    return parseFloat((myScores.reduce((s, c) => s + c.orgAvg, 0) / myScores.length).toFixed(2));
  }, [myScores]);

  const setTab = (tab: string) => {
    setSearchParams({ tab });
  };

  const handleLogout = async () => { await logout(); navigate('/'); };

  if (loading) {
    return (
      <div className="app-page flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const getRankIcon = (rank: number) => {
    if (rank === 0) return <Trophy className="w-5 h-5 text-warning" />;
    if (rank === 1) return <span className="text-muted-foreground font-bold">🥈</span>;
    if (rank === 2) return <span className="text-primary font-bold">🥉</span>;
    return <span className="w-5 h-5 flex items-center justify-center text-xs font-bold text-muted-foreground">{rank + 1}</span>;
  };

  const stepNumber = step === 'subsidiary' ? 1 : step === 'employee' ? 2 : step === 'questions' ? 3 : 4;
  const currentEmployeeSubsidiary = currentEmployee
    ? subsidiaries.find((s) => s.id === currentEmployee.subsidiary_id)?.name
    : null;

  return (
    <div className="app-page">
      <div className="app-page-grid" />
      <PlatformSidebar
        title="360° Appraisal"
        subtitle={profile?.name}
        meta={[
          { label: 'Subsidiary', value: currentEmployeeSubsidiary ?? 'Unlisted' },
          { label: 'Department', value: currentEmployee?.department ?? profile?.department ?? 'Unassigned' },
          { label: 'Role', value: currentEmployee?.role ?? 'Employee' },
        ]}
        onLogout={handleLogout}
        items={[
          { key: 'dashboard', label: 'My Dashboard', icon: <BarChart3 className="w-4 h-4" />, active: activeTab === 'dashboard', onClick: () => setTab('dashboard') },
          { key: 'growth', label: 'Growth Hub', icon: <Sparkles className="w-4 h-4" />, active: activeTab === 'growth', onClick: () => setTab('growth') },
          { key: 'rankings', label: 'Rankings', icon: <Trophy className="w-4 h-4" />, active: activeTab === 'rankings', onClick: () => setTab('rankings') },
          { key: 'survey', label: 'Survey', icon: <ClipboardList className="w-4 h-4" />, active: activeTab === 'survey', onClick: () => setTab('survey') },
        ]}
        actions={
          <>
            {isAdmin && (
              <Button variant="outline" size="sm" asChild className="w-full gap-2 border-primary/30 text-primary">
                <Link to="/admin"><Shield className="w-4 h-4" /> Admin</Link>
              </Button>
            )}
            <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-muted-foreground px-1">
              <Shield className="w-3.5 h-3.5" />
              <span>Anonymous</span>
            </div>
          </>
        }
      />

      {/* Tabs */}
      <div className="lg:pl-72">
      <div className="platform-content section-stack">
        <Tabs value={activeTab} onValueChange={setTab}>
          {/* ============ SURVEY TAB ============ */}
          <TabsContent value="survey" className="mt-4">
            {/* Step Indicator */}
            {step !== 'submitted' && (
              <div className="mb-4">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {['Company', 'Person', 'Questions'].map((label, i) => (
                    <div key={label} className="flex items-center gap-1.5 sm:gap-2 flex-1">
                      <div className={`w-8 h-8 rounded-xl text-xs font-bold flex items-center justify-center transition-all duration-300 shadow-sm ${
                        i + 1 < stepNumber ? 'bg-primary text-primary-foreground shadow-primary/20'
                        : i + 1 === stepNumber ? 'bg-primary text-primary-foreground shadow-primary/20'
                        : 'bg-muted text-muted-foreground'
                      }`}>
                        {i + 1 < stepNumber ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                      </div>
                      <span className={`text-xs hidden sm:block font-medium ${i + 1 <= stepNumber ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {label}
                      </span>
                      {i < 2 && <div className={`flex-1 h-0.5 rounded-full ${i + 1 < stepNumber ? 'bg-primary' : 'bg-border'}`} />}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Progress Bar */}
            {step === 'questions' && (
              <div className="mb-4">
                <div className="flex justify-between text-[11px] text-muted-foreground mb-2 font-medium">
                  <span>Section {currentCategoryIndex + 1} of {categories.length} — {currentCategory?.name}</span>
                  <span className="text-primary font-bold">{Math.round(progress)}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div className="h-full bg-primary rounded-full" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.4, ease: 'easeOut' }} />
                </div>
              </div>
            )}

            <AnimatePresence mode="wait">
              {/* Step 1: Subsidiary */}
              {step === 'subsidiary' && (
                <motion.div key="subsidiary" {...pageTransition}>
                  <div className="glass-panel p-6 sm:p-8">
                    <div className="mb-6">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                        <Building2 className="w-6 h-6 text-primary" />
                      </div>
                      <h2 className="text-xl font-bold mb-1">Select Company</h2>
                      <p className="text-muted-foreground text-sm">Choose the subsidiary of the person you would like to review.</p>
                    </div>
                    <div className="grid gap-2.5">
                      {subsidiaries.map(sub => (
                        <button
                          key={sub.id}
                          onClick={() => handleSelectSubsidiary(sub)}
                          className="flex items-center justify-between p-4 rounded-2xl border-2 border-border bg-background hover:bg-muted/50 hover:border-primary/30 hover:shadow-md transition-all duration-200 text-left group"
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-sm">{sub.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                              {subsidiaryCounts[sub.id] || 0} people
                            </Badge>
                            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Employee with department badges */}
              {step === 'employee' && (
                <motion.div key="employee" {...pageTransition}>
                  <div className="glass-panel p-6 sm:p-8">
                    <button onClick={() => setStep('subsidiary')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors font-medium">
                      <ChevronLeft className="w-4 h-4" /> Back
                    </button>
                    <div className="mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
                        <User className="w-6 h-6 text-accent" />
                      </div>
                      <h2 className="text-xl font-bold mb-1">Select Person to Review</h2>
                      <p className="text-muted-foreground text-sm">{selectedSubsidiary?.name}</p>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Your level: <span className="font-semibold text-foreground">{HIERARCHY_LABELS[myHierarchyLevel] || `L${myHierarchyLevel}`}</span>
                      </p>
                    </div>

                    {/* Pool badges */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {[
                        { label: 'Above You', count: hierarchyPools.above.length, icon: <ArrowUp className="w-3 h-3" />, color: 'text-blue-600 bg-blue-500/10 border-blue-500/30' },
                        { label: 'Peers', count: hierarchyPools.peers.length, icon: <ArrowLeftRight className="w-3 h-3" />, color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/30' },
                        { label: 'Below You', count: hierarchyPools.below.length, icon: <ArrowDown className="w-3 h-3" />, color: 'text-amber-600 bg-amber-500/10 border-amber-500/30' },
                      ].map(p => (
                        <Badge key={p.label} variant="outline" className={`text-[10px] gap-1 ${p.color}`}>
                          {p.icon} {p.label} <span className="font-bold">{p.count}</span>
                        </Badge>
                      ))}
                    </div>

                    {/* Search */}
                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by name, email, or department..."
                        value={employeeSearch}
                        onChange={e => setEmployeeSearch(e.target.value)}
                        className="pl-10 h-10"
                      />
                      {employeeSearch && (
                        <button onClick={() => setEmployeeSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                          <X className="w-4 h-4 text-muted-foreground" />
                        </button>
                      )}
                    </div>

                    <div className="max-h-[55vh] overflow-y-auto scrollbar-thin pr-1 space-y-5">
                      {([
                        { key: 'above' as const, label: 'Above You', sublabel: 'Leadership & Senior Colleagues', icon: <ArrowUp className="w-3.5 h-3.5" />, color: 'text-blue-600', bg: 'bg-blue-500/10', border: 'border-l-blue-500' },
                        { key: 'peers' as const, label: 'Your Peers', sublabel: 'Same hierarchy level as you', icon: <ArrowLeftRight className="w-3.5 h-3.5" />, color: 'text-emerald-600', bg: 'bg-emerald-500/10', border: 'border-l-emerald-500' },
                        { key: 'below' as const, label: 'Below You', sublabel: 'Team members & junior colleagues', icon: <ArrowDown className="w-3.5 h-3.5" />, color: 'text-amber-600', bg: 'bg-amber-500/10', border: 'border-l-amber-500' },
                      ] as const).map(pool => {
                        const poolEmps = hierarchyPools[pool.key];
                        if (poolEmps.length === 0) return null;
                        return (
                          <div key={pool.key} className={`border-l-2 ${pool.border} pl-3`}>
                            <div className="flex items-center gap-2 mb-2 sticky top-0 bg-card/95 backdrop-blur-sm py-1 z-10">
                              <span className={`${pool.color} ${pool.bg} w-6 h-6 rounded-md flex items-center justify-center`}>{pool.icon}</span>
                              <div>
                                <h3 className="text-xs font-bold">{pool.label}</h3>
                                <p className="text-[10px] text-muted-foreground">{pool.sublabel}</p>
                              </div>
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-auto">{poolEmps.length}</Badge>
                            </div>
                            <div className="grid gap-1.5">
                              {poolEmps.map(emp => {
                                const isCompleted = completedEmployees.has(emp.id);
                                return (
                                  <button
                                    key={emp.id}
                                    onClick={() => !isCompleted && handleSelectEmployee(emp)}
                                    disabled={isCompleted}
                                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-all duration-200 text-left group ${
                                      isCompleted
                                        ? 'border-primary/15 bg-primary/[0.03] cursor-not-allowed opacity-60'
                                        : 'border-border bg-background hover:bg-muted/50 hover:border-primary/30 hover:shadow-sm'
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                                        isCompleted ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                                      }`}>
                                        {emp.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                      </div>
                                      <div>
                                        <span className={`font-medium text-sm block ${isCompleted ? 'text-muted-foreground line-through' : ''}`}>{emp.name}</span>
                                        <div className="flex items-center gap-1.5">
                                          {emp.role && <span className="text-xs text-muted-foreground">{emp.role}</span>}
                                          {emp.department && <span className="text-[10px] text-muted-foreground/60">• {emp.department}</span>}
                                        </div>
                                      </div>
                                    </div>
                                    {isCompleted ? (
                                      <div className="flex items-center gap-1.5 text-primary">
                                        <span className="text-[10px] font-semibold">Reviewed</span>
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-1.5">
                                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 hidden sm:inline-flex">
                                          {HIERARCHY_LABELS[emp.hierarchy_level ?? 3] || `L${emp.hierarchy_level}`}
                                        </Badge>
                                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                      </div>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                      {filteredEmployees.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                          No employees match your search.
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Questions */}
              {step === 'questions' && currentCategory && (
                <motion.div key={`cat-${currentCategoryIndex}`} {...pageTransition}>
                  <div className="glass-panel p-6 sm:p-8">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <ClipboardList className="w-5 h-5 text-primary" />
                        </div>
                        <h2 className="text-lg font-bold">{currentCategory.name}</h2>
                      </div>
                      <span className="text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-xl font-bold">
                        {currentCategoryIndex + 1} / {categories.length}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-6 ml-[52px]">
                      Reviewing: <span className="text-foreground font-semibold">{selectedEmployee?.name}</span>
                      {selectedEmployee?.role && <span className="text-muted-foreground"> — {selectedEmployee.role}</span>}
                    </p>

                    {/* Scale Legend */}
                    {currentCategory.sort_order < 8 && (
                      <div className="flex flex-wrap gap-x-5 gap-y-2 mb-8 p-4 rounded-2xl bg-muted/40 border border-border/60 text-xs text-muted-foreground">
                        {SCALE_OPTIONS.map(s => (
                          <span key={s.value} className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary text-center leading-6 font-bold text-xs">{s.value}</span>
                            <span className="font-medium">{s.label}</span>
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="space-y-8">
                      {currentQuestions.map((q, qi) => (
                        <motion.div
                          key={q.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: qi * 0.05 }}
                          className="p-4 rounded-2xl bg-muted/20 border border-border/40"
                        >
                          <p className="text-sm leading-relaxed mb-4 font-medium">
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-primary/10 text-primary text-xs font-bold mr-2">{qi + 1}</span>
                            {q.question_text}
                          </p>
                          {q.question_type === 'scored' ? (
                            <div className="flex gap-2">
                              {SCALE_OPTIONS.map(s => (
                                <button
                                  key={s.value}
                                  onClick={() => setAnswers(prev => ({ ...prev, [q.id]: s.value }))}
                                  className={`flex-1 py-3 rounded-xl border-2 text-center transition-all duration-200 ${
                                    answers[q.id] === s.value
                                      ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20 -translate-y-0.5'
                                      : 'border-border bg-background text-muted-foreground hover:bg-muted/50 hover:border-primary/30'
                                  }`}
                                >
                                  <div className="text-sm font-bold">{s.value}</div>
                                  <div className="text-[10px] mt-0.5 hidden sm:block opacity-80 font-medium">{s.label}</div>
                                </button>
                              ))}
                            </div>
                          ) : (
                            <Textarea
                              placeholder="Share your thoughts..."
                              value={(answers[q.id] as string) || ''}
                              onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                              className="bg-background border-2 border-border rounded-xl min-h-[100px] text-sm resize-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all duration-200"
                            />
                          )}
                        </motion.div>
                      ))}
                    </div>

                    <div className="flex justify-between mt-8 pt-6 border-t border-border/60">
                      <Button
                        variant="outline"
                        onClick={() => {
                          if (currentCategoryIndex === 0) setStep('employee');
                          else setCurrentCategoryIndex(prev => prev - 1);
                        }}
                        className="gap-1.5"
                      >
                        <ChevronLeft className="w-4 h-4" /> Previous
                      </Button>
                      {currentCategoryIndex < categories.length - 1 ? (
                        <Button
                          onClick={() => setCurrentCategoryIndex(prev => prev + 1)}
                          disabled={currentCategory.sort_order < 8 && !isCurrentCategoryComplete()}
                          className="gap-1.5"
                        >
                          Next Section <ChevronRight className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Button
                          onClick={handleSubmit}
                          disabled={submitting || answeredScoredQuestions < totalScoredQuestions}
                          className="gap-1.5"
                        >
                          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                          Submit Response
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 4: Submitted */}
              {step === 'submitted' && (
                <motion.div key="submitted" {...pageTransition}>
                  <div className="glass-panel p-10 sm:p-14 text-center max-w-md mx-auto">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200, delay: 0.15 }}
                      className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-6"
                    >
                      <CheckCircle2 className="w-10 h-10 text-primary" />
                    </motion.div>
                    <h2 className="text-2xl font-bold mb-3">Thank You!</h2>
                    <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
                      Your anonymous feedback has been recorded successfully.
                    </p>
                    <Button
                      size="lg"
                      onClick={() => {
                        setStep('subsidiary');
                        setSelectedSubsidiary(null);
                        setSelectedEmployee(null);
                        setAnswers({});
                        setCurrentCategoryIndex(0);
                      }}
                      className="gap-2"
                    >
                      Review Another Person <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>

          {/* ============ DASHBOARD TAB ============ */}
          <TabsContent value="dashboard" className="mt-4">
            <motion.div {...pageTransition}>
              {dashboardLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Your Level & Pool Summary */}
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Users className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold">Your Appraisal Pool</h3>
                          <p className="text-[10px] text-muted-foreground">Level: {HIERARCHY_LABELS[myHierarchyLevel] || `L${myHierarchyLevel}`} — {globalPoolCounts.total} people can review you</p>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'Above You', count: globalPoolCounts.above, icon: <ArrowUp className="w-3.5 h-3.5" />, color: 'text-blue-600 bg-blue-500/10' },
                        { label: 'Your Peers', count: globalPoolCounts.peers, icon: <ArrowLeftRight className="w-3.5 h-3.5" />, color: 'text-emerald-600 bg-emerald-500/10' },
                        { label: 'Below You', count: globalPoolCounts.below, icon: <ArrowDown className="w-3.5 h-3.5" />, color: 'text-amber-600 bg-amber-500/10' },
                      ].map(p => (
                        <div key={p.label} className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/40">
                          <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${p.color}`}>{p.icon}</span>
                          <div>
                            <p className="text-[10px] text-muted-foreground">{p.label}</p>
                            <p className="text-sm font-bold">{p.count}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Stats row */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Star className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">Overall</p>
                          <p className="text-xl font-bold">{overallScore}<span className="text-xs font-normal text-muted-foreground">/5</span></p>
                        </div>
                      </div>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-panel p-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                          <BarChart3 className="w-3.5 h-3.5 text-accent" />
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">Org Avg</p>
                          <p className="text-xl font-bold">{orgOverall}<span className="text-xs font-normal text-muted-foreground">/5</span></p>
                        </div>
                      </div>
                    </motion.div>
                    {/* Direction counts */}
                    {[
                      { label: 'From Above', count: directionCounts.above, icon: '↓', color: 'text-blue-500 bg-blue-500/10' },
                      { label: 'From Peers', count: directionCounts.peer, icon: '↔', color: 'text-emerald-500 bg-emerald-500/10' },
                      { label: 'From Below', count: directionCounts.below, icon: '↑', color: 'text-amber-500 bg-amber-500/10' },
                    ].map((d, i) => (
                      <motion.div key={d.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }} className="glass-panel p-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${d.color}`}>{d.icon}</div>
                          <div>
                            <p className="text-[10px] text-muted-foreground">{d.label}</p>
                            <p className="text-xl font-bold">{d.count}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {myScores.length > 0 ? (
                    <>
                      {/* AI Insights Carousel */}
                      {aiDataContext && <AIInsightsCarousel dataContext={aiDataContext} />}

                      {/* Overall charts */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-panel p-6">
                          <h2 className="text-sm font-semibold mb-4">Overall Competency Overview</h2>
                          <ResponsiveContainer width="100%" height={280}>
                            <RadarChart data={myScores}>
                              <PolarGrid stroke="hsl(var(--border))" />
                              <PolarAngleAxis dataKey="category" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                              <Radar name="You" dataKey="myScore" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} strokeWidth={2} />
                              <Radar name="Org Avg" dataKey="orgAvg" stroke="hsl(var(--muted-foreground))" fill="hsl(var(--muted-foreground))" fillOpacity={0.05} strokeWidth={1} strokeDasharray="4 4" />
                            </RadarChart>
                          </ResponsiveContainer>
                          <div className="flex gap-4 justify-center mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-primary rounded" /> You</span>
                            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-muted-foreground rounded" /> Org Average</span>
                          </div>
                        </motion.div>

                        <DetailedCategoryBreakdown scores={myScores} />
                      </div>

                      {/* Segmented Feedback by Direction */}
                      <div>
                        <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
                          <Users className="w-4 h-4 text-primary" />
                          Feedback by Source
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {[
                            { key: 'above' as const, label: 'From Leadership Above', icon: '↓', color: 'border-blue-500/30', accent: 'hsl(210, 80%, 55%)', desc: 'Scores from people above your level' },
                            { key: 'peer' as const, label: 'From Peers', icon: '↔', color: 'border-emerald-500/30', accent: 'hsl(160, 60%, 45%)', desc: 'Scores from people at your level' },
                            { key: 'below' as const, label: 'From Reports Below', icon: '↑', color: 'border-amber-500/30', accent: 'hsl(40, 80%, 50%)', desc: 'Scores from people below your level' },
                          ].map(({ key, label, icon, color, accent, desc }) => {
                            const scores = directionScores[key];
                            const avg = scores.length
                              ? parseFloat((scores.reduce((s, c) => s + c.myScore, 0) / scores.length).toFixed(2))
                              : 0;
                            return (
                              <motion.div
                                key={key}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`glass-panel p-5 border-l-4 ${color}`}
                              >
                                <div className="flex items-center gap-2 mb-3">
                                  <span className="text-lg">{icon}</span>
                                  <div>
                                    <h3 className="text-xs font-bold">{label}</h3>
                                    <p className="text-[10px] text-muted-foreground">{desc}</p>
                                  </div>
                                </div>
                                {scores.length > 0 ? (
                                  <>
                                    <div className="text-center mb-3">
                                      <span className="text-2xl font-bold">{avg}</span>
                                      <span className="text-xs text-muted-foreground">/5</span>
                                      <p className="text-[10px] text-muted-foreground mt-0.5">{directionCounts[key]} review{directionCounts[key] !== 1 ? 's' : ''}</p>
                                    </div>
                                    <div className="space-y-1.5">
                                      {scores.map(s => (
                                        <div key={s.category} className="flex items-center gap-2">
                                          <span className="text-[10px] text-muted-foreground w-20 truncate">{s.category}</span>
                                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                            <div className="h-full rounded-full" style={{ width: `${(s.myScore / 5) * 100}%`, backgroundColor: accent }} />
                                          </div>
                                          <span className="text-[10px] font-semibold w-6 text-right">{s.myScore}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </>
                                ) : (
                                  <div className="text-center py-4">
                                    <p className="text-xs text-muted-foreground">No reviews from this source yet</p>
                                  </div>
                                )}
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Qualitative Feedback Section */}
                      <QualitativeFeedback
                        startDoing={qualitativeFeedback.startDoing}
                        stopDoing={qualitativeFeedback.stopDoing}
                        continueDoing={qualitativeFeedback.continueDoing}
                      />
                    </>
                  ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel p-12 text-center">
                      <BarChart3 className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
                      <h2 className="text-lg font-semibold mb-2">No Results Yet</h2>
                      <p className="text-muted-foreground text-sm">Your colleagues haven't submitted reviews for you yet. Check back later.</p>
                    </motion.div>
                  )}
                </div>
              )}
            </motion.div>
          </TabsContent>

          {/* ============ RANKINGS TAB ============ */}
          <TabsContent value="rankings" className="mt-4">
            <motion.div {...pageTransition}>
              {rankingsLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                <div>
                  <div className="text-center mb-6">
                    <h1 className="text-xl font-bold mb-1">Performance Rankings</h1>
                    <p className="text-muted-foreground text-sm">Top performers based on peer review scores.</p>
                  </div>

                  {/* Top 3 podium */}
                  {rankings.length >= 3 && (
                    <div className="grid grid-cols-3 gap-3 mb-6">
                      {[1, 0, 2].map(idx => {
                        const person = rankings[idx];
                        const isFirst = idx === 0;
                        return (
                          <motion.div
                            key={person.employee_id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 + idx * 0.1 }}
                            className={`glass-panel p-4 text-center ${isFirst ? 'sm:-mt-4 border-primary/30 bg-primary/5' : ''}`}
                          >
                            <div className="mb-2">{getRankIcon(idx)}</div>
                            <div className={`w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center ${
                              isFirst ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                            }`}>
                              <span className="font-bold text-xs">{person.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
                            </div>
                            <p className="text-sm font-semibold truncate">{person.name}</p>
                            <p className="text-[10px] text-muted-foreground mb-1">{person.subsidiary}</p>
                            <div className="flex items-center justify-center gap-1">
                              <Star className="w-3 h-3 text-primary" />
                              <span className="text-sm font-bold text-primary">{person.avgScore}</span>
                              <span className="text-[10px] text-muted-foreground">/5</span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}

                  {/* Full list */}
                  <div className="glass-panel divide-y divide-border">
                    {rankings.map((person, i) => {
                      const isMe = person.employee_id === currentEmployee?.id;
                      return (
                        <motion.div
                          key={person.employee_id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.03 * Math.min(i, 20) }}
                          className={`flex items-center gap-4 px-4 py-3 ${isMe ? 'bg-primary/5' : ''}`}
                        >
                          <div className="w-7 flex-shrink-0 text-center">{getRankIcon(i)}</div>
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                            <span className="text-[10px] font-semibold text-muted-foreground">{person.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {person.name}
                              {isMe && <span className="ml-1.5 text-xs text-primary font-normal">(You)</span>}
                            </p>
                            <p className="text-[10px] text-muted-foreground">{person.subsidiary}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-primary" />
                              <span className="text-sm font-bold">{person.avgScore}</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground">{person.totalReviews} reviews</p>
                          </div>
                        </motion.div>
                      );
                    })}
                    {rankings.length === 0 && (
                      <div className="p-12 text-center">
                        <Trophy className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
                        <h2 className="text-lg font-semibold mb-2">No Rankings Yet</h2>
                        <p className="text-muted-foreground text-sm">Rankings will appear once reviews are submitted.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEmployeeAuth } from '@/contexts/EmployeeAuthContext';
import { supabase } from '@/integrations/supabase/client';
import PlatformSidebar from '@/components/PlatformSidebar';
import {
  BarChart3, Users, Trophy, ClipboardList, Star,
} from 'lucide-react';
import { EmployeeDashboardPageSkeleton } from '@/components/shell/LoadingShells';
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { defaultQuarterPeriod } from '@/lib/boomPeriods';

interface CategoryScore {
  category: string;
  myScore: number;
  orgAvg: number;
}

export default function EmployeeDashboard() {
  const { user, profile, logout } = useEmployeeAuth();
  const navigate = useNavigate();
  const [myScores, setMyScores] = useState<CategoryScore[]>([]);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !profile?.employee_id) return;
    loadDashboardData();
  }, [user, profile]);

  const loadDashboardData = async () => {
    if (!profile?.employee_id || !user) return;
    const applyReleasedBoom360 = async () => {
      const qPeriod = defaultQuarterPeriod();
      const { data: boom360 } = await supabase.rpc('get_my_360_results', { _period: qPeriod });
      if (!boom360?.length) return;
      const bySection: Record<string, { wsum: number; w: number }> = {};
      for (const row of boom360 as {
        section: string;
        avg_score: number;
        response_count: number;
      }[]) {
        const sec = row.section?.trim() || '360 feedback';
        if (!bySection[sec]) bySection[sec] = { wsum: 0, w: 0 };
        bySection[sec].wsum += Number(row.avg_score) * row.response_count;
        bySection[sec].w += row.response_count;
      }
      const avgSec = (wsum: number, w: number) => (w ? parseFloat((wsum / w).toFixed(2)) : 0);
      const scores = Object.entries(bySection).map(([category, v]) => ({
        category,
        myScore: avgSec(v.wsum, v.w),
        orgAvg: 0,
      }));
      setMyScores(scores);
      const maxR = Math.max(...(boom360 as { response_count: number }[]).map((r) => r.response_count), 0);
      setTotalReviews(maxR);
    };

    try {
      // Load my responses
      const { data: myResponses } = await supabase
        .from('survey_responses')
        .select('id')
        .eq('employee_id', profile.employee_id);

      if (!myResponses?.length) {
        await applyReleasedBoom360();
        setLoading(false);
        return;
      }

      setTotalReviews(myResponses.length);
      const responseIds = myResponses.map(r => r.id);

      // Fetch question -> category mapping
      const { data: questionsWithCats } = await supabase
        .from('survey_questions')
        .select('id, survey_categories(name)');

      const questionCatMap: Record<string, string> = {};
      (questionsWithCats as any[])?.forEach(q => {
        if (q.survey_categories?.name) questionCatMap[q.id] = q.survey_categories.name;
      });

      // Batch fetch MY answers
      const batchSize = 200;
      let allMyAnswers: any[] = [];
      for (let i = 0; i < responseIds.length; i += batchSize) {
        const batch = responseIds.slice(i, i + batchSize);
        const { data } = await supabase
          .from('survey_answers')
          .select('score, question_id')
          .in('response_id', batch)
          .not('score', 'is', null);
        if (data) allMyAnswers = allMyAnswers.concat(data);
      }

      // Aggregate by category
      const myCatScores: Record<string, number[]> = {};
      allMyAnswers.forEach(a => {
        const cat = questionCatMap[a.question_id];
        if (cat && a.score) {
          if (!myCatScores[cat]) myCatScores[cat] = [];
          myCatScores[cat].push(a.score);
        }
      });

      const avgArr = (arr: number[]) => arr.length ? parseFloat((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2)) : 0;
      const cats = Object.keys(myCatScores);
      const scores = cats.map(cat => ({
        category: cat,
        myScore: avgArr(myCatScores[cat]),
        orgAvg: 0,
      }));
      setMyScores(scores);
      if (cats.length === 0) {
        await applyReleasedBoom360();
      }

      // Load org averages in background (sampled for speed)
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
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const overallScore = useMemo(() => {
    if (!myScores.length) return 0;
    return parseFloat((myScores.reduce((sum, s) => sum + s.myScore, 0) / myScores.length).toFixed(2));
  }, [myScores]);

  const orgOverall = useMemo(() => {
    if (!myScores.length) return 0;
    return parseFloat((myScores.reduce((sum, s) => sum + s.orgAvg, 0) / myScores.length).toFixed(2));
  }, [myScores]);

  const handleLogout = async () => { await logout(); navigate('/'); };

  if (loading) {
    return <EmployeeDashboardPageSkeleton />;
  }

  return (
    <div className="app-page">
      <div className="app-page-grid" />
      <PlatformSidebar
        title="Employee Portal"
        subtitle={profile?.name}
        onLogout={handleLogout}
        items={[
          { key: 'dashboard', label: 'My Dashboard', icon: <BarChart3 className="w-4 h-4" />, active: true, onClick: () => {} },
          { key: 'rankings', label: 'Rankings', icon: <Trophy className="w-4 h-4" />, to: '/wall-of-fame' },
          { key: 'survey', label: 'Survey', icon: <ClipboardList className="w-4 h-4" />, to: '/survey' },
        ]}
      />

      <div className="lg:pl-72">
      <main className="platform-content section-stack">
        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Star className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Your Overall Score</p>
                <p className="text-2xl font-bold text-foreground">{overallScore}<span className="text-sm font-normal text-muted-foreground">/5</span></p>
              </div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Organisation Average</p>
                <p className="text-2xl font-bold text-foreground">{orgOverall}<span className="text-sm font-normal text-muted-foreground">/5</span></p>
              </div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Reviews Received</p>
                <p className="text-2xl font-bold text-foreground">{totalReviews}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {myScores.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-panel p-6">
              <h2 className="text-sm font-semibold mb-4">Competency Overview</h2>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={myScores}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="category" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <Radar name="You" dataKey="myScore" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} strokeWidth={2} />
                  <Radar name="Org Avg" dataKey="orgAvg" stroke="hsl(var(--muted-foreground))" fill="hsl(var(--muted-foreground))" fillOpacity={0.05} strokeWidth={1} strokeDasharray="4 4" />
                </RadarChart>
              </ResponsiveContainer>
              <div className="flex gap-4 justify-center mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-primary rounded" /> You</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-muted-foreground rounded border-dashed" /> Org Average</span>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-panel p-6">
              <h2 className="text-sm font-semibold mb-4">Score Comparison by Category</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={myScores} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis dataKey="category" type="category" width={100} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                  <Bar dataKey="myScore" name="You" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="orgAvg" name="Org Avg" fill="hsl(var(--muted))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel p-12 text-center">
            <BarChart3 className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">No Results Yet</h2>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Scores from the organisation-wide survey appear here once you have received reviews. If your team uses BOOM
              peer 360, aggregated results show after HR releases the quarter and at least three peers have submitted — see
              the Survey tab for status.
            </p>
          </motion.div>
        )}
      </main>
      </div>
    </div>
  );
}

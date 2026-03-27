import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployeeAuth } from '@/contexts/EmployeeAuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3, Users, Building2, ClipboardCheck, LogOut, ArrowLeft, RefreshCw,
  TrendingUp, Clock, ChevronDown, ChevronUp, Eye
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, PieChart, Pie, Cell
} from 'recharts';

interface ResponseRow {
  id: string;
  employee_id: string;
  subsidiary_id: string;
  created_at: string;
}

interface AnswerRow {
  id: string;
  response_id: string;
  question_id: string;
  score: number | null;
  text_answer: string | null;
}

interface EmployeeRow {
  id: string;
  name: string;
  role: string | null;
  subsidiary_id: string;
}

interface SubsidiaryRow {
  id: string;
  name: string;
}

interface CategoryRow {
  id: string;
  name: string;
  sort_order: number;
}

interface QuestionRow {
  id: string;
  category_id: string;
  question_text: string;
  question_type: string;
  sort_order: number;
}

const CHART_COLORS = ['hsl(173, 80%, 40%)', 'hsl(38, 92%, 50%)', 'hsl(262, 83%, 58%)', 'hsl(142, 71%, 45%)', 'hsl(0, 72%, 51%)', 'hsl(200, 80%, 50%)', 'hsl(320, 70%, 50%)'];

export default function AppraisalAdmin() {
  const { logout: legacyLogout } = useAuth();
  const { logout: employeeLogout, isAdmin } = useEmployeeAuth();
  const navigate = useNavigate();
  const [responses, setResponses] = useState<ResponseRow[]>([]);
  const [answers, setAnswers] = useState<AnswerRow[]>([]);
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [subsidiaries, setSubsidiaries] = useState<SubsidiaryRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubsidiary, setSelectedSubsidiary] = useState<string>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [expandedResponse, setExpandedResponse] = useState<string | null>(null);

  useEffect(() => {
    loadAllData();
    // Realtime subscription
    const channel = supabase
      .channel('survey-responses')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'survey_responses' }, (payload) => {
        setResponses(prev => [payload.new as ResponseRow, ...prev]);
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'survey_answers' }, (payload) => {
        setAnswers(prev => [...prev, payload.new as AnswerRow]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [resRes, ansRes, empRes, subRes, catRes, qRes] = await Promise.all([
        supabase.from('survey_responses').select('*').order('created_at', { ascending: false }),
        supabase.from('survey_answers').select('*'),
        supabase.from('employees').select('*').order('sort_order'),
        supabase.from('subsidiaries').select('*').order('name'),
        supabase.from('survey_categories').select('*').order('sort_order'),
        supabase.from('survey_questions').select('*').order('sort_order'),
      ]);
      if (resRes.data) setResponses(resRes.data);
      if (ansRes.data) setAnswers(ansRes.data);
      if (empRes.data) setEmployees(empRes.data);
      if (subRes.data) setSubsidiaries(subRes.data);
      if (catRes.data) setCategories(catRes.data);
      if (qRes.data) setQuestions(qRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getEmployeeName = (id: string) => employees.find(e => e.id === id)?.name || 'Unknown';
  const getEmployeeRole = (id: string) => employees.find(e => e.id === id)?.role || '';
  const getSubsidiaryName = (id: string) => subsidiaries.find(s => s.id === id)?.name || 'Unknown';
  const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || 'Unknown';
  const getQuestionText = (id: string) => questions.find(q => q.id === id)?.question_text || '';
  const getQuestionCategory = (id: string) => questions.find(q => q.id === id)?.category_id || '';

  const filteredResponses = useMemo(() => {
    let filtered = responses;
    if (selectedSubsidiary !== 'all') {
      filtered = filtered.filter(r => r.subsidiary_id === selectedSubsidiary);
    }
    if (selectedEmployee) {
      filtered = filtered.filter(r => r.employee_id === selectedEmployee);
    }
    return filtered;
  }, [responses, selectedSubsidiary, selectedEmployee]);

  const filteredResponseIds = new Set(filteredResponses.map(r => r.id));
  const filteredAnswers = useMemo(() => answers.filter(a => filteredResponseIds.has(a.response_id)), [answers, filteredResponseIds]);

  // Stats
  const totalResponses = filteredResponses.length;
  const uniqueReviewees = new Set(filteredResponses.map(r => r.employee_id)).size;
  const uniqueSubsidiaries = new Set(filteredResponses.map(r => r.subsidiary_id)).size;

  const avgOverallScore = useMemo(() => {
    const scored = filteredAnswers.filter(a => a.score !== null);
    if (scored.length === 0) return 0;
    return scored.reduce((sum, a) => sum + (a.score || 0), 0) / scored.length;
  }, [filteredAnswers]);

  // Responses per subsidiary
  const subsidiaryBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredResponses.forEach(r => {
      const name = getSubsidiaryName(r.subsidiary_id);
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [filteredResponses, subsidiaries]);

  // Category averages
  const categoryAverages = useMemo(() => {
    const scoredCategories = categories.filter(c => c.sort_order < 8);
    return scoredCategories.map(cat => {
      const catQuestionIds = new Set(questions.filter(q => q.category_id === cat.id).map(q => q.id));
      const catAnswers = filteredAnswers.filter(a => catQuestionIds.has(a.question_id) && a.score !== null);
      const avg = catAnswers.length > 0
        ? catAnswers.reduce((sum, a) => sum + (a.score || 0), 0) / catAnswers.length
        : 0;
      return { name: cat.name.split('&')[0].trim().substring(0, 15), fullName: cat.name, avg: parseFloat(avg.toFixed(2)), fullMark: 5 };
    });
  }, [filteredAnswers, categories, questions]);

  // Top reviewed employees
  const employeeResponseCounts = useMemo(() => {
    const counts: Record<string, { name: string; role: string; subsidiary: string; count: number; avgScore: number }> = {};
    filteredResponses.forEach(r => {
      const emp = employees.find(e => e.id === r.employee_id);
      if (!emp) return;
      if (!counts[r.employee_id]) {
        counts[r.employee_id] = {
          name: emp.name,
          role: emp.role || '',
          subsidiary: getSubsidiaryName(emp.subsidiary_id),
          count: 0,
          avgScore: 0,
        };
      }
      counts[r.employee_id].count++;
    });
    // Calculate avg scores per employee
    Object.keys(counts).forEach(empId => {
      const empResponseIds = new Set(filteredResponses.filter(r => r.employee_id === empId).map(r => r.id));
      const empAnswers = answers.filter(a => empResponseIds.has(a.response_id) && a.score !== null);
      counts[empId].avgScore = empAnswers.length > 0
        ? parseFloat((empAnswers.reduce((s, a) => s + (a.score || 0), 0) / empAnswers.length).toFixed(2))
        : 0;
    });
    return Object.values(counts).sort((a, b) => b.count - a.count);
  }, [filteredResponses, employees, answers]);

  // Recent responses timeline
  const recentResponses = filteredResponses.slice(0, 20);

  // Get response detail
  const getResponseAnswers = (responseId: string) => {
    return answers.filter(a => a.response_id === responseId);
  };

  const filteredEmployees = useMemo(() => {
    if (selectedSubsidiary === 'all') return employees;
    return employees.filter(e => e.subsidiary_id === selectedSubsidiary);
  }, [employees, selectedSubsidiary]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 sm:gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="gap-1 flex-shrink-0">
              <ArrowLeft className="w-4 h-4" /> Dashboard
            </Button>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-primary">360° Appraisal Monitor</h1>
              <p className="text-xs text-muted-foreground">Real-time response tracking</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={loadAllData} className="gap-1">
              <RefreshCw className="w-3 h-3" /> Refresh
            </Button>
            <Button variant="ghost" size="sm" onClick={async () => { legacyLogout(); await employeeLogout(); navigate('/'); }}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-start sm:items-center">
          <Select value={selectedSubsidiary} onValueChange={(v) => { setSelectedSubsidiary(v); setSelectedEmployee(null); }}>
            <SelectTrigger className="w-full sm:w-[200px] bg-secondary/50">
              <Building2 className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="All Subsidiaries" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subsidiaries</SelectItem>
              {subsidiaries.map(s => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedEmployee || 'all'} onValueChange={(v) => setSelectedEmployee(v === 'all' ? null : v)}>
            <SelectTrigger className="w-full sm:w-[220px] bg-secondary/50">
              <Users className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="All Employees" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Employees</SelectItem>
              {filteredEmployees.map(e => (
                <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {totalResponses > 0 && (
            <Badge variant="secondary" className="text-xs">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse mr-2" />
              Live
            </Badge>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Responses', value: totalResponses, icon: ClipboardCheck, color: 'text-primary' },
            { label: 'People Reviewed', value: uniqueReviewees, icon: Users, color: 'text-accent' },
            { label: 'Subsidiaries', value: uniqueSubsidiaries, icon: Building2, color: 'text-chart-3' },
            { label: 'Avg Score', value: `${avgOverallScore.toFixed(2)}/5`, icon: TrendingUp, color: 'text-primary' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-panel p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {totalResponses === 0 ? (
          <div className="glass-panel p-12 text-center">
            <ClipboardCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Responses Yet</h3>
            <p className="text-muted-foreground text-sm mb-4">Share the survey link to start collecting anonymous feedback.</p>
            <Button onClick={() => { navigator.clipboard.writeText(window.location.origin + '/survey'); }} className="bg-primary hover:bg-primary/90">
              Copy Survey Link
            </Button>
          </div>
        ) : (
          <>
            {/* Charts Row */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Responses by Subsidiary */}
              <div className="glass-panel p-4">
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" /> Responses by Subsidiary
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={subsidiaryBreakdown} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, count }) => `${name}: ${count}`} labelLine>
                      {subsidiaryBreakdown.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(222, 47%, 10%)', border: '1px solid hsl(222, 30%, 18%)', borderRadius: '8px', color: 'hsl(210, 40%, 96%)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Category Radar */}
              <div className="glass-panel p-4">
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-accent" /> Category Averages
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <RadarChart data={categoryAverages}>
                    <PolarGrid stroke="hsl(222, 30%, 18%)" />
                    <PolarAngleAxis dataKey="name" tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 10 }} />
                    <PolarRadiusAxis domain={[0, 5]} tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 10 }} />
                    <Radar name="Average" dataKey="avg" stroke="hsl(173, 80%, 40%)" fill="hsl(173, 80%, 40%)" fillOpacity={0.3} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Employee Leaderboard */}
            <div className="glass-panel p-4">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" /> Response Count by Person
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left py-2 px-3 text-muted-foreground font-medium">Name</th>
                      <th className="text-left py-2 px-3 text-muted-foreground font-medium">Role</th>
                      <th className="text-left py-2 px-3 text-muted-foreground font-medium">Subsidiary</th>
                      <th className="text-center py-2 px-3 text-muted-foreground font-medium">Responses</th>
                      <th className="text-center py-2 px-3 text-muted-foreground font-medium">Avg Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employeeResponseCounts.map((emp, i) => (
                      <tr key={i} className="border-b border-border/20 hover:bg-secondary/30 transition-colors">
                        <td className="py-2.5 px-3 font-medium">{emp.name}</td>
                        <td className="py-2.5 px-3 text-muted-foreground text-xs">{emp.role}</td>
                        <td className="py-2.5 px-3 text-muted-foreground text-xs">{emp.subsidiary}</td>
                        <td className="py-2.5 px-3 text-center">
                          <Badge variant="secondary">{emp.count}</Badge>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`font-semibold ${
                            emp.avgScore >= 4 ? 'text-emerald-400' :
                            emp.avgScore >= 3 ? 'text-primary' :
                            emp.avgScore >= 2 ? 'text-amber-400' : 'text-red-400'
                          }`}>
                            {emp.avgScore}/5
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Responses Feed */}
            <div className="glass-panel p-4">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-accent" /> Recent Responses
              </h3>
              <div className="space-y-2">
                {recentResponses.map(r => {
                  const isExpanded = expandedResponse === r.id;
                  const responseAnswers = isExpanded ? getResponseAnswers(r.id) : [];
                  return (
                    <div key={r.id} className="border border-border/30 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setExpandedResponse(isExpanded ? null : r.id)}
                        className="w-full flex items-center justify-between p-3 hover:bg-secondary/30 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-primary" />
                          <div>
                            <span className="font-medium text-sm">{getEmployeeName(r.employee_id)}</span>
                            <span className="text-muted-foreground text-xs ml-2">{getSubsidiaryName(r.subsidiary_id)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {new Date(r.created_at).toLocaleDateString()} {new Date(r.created_at).toLocaleTimeString()}
                          </span>
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </button>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          className="border-t border-border/30 p-3 bg-secondary/10"
                        >
                          <div className="space-y-2 max-h-96 overflow-y-auto">
                            {categories.filter(c => c.sort_order < 8).map(cat => {
                              const catQuestions = questions.filter(q => q.category_id === cat.id);
                              const catAnswered = responseAnswers.filter(a => catQuestions.some(q => q.id === a.question_id));
                              if (catAnswered.length === 0) return null;
                              const catAvg = catAnswered.filter(a => a.score).reduce((s, a) => s + (a.score || 0), 0) / catAnswered.filter(a => a.score).length;
                              return (
                                <div key={cat.id} className="flex items-center justify-between py-1 text-xs">
                                  <span className="text-muted-foreground">{cat.name}</span>
                                  <span className={`font-semibold ${
                                    catAvg >= 4 ? 'text-emerald-400' : catAvg >= 3 ? 'text-primary' : catAvg >= 2 ? 'text-amber-400' : 'text-red-400'
                                  }`}>
                                    {catAvg.toFixed(1)}/5
                                  </span>
                                </div>
                              );
                            })}
                            {/* Open ended answers */}
                            {responseAnswers.filter(a => a.text_answer).map(a => (
                              <div key={a.id} className="mt-2 p-2 rounded bg-secondary/20 text-xs">
                                <p className="text-muted-foreground mb-1">{getQuestionText(a.question_id)}</p>
                                <p className="text-foreground">{a.text_answer}</p>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

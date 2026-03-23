import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, ChevronRight, ChevronLeft, Building2, User, ClipboardList, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Subsidiary {
  id: string;
  name: string;
}

interface Employee {
  id: string;
  name: string;
  role: string | null;
  subsidiary_id: string;
}

interface Category {
  id: string;
  name: string;
  sort_order: number;
}

interface Question {
  id: string;
  category_id: string;
  question_text: string;
  question_type: string;
  sort_order: number;
}

const SCALE_LABELS = [
  { value: 5, label: 'Most Likely', color: 'bg-emerald-500/20 border-emerald-500 text-emerald-400' },
  { value: 4, label: 'Likely', color: 'bg-teal-500/20 border-teal-500 text-teal-400' },
  { value: 3, label: 'Neutral', color: 'bg-amber-500/20 border-amber-500 text-amber-400' },
  { value: 2, label: 'Unlikely', color: 'bg-orange-500/20 border-orange-500 text-orange-400' },
  { value: 1, label: 'Least Likely', color: 'bg-red-500/20 border-red-500 text-red-400' },
];

export default function Survey() {
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

  // Load completed employees from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('vgg_completed_reviews');
    if (saved) {
      try {
        setCompletedEmployees(new Set(JSON.parse(saved)));
      } catch { /* ignore */ }
    }
  }, []);

  const markEmployeeCompleted = (employeeId: string) => {
    setCompletedEmployees(prev => {
      const next = new Set(prev);
      next.add(employeeId);
      localStorage.setItem('vgg_completed_reviews', JSON.stringify([...next]));
      return next;
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [subRes, catRes, qRes] = await Promise.all([
        supabase.from('subsidiaries').select('*').order('name'),
        supabase.from('survey_categories').select('*').order('sort_order'),
        supabase.from('survey_questions').select('*').order('sort_order'),
      ]);
      if (subRes.data) setSubsidiaries(subRes.data);
      if (catRes.data) setCategories(catRes.data);
      if (qRes.data) setQuestions(qRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async (subsidiaryId: string) => {
    const { data } = await supabase
      .from('employees')
      .select('*')
      .eq('subsidiary_id', subsidiaryId)
      .order('sort_order');
    if (data) setEmployees(data);
  };

  const handleSelectSubsidiary = (sub: Subsidiary) => {
    setSelectedSubsidiary(sub);
    loadEmployees(sub.id);
    setStep('employee');
  };

  const handleSelectEmployee = (emp: Employee) => {
    setSelectedEmployee(emp);
    setStep('questions');
    setCurrentCategoryIndex(0);
  };

  const currentCategory = categories[currentCategoryIndex];
  const currentQuestions = currentCategory
    ? questions.filter(q => q.category_id === currentCategory.id)
    : [];

  const scoredCategories = categories.filter(c => c.sort_order < 8);
  const openEndedCategory = categories.find(c => c.sort_order === 8);

  const isCurrentCategoryComplete = () => {
    if (!currentCategory) return false;
    return currentQuestions.every(q => {
      if (q.question_type === 'open_ended') return true; // open-ended optional
      return answers[q.id] !== undefined;
    });
  };

  const totalScoredQuestions = questions.filter(q => q.question_type === 'scored').length;
  const answeredScoredQuestions = questions.filter(q => q.question_type === 'scored' && answers[q.id] !== undefined).length;
  const progress = totalScoredQuestions > 0 ? (answeredScoredQuestions / totalScoredQuestions) * 100 : 0;

  const handleSubmit = async () => {
    if (!selectedEmployee || !selectedSubsidiary) return;
    setSubmitting(true);

    try {
      // Create response
      const { data: responseData, error: responseError } = await supabase
        .from('survey_responses')
        .insert({
          employee_id: selectedEmployee.id,
          subsidiary_id: selectedSubsidiary.id,
        })
        .select('id')
        .single();

      if (responseError) throw responseError;

      // Create answers
      const answerRows = Object.entries(answers).map(([questionId, value]) => ({
        response_id: responseData.id,
        question_id: questionId,
        score: typeof value === 'number' ? value : null,
        text_answer: typeof value === 'string' ? value : null,
      }));

      const { error: answersError } = await supabase
        .from('survey_answers')
        .insert(answerRows);

      if (answersError) throw answersError;

      setStep('submitted');
      toast.success('Response submitted successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit response. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold gradient-text">VGG 360° Appraisal</h1>
          <p className="text-muted-foreground mt-2 text-sm">Anonymous Performance Feedback</p>
        </motion.div>

        {/* Progress Bar */}
        {step === 'questions' && (
          <div className="mb-6">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              {categories.map((cat, i) => (
                <div
                  key={cat.id}
                  className={`w-2 h-2 rounded-full ${
                    i < currentCategoryIndex ? 'bg-primary' :
                    i === currentCategoryIndex ? 'bg-accent' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* Step 1: Select Subsidiary */}
          {step === 'subsidiary' && (
            <motion.div key="subsidiary" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="glass-panel p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Building2 className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold">Select Subsidiary</h2>
                </div>
                <p className="text-muted-foreground text-sm mb-6">Choose the company of the person you are reviewing.</p>
                <div className="grid gap-3">
                  {subsidiaries.map(sub => (
                    <button
                      key={sub.id}
                      onClick={() => handleSelectSubsidiary(sub)}
                      className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-secondary/30 hover:bg-secondary/60 hover:border-primary/50 transition-all text-left group"
                    >
                      <span className="font-medium">{sub.name}</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Select Employee */}
          {step === 'employee' && (
            <motion.div key="employee" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="glass-panel p-6">
                <button onClick={() => setStep('subsidiary')} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <div className="flex items-center gap-3 mb-2">
                  <User className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold">Select Person to Review</h2>
                </div>
                <p className="text-muted-foreground text-sm mb-6">{selectedSubsidiary?.name}</p>
                <div className="grid gap-2 max-h-[60vh] overflow-y-auto pr-2">
                  {employees.map(emp => (
                    <button
                      key={emp.id}
                      onClick={() => handleSelectEmployee(emp)}
                      className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-secondary/30 hover:bg-secondary/60 hover:border-primary/50 transition-all text-left group"
                    >
                      <div>
                        <span className="font-medium text-sm">{emp.name}</span>
                        {emp.role && <span className="block text-xs text-muted-foreground">{emp.role}</span>}
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Questions */}
          {step === 'questions' && currentCategory && (
            <motion.div key={`cat-${currentCategoryIndex}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="glass-panel p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <ClipboardList className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-semibold">{currentCategory.name}</h2>
                  </div>
                  <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">
                    {currentCategoryIndex + 1} / {categories.length}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-6">
                  Reviewing: <span className="text-foreground font-medium">{selectedEmployee?.name}</span>
                  {selectedEmployee?.role && <span> — {selectedEmployee.role}</span>}
                </p>

                {/* Scale Legend for scored questions */}
                {currentCategory.sort_order < 8 && (
                  <div className="flex flex-wrap gap-2 mb-6 p-3 rounded-lg bg-secondary/30 border border-border/30">
                    {SCALE_LABELS.map(s => (
                      <span key={s.value} className="text-xs flex items-center gap-1">
                        <span className={`inline-block w-5 h-5 rounded text-center leading-5 text-xs font-bold border ${s.color}`}>{s.value}</span>
                        <span className="text-muted-foreground">{s.label}</span>
                      </span>
                    ))}
                  </div>
                )}

                <div className="space-y-6">
                  {currentQuestions.map((q, qi) => (
                    <div key={q.id} className="space-y-3">
                      <p className="text-sm font-medium leading-relaxed">
                        <span className="text-muted-foreground mr-2">{qi + 1}.</span>
                        {q.question_text}
                      </p>
                      {q.question_type === 'scored' ? (
                        <div className="flex gap-2">
                          {SCALE_LABELS.map(s => (
                            <button
                              key={s.value}
                              onClick={() => setAnswers(prev => ({ ...prev, [q.id]: s.value }))}
                              className={`flex-1 py-2.5 rounded-lg border text-xs font-semibold transition-all ${
                                answers[q.id] === s.value
                                  ? s.color + ' shadow-lg scale-105'
                                  : 'border-border/50 bg-secondary/20 text-muted-foreground hover:bg-secondary/40'
                              }`}
                            >
                              <div className="text-base">{s.value}</div>
                              <div className="text-[10px] mt-0.5 hidden sm:block">{s.label}</div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <Textarea
                          placeholder="Type your response here..."
                          value={(answers[q.id] as string) || ''}
                          onChange={(e) => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                          className="bg-secondary/30 border-border/50 min-h-[80px] text-sm"
                        />
                      )}
                    </div>
                  ))}
                </div>

                {/* Navigation */}
                <div className="flex justify-between mt-8">
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (currentCategoryIndex === 0) {
                        setStep('employee');
                      } else {
                        setCurrentCategoryIndex(prev => prev - 1);
                      }
                    }}
                    className="gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" /> Back
                  </Button>

                  {currentCategoryIndex < categories.length - 1 ? (
                    <Button
                      onClick={() => setCurrentCategoryIndex(prev => prev + 1)}
                      disabled={currentCategory.sort_order < 8 && !isCurrentCategoryComplete()}
                      className="gap-1 bg-primary hover:bg-primary/90"
                    >
                      Next <ChevronRight className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmit}
                      disabled={submitting || answeredScoredQuestions < totalScoredQuestions}
                      className="gap-1 bg-primary hover:bg-primary/90"
                    >
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      Submit
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 4: Submitted */}
          {step === 'submitted' && (
            <motion.div key="submitted" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <div className="glass-panel p-8 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                >
                  <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-4" />
                </motion.div>
                <h2 className="text-xl font-bold mb-2">Thank You!</h2>
                <p className="text-muted-foreground text-sm mb-6">
                  Your anonymous feedback has been submitted successfully.
                </p>
                <Button
                  onClick={() => {
                    setStep('subsidiary');
                    setSelectedSubsidiary(null);
                    setSelectedEmployee(null);
                    setAnswers({});
                    setCurrentCategoryIndex(0);
                  }}
                  className="bg-primary hover:bg-primary/90"
                >
                  Submit Another Review
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

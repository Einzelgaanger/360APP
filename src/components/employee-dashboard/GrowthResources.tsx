import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, BookOpen, FileText, Video, Wrench, Loader2, RefreshCw, Clock, Target, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ResourceFeedback from './ResourceFeedback';

interface Resource {
  title: string;
  type: 'article' | 'book' | 'video' | 'exercise';
  source: string;
  url: string | null;
  why_relevant: string;
  why_picked?: string;
  time_commitment: string;
  difficulty: 'foundational' | 'intermediate' | 'advanced';
}

interface GrowthResourcesProps {
  userId: string;
  focusArea: string;
  currentScore?: number;
  feedbackContext?: string;
  onAddToGoal?: (resource: Resource) => void;
}

const TYPE_META = {
  article:  { icon: FileText,  label: 'ARTICLE'  },
  book:     { icon: BookOpen,  label: 'BOOK'     },
  video:    { icon: Video,     label: 'WATCH'    },
  exercise: { icon: Wrench,    label: 'EXERCISE' },
};

// Stable id from a resource so feedback can be matched across regenerations.
const resourceId = (r: Resource) => `${r.type}::${r.title.toLowerCase().slice(0, 80).replace(/\s+/g, '_')}`;

export default function GrowthResources({ userId, focusArea, currentScore, feedbackContext, onAddToGoal }: GrowthResourcesProps) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatedAt, setGeneratedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedbackMap, setFeedbackMap] = useState<Record<string, number>>({});

  // Load any existing feedback for this user so thumbs persist.
  const loadFeedback = useCallback(async () => {
    const { data } = await supabase
      .from('resource_feedback')
      .select('resource_id, relevance_score')
      .eq('user_id', userId);
    if (data) {
      const map: Record<string, number> = {};
      data.forEach((row: any) => { map[row.resource_id] = row.relevance_score; });
      setFeedbackMap(map);
    }
  }, [userId]);

  const loadCached = useCallback(async () => {
    const { data } = await supabase
      .from('growth_resources')
      .select('resources, generated_at, expires_at')
      .eq('user_id', userId)
      .eq('focus_area', focusArea)
      .gt('expires_at', new Date().toISOString())
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) {
      setResources(data.resources as unknown as Resource[]);
      setGeneratedAt(new Date(data.generated_at));
      return true;
    }
    return false;
  }, [userId, focusArea]);

  const generate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Use adaptive endpoint — falls back to legacy on error.
      let { data, error: fnErr } = await supabase.functions.invoke('adaptive-resources', {
        body: { focusArea, currentScore, feedbackContext: feedbackContext?.slice(0, 1500) },
      });
      if (fnErr || data?.error) {
        const fb = await supabase.functions.invoke('research-resources', {
          body: { focusArea, currentScore, feedbackContext: feedbackContext?.slice(0, 1500) },
        });
        data = fb.data;
        if (fb.error) throw fb.error;
      }
      const list: Resource[] = data?.resources || [];
      if (list.length === 0) throw new Error('No resources returned');

      await supabase.from('growth_resources').delete().eq('user_id', userId).eq('focus_area', focusArea);
      await supabase.from('growth_resources').insert({
        user_id: userId,
        focus_area: focusArea,
        resources: list as any,
        feedback_snapshot: feedbackContext?.slice(0, 1500) || null,
      });
      setResources(list);
      setGeneratedAt(new Date());
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Could not generate resources');
      toast.error('Could not generate resources. Try again in a minute.');
    } finally {
      setLoading(false);
    }
  }, [userId, focusArea, currentScore, feedbackContext]);

  useEffect(() => {
    setResources([]);
    setGeneratedAt(null);
    setError(null);
    void loadFeedback();
    loadCached().then(found => { if (!found) void generate(); });
  }, [focusArea, loadCached, generate, loadFeedback]);

  const logInteraction = async (r: Resource, action: 'opened' | 'saved' | 'dismissed' | 'completed') => {
    await supabase.from('learning_interactions').insert({
      user_id: userId,
      resource_id: resourceId(r),
      resource_title: r.title,
      resource_format: r.type,
      focus_area: focusArea,
      action,
      metadata: { source: r.source, difficulty: r.difficulty } as any,
    });
  };

  const dismiss = async (r: Resource) => {
    await logInteraction(r, 'dismissed');
    setResources(prev => prev.filter(x => x.title !== r.title));
    toast.success('Dropped. The recommender will avoid similar items.', { duration: 1800 });
  };

  return (
    <div className="brutal p-5">
      <div className="flex items-start justify-between mb-4 gap-3">
        <div className="min-w-0">
          <div className="eyebrow mb-1 flex items-center gap-2"><Sparkles className="w-3 h-3" /> Adaptive picks</div>
          <h3 className="font-display text-lg font-medium leading-tight truncate">For: {focusArea}</h3>
          <p className="text-[11px] text-muted-foreground mt-1">
            Personalised from your past interactions, ratings and reflections.
            {generatedAt && <> · Refreshed {generatedAt.toLocaleDateString()}</>}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={generate} disabled={loading} className="shrink-0 h-8">
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
          <span className="ml-1.5 text-[10px]">Refresh</span>
        </Button>
      </div>

      {loading && resources.length === 0 && (
        <div className="py-12 text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3" />
          <p className="text-xs mono uppercase tracking-[0.2em]">Researching the best resources for you…</p>
          <p className="text-[10px] text-foreground/60 mt-1">10–20 seconds.</p>
        </div>
      )}

      {error && resources.length === 0 && !loading && (
        <div className="py-6 text-center text-xs">
          {error}. <button onClick={generate} className="underline font-bold">Try again</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <AnimatePresence>
          {resources.map((r, i) => {
            const Meta = TYPE_META[r.type] || TYPE_META.article;
            const Icon = Meta.icon;
            const rid = resourceId(r);
            return (
              <motion.div
                key={rid}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.04 }}
                className="brutal p-4 flex flex-col bg-card"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 border-2 border-foreground rounded-sm flex items-center justify-center bg-background shrink-0">
                      <Icon className="w-3 h-3" />
                    </div>
                    <span className="mono text-[9px] uppercase tracking-[0.2em] font-bold">{Meta.label}</span>
                  </div>
                  <button
                    onClick={() => dismiss(r)}
                    className="text-foreground/40 hover:text-destructive transition-colors"
                    title="Not relevant — drop and improve recommender"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <h4 className="font-serif text-base font-bold leading-snug mb-1">{r.title}</h4>
                <p className="text-[10px] mono uppercase tracking-[0.16em] text-foreground/60 mb-2">{r.source}</p>

                <p className="text-[12px] leading-relaxed mb-2">{r.why_relevant}</p>

                {r.why_picked && (
                  <div className="text-[11px] italic border-l-2 border-primary pl-2 py-1 mb-3 text-foreground/80 bg-primary/5">
                    <span className="mono not-italic font-bold uppercase tracking-[0.16em] text-[9px] block mb-0.5">Why you</span>
                    {r.why_picked}
                  </div>
                )}

                <div className="flex items-center gap-1.5 flex-wrap mt-auto mb-3">
                  <Badge variant="outline" className="text-[9px] py-0 h-5 gap-1"><Clock className="w-2.5 h-2.5" /> {r.time_commitment}</Badge>
                  <Badge variant={r.difficulty === 'advanced' ? 'green' : 'outline'} className="text-[9px] py-0 h-5">{r.difficulty}</Badge>
                </div>

                <div className="flex gap-1.5 mb-3">
                  {r.url && (
                    <a href={r.url} target="_blank" rel="noopener noreferrer" className="flex-1" onClick={() => logInteraction(r, 'opened')}>
                      <Button variant="default" size="sm" className="w-full h-8 text-[10px]">
                        <ExternalLink className="w-3 h-3 mr-1" /> Open
                      </Button>
                    </a>
                  )}
                  {onAddToGoal && (
                    <Button size="sm" variant="green" onClick={() => { logInteraction(r, 'completed'); onAddToGoal(r); }} className="h-8 text-[10px] px-2">
                      <Target className="w-3 h-3 mr-1" /> Use
                    </Button>
                  )}
                </div>

                <div className="border-t-2 border-foreground/10 pt-2.5">
                  <ResourceFeedback
                    userId={userId}
                    resourceId={rid}
                    resourceTitle={r.title}
                    focusArea={focusArea}
                    initialScore={feedbackMap[rid] ?? null}
                    onSubmitted={(score) => setFeedbackMap(m => ({ ...m, [rid]: score }))}
                  />
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

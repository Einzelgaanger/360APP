import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ExternalLink, BookOpen, FileText, Video, Wrench, Loader2, RefreshCw, Clock, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Resource {
  title: string;
  type: 'article' | 'book' | 'video' | 'exercise';
  source: string;
  url: string | null;
  why_relevant: string;
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
  article: { icon: FileText, color: 'text-blue-600 bg-blue-500/10', label: 'Article' },
  book: { icon: BookOpen, color: 'text-amber-600 bg-amber-500/10', label: 'Book' },
  video: { icon: Video, color: 'text-rose-600 bg-rose-500/10', label: 'Watch' },
  exercise: { icon: Wrench, color: 'text-emerald-600 bg-emerald-500/10', label: 'Exercise' },
};

const DIFFICULTY_COLOR = {
  foundational: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30',
  intermediate: 'bg-blue-500/10 text-blue-700 border-blue-500/30',
  advanced: 'bg-purple-500/10 text-purple-700 border-purple-500/30',
};

export default function GrowthResources({ userId, focusArea, currentScore, feedbackContext, onAddToGoal }: GrowthResourcesProps) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatedAt, setGeneratedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      setResources(data.resources as Resource[]);
      setGeneratedAt(new Date(data.generated_at));
      return true;
    }
    return false;
  }, [userId, focusArea]);

  const generate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('research-resources', {
        body: { focusArea, currentScore, feedbackContext: feedbackContext?.slice(0, 1500) },
      });
      if (fnErr) throw fnErr;
      if (data?.error) throw new Error(data.error);
      const list: Resource[] = data?.resources || [];
      if (list.length === 0) throw new Error('No resources returned');

      // Cache
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
    loadCached().then(found => { if (!found) void generate(); });
  }, [focusArea, loadCached, generate]);

  return (
    <div className="glass-panel p-5">
      <div className="flex items-start justify-between mb-4 gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Curated for: <span className="text-primary truncate">{focusArea}</span>
          </h3>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Hand-picked by AI from real articles, books, videos and exercises tied to your feedback.
            {generatedAt && <> · Refreshed {generatedAt.toLocaleDateString()}</>}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={generate} disabled={loading} className="shrink-0 h-7 text-[11px]">
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
          <span className="ml-1.5">Refresh</span>
        </Button>
      </div>

      {loading && resources.length === 0 && (
        <div className="py-12 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-3" />
          <p className="text-xs text-muted-foreground">Researching the best resources for you…</p>
          <p className="text-[10px] text-muted-foreground mt-1">This takes 10–20 seconds.</p>
        </div>
      )}

      {error && resources.length === 0 && !loading && (
        <div className="py-6 text-center text-xs text-muted-foreground">
          {error}. <button onClick={generate} className="text-primary underline">Try again</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <AnimatePresence>
          {resources.map((r, i) => {
            const Meta = TYPE_META[r.type] || TYPE_META.article;
            const Icon = Meta.icon;
            return (
              <motion.div
                key={`${r.title}-${i}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="group p-3 rounded-xl border border-border/60 bg-card/40 hover:border-primary/40 hover:bg-card/70 transition-all flex flex-col"
              >
                <div className="flex items-start gap-2.5 mb-2">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${Meta.color}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-semibold text-foreground leading-snug line-clamp-2">{r.title}</h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{r.source}</p>
                  </div>
                </div>
                <p className="text-[11px] text-foreground/80 leading-relaxed mb-3 line-clamp-3">{r.why_relevant}</p>
                <div className="flex items-center gap-1.5 flex-wrap mt-auto mb-2">
                  <Badge variant="outline" className="text-[9px] py-0 h-4 gap-1"><Clock className="w-2.5 h-2.5" /> {r.time_commitment}</Badge>
                  <Badge variant="outline" className={`text-[9px] py-0 h-4 ${DIFFICULTY_COLOR[r.difficulty]}`}>{r.difficulty}</Badge>
                </div>
                <div className="flex gap-1.5">
                  {r.url && (
                    <a href={r.url} target="_blank" rel="noopener noreferrer" className="flex-1">
                      <Button variant="outline" size="sm" className="w-full h-7 text-[10px]">
                        <ExternalLink className="w-3 h-3 mr-1" /> Open
                      </Button>
                    </a>
                  )}
                  {onAddToGoal && (
                    <Button size="sm" variant="ghost" onClick={() => onAddToGoal(r)} className="h-7 text-[10px] px-2">
                      <Target className="w-3 h-3 mr-1" /> Use
                    </Button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Save, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const PROMPTS = [
  { key: 'surprised_by' as const, label: 'What surprised you?', hint: 'Anything in the feedback you didn\'t expect?' },
  { key: 'agreed_with' as const, label: 'What rang true?', hint: 'Themes you recognise in yourself.' },
  { key: 'disagreed_with' as const, label: 'What felt off?', hint: 'Feedback you don\'t fully agree with — and why.' },
  { key: 'one_change' as const, label: 'One thing you\'ll change', hint: 'A single, specific shift you\'re committing to.' },
];

export default function SelfDebrief({ userId }: { userId: string }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  useEffect(() => {
    supabase.from('feedback_reflections').select('*').eq('user_id', userId).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setValues({
            surprised_by: data.surprised_by || '',
            agreed_with: data.agreed_with || '',
            disagreed_with: data.disagreed_with || '',
            one_change: data.one_change || '',
          });
          setSavedAt(new Date(data.updated_at));
        }
        setLoading(false);
      });
  }, [userId]);

  const save = async () => {
    setSaving(true);
    const payload = { user_id: userId, ...values };
    const { data: existing } = await supabase.from('feedback_reflections').select('id').eq('user_id', userId).maybeSingle();
    const { error } = existing
      ? await supabase.from('feedback_reflections').update(payload).eq('id', existing.id)
      : await supabase.from('feedback_reflections').insert(payload);
    setSaving(false);
    if (error) { toast.error('Could not save reflection'); return; }
    setSavedAt(new Date());
    toast.success('Reflection saved — only you can see this.');
  };

  if (loading) return <div className="glass-panel p-6 flex justify-center"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6">
      <div className="flex items-start justify-between mb-1">
        <div>
          <h2 className="text-sm font-semibold flex items-center gap-2"><BookOpen className="w-4 h-4 text-primary" /> Self-Debrief</h2>
          <p className="text-[10px] text-muted-foreground mt-0.5">Private journal — only visible to you. Research shows reviewers who reflect first act on feedback 3× more often.</p>
        </div>
        {savedAt && <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Check className="w-3 h-3 text-emerald-500" /> Saved {savedAt.toLocaleDateString()}</span>}
      </div>
      <div className="space-y-3 mt-4">
        {PROMPTS.map(p => (
          <div key={p.key}>
            <label className="text-xs font-medium text-foreground">{p.label}</label>
            <p className="text-[10px] text-muted-foreground mb-1.5">{p.hint}</p>
            <Textarea
              value={values[p.key] || ''}
              onChange={(e) => setValues(v => ({ ...v, [p.key]: e.target.value.slice(0, 1000) }))}
              placeholder="Type freely…"
              className="min-h-[60px] text-xs resize-none"
            />
          </div>
        ))}
      </div>
      <Button onClick={save} disabled={saving} size="sm" className="mt-4 w-full">
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : <Save className="w-3.5 h-3.5 mr-2" />}
        Save reflection
      </Button>
    </motion.div>
  );
}

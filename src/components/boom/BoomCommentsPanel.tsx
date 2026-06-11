import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

type Row = {
  reviewee_id: string;
  reviewee_name: string;
  reviewee_role: string | null;
  reviewee_department: string | null;
  comment_id: string | null;
  status: string;
};

interface BoomCommentsPanelProps {
  reviewerEmployeeId: string | null;
  periodQuarter: string;
  givesComments: boolean;
  receivesComments: boolean;
}

export default function BoomCommentsPanel({
  reviewerEmployeeId,
  periodQuarter,
  givesComments,
  receivesComments,
}: BoomCommentsPanelProps) {
  const [loading, setLoading] = useState(false);
  const [toGive, setToGive] = useState<Row[]>([]);
  const [received, setReceived] = useState<{ comment_text: string }[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const loadGive = useCallback(async () => {
    if (!reviewerEmployeeId || !givesComments) {
      setToGive([]);
      return;
    }
    const { data, error } = await supabase.rpc('get_boom_comment_assignments', {
      _period: periodQuarter,
    });
    if (error) {
      toast.error(error.message);
      setToGive([]);
      return;
    }
    setToGive((data ?? []) as Row[]);
  }, [reviewerEmployeeId, periodQuarter, givesComments]);

  const loadReceived = useCallback(async () => {
    if (!reviewerEmployeeId || !receivesComments) {
      setReceived([]);
      return;
    }
    const { data, error } = await supabase
      .from('assessment_peer_comments')
      .select('comment_text')
      .eq('reviewee_employee_id', reviewerEmployeeId)
      .eq('status', 'submitted')
      .eq('period', periodQuarter);
    if (!error) setReceived(data ?? []);
  }, [reviewerEmployeeId, periodQuarter, receivesComments]);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadGive(), loadReceived()]).finally(() => setLoading(false));
  }, [loadGive, loadReceived]);

  const saveComment = async (row: Row, submit: boolean) => {
    if (!reviewerEmployeeId) return;
    const text = (drafts[row.reviewee_id] ?? '').trim();
    if (submit && text.length < 20) {
      toast.error('Please write at least 20 characters before submitting.');
      return;
    }
    setSaving(row.reviewee_id);
    try {
      const payload = {
        reviewer_employee_id: reviewerEmployeeId,
        reviewee_employee_id: row.reviewee_id,
        period: periodQuarter,
        comment_text: text,
        status: submit ? 'submitted' : 'draft',
        submitted_at: submit ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from('assessment_peer_comments').upsert(payload, {
        onConflict: 'reviewer_employee_id,reviewee_employee_id,period',
      });
      if (error) throw error;
      toast.success(submit ? 'Comment submitted' : 'Draft saved');
      await loadGive();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Could not save comment');
    } finally {
      setSaving(null);
    }
  };

  if (!reviewerEmployeeId) return null;

  if (!givesComments && !receivesComments) {
    return (
      <p className="text-sm text-muted-foreground">
        Comments are not part of your role on the org chart (no orange/blue marker).
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {givesComments && (
        <div className="glass-panel p-5 space-y-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            <h4 className="text-sm font-semibold">Comments to give</h4>
            <Badge variant="outline" className="text-[10px]">Downward · anonymous to recipient</Badge>
          </div>
          {loading ? (
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin" /> Loading…
            </p>
          ) : toGive.length === 0 ? (
            <p className="text-xs text-muted-foreground">No comment obligations for this period.</p>
          ) : (
            <ul className="space-y-4">
              {toGive.map((row) => (
                <li key={row.reviewee_id} className="rounded-xl border border-border/60 p-4 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-sm">{row.reviewee_name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {row.reviewee_role ?? '—'} · {row.reviewee_department ?? '—'}
                      </p>
                    </div>
                    <Badge variant={row.status === 'submitted' ? 'default' : 'outline'} className="text-[10px]">
                      {row.status === 'submitted' ? 'Submitted' : row.status === 'draft' ? 'Draft' : 'To do'}
                    </Badge>
                  </div>
                  <Textarea
                    placeholder="Constructive comments for this person (not scored — separate from 360)…"
                    value={drafts[row.reviewee_id] ?? ''}
                    onChange={(e) => setDrafts((d) => ({ ...d, [row.reviewee_id]: e.target.value }))}
                    rows={3}
                    className="text-sm"
                  />
                  <div className="flex gap-2 justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={saving === row.reviewee_id}
                      onClick={() => void saveComment(row, false)}
                    >
                      Save draft
                    </Button>
                    <Button
                      size="sm"
                      disabled={saving === row.reviewee_id}
                      onClick={() => void saveComment(row, true)}
                    >
                      Submit
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {receivesComments && (
        <div className="glass-panel p-5 space-y-3">
          <h4 className="text-sm font-semibold">Comments you received</h4>
          <p className="text-[11px] text-muted-foreground">
            Narrative feedback from leaders above you. Reviewer names are not shown.
          </p>
          {received.length === 0 ? (
            <p className="text-xs text-muted-foreground">None submitted yet for {periodQuarter}.</p>
          ) : (
            <ul className="space-y-3">
              {received.map((c, i) => (
                <li key={i} className="rounded-lg bg-muted/40 p-3 text-sm italic text-foreground/90">
                  {c.comment_text}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

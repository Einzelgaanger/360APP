import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

type NotificationRow = {
  id: string;
  event_type: string;
  form_code: string;
  period: string;
  title: string;
  body: string;
  href: string;
  read_at: string | null;
  created_at: string;
  is_unread: boolean;
};

function formatWhen(iso: string): string {
  try {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    if (diff < 60_000) return 'Just now';
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

export default function BoomNotificationsBell({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<NotificationRow[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [listRes, countRes] = await Promise.all([
        supabase.rpc('get_my_boom_notifications', { _limit: 30 }),
        supabase.rpc('get_my_boom_notification_unread_count'),
      ]);
      if (!listRes.error && Array.isArray(listRes.data)) {
        setRows(listRes.data as NotificationRow[]);
      }
      if (!countRes.error && typeof countRes.data === 'number') {
        setUnread(countRes.data);
      } else if (!countRes.error && countRes.data != null) {
        setUnread(Number(countRes.data) || 0);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const t = window.setInterval(() => void refresh(), 60_000);
    return () => window.clearInterval(t);
  }, [refresh]);

  useEffect(() => {
    if (open) void refresh();
  }, [open, refresh]);

  const markRead = async (id: string) => {
    await supabase.rpc('mark_boom_notification_read', { _notification_id: id });
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, read_at: r.read_at ?? new Date().toISOString(), is_unread: false } : r)),
    );
    setUnread((n) => Math.max(0, n - 1));
  };

  const markAll = async () => {
    await supabase.rpc('mark_all_boom_notifications_read');
    setRows((prev) =>
      prev.map((r) => ({ ...r, read_at: r.read_at ?? new Date().toISOString(), is_unread: false })),
    );
    setUnread(0);
  };

  const openItem = async (row: NotificationRow) => {
    if (row.is_unread) await markRead(row.id);
    setOpen(false);
    const path = row.href?.startsWith('http')
      ? row.href.replace(/^https?:\/\/[^/]+/, '')
      : row.href || '/hub?tab=survey';
    navigate(path);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size={compact ? 'icon' : 'sm'}
          className={cn(
            'relative',
            compact ? 'h-9 w-9' : 'w-full justify-start gap-2 font-mono text-[11px] uppercase tracking-[0.16em]',
            className,
          )}
          aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
        >
          <Bell className="h-4 w-4 shrink-0" />
          {!compact && <span>Notifications</span>}
          {unread > 0 && (
            <span
              className={cn(
                'absolute flex items-center justify-center rounded-full bg-primary text-[9px] font-semibold text-primary-foreground',
                compact ? 'right-1 top-1 h-4 min-w-4 px-0.5' : 'right-2 top-1/2 h-4 min-w-4 -translate-y-1/2 px-1',
              )}
            >
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(100vw-2rem,360px)] p-0" sideOffset={8}>
        <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
          <p className="text-sm font-semibold">Notifications</p>
          {unread > 0 && (
            <button
              type="button"
              onClick={() => void markAll()}
              className="text-[11px] text-muted-foreground hover:text-foreground"
            >
              Mark all read
            </button>
          )}
        </div>
        <div className="max-h-[min(60vh,420px)] overflow-y-auto scrollbar-thin">
          {loading && rows.length === 0 ? (
            <p className="px-3 py-8 text-center text-xs text-muted-foreground">Loading…</p>
          ) : rows.length === 0 ? (
            <p className="px-3 py-8 text-center text-xs text-muted-foreground">
              No notifications yet. You’ll be alerted when a review about you is submitted.
            </p>
          ) : (
            <ul>
              {rows.map((row) => (
                <li key={row.id} className="border-b border-border/60 last:border-0">
                  <button
                    type="button"
                    onClick={() => void openItem(row)}
                    className={cn(
                      'w-full px-3 py-3 text-left transition-colors hover:bg-muted/40',
                      row.is_unread && 'bg-primary/5',
                    )}
                  >
                    <div className="flex items-start gap-2">
                      {row.is_unread ? (
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      ) : (
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-foreground leading-snug">{row.title}</p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                          {row.body}
                        </p>
                        <p className="mt-1 font-mono text-[9px] uppercase tracking-wider text-muted-foreground/80">
                          {row.period} · {formatWhen(row.created_at)}
                        </p>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

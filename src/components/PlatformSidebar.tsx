import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import vggLogo from '@/assets/vgg-logo.webp';

type SidebarItem = {
  key: string;
  label: string;
  icon?: React.ReactNode;
  to?: string;
  onClick?: () => void;
  active?: boolean;
};

type SidebarMetaItem = {
  label: string;
  value?: string | null;
};

interface PlatformSidebarProps {
  title?: string;
  subtitle?: string;
  meta?: SidebarMetaItem[];
  items: SidebarItem[];
  onLogout?: () => void;
  actions?: React.ReactNode;
  /**
   * When true, no mobile top bar is rendered (parent supplies mobile chrome, e.g. bottom tabs).
   * Desktop sidebar is unchanged.
   */
  suppressMobileHeader?: boolean;
}

export default function PlatformSidebar({
  title = '360° Appraisal',
  subtitle,
  meta,
  items,
  onLogout,
  actions,
  suppressMobileHeader = false,
}: PlatformSidebarProps) {
  const visibleMeta = (meta ?? []).filter((entry) => Boolean(entry.value));

  return (
    <>
      <aside className="hidden lg:flex fixed left-0 top-0 z-30 h-screen w-72 flex-col border-r border-border bg-background">
        <div className="px-6 pt-6 pb-5 border-b border-border">
          <img src={vggLogo} alt="Venture Garden Group" className="h-8 w-auto" />
          <div className="mt-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              ◉ Workspace
            </p>
            <h2 className="font-display mt-1.5 text-base font-medium text-foreground">{title}</h2>
            {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          {visibleMeta.length > 0 && (
            <div className="mt-4 space-y-2 border-t border-border pt-4">
              {visibleMeta.map((entry) => (
                <div key={entry.label} className="flex items-start justify-between gap-2 text-[11px] leading-tight">
                  <span className="font-mono uppercase tracking-[0.16em] text-muted-foreground">{entry.label}</span>
                  <span className="font-medium text-foreground text-right">{entry.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto" aria-label="Sidebar Navigation">
          {items.map((item) => {
            const className = `relative w-full justify-start gap-2.5 rounded-sm font-mono text-[11px] uppercase tracking-[0.16em] ${
              item.active
                ? 'bg-foreground text-background hover:bg-foreground hover:text-background'
                : 'text-muted-foreground hover:text-foreground hover:bg-paper-deep/60'
            }`;
            const activeBar = item.active ? <span className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 bg-primary" /> : null;

            if (item.to) {
              return (
                <Button key={item.key} variant="ghost" size="sm" asChild className={className}>
                  <Link to={item.to}>
                    {activeBar}
                    {item.icon}
                    {item.label}
                  </Link>
                </Button>
              );
            }

            return (
              <Button
                key={item.key}
                variant="ghost"
                size="sm"
                className={className}
                onClick={item.onClick}
              >
                {activeBar}
                {item.icon}
                {item.label}
              </Button>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-border space-y-2">
          {actions}
          {onLogout && (
            <Button variant="outline" size="sm" onClick={onLogout} className="w-full gap-2">
              <LogOut className="w-4 h-4" /> Sign Out
            </Button>
          )}
        </div>
      </aside>

      {!suppressMobileHeader && (
        <header
          className="lg:hidden sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          <div className="flex h-14 items-center gap-3 px-4">
            <img src={vggLogo} alt="Venture Garden Group" className="h-6 w-auto flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-sm font-medium text-foreground">{title}</p>
              {subtitle && (
                <p className="truncate text-[11px] text-muted-foreground">{subtitle}</p>
              )}
            </div>
          </div>
        </header>
      )}
    </>
  );
}

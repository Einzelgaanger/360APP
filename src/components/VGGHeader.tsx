import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, Menu, X } from 'lucide-react';
import vggLogo from '@/assets/vgg-logo.webp';

interface HeaderNavItem {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface VGGHeaderProps {
  subtitle?: string;
  userName?: string;
  onLogout?: () => void;
  actions?: React.ReactNode;
  maxWidth?: string;
  navItems?: HeaderNavItem[];
  activeNav?: string;
  onNavChange?: (value: string) => void;
}

export default function VGGHeader({
  subtitle,
  userName,
  onLogout,
  actions,
  maxWidth = 'max-w-6xl',
  navItems,
  activeNav,
  onNavChange,
}: VGGHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const hasNav = Boolean(navItems?.length);

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-card/78 backdrop-blur-xl shadow-sm shadow-black/[0.03]">
      <div className={`${maxWidth} mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-3.5 flex items-center justify-between gap-4`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="rounded-xl border border-border/60 bg-background/70 p-1.5">
            <img src={vggLogo} alt="Venture Garden Group" className="h-6 sm:h-7 w-auto flex-shrink-0" />
          </div>
          <div className="hidden sm:block h-6 w-px bg-border flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground leading-none">
              VGG 360 Platform
            </p>
            <p className="text-sm font-semibold text-foreground leading-none mt-1 truncate">
              360° Appraisal
            </p>
            {(subtitle || userName) && (
              <p className="text-[11px] text-muted-foreground leading-none mt-1 truncate">
                {subtitle || userName}
              </p>
            )}
          </div>
        </div>

        {hasNav && (
          <nav className="hidden lg:flex items-center gap-1 rounded-2xl border border-border/70 bg-background/80 p-1.5 shadow-sm" aria-label="Primary">
            {navItems!.map((item) => {
              const isActive = activeNav === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => onNavChange?.(item.value)}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-primary/12 text-primary ring-1 ring-primary/20'
                      : 'text-muted-foreground hover:bg-muted/65 hover:text-foreground'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {item.icon}
                  {item.label}
                </button>
              );
            })}
          </nav>
        )}

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-2.5">
          {actions}
          {onLogout && (
            <Button variant="ghost" size="icon" onClick={onLogout} className="h-9 w-9 rounded-xl border border-transparent text-muted-foreground hover:border-border/70 hover:bg-background/70 hover:text-foreground">
              <LogOut className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Mobile hamburger */}
        <div className="flex md:hidden items-center gap-1.5">
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="h-9 w-9 rounded-xl border border-border/60 bg-background/70">
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border/40 bg-card/95 backdrop-blur-xl px-4 py-3 space-y-2">
          {hasNav && (
            <nav className="grid grid-cols-1 gap-2">
              {navItems!.map((item) => {
                const isActive = activeNav === item.value;
                return (
                  <Button
                    key={item.value}
                    variant={isActive ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      onNavChange?.(item.value);
                      setMobileMenuOpen(false);
                    }}
                    className="justify-start gap-2"
                  >
                    {item.icon}
                    {item.label}
                  </Button>
                );
              })}
            </nav>
          )}
          <div className="flex flex-wrap gap-2">
            {actions}
          </div>
          {onLogout && (
            <Button variant="outline" size="sm" onClick={onLogout} className="w-full gap-2 mt-2">
              <LogOut className="w-4 h-4" /> Sign Out
            </Button>
          )}
        </div>
      )}
    </header>
  );
}

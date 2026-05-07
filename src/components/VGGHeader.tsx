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
    <header className="sticky top-0 z-30 border-b border-border bg-background">
      <div className={`${maxWidth} mx-auto px-4 sm:px-8 py-3 sm:py-4 flex items-center justify-between gap-4`}>
        <div className="flex items-center gap-3 min-w-0">
          <img src={vggLogo} alt="Venture Garden Group" className="h-7 w-auto flex-shrink-0" />
          <div className="hidden sm:block h-5 w-px bg-border flex-shrink-0" />
          <div className="min-w-0 hidden sm:block">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground leading-none">
              ◉ VGG / 360°
            </p>
            <p className="font-display text-sm font-medium text-foreground leading-none mt-1.5 truncate">
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
          <nav className="hidden lg:flex items-center gap-0 border border-border bg-paper-deep/30 p-1 rounded-sm" aria-label="Primary">
            {navItems!.map((item) => {
              const isActive = activeNav === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => onNavChange?.(item.value)}
                  className={`font-mono inline-flex items-center gap-1.5 rounded-sm px-3.5 py-2 text-[11px] uppercase tracking-[0.18em] transition-all ${
                    isActive
                      ? 'bg-foreground text-background'
                      : 'text-muted-foreground hover:text-foreground'
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
        <div className="hidden md:flex items-center gap-2">
          {actions}
          {onLogout && (
            <Button variant="ghost" size="icon" onClick={onLogout} className="h-9 w-9">
              <LogOut className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Mobile hamburger */}
        <div className="flex md:hidden items-center gap-1.5">
          <Button variant="outline" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="h-9 w-9">
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-card px-4 py-3 space-y-2">
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

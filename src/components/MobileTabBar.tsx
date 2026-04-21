import { ClipboardList, BarChart3, Sparkles, Trophy, User } from 'lucide-react';

export type MobileTab = 'survey' | 'dashboard' | 'growth' | 'rankings' | 'profile';

interface MobileTabBarProps {
  active: MobileTab;
  onChange: (tab: MobileTab) => void;
}

const TABS: { key: MobileTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'survey',    label: 'Survey',    icon: ClipboardList },
  { key: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { key: 'growth',    label: 'Growth',    icon: Sparkles },
  { key: 'rankings',  label: 'Rankings',  icon: Trophy },
  { key: 'profile',   label: 'Profile',   icon: User },
];

/**
 * WhatsApp-style fixed bottom tab bar — mobile only (hidden on lg+).
 * Editorial: hairline top border, paper background, ink text, green active state.
 */
export default function MobileTabBar({ active, onChange }: MobileTabBarProps) {
  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 inset-x-0 z-40 lg:hidden border-t border-border bg-background/95 backdrop-blur-md"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="grid grid-cols-5">
        {TABS.map(({ key, label, icon: Icon }) => {
          const isActive = active === key;
          return (
            <li key={key}>
              <button
                type="button"
                onClick={() => onChange(key)}
                aria-current={isActive ? 'page' : undefined}
                className={`relative w-full flex flex-col items-center justify-center gap-1 py-2.5 transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground active:text-foreground'
                }`}
              >
                {isActive && (
                  <span
                    aria-hidden
                    className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-8 bg-primary"
                  />
                )}
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.25]' : ''}`} />
                <span
                  className="text-[10px] font-medium tracking-wide"
                  style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
                >
                  {label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

import { Link, useNavigate } from 'react-router-dom';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import vggLogo from '@/assets/vgg-logo.webp';

interface VGGHeaderProps {
  subtitle?: string;
  userName?: string;
  onLogout?: () => void;
  actions?: React.ReactNode;
  maxWidth?: string;
}

export default function VGGHeader({ subtitle, userName, onLogout, actions, maxWidth = 'max-w-5xl' }: VGGHeaderProps) {
  return (
    <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-20">
      <div className={`${maxWidth} mx-auto px-4 sm:px-6 h-16 flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <img src={vggLogo} alt="Venture Garden Group" className="h-7 w-auto" />
          <div className="hidden sm:block border-l border-border pl-3">
            <p className="text-xs font-semibold text-foreground tracking-tight leading-none">
              360° Appraisal
            </p>
            {(subtitle || userName) && (
              <p className="text-[11px] text-muted-foreground leading-none mt-1">
                {subtitle || userName}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {actions}
          <ThemeToggle />
          {onLogout && (
            <Button variant="ghost" size="icon" onClick={onLogout} className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <LogOut className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

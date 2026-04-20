import type { ReactNode } from 'react';
import heroLogin from '@/assets/hero-login.jpg';
import heroHub from '@/assets/hero-hub.jpg';

type AuthHeroPanelProps = {
  eyebrow?: string;
  title: string;
  description: string;
  variant?: 'login' | 'hub';
  children?: ReactNode;
};

/**
 * Editorial split-screen left panel: bold graphic art + magazine-grade typography.
 * Sharp edges, cream paper, hairline rules. Strictly no gradients on type areas.
 */
export function AuthHeroPanel({
  eyebrow = 'VGG / 360°',
  title,
  description,
  variant = 'login',
  children,
}: AuthHeroPanelProps) {
  const art = variant === 'hub' ? heroHub : heroLogin;

  return (
    <aside className="relative hidden min-h-0 w-[48%] flex-col overflow-hidden border-r border-foreground/15 bg-background lg:flex">
      {/* Top metadata bar — like a magazine masthead */}
      <div className="relative z-10 flex items-center justify-between border-b border-foreground/15 px-8 py-4">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground/70">
          {eyebrow}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/50">
          Vol. 01 · Issue 03
        </span>
      </div>

      {/* Bold graphic art — full bleed, flat */}
      <div className="relative z-0 flex-1 overflow-hidden">
        <img
          src={art}
          alt="Editorial graphic composition"
          width={1536}
          height={1536}
          decoding="async"
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>

      {/* Caption block — magazine cover treatment */}
      <div className="relative z-10 border-t border-foreground/15 bg-background px-8 py-8 xl:px-12">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/50">
            № 360
          </span>
          <div className="h-px flex-1 bg-foreground/20" />
        </div>
        <h2 className="mt-3 font-serif text-3xl font-bold leading-[0.95] tracking-[-0.02em] text-foreground xl:text-[2.5rem]">
          {title}
        </h2>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-foreground/70">{description}</p>
        {children}
      </div>
    </aside>
  );
}

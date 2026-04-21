import type { ReactNode } from 'react';
import riverDelta from '@/assets/auth-river-delta.jpg';
import heroGlobe from '@/assets/hero-globe.jpg';

type AuthHeroPanelProps = {
  eyebrow?: string;
  title: string;
  description: string;
  variant?: 'login' | 'hub';
  children?: ReactNode;
};

/**
 * Editorial split-screen left panel: photo + magazine masthead + caption.
 * Hairline rules, cream paper, ink frame around image. STRICT FLAT.
 */
export function AuthHeroPanel({
  eyebrow = 'VGG / 360°',
  title,
  description,
  variant = 'login',
  children,
}: AuthHeroPanelProps) {
  const art = variant === 'hub' ? riverDelta : heroGlobe;
  const caption = variant === 'hub' ? 'Fig. 02 — River delta, dawn' : 'Fig. 01 — Atlas of what\'s possible';

  return (
    <aside className="relative hidden min-h-0 w-[48%] flex-col bg-paper-deep/40 lg:flex">
      {/* Top metadata bar */}
      <div className="flex items-center justify-between border-b border-border px-8 py-4">
        <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-muted-foreground">
          ◉ {eyebrow}
        </span>
        <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-muted-foreground">
          Vol. 01 · Issue 03
        </span>
      </div>

      {/* Editorial photo */}
      <div className="relative flex-1 p-8 xl:p-12">
        <div className="ink-frame relative h-full w-full overflow-hidden">
          <img
            src={art}
            alt={caption}
            decoding="async"
            fetchPriority="high"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
      </div>

      {/* Caption block */}
      <div className="border-t border-border bg-card px-8 py-8 xl:px-12">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-muted-foreground">
            № 360
          </span>
          <div className="h-px flex-1 bg-border" />
          <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-muted-foreground">
            {caption}
          </span>
        </div>
        <h2 className="font-display mt-4 text-3xl font-medium leading-[0.98] tracking-[-0.03em] text-foreground xl:text-[2.5rem]">
          {title}
        </h2>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">{description}</p>
        {children}
      </div>
    </aside>
  );
}

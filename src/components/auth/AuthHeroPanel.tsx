import type { ReactNode } from 'react';

const HERO_SRC = '/auth-hero.jpg';

type AuthHeroPanelProps = {
  eyebrow?: string;
  title: string;
  description: string;
  children?: ReactNode;
};

/**
 * Left column for split auth layouts: full-bleed photo with brand overlay.
 */
export function AuthHeroPanel({ eyebrow = 'VGG 360°', title, description, children }: AuthHeroPanelProps) {
  return (
    <div className="relative hidden min-h-0 w-[45%] flex-col justify-center overflow-hidden lg:flex">
      <img
        src={HERO_SRC}
        alt="Modern professional workspace"
        width={1600}
        height={1067}
        decoding="async"
        fetchPriority="high"
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
      {/* Readability: brand tint + subtle vignette */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-primary/[0.92] via-primary/[0.78] to-[hsl(210_45%_28%)]/85"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(255,255,255,0.12),transparent_55%)]"
        aria-hidden
      />
      <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.35),transparent_45%)]" aria-hidden />

      <div className="relative z-10 flex flex-col justify-center px-10 py-14 text-white xl:px-14">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/75">{eyebrow}</p>
        <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight xl:text-[1.75rem]">{title}</h2>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-white/88">{description}</p>
        {children}
      </div>
    </div>
  );
}

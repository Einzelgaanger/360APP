import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronLeft, ArrowRight, ArrowUpRight, Search } from 'lucide-react';
import vggLogo from '@/assets/vgg-logo.webp';
import heroOnboarding from '@/assets/hero-onboarding.jpg';
import heroHub from '@/assets/hero-hub.jpg';
import heroAdmin from '@/assets/hero-admin.jpg';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const SLIDE = { duration: 0.55, ease: EASE };

const SLIDES = [
  {
    label: 'Manifesto',
    no: '01',
    eyebrow: 'A Field Manual',
    headline: 'Performance, written in plain ink.',
    body:
      'A 360° appraisal platform built for honesty, anonymity and craft. Less ceremony, more signal. This is how Venture Garden Group measures growth.',
    art: heroOnboarding,
  },
  {
    label: 'How it works',
    no: '02',
    eyebrow: 'The Method',
    headline: 'Three movements. One review cycle.',
    body:
      'Find your profile, review your colleagues across the leadership canon, then read the chorus back as a personal dashboard. No scoreboards. No spectacle.',
    art: heroHub,
  },
  {
    label: 'Get started',
    no: '03',
    eyebrow: 'Begin',
    headline: 'Your voice, on the record. Anonymously.',
    body:
      'Sign in with your VGG credentials. Every response is encrypted and detached from your identity before analytics ever sees it.',
    art: heroAdmin,
  },
] as const;

export default function Onboarding() {
  const [slide, setSlide] = useState(0);
  const navigate = useNavigate();

  const next = useCallback(() => setSlide((s) => Math.min(s + 1, SLIDES.length - 1)), []);
  const prev = useCallback(() => setSlide((s) => Math.max(s - 1, 0)), []);
  const current = SLIDES[slide];
  const isLast = slide === SLIDES.length - 1;

  return (
    <div className="app-page flex min-h-screen flex-col">
      {/* Masthead */}
      <header className="relative z-10 flex items-center justify-between border-b border-foreground/15 px-6 py-4 sm:px-10">
        <div className="flex items-center gap-4">
          <img src={vggLogo} alt="Venture Garden Group" className="h-7 w-auto" />
          <span className="hidden h-5 w-px bg-foreground/25 sm:block" />
          <span className="hidden font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground/70 sm:block">
            360° / Performance Edition
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/50 sm:block">
            Est. 2024 · Lagos
          </span>
          <Button variant="outline" size="sm" onClick={() => navigate('/login')}>
            Sign In
          </Button>
        </div>
      </header>

      {/* Issue meta strip */}
      <div className="relative z-10 flex items-stretch border-b border-foreground/15 bg-background">
        {SLIDES.map((s, i) => {
          const active = i === slide;
          return (
            <button
              key={s.label}
              type="button"
              onClick={() => setSlide(i)}
              className={`group flex flex-1 items-baseline gap-3 border-r border-foreground/15 px-6 py-3 text-left transition-colors last:border-r-0 ${
                active ? 'bg-foreground text-background' : 'hover:bg-foreground/5'
              }`}
              aria-current={active ? 'step' : undefined}
            >
              <span className={`font-mono text-[11px] font-bold ${active ? 'text-background' : 'text-foreground/50'}`}>
                {s.no}
              </span>
              <span
                className={`font-mono text-[10px] font-semibold uppercase tracking-[0.2em] ${
                  active ? 'text-background' : 'text-foreground/70'
                }`}
              >
                {s.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Editorial spread */}
      <main className="relative z-10 flex flex-1 flex-col overflow-hidden lg:flex-row">
        {/* Left: art */}
        <div className="relative order-2 min-h-[280px] flex-1 overflow-hidden border-foreground/15 lg:order-1 lg:border-r">
          <AnimatePresence mode="wait">
            <motion.img
              key={current.art}
              src={current.art}
              alt="Editorial graphic for current onboarding step"
              width={1536}
              height={1536}
              decoding="async"
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={SLIDE}
              className="absolute inset-0 h-full w-full object-cover"
            />
          </AnimatePresence>
        </div>

        {/* Right: copy */}
        <div className="relative order-1 flex flex-1 flex-col justify-between px-6 py-10 sm:px-12 lg:order-2 lg:py-16">
          <AnimatePresence mode="wait">
            <motion.div
              key={slide}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={SLIDE}
              className="max-w-xl"
            >
              <div className="mb-8 flex items-center gap-3">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground/70">
                  {current.eyebrow}
                </span>
                <div className="h-px flex-1 bg-foreground/25" />
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/50">
                  № {current.no}
                </span>
              </div>

              <h1 className="font-serif text-[clamp(2.25rem,5vw,4.25rem)] font-bold leading-[0.95] tracking-[-0.025em] text-foreground text-balance">
                {current.headline}
              </h1>

              <p className="mt-6 max-w-md text-base leading-relaxed text-foreground/70">{current.body}</p>

              {isLast && (
                <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                  <Button size="lg" onClick={() => navigate('/login')} className="gap-2">
                    Sign In <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => navigate('/find-account')} className="gap-2">
                    <Search className="h-4 w-4" /> Find My Account
                  </Button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Footer controls */}
          <div className="mt-12 flex items-center justify-between border-t border-foreground/15 pt-6">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/60">
              <span>{String(slide + 1).padStart(2, '0')}</span>
              <span>/</span>
              <span>{String(SLIDES.length).padStart(2, '0')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={prev}
                disabled={slide === 0}
                aria-label="Previous"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {isLast ? (
                <Button size="default" onClick={() => navigate('/login')} className="gap-2">
                  Enter <ArrowUpRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button variant="default" size="icon" onClick={next} aria-label="Next">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

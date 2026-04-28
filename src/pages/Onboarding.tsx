import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronLeft, ArrowRight, Search } from 'lucide-react';
import vggLogo from '@/assets/vgg-logo.webp';
import heroFeedbackSession from '@/assets/hero-feedback-session.jpg';
import heroReflectionData from '@/assets/hero-reflection-data.jpg';
import heroTeam from '@/assets/hero-team-mobile.jpg';

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
const SLIDE = { duration: 0.5, ease: EASE };

type SlideDef = {
  no: string;
  label: string;
  kicker: string;
  headlineHTML: string;
  body: string;
  image: string;
  caption: string;
};

const SLIDES: SlideDef[] = [
  {
    no: '01',
    label: 'Overview',
    kicker: 'Why this system exists',
    headlineHTML: 'Performance, written in <em>plain ink.</em>',
    body:
      'A 360° appraisal platform built for honesty, anonymity and craft. Less ceremony, more signal. This is how Venture Garden Group measures growth.',
    image: heroFeedbackSession,
    caption: 'Fig. 01 — Feedback with data',
  },
  {
    no: '02',
    label: 'Process',
    kicker: 'Simple 3-step process',
    headlineHTML: 'Find. Review. <em>Read the chorus back.</em>',
    body:
      'Find your profile, review your colleagues across the leadership canon, then read the chorus back as a personal dashboard. No scoreboards. No spectacle.',
    image: heroTeam,
    caption: 'Fig. 02 — A team in the room',
  },
  {
    no: '03',
    label: 'Access',
    kicker: 'Sign in and continue',
    headlineHTML: 'Your voice, on the record. <em>Anonymously.</em>',
    body:
      'Sign in with your VGG credentials. Every response is encrypted and detached from your identity before analytics ever sees it.',
    image: heroReflectionData,
    caption: 'Fig. 03 — Reflection with analytics',
  },
];

export default function Onboarding() {
  const [slide, setSlide] = useState(0);
  const navigate = useNavigate();

  const next = useCallback(() => setSlide((s) => Math.min(s + 1, SLIDES.length - 1)), []);
  const prev = useCallback(() => setSlide((s) => Math.max(s - 1, 0)), []);
  const current = SLIDES[slide];
  const isLast = slide === SLIDES.length - 1;
  const progress = ((slide + 1) / SLIDES.length) * 100;

  return (
    <div className="mobile-flow-shell app-page flex min-h-dvh-screen flex-col">
      {/* Editorial masthead */}
      <header
        className="mobile-top-safe flex items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-10 sm:py-4"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <img src={vggLogo} alt="VGG" className="h-6 w-auto sm:h-7" />
          <div className="hidden h-5 w-px bg-border sm:block" />
          <span className="font-mono hidden sm:inline text-[10.5px] uppercase tracking-[0.22em] text-muted-foreground">
            VGG / 360° / Performance Edition
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="font-mono hidden lg:inline text-[10.5px] uppercase tracking-[0.22em] text-muted-foreground">
            Vol. 01 · Issue 03
          </span>
          <Button variant="green" size="sm" className="h-8 px-3 text-xs" onClick={() => navigate('/login')}>
            Sign In
          </Button>
        </div>
      </header>

      {/* Step strip */}
      <div className="grid grid-cols-3 border-b border-border bg-card/45">
        {SLIDES.map((s, i) => {
          const active = i === slide;
          return (
            <button
              key={s.label}
              type="button"
              onClick={() => setSlide(i)}
              className={`group flex min-h-[56px] items-center gap-2 border-r border-border px-3 py-3 text-left transition-colors last:border-r-0 sm:min-h-[64px] sm:px-4 sm:py-3.5 ${
                active ? 'bg-secondary/70' : 'bg-card hover:bg-secondary/35'
              }`}
              aria-current={active ? 'step' : undefined}
            >
              <span
                className={`numeral text-sm sm:text-base ${
                  active ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {s.no}
              </span>
              <div className="min-w-0">
                <div className="hidden text-[10px] font-semibold text-muted-foreground sm:block">
                  Step {i + 1} / {SLIDES.length}
                </div>
                <div className="truncate text-[12px] font-semibold text-foreground sm:mt-0.5 sm:text-[13px]">
                  {s.label}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="h-1 w-full bg-border/60">
        <motion.div
          className="h-full bg-primary"
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.35, ease: EASE }}
        />
      </div>

      {/* Mobile: full-bleed slide imagery (desktop uses left column) */}
      <div className="relative border-b border-border bg-paper-deep/30 lg:hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.image}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={SLIDE}
            className="relative aspect-[16/10] max-h-[42vh] w-full overflow-hidden"
          >
            <img
              src={current.image}
              alt={current.caption}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 bg-background/80 px-4 py-3">
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                {current.caption}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Spread */}
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
        {/* Left: editorial photo with caption */}
        <div className="relative order-2 hidden flex-1 flex-col bg-paper-deep/40 lg:order-1 lg:flex">
          <div className="flex items-center justify-between border-b border-border px-8 py-4">
            <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-muted-foreground">
              Index {String(slide + 1).padStart(3, '0')} / 2026
            </span>
            <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-muted-foreground">
              {current.kicker}
            </span>
          </div>

          <div className="relative flex-1 p-8 xl:p-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={current.image}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={SLIDE}
                className="ink-frame relative h-full w-full overflow-hidden"
              >
                <img
                  src={current.image}
                  alt={current.caption}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-between border-t border-border px-8 py-4">
            <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-muted-foreground">
              {current.caption}
            </span>
            <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-muted-foreground">
              № {current.no}
            </span>
          </div>
        </div>

        {/* Right: copy */}
        <div className="relative order-1 flex min-h-0 flex-1 flex-col justify-between overflow-y-auto px-5 py-4 sm:px-10 sm:py-8 lg:order-2 lg:overflow-visible lg:py-14 xl:px-16">
          <AnimatePresence mode="wait">
            <motion.div
              key={slide}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={SLIDE}
              className="max-w-xl"
            >
              <span className="eyebrow-primary">◉ {current.kicker}</span>

              <h1
                className="headline-collage display-serif mt-3 text-[clamp(1.55rem,6.3vw,3.9rem)] font-medium leading-[0.98] tracking-[-0.03em] text-foreground sm:mt-5"
                dangerouslySetInnerHTML={{ __html: current.headlineHTML }}
              />

              <p className="mt-4 max-w-md text-[14px] leading-relaxed text-muted-foreground sm:text-[15px]">
                {current.body}
              </p>

              {!isLast && (
                <div className="mt-6 rounded-lg border border-border bg-card/70 p-3 sm:rounded-sm sm:p-3.5">
                  <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
                    Coming next
                  </p>
                  <p className="mt-1 text-[13px] text-foreground">
                    {SLIDES[slide + 1].label}: {SLIDES[slide + 1].kicker}
                  </p>
                </div>
              )}

              {isLast && (
                <div className="mt-7 grid grid-cols-1 gap-2.5 sm:mt-9 sm:grid-cols-2">
                  <Button size="lg" variant="green" onClick={() => navigate('/login')} className="h-9 w-full justify-center rounded-md px-3.5 text-xs font-medium normal-case">
                    Sign in
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => navigate('/find-account')} className="h-9 w-full justify-center rounded-md px-3.5 text-xs font-medium normal-case">
                    Find my account
                  </Button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Footer controls — sticky on small screens for thumb reach */}
          <div className="sticky bottom-0 z-10 -mx-5 mt-7 flex items-center justify-between border-t border-border bg-background/95 px-5 pt-3.5 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 pb-safe sm:static sm:mx-0 sm:mt-10 sm:bg-transparent sm:px-0 sm:pt-5 sm:pb-0 sm:backdrop-blur-none lg:mt-10">
            <span className="rounded-md border border-border bg-card px-2 py-0.5 text-[9px] font-medium tracking-normal text-muted-foreground sm:text-[10px]">
              {String(slide + 1).padStart(2, '0')} / {String(SLIDES.length).padStart(2, '0')}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={prev}
                disabled={slide === 0}
                aria-label="Previous"
                className="h-9 w-9 shrink-0 rounded-md"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {isLast ? (
                <Button size="default" variant="green" onClick={() => navigate('/login')} className="h-8 min-w-[90px] rounded-md px-3 text-xs font-medium normal-case">
                  Enter
                </Button>
              ) : (
                <Button variant="default" size="default" onClick={next} aria-label="Next" className="h-8 rounded-md px-3 text-xs font-medium normal-case">
                  Next
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronLeft, ArrowRight, Search } from 'lucide-react';
import vggLogo from '@/assets/vgg-logo.webp';
import heroPeopleData from '@/assets/hero-people-data.jpg';
import authPersonData from '@/assets/auth-person-data.jpg';
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
    label: 'Manifesto',
    kicker: 'A Field Manual',
    headlineHTML: 'Performance, written in <em>plain ink.</em>',
    body:
      'A 360° appraisal platform built for honesty, anonymity and craft. Less ceremony, more signal. This is how Venture Garden Group measures growth.',
    image: heroPeopleData,
    caption: 'Fig. 01 — Feedback in conversation',
  },
  {
    no: '02',
    label: 'The Method',
    kicker: 'Three Movements',
    headlineHTML: 'Find. Review. <em>Read the chorus back.</em>',
    body:
      'Find your profile, review your colleagues across the leadership canon, then read the chorus back as a personal dashboard. No scoreboards. No spectacle.',
    image: heroTeam,
    caption: 'Fig. 02 — A team in the room',
  },
  {
    no: '03',
    label: 'Begin',
    kicker: 'Get Started',
    headlineHTML: 'Your voice, on the record. <em>Anonymously.</em>',
    body:
      'Sign in with your VGG credentials. Every response is encrypted and detached from your identity before analytics ever sees it.',
    image: authPersonData,
    caption: 'Fig. 03 — A moment of reflection',
  },
];

export default function Onboarding() {
  const [slide, setSlide] = useState(0);
  const navigate = useNavigate();

  const next = useCallback(() => setSlide((s) => Math.min(s + 1, SLIDES.length - 1)), []);
  const prev = useCallback(() => setSlide((s) => Math.max(s - 1, 0)), []);
  const current = SLIDES[slide];
  const isLast = slide === SLIDES.length - 1;

  return (
    <div className="app-page flex min-h-screen flex-col">
      {/* Editorial masthead */}
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-10 sm:py-4">
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
          <Button variant="green" size="sm" onClick={() => navigate('/login')}>
            Sign In
          </Button>
        </div>
      </header>

      {/* Step strip — hairline editorial tabs */}
      <div className="grid grid-cols-3 border-b border-border">
        {SLIDES.map((s, i) => {
          const active = i === slide;
          return (
            <button
              key={s.label}
              type="button"
              onClick={() => setSlide(i)}
              className={`group flex items-center gap-2 sm:gap-3 border-r border-border px-3 py-3 sm:px-5 sm:py-4 text-left transition-colors last:border-r-0 ${
                active ? 'bg-paper-deep/40' : 'bg-card hover:bg-paper-deep/30'
              }`}
              aria-current={active ? 'step' : undefined}
            >
              <span
                className={`numeral text-lg sm:text-2xl ${
                  active ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {s.no}
              </span>
              <div className="min-w-0 hidden sm:block">
                <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                  Step {i + 1} / 03
                </div>
                <div className="font-mono mt-0.5 text-[11px] uppercase tracking-[0.18em] text-foreground truncate">
                  {s.label}
                </div>
              </div>
              <span className="font-mono sm:hidden text-[10px] uppercase tracking-[0.16em] text-foreground truncate">
                {s.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Spread */}
      <main className="flex flex-1 flex-col overflow-hidden lg:flex-row">
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
        <div className="relative order-1 flex flex-1 flex-col justify-between px-5 py-8 sm:px-12 sm:py-10 lg:order-2 lg:py-16 xl:px-20">
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
                className="headline-collage display-serif mt-6 text-[clamp(2.5rem,6vw,5rem)] font-medium leading-[0.95] tracking-[-0.04em] text-foreground"
                dangerouslySetInnerHTML={{ __html: current.headlineHTML }}
              />

              <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">
                {current.body}
              </p>

              {isLast && (
                <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                  <Button size="lg" variant="green" onClick={() => navigate('/login')} className="gap-2">
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
          <div className="mt-12 flex items-center justify-between border-t border-border pt-6">
            <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-muted-foreground">
              {String(slide + 1).padStart(2, '0')} / {String(SLIDES.length).padStart(2, '0')}
            </span>
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
                <Button size="default" variant="green" onClick={() => navigate('/login')} className="gap-2">
                  Enter <ArrowRight className="h-4 w-4" />
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

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronLeft, ArrowRight, Search } from 'lucide-react';
import vggLogo from '@/assets/vgg-logo.webp';
import { Mascot } from '@/components/mascots/Mascot';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const SLIDE = { duration: 0.45, ease: EASE };

type SlideDef = {
  no: string;
  label: string;
  kicker: string;
  // headline parts mix sizes/weights; <em> = green, <u> = ink-block
  headlineHTML: string;
  body: string;
  mascot: 'lion' | 'owl' | 'eagle';
  mascotLine: string;
};

const SLIDES: SlideDef[] = [
  {
    no: '01',
    label: 'Manifesto',
    kicker: 'A Field Manual',
    headlineHTML: 'Performance,<br/><em>written</em> in <u>plain ink</u>.',
    body:
      'A 360° appraisal platform built for honesty, anonymity and craft. Less ceremony, more signal. This is how Venture Garden Group measures growth.',
    mascot: 'lion',
    mascotLine: 'Lion says: stand up straight, speak the truth.',
  },
  {
    no: '02',
    label: 'The Method',
    kicker: 'Three Movements',
    headlineHTML: 'Find. <em>Review.</em><br/><u>Read</u> the chorus back.',
    body:
      'Find your profile, review your colleagues across the leadership canon, then read the chorus back as a personal dashboard. No scoreboards. No spectacle.',
    mascot: 'owl',
    mascotLine: 'Owl says: feedback is information, not opinion.',
  },
  {
    no: '03',
    label: 'Begin',
    kicker: 'Get Started',
    headlineHTML: 'Your <em>voice</em>,<br/>on the record. <u>Anonymously.</u>',
    body:
      'Sign in with your VGG credentials. Every response is encrypted and detached from your identity before analytics ever sees it.',
    mascot: 'eagle',
    mascotLine: 'Eagle says: see the whole field before you swoop.',
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
      {/* Brutalist masthead — solid ink slab */}
      <header className="relative z-10 flex items-center justify-between border-b-[3px] border-foreground bg-foreground px-5 py-3 sm:px-8">
        <div className="flex items-center gap-3">
          <div className="brutal flex h-10 w-10 items-center justify-center bg-background p-1">
            <img src={vggLogo} alt="VGG" className="h-full w-full object-contain" />
          </div>
          <span className="mono text-[10px] font-bold uppercase tracking-[0.22em] text-background">
            VGG / 360° / Performance
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex tag-solid !bg-background !text-foreground">
            EST · 2024
          </span>
          <Button variant="green" size="sm" onClick={() => navigate('/login')}>
            Sign In
          </Button>
        </div>
      </header>

      {/* Step strip — chunky brutalist tabs */}
      <div className="relative z-10 flex items-stretch border-b-[3px] border-foreground bg-background">
        {SLIDES.map((s, i) => {
          const active = i === slide;
          return (
            <button
              key={s.label}
              type="button"
              onClick={() => setSlide(i)}
              className={`group flex flex-1 items-center gap-3 border-r-2 border-foreground px-5 py-4 text-left transition-all last:border-r-0 ${
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card hover:bg-foreground hover:text-background'
              }`}
              aria-current={active ? 'step' : undefined}
            >
              <span
                className={`brutal flex h-9 w-9 items-center justify-center mono text-sm font-black ${
                  active ? 'bg-foreground text-background' : 'bg-background text-foreground'
                }`}
              >
                {s.no}
              </span>
              <span className="mono text-[10px] font-bold uppercase tracking-[0.22em]">
                {s.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Spread */}
      <main className="relative z-10 flex flex-1 flex-col overflow-hidden lg:flex-row">
        {/* Left: huge mascot slab on flat color */}
        <div className="relative order-2 flex min-h-[320px] flex-1 items-center justify-center overflow-hidden border-foreground bg-primary lg:order-1 lg:border-r-[3px]">
          {/* corner ticks */}
          <div className="pointer-events-none absolute left-0 top-0 h-6 w-6 border-b-[3px] border-r-[3px] border-foreground" />
          <div className="pointer-events-none absolute right-0 top-0 h-6 w-6 border-b-[3px] border-l-[3px] border-foreground" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-6 w-6 border-r-[3px] border-t-[3px] border-foreground" />
          <div className="pointer-events-none absolute bottom-0 right-0 h-6 w-6 border-l-[3px] border-t-[3px] border-foreground" />

          {/* big issue number */}
          <div className="pointer-events-none absolute left-6 top-6 mono text-[10px] font-bold uppercase tracking-[0.22em] text-primary-foreground">
            № {current.no} / 03
          </div>
          <div className="pointer-events-none absolute right-6 top-6 mono text-[10px] font-bold uppercase tracking-[0.22em] text-primary-foreground">
            {current.kicker}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={current.mascot}
              initial={{ opacity: 0, scale: 0.85, rotate: -6 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={SLIDE}
              className="flex flex-col items-center gap-5 px-6"
            >
              <div className="brutal-lg bg-background p-6 sm:p-8">
                <Mascot type={current.mascot} size={220} className="mascot-wave" />
              </div>
              <div className="brutal max-w-[280px] bg-foreground px-4 py-2 text-center mono text-[10px] font-bold uppercase tracking-[0.18em] text-background">
                {current.mascotLine}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right: copy slab */}
        <div className="relative order-1 flex flex-1 flex-col justify-between bg-background px-6 py-10 sm:px-12 lg:order-2 lg:py-14">
          <AnimatePresence mode="wait">
            <motion.div
              key={slide}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={SLIDE}
              className="max-w-2xl"
            >
              <div className="mb-6 flex items-center gap-3">
                <span className="tag-green">{current.kicker}</span>
                <div className="h-[3px] flex-1 bg-foreground" />
                <span className="mono text-[10px] font-bold uppercase tracking-[0.22em] text-foreground">
                  STEP {current.no}
                </span>
              </div>

              <h1
                className="headline-collage display-serif text-[clamp(2.5rem,6vw,5rem)] font-black leading-[0.92] tracking-[-0.035em] text-foreground"
                dangerouslySetInnerHTML={{ __html: current.headlineHTML }}
              />

              <div className="mt-6 flex items-start gap-4">
                <div className="mt-2 h-[3px] w-12 shrink-0 bg-foreground" />
                <p className="max-w-md text-base leading-relaxed text-foreground">{current.body}</p>
              </div>

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

          {/* Footer controls — chunky brutalist */}
          <div className="mt-12 flex items-center justify-between border-t-[3px] border-foreground pt-5">
            <div className="flex items-center gap-2">
              <span className="brutal flex h-10 w-10 items-center justify-center bg-foreground mono text-sm font-black text-background">
                {String(slide + 1).padStart(2, '0')}
              </span>
              <span className="mono text-[10px] font-bold uppercase tracking-[0.22em] text-foreground">
                / {String(SLIDES.length).padStart(2, '0')}
              </span>
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

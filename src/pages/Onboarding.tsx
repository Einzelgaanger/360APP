import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ThemeToggle } from '@/components/ThemeToggle';
import TypewriterText from '@/components/TypewriterText';
import { Button } from '@/components/ui/button';
import { Search, Users, BarChart3, ChevronRight, ChevronLeft, Shield, ArrowRight, Star, TrendingUp, Award } from 'lucide-react';
import welcomeImg from '@/assets/onboarding-welcome.png';
import stepsImg from '@/assets/onboarding-steps.png';
import startImg from '@/assets/onboarding-start.png';

export default function Onboarding() {
  const [slide, setSlide] = useState(0);
  const navigate = useNavigate();

  const next = useCallback(() => setSlide((s) => Math.min(s + 1, 2)), []);
  const prev = useCallback(() => setSlide((s) => Math.max(s - 1, 0)), []);

  const handleAutoAdvance = useCallback(() => {
    setSlide((s) => {
      if (s < 2) return s + 1;
      return s;
    });
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden relative">
      {/* Subtle grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.3)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.3)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] via-transparent to-transparent pointer-events-none" />

      {/* Floating decorative elements */}
      <motion.div
        animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-20 right-[15%] w-16 h-16 rounded-2xl bg-primary/5 border border-primary/10 hidden lg:block"
      />
      <motion.div
        animate={{ y: [0, 12, 0], rotate: [0, -3, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute bottom-32 left-[10%] w-12 h-12 rounded-full bg-accent/5 border border-accent/10 hidden lg:block"
      />
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        className="absolute top-1/3 left-[8%] hidden lg:block"
      >
        <Star className="w-5 h-5 text-primary/15" />
      </motion.div>
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        className="absolute top-1/4 right-[8%] hidden lg:block"
      >
        <TrendingUp className="w-6 h-6 text-primary/10" />
      </motion.div>

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-6 sm:px-10 py-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-sm">
            <span className="text-primary-foreground font-bold text-sm">V</span>
          </div>
          <span className="text-sm font-semibold text-foreground tracking-tight">VGG 360°</span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button variant="outline" size="sm" onClick={() => navigate('/login')} className="text-xs">
            Sign In
          </Button>
        </div>
      </header>

      {/* Slide content */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-6 pb-28">
        <AnimatePresence mode="wait">
          {slide === 0 && <SlideWelcome key="welcome" onComplete={handleAutoAdvance} />}
          {slide === 1 && <SlideHowItWorks key="how" onComplete={handleAutoAdvance} />}
          {slide === 2 && <SlideGetStarted key="start" navigate={navigate} />}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-20 py-6 flex items-center justify-center gap-6 bg-gradient-to-t from-background via-background/80 to-transparent">
        <Button
          variant="ghost"
          size="icon"
          onClick={prev}
          disabled={slide === 0}
          className="rounded-full h-10 w-10"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>

        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <button
              key={i}
              onClick={() => setSlide(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === slide
                  ? 'w-8 bg-primary'
                  : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
              }`}
            />
          ))}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={slide === 2 ? () => navigate('/login') : next}
          className="rounded-full h-10 w-10"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}

/* ─── Slide 1: Welcome ─── */
function SlideWelcome({ onComplete }: { onComplete: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="max-w-4xl w-full flex flex-col lg:flex-row items-center gap-8 lg:gap-14"
    >
      {/* Text side */}
      <div className="flex-1 text-center lg:text-left">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-6"
        >
          <Shield className="w-3 h-3" />
          VGG 360° Performance Platform
        </motion.div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight mb-3">
          <TypewriterText
            texts={['Driving Performance.', 'Unlocking Growth.', 'Building Excellence.']}
            className="text-primary"
            speed={70}
            deleteSpeed={35}
            pauseDuration={2200}
            onCycleComplete={onComplete}
          />
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-md mx-auto lg:mx-0 mt-4"
        >
          <TypewriterText
            texts={[
              'A comprehensive peer review platform designed to unlock your team\'s full potential.',
              'Structured, anonymous feedback that fuels real development.',
            ]}
            speed={25}
            deleteSpeed={12}
            pauseDuration={3000}
          />
        </motion.p>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="flex flex-wrap gap-2 mt-6 justify-center lg:justify-start"
        >
          {['Anonymous', 'Secure', 'Data-Driven'].map((label, i) => (
            <motion.span
              key={label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1 + i * 0.1 }}
              className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium"
            >
              {label}
            </motion.span>
          ))}
        </motion.div>
      </div>

      {/* Illustration side */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85, x: 40 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        transition={{ delay: 0.3, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="flex-shrink-0"
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <img src={welcomeImg} alt="Welcome" width={220} height={220} className="drop-shadow-lg" />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Slide 2: How It Works ─── */
const STEPS = [
  { icon: Search, title: 'Find Your Profile', desc: 'Look up your name to locate your account and set up your credentials securely.', color: 'text-primary' },
  { icon: Users, title: 'Review Colleagues', desc: 'Provide honest, anonymous feedback across key competencies for your peers.', color: 'text-chart-4' },
  { icon: BarChart3, title: 'View Insights', desc: 'Access your personal dashboard, see benchmarks, and track progress over time.', color: 'text-chart-5' },
];

function SlideHowItWorks({ onComplete }: { onComplete: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="max-w-4xl w-full flex flex-col lg:flex-row items-center gap-8 lg:gap-14"
    >
      {/* Illustration side */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85, x: -40 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="flex-shrink-0 order-2 lg:order-1"
      >
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <img src={stepsImg} alt="Steps" width={200} height={160} loading="lazy" className="drop-shadow-lg" />
        </motion.div>
      </motion.div>

      {/* Content side */}
      <div className="flex-1 text-center lg:text-left order-1 lg:order-2">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-6"
        >
          <Award className="w-3 h-3" />
          Simple 3-Step Process
        </motion.div>

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3">
          <TypewriterText
            texts={['How It Works', 'Your Journey Begins', 'Three Simple Steps']}
            className="text-foreground"
            speed={60}
            deleteSpeed={30}
            pauseDuration={2500}
            onCycleComplete={onComplete}
          />
        </h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-muted-foreground text-xs sm:text-sm max-w-md mx-auto lg:mx-0 mb-8"
        >
          <TypewriterText
            texts={[
              'From account setup to actionable insights in minutes.',
              'A streamlined process designed for busy professionals.',
            ]}
            speed={25}
            deleteSpeed={12}
            pauseDuration={3000}
          />
        </motion.p>

        <div className="grid gap-4">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border hover:shadow-md transition-shadow duration-300 text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <step.icon className={`w-5 h-5 ${step.color}`} />
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-primary mb-0.5">
                  Step {i + 1}
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-1">{step.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Slide 3: Get Started ─── */
function SlideGetStarted({ navigate }: { navigate: (path: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="max-w-4xl w-full flex flex-col lg:flex-row items-center gap-8 lg:gap-14"
    >
      {/* Text side */}
      <div className="flex-1 text-center lg:text-left">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-6"
        >
          <Shield className="w-3 h-3" />
          Secure & Confidential
        </motion.div>

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3">
          <TypewriterText
            texts={['Ready to Begin?', 'Let\'s Get Started.', 'Your Voice Matters.']}
            className="text-foreground"
            speed={60}
            deleteSpeed={30}
            pauseDuration={2500}
          />
        </h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-lg mx-auto lg:mx-0 mb-8"
        >
          <TypewriterText
            texts={[
              'Sign in with your credentials or find your account to get started.',
              'Your feedback is completely anonymous and confidential.',
            ]}
            speed={25}
            deleteSpeed={12}
            pauseDuration={3000}
          />
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start"
        >
          <Button size="lg" onClick={() => navigate('/login')} className="gap-2">
            Sign In <ArrowRight className="w-4 h-4" />
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate('/find-account')} className="gap-2">
            <Search className="w-4 h-4" /> Find My Account
          </Button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-xs text-muted-foreground mt-6 flex items-center justify-center lg:justify-start gap-1.5"
        >
          <Shield className="w-3 h-3" />
          <TypewriterText
            texts={[
              'Only registered employees can access this platform.',
              'All responses are encrypted and anonymised.',
            ]}
            speed={30}
            deleteSpeed={15}
            pauseDuration={3500}
          />
        </motion.p>
      </div>

      {/* Illustration side */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85, x: 40 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        transition={{ delay: 0.3, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="flex-shrink-0"
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <img src={startImg} alt="Get Started" width={220} height={220} loading="lazy" className="drop-shadow-lg" />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

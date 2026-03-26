import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ThemeToggle } from '@/components/ThemeToggle';
import TypewriterText from '@/components/TypewriterText';
import { Button } from '@/components/ui/button';
import { Search, Users, BarChart3, ChevronRight, ChevronLeft, Shield } from 'lucide-react';

const SLIDES = [
  {
    id: 'welcome',
    badge: 'VGG 360° Performance Platform',
    heading: 'Driving',
    typewriterWords: ['Performance', 'Growth', 'Excellence', 'Innovation'],
    description:
      'A comprehensive peer review platform designed to unlock your team\'s full potential through structured, anonymous feedback.',
  },
  {
    id: 'how',
    badge: 'Simple 3-Step Process',
    heading: 'How It Works',
    steps: [
      {
        icon: Search,
        title: 'Find Your Profile',
        desc: 'Look up your name to locate your account and set up your credentials securely.',
      },
      {
        icon: Users,
        title: 'Review Colleagues',
        desc: 'Provide honest, anonymous feedback across key competencies for your peers.',
      },
      {
        icon: BarChart3,
        title: 'View Insights',
        desc: 'Access your personal dashboard, see organisation benchmarks, and track progress.',
      },
    ],
  },
  {
    id: 'start',
    badge: 'Secure & Confidential',
    heading: 'Ready to Begin?',
    description:
      'Only registered employees can access the platform. Sign in with your credentials or find your account to get started.',
  },
];

export default function Onboarding() {
  const [slide, setSlide] = useState(0);
  const navigate = useNavigate();

  const next = useCallback(() => setSlide((s) => Math.min(s + 1, 2)), []);
  const prev = useCallback(() => setSlide((s) => Math.max(s - 1, 0)), []);

  const current = SLIDES[slide];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">V</span>
          </div>
          <span className="text-sm font-semibold text-foreground">VGG 360°</span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button variant="outline" size="sm" onClick={() => navigate('/login')}>
            Sign In
          </Button>
        </div>
      </header>

      {/* Slide content */}
      <div className="flex-1 flex items-center justify-center px-6 pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="max-w-2xl w-full text-center"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-8"
            >
              <Shield className="w-3 h-3" />
              {current.badge}
            </motion.div>

            {/* Slide 1: Welcome */}
            {slide === 0 && (
              <>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
                  {current.heading}{' '}
                  <TypewriterText
                    texts={current.typewriterWords!}
                    className="text-primary"
                    speed={90}
                    deleteSpeed={50}
                    pauseDuration={2500}
                  />
                </h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-muted-foreground text-base sm:text-lg leading-relaxed max-w-lg mx-auto"
                >
                  {current.description}
                </motion.p>
              </>
            )}

            {/* Slide 2: How It Works */}
            {slide === 1 && (
              <>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-10">
                  {current.heading}
                </h1>
                <div className="grid sm:grid-cols-3 gap-6">
                  {current.steps!.map((step, i) => (
                    <motion.div
                      key={step.title}
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + i * 0.15 }}
                      className="glass-panel p-6 text-left"
                    >
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                        <step.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="text-xs font-semibold text-primary mb-1">
                        Step {i + 1}
                      </div>
                      <h3 className="text-sm font-semibold text-foreground mb-2">
                        {step.title}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {step.desc}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </>
            )}

            {/* Slide 3: Get Started */}
            {slide === 2 && (
              <>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
                  {current.heading}
                </h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-muted-foreground text-base sm:text-lg leading-relaxed max-w-lg mx-auto mb-10"
                >
                  {current.description}
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex flex-col sm:flex-row gap-3 justify-center"
                >
                  <Button size="lg" onClick={() => navigate('/login')} className="gap-2">
                    Sign In <ChevronRight className="w-4 h-4" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => navigate('/find-account')}
                    className="gap-2"
                  >
                    <Search className="w-4 h-4" /> Find My Account
                  </Button>
                </motion.div>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-xs text-muted-foreground mt-6 flex items-center justify-center gap-1.5"
                >
                  <Shield className="w-3 h-3" />
                  Only registered employees can access the platform
                </motion.p>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="fixed bottom-0 left-0 right-0 py-6 flex items-center justify-center gap-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={prev}
          disabled={slide === 0}
          className="rounded-full"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>

        <div className="flex gap-2">
          {SLIDES.map((_, i) => (
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
          className="rounded-full"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}

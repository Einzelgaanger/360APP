import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEmployeeAuth } from '@/contexts/EmployeeAuthContext';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthHeroPanel } from '@/components/auth/AuthHeroPanel';
import { Lock, Mail, AlertCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import vggLogo from '@/assets/vgg-logo.webp';
import authPersonData from '@/assets/auth-person-data.jpg';

export default function EmployeeLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useEmployeeAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error } = await login(email, password);
      if (error) setError(error);
      else navigate('/hub?tab=dashboard');
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-page flex min-h-screen flex-col lg:flex-row">
      <AuthHeroPanel
        variant="hub"
        eyebrow="VGG / Employee"
        title="Your voice, on the record. Anonymously."
        description="Provide peer feedback, view your personal dashboard, and track your growth alongside colleagues."
      />

      {/* Mobile-only hero strip */}
      <div className="mobile-hero">
        <img src={authPersonData} alt="A colleague in a moment of reflection" fetchPriority="high" />
        <div className="mobile-hero-caption">
          <span>◉ VGG / Employee</span>
          <span>Auth / 02</span>
        </div>
      </div>

      <div className="relative flex flex-1 items-center justify-center px-5 sm:px-6 py-8 sm:py-10">
        <div className="absolute inset-x-0 top-0 flex items-center justify-between border-b border-foreground/15 px-4 sm:px-6 py-3 sm:py-4 bg-background lg:bg-transparent">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/50">
            Authentication / 02
          </span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <img src={vggLogo} alt="Venture Garden Group" className="h-7 w-auto mb-8 sm:mb-10" />

          <div className="mb-8 sm:mb-10">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground/60">
              Employee
            </span>
          <h1 className="mt-3 font-serif text-[1.75rem] font-bold leading-[1.0] tracking-[-0.02em] sm:text-5xl sm:leading-[0.95]">
            Welcome back.
          </h1>
            <p className="mt-3 text-sm text-foreground/60">
              VGG 360° Appraisal — secure employee access.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/70">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 pl-10 rounded-sm border-foreground/25 focus:border-foreground"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/70">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 pl-10 rounded-sm border-foreground/25 focus:border-foreground"
                  required
                />
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 border border-destructive bg-destructive/5 p-3 text-sm text-destructive rounded-sm"
              >
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </motion.div>
            )}

            <Button type="submit" disabled={loading} className="h-12 w-full gap-2">
              {loading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="h-4 w-4 rounded-full border-2 border-background/30 border-t-background"
                />
              ) : (
                <>
                  Sign In <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 border-t border-foreground/15 pt-6">
            <Link
              to="/find-account"
              className="font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/70 hover:text-foreground"
            >
              First time? → Find your account
            </Link>
            <Link
              to="/admin"
              className="font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/50 hover:text-foreground"
            >
              Admin →
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

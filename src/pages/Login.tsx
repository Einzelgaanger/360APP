import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Mail, AlertCircle, ArrowRight, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import vggLogo from '@/assets/vgg-logo.webp';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitTick, setSubmitTick] = useState(0);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitTick((t) => t + 1);
    setLoading(true);
    try {
      const success = await login(email, password);
      if (success) navigate('/dashboard');
      else setError('Invalid credentials. Please try again.');
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mobile-flow-shell app-page flex min-h-dvh-screen flex-col bg-background">
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden lg:min-h-0">
        <motion.div
          key={submitTick}
          className="pointer-events-none absolute top-0 left-0 right-0 z-10 h-0.5 bg-primary/25 lg:left-0"
          initial={{ scaleX: 0, transformOrigin: '0% 50%' }}
          animate={
            loading
              ? { scaleX: [0.12, 0.55, 0.28, 0.72, 0.4, 0.95], transition: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' } }
              : { scaleX: 1, opacity: 0, transition: { duration: 0.25 } }
          }
        />

        <div className="mobile-flow-header mobile-top-safe border-b border-foreground/10">
          <div className="flex items-center justify-between lg:hidden">
            <Button variant="ghost" size="sm" className="gap-1.5 -ml-2 h-9 text-muted-foreground" asChild>
              <Link to="/">
                <ArrowLeft className="h-4 w-4" /> Home
              </Link>
            </Button>
            <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-foreground/50">Admin / 01</span>
          </div>
          <div className="hidden lg:flex items-center justify-between">
            <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-foreground/70">
              Restricted Access
            </span>
            <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-foreground/50">
              Authentication / 01
            </span>
          </div>
        </div>

        <div className="flex flex-1 min-h-0 flex-col lg:justify-center lg:px-6 lg:py-10">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-1 flex-col min-h-0 w-full max-w-md mx-auto px-4 sm:px-6 lg:flex-none lg:justify-center"
          >
            <div className="mobile-flow-content px-0 py-2 sm:px-0 lg:overflow-visible lg:px-0 lg:py-0">
              <img src={vggLogo} alt="Venture Garden Group" className="h-6 w-auto mb-6 sm:mb-8" />

              <div className="mb-6 sm:mb-8">
                <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-foreground/60">
                  Administrator
                </span>
                <h1 className="mt-2.5 font-serif text-[1.75rem] font-semibold leading-[0.98] tracking-[-0.02em] sm:text-[2.5rem]">
                  Sign in.
                </h1>
                <p className="mt-2 text-[13px] text-foreground/60 sm:text-sm">
                  VGG 360° Performance Analytics console.
                </p>
              </div>

              <form id="admin-login-form" onSubmit={handleSubmit} className="mobile-flow-card space-y-4.5 sm:space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="font-mono text-[9px] uppercase tracking-[0.16em] text-foreground/70">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-11 pl-10 rounded-lg border-foreground/20 bg-background text-sm sm:rounded-sm"
                      inputMode="email"
                      autoComplete="username"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="font-mono text-[9px] uppercase tracking-[0.16em] text-foreground/70">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 pl-10 pr-11 rounded-lg border-foreground/20 bg-background text-sm sm:rounded-sm"
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-md text-foreground/50 hover:text-foreground"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] text-muted-foreground">Use your administrative company account.</p>
                  <Link to="/find-account" className="text-[11px] font-medium text-primary hover:underline">
                    Need help?
                  </Link>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 rounded-xl border border-destructive bg-destructive/5 p-3 text-sm text-destructive sm:rounded-sm"
                  >
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {error}
                  </motion.div>
                )}

                <div className="hidden pb-1 lg:block">
                  <Button type="submit" disabled={loading} className="h-10 w-full gap-2 text-sm font-semibold transition-transform active:scale-[0.98]">
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <motion.span
                          className="inline-block h-2 w-2 rounded-full bg-primary-foreground"
                          animate={{ opacity: [0.35, 1, 0.35], scale: [0.9, 1, 0.9] }}
                          transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
                        />
                        Signing in…
                      </span>
                    ) : (
                      <>
                        Enter Console <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>

              <p className="mt-3 px-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                Protected administrator channel. Contact platform owner if access fails.
              </p>
            </div>

            <div className="mobile-flow-sticky-cta lg:hidden">
              <Button
                type="submit"
                form="admin-login-form"
                disabled={loading}
                className="h-10 w-full gap-2 rounded-lg text-sm font-semibold shadow-sm active:scale-[0.98] sm:rounded-sm"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <motion.span
                      className="inline-block h-2 w-2 rounded-full bg-primary-foreground"
                      animate={{ opacity: [0.35, 1, 0.35], scale: [0.9, 1, 0.9] }}
                      transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    Signing in…
                  </span>
                ) : (
                  <>
                    Enter Console <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

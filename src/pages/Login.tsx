import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthHeroPanel } from '@/components/auth/AuthHeroPanel';
import { Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';
import vggLogo from '@/assets/vgg-logo.webp';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
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
    <div className="app-page flex min-h-screen">
      <AuthHeroPanel
        variant="login"
        eyebrow="VGG / Administrator"
        title="The console for organisational truth."
        description="Analytics, leaderboards, exports and AI co‑analysis — for the few who steward the system."
      />

      {/* Right form panel */}
      <div className="relative flex flex-1 items-center justify-center px-6 py-10">
        <div className="absolute inset-x-0 top-0 flex items-center justify-between border-b border-foreground/15 px-6 py-4">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground/70">
            Restricted Access
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/50">
            Authentication / 01
          </span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <img src={vggLogo} alt="Venture Garden Group" className="h-7 w-auto mb-10" />

          <div className="mb-10">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground/60">
              Administrator
            </span>
            <h1 className="mt-3 font-serif text-4xl font-bold leading-[0.95] tracking-[-0.02em] sm:text-5xl">
              Sign in.
            </h1>
            <p className="mt-3 text-sm text-foreground/60">
              VGG 360° Performance Analytics console.
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
                  placeholder="admin@company.com"
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
                  Enter Console <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

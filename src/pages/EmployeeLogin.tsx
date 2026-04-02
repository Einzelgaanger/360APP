import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEmployeeAuth } from '@/contexts/EmployeeAuthContext';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthHeroPanel } from '@/components/auth/AuthHeroPanel';
import { Lock, Mail, AlertCircle, ArrowLeft } from 'lucide-react';
import vggLogo from '@/assets/vgg-logo.webp';

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
    <div className="app-page flex">
      <AuthHeroPanel
        eyebrow="Employee sign in"
        title="Welcome back"
        description="Provide anonymous peer feedback, view your personal dashboard, and track your development alongside colleagues."
      >
        <div className="mt-8 flex flex-wrap gap-2">
          {['Anonymous', 'Confidential', 'Secure'].map((label) => (
            <span
              key={label}
              className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/90 backdrop-blur-sm"
            >
              {label}
            </span>
          ))}
        </div>
      </AuthHeroPanel>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center relative p-6">
        <div className="absolute top-5 left-5">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="gap-1.5 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
        </div>
        

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm"
        >
          <div className="mb-8">
            <img src={vggLogo} alt="Venture Garden Group" className="h-8 w-auto mb-8" />
            <h1 className="text-2xl font-bold font-serif mb-1">Sign In</h1>
            <p className="text-muted-foreground text-sm">
              VGG 360° Appraisal Platform
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-11"
                  required
                />
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </motion.div>
            )}

            <Button type="submit" disabled={loading} className="w-full h-11 font-semibold">
              {loading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                />
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="mt-8 space-y-3 text-center">
            <Link
              to="/find-account"
              className="text-sm text-primary hover:underline font-medium block"
            >
              First time? Find your account
            </Link>
            <Link
              to="/admin"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors block"
            >
              Administrator access →
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

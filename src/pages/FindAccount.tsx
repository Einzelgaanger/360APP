import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useEmployeeAuth } from '@/contexts/EmployeeAuthContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Search, ArrowLeft, CheckCircle2, AlertCircle, Loader2, Building2, User,
} from 'lucide-react';

interface EmployeeResult {
  id: string;
  name: string;
  role: string | null;
  email: string | null;
  subsidiaries: { name: string } | null;
}

export default function FindAccount() {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<EmployeeResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [sent, setSent] = useState(false);
  const [sentTo, setSentTo] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const { resetPassword } = useEmployeeAuth();
  const navigate = useNavigate();

  const handleSearch = async () => {
    if (searchQuery.trim().length < 2) return;
    setSearching(true);
    setError('');
    setResults([]);
    try {
      const { data, error: err } = await supabase
        .from('employees')
        .select('id, name, role, email, subsidiaries(name)')
        .ilike('name', `%${searchQuery.trim()}%`)
        .limit(10);
      if (err) throw err;
      setResults((data as unknown as EmployeeResult[]) || []);
      if (!data?.length) setError('No matching employees found. Please check the spelling.');
    } catch {
      setError('Search failed. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const handleSendReset = async (employee: EmployeeResult) => {
    if (!employee.email) {
      setError('No email on file for this account. Please contact your administrator.');
      return;
    }
    setSending(true);
    setError('');
    try {
      const { error } = await resetPassword(employee.email);
      if (error) throw new Error(error);
      setSent(true);
      setSentTo(employee.email.replace(/(.{2})(.*)(@.*)/, '$1***$3'));
    } catch {
      setError('Failed to send reset email. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-sm w-full glass-panel p-8 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
            className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5"
          >
            <CheckCircle2 className="w-7 h-7 text-primary" />
          </motion.div>
          <h1 className="text-xl font-semibold mb-2">Check Your Email</h1>
          <p className="text-muted-foreground text-sm mb-1">
            We've sent a password reset link to
          </p>
          <p className="text-foreground font-medium text-sm mb-6">{sentTo}</p>
          <p className="text-xs text-muted-foreground mb-6">
            Click the link in the email to set your password, then sign in.
          </p>
          <Button onClick={() => navigate('/login')} className="w-full">
            Go to Sign In
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative">
      <div className="absolute top-4 left-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="gap-1.5 text-muted-foreground">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
      </div>
      <div className="absolute top-4 right-4"><ThemeToggle /></div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md px-6"
      >
        <div className="glass-panel p-8">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mx-auto mb-4">
              <Search className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-semibold">Find Your Account</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Search your name to locate your profile and set up your password.
            </p>
          </div>

          {/* Search */}
          <div className="space-y-3 mb-4">
            <Label htmlFor="search" className="text-sm">Your Name</Label>
            <div className="flex gap-2">
              <Input
                id="search"
                placeholder="e.g. John Doe"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={searching || searchQuery.trim().length < 2}>
                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm mb-4"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </motion.div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <p className="text-xs text-muted-foreground font-medium mb-2">
                {results.length} result{results.length !== 1 ? 's' : ''} found — select your profile:
              </p>
              {results.map((emp) => (
                <button
                  key={emp.id}
                  onClick={() => handleSendReset(emp)}
                  disabled={sending}
                  className="w-full flex items-center justify-between p-3.5 rounded-lg border border-border bg-background hover:bg-muted/50 hover:border-primary/40 transition-all text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <span className="font-medium text-sm block">{emp.name}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {emp.subsidiaries?.name || 'Unknown'}
                        {emp.role && ` · ${emp.role}`}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                    That's me →
                  </span>
                </button>
              ))}
            </motion.div>
          )}

          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm text-primary hover:underline">
              Already have a password? Sign in
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useEmployeeAuth } from '@/contexts/EmployeeAuthContext';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Search, ArrowLeft, CheckCircle2, AlertCircle, Loader2, Building2, Mail,
} from 'lucide-react';
import vggLogo from '@/assets/vgg-logo.webp';

interface EmployeeResult {
  id: string;
  name: string;
  role: string | null;
  email: string | null;
  department: string | null;
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
  const [hasSearched, setHasSearched] = useState(false);
  const { resetPassword } = useEmployeeAuth();
  const navigate = useNavigate();

  // Debounced live search
  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length < 2) {
      setResults([]);
      setHasSearched(false);
      setError('');
      return;
    }

    const timeout = setTimeout(async () => {
      setSearching(true);
      setError('');
      try {
        // Search by name OR email using or() filter
        const { data, error: err } = await supabase
          .from('employees')
          .select('id, name, role, email, department, subsidiaries(name)')
          .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
          .order('name')
          .limit(15);
        if (err) throw err;
        setResults((data as unknown as EmployeeResult[]) || []);
        setHasSearched(true);
      } catch {
        setError('Search failed. Please try again.');
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

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
      setSentTo(employee.email.replace(/(.{3})(.*)(@.*)/, '$1***$3'));
    } catch {
      setError('Failed to send reset email. Please try again.');
    } finally {
      setSending(false);
    }
  };

  // Highlight matching text
  const highlightMatch = (text: string) => {
    const query = searchQuery.trim();
    if (!query || query.length < 2) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? <mark key={i} className="bg-primary/20 text-primary font-semibold rounded-sm px-0.5">{part}</mark> : part
    );
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-sm w-full text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
            className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle2 className="w-8 h-8 text-primary" />
          </motion.div>
          <h1 className="text-2xl font-bold font-serif mb-2">Check Your Email</h1>
          <p className="text-muted-foreground text-sm mb-1">
            We've sent a password reset link to
          </p>
          <p className="text-foreground font-semibold text-sm mb-6">{sentTo}</p>
          <div className="space-y-2 text-left bg-muted/50 rounded-xl p-4 mb-8">
            <p className="text-xs font-semibold text-foreground mb-2">Next steps:</p>
            <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
              <li>Open the email and click the reset link</li>
              <li>Set a new password for your account</li>
              <li>Return here and sign in with your new password</li>
            </ol>
          </div>
          <Button onClick={() => navigate('/login')} className="w-full h-11">
            Go to Sign In
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative p-6">
      <div className="absolute top-5 left-5">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="gap-1.5 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="mb-8">
          <img src={vggLogo} alt="Venture Garden Group" className="h-8 w-auto mb-8" />
          <h1 className="text-2xl font-bold font-serif mb-1">Find Your Account</h1>
          <p className="text-muted-foreground text-sm">
            Search by your name or work email to locate your profile.
          </p>
        </div>

        {/* Search */}
        <div className="space-y-3 mb-4">
          <Label htmlFor="search" className="text-sm font-medium">Name or Email</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="e.g. John Doe or john@company.com"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11"
              autoFocus
            />
            {searching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
            )}
          </div>
          {searchQuery.trim().length > 0 && searchQuery.trim().length < 2 && (
            <p className="text-xs text-muted-foreground">Type at least 2 characters to search…</p>
          )}
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
        <AnimatePresence mode="wait">
          {hasSearched && results.length === 0 && !searching && (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center py-8"
            >
              <Search className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No matching employees found.</p>
              <p className="text-xs text-muted-foreground mt-1">Try a different spelling or use your email address.</p>
            </motion.div>
          )}

          {results.length > 0 && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              <p className="text-xs text-muted-foreground font-medium mb-3">
                {results.length} result{results.length !== 1 ? 's' : ''} — select your profile to receive a password reset email:
              </p>
              <div className="max-h-[340px] overflow-y-auto space-y-2 pr-1">
                {results.map((emp) => (
                  <button
                    key={emp.id}
                    onClick={() => handleSendReset(emp)}
                    disabled={sending}
                    className="w-full flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:bg-muted/50 hover:border-primary/40 transition-all text-left group disabled:opacity-50"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-semibold text-primary">
                          {emp.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <span className="font-medium text-sm block truncate">{highlightMatch(emp.name)}</span>
                        {emp.email && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                            <Mail className="w-3 h-3 flex-shrink-0" />
                            {highlightMatch(emp.email)}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3 h-3 flex-shrink-0" />
                          {emp.subsidiaries?.name || 'Unknown'}
                          {emp.department && ` · ${emp.department}`}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity font-medium whitespace-nowrap ml-2">
                      That's me →
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-8 text-center">
          <Link to="/login" className="text-sm text-primary hover:underline font-medium">
            Already have a password? Sign in
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

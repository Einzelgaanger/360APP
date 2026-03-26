import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useEmployeeAuth } from '@/contexts/EmployeeAuthContext';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Search, ArrowLeft, CheckCircle2, AlertCircle, Loader2, Building2, User,
} from 'lucide-react';
import vggIcon from '@/assets/vgg-icon.png';

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
          <p className="text-xs text-muted-foreground mb-8">
            Click the link in the email to set your password, then sign in.
          </p>
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
          <img src={vggIcon} alt="Venture Garden Group" className="h-10 w-auto mb-8" />
          <h1 className="text-2xl font-bold font-serif mb-1">Find Your Account</h1>
          <p className="text-muted-foreground text-sm">
            Search your name to locate your profile and set up your password.
          </p>
        </div>

        {/* Search */}
        <div className="space-y-3 mb-5">
          <Label htmlFor="search" className="text-sm font-medium">Your Name</Label>
          <div className="flex gap-2">
            <Input
              id="search"
              placeholder="e.g. John Doe"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="h-11"
            />
            <Button onClick={handleSearch} disabled={searching || searchQuery.trim().length < 2} className="h-11 px-5">
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm mb-5"
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
            <p className="text-xs text-muted-foreground font-medium mb-3">
              {results.length} result{results.length !== 1 ? 's' : ''} found — select your profile:
            </p>
            {results.map((emp) => (
              <button
                key={emp.id}
                onClick={() => handleSendReset(emp)}
                disabled={sending}
                className="w-full flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:bg-muted/50 hover:border-primary/40 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-primary">
                      {emp.name.split(' ').map(n => n[0]).join('')}
                    </span>
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

        <div className="mt-8 text-center">
          <Link to="/login" className="text-sm text-primary hover:underline font-medium">
            Already have a password? Sign in
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

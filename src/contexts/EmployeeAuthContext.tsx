import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

interface Profile {
  id: string;
  employee_id: string | null;
  name: string;
  email: string;
  department: string | null;
  created_at: string | null;
}

interface EmployeeAuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (password: string) => Promise<{ error: string | null }>;
}

const EmployeeAuthContext = createContext<EmployeeAuthContextType | undefined>(undefined);

export function EmployeeAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch profile and admin role when user changes
  useEffect(() => {
    let cancelled = false;

    const loadUserContext = async () => {
      if (!user) {
        setProfile(null);
        setIsAdmin(false);
        return;
      }

      const [{ data: profileData }, { data: roleData }] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle(),
        supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle(),
      ]);

      let resolvedProfile = profileData as Profile | null;
      const normalizedEmail = resolvedProfile?.email?.trim().toLowerCase();

      if (resolvedProfile && !resolvedProfile.employee_id && normalizedEmail) {
        const { data: employeeData } = await supabase
          .from('employees')
          .select('id, department')
          .ilike('email', normalizedEmail)
          .maybeSingle();

        if (employeeData) {
          const nextDepartment = resolvedProfile.department ?? employeeData.department;
          resolvedProfile = {
            ...resolvedProfile,
            employee_id: employeeData.id,
            department: nextDepartment,
          };

          void supabase
            .from('profiles')
            .update({
              employee_id: employeeData.id,
              department: nextDepartment,
            })
            .eq('id', user.id);
        }
      }

      if (cancelled) return;
      setProfile(resolvedProfile);
      setIsAdmin(!!roleData);
    };

    void loadUserContext();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const resetPassword = async (email: string) => {
    const siteUrl = import.meta.env.PROD ? 'https://appraisal.vgg.app' : window.location.origin;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/reset-password`,
    });
    return { error: error?.message ?? null };
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    return { error: error?.message ?? null };
  };

  return (
    <EmployeeAuthContext.Provider
      value={{
        user, session, profile,
        isAuthenticated: !!session,
        isAdmin,
        isLoading,
        login, logout, resetPassword, updatePassword,
      }}
    >
      {children}
    </EmployeeAuthContext.Provider>
  );
}

export function useEmployeeAuth() {
  const context = useContext(EmployeeAuthContext);
  if (!context) throw new Error('useEmployeeAuth must be used within EmployeeAuthProvider');
  return context;
}

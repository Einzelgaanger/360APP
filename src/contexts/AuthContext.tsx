import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Legacy demo login: only when both env vars are set (no defaults). Values are still bundled with the client. */
function getLegacyDemoConfig(): { email: string; password: string; name: string } | null {
  const email = import.meta.env.VITE_LEGACY_ADMIN_EMAIL?.trim().toLowerCase();
  const password = import.meta.env.VITE_LEGACY_ADMIN_PASSWORD;
  const name = import.meta.env.VITE_LEGACY_ADMIN_NAME?.trim() || 'Admin';
  if (!email || !password) return null;
  return { email, password, name };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check for existing session
    const savedUser = localStorage.getItem('vgg_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 220));

    const legacy = getLegacyDemoConfig();
    if (!legacy) return false;

    if (email.trim().toLowerCase() === legacy.email && password === legacy.password) {
      const userData = { email: email.trim(), name: legacy.name };
      setUser(userData);
      localStorage.setItem('vgg_user', JSON.stringify(userData));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('vgg_user');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
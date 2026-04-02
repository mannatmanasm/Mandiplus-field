'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  AuthUser,
  getCurrentUser,
  getStoredAuthToken,
  logout,
  setStoredAuthToken,
} from '@/features/auth/api';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  setUserAndToken: (token: string, user: AuthUser) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      try {
        const token = getStoredAuthToken();
        if (!token) {
          setLoading(false);
          return;
        }

        setStoredAuthToken(token);
        const currentUser = await getCurrentUser(token);
        setUser(currentUser);
      } catch {
        logout();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  const setUserAndToken = (token: string, nextUser: AuthUser) => {
    setStoredAuthToken(token);
    setUser(nextUser);
  };

  const signOut = () => {
    logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, setUserAndToken, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

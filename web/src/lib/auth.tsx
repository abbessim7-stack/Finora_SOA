import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api } from './api';
import type { User } from './types';

interface AuthValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  updateAccount: (input: { name: string; email: string }) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    api
      .me()
      .then((me) => {
        if (alive) setUser(me);
      })
      .catch(() => {
        /* pas de session active */
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      user,
      loading,
      async login(email, password) {
        const result = await api.login({ email, password });
        setUser(result.user);
      },
      async register(name, email, password) {
        const result = await api.register({ name, email, password });
        setUser(result.user);
      },
      async updateAccount(input) {
        const updatedUser = await api.updateAccount(input);
        setUser(updatedUser);
        return updatedUser;
      },
      async logout() {
        await api.logout();
        setUser(null);
      },
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth doit être utilisé dans AuthProvider');
  return context;
}

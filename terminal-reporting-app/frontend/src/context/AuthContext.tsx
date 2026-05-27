import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { authApi } from '../api';
import { clearStoredAuth, getStoredUser, setStoredAuth } from '../api/authStorage';
import type { User } from '../types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => getStoredUser<User>());
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const currentUser = await authApi.getMe();
      setUser(currentUser);
      const token = localStorage.getItem('tos_token');
      if (token) {
        setStoredAuth(token, currentUser);
      }
    } catch {
      clearStoredAuth();
      setUser(null);
    }
  };

  useEffect(() => {
    const init = async () => {
      if (!getStoredUser<User>()) {
        setLoading(false);
        return;
      }

      await refreshUser();
      setLoading(false);
    };

    init();
  }, []);

  const login = async (username: string, password: string) => {
    const response = await authApi.login(username, password);
    setStoredAuth(response.token, response.user);
    setUser(response.user);
  };

  const logout = () => {
    clearStoredAuth();
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      isAdmin: user?.role === 'ADMIN',
      login,
      logout,
      refreshUser,
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

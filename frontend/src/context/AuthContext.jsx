import { createContext, useContext, useState, useCallback } from 'react';
import { authService } from '../api/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('skillify_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('skillify_token'));

  const persist = (newToken, newUser) => {
    localStorage.setItem('skillify_token', newToken);
    localStorage.setItem('skillify_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const login = useCallback(async (email, password) => {
    const data = await authService.login({ email, password });
    persist(data.token, data.user);
    return data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const data = await authService.register(payload);
    persist(data.token, data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('skillify_token');
    localStorage.removeItem('skillify_user');
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const fresh = await authService.profile();
    localStorage.setItem('skillify_user', JSON.stringify(fresh));
    setUser(fresh);
    return fresh;
  }, []);

  const updateLocalUser = useCallback((partialUser) => {
    setUser((prev) => {
      const merged = { ...prev, ...partialUser };
      localStorage.setItem('skillify_user', JSON.stringify(merged));
      return merged;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, token, login, register, logout, refreshUser, updateLocalUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

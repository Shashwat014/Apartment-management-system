import { createContext, useContext, useEffect, useState } from 'react';
import { apiClient } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/auth/me').then(({ data }) => setUser(data.data.user)).catch(() => setUser(null)).finally(() => setLoading(false));
  }, []);

  async function login(values) {
    const { data } = await apiClient.post('/auth/login', values);
    setUser(data.data.user);
    return data.data.user;
  }

  async function register(values) {
    const { data } = await apiClient.post('/auth/register', values);
    setUser(data.data.user);
    return data.data.user;
  }

  async function logout() {
    await apiClient.post('/auth/logout');
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, setUser, loading, login, register, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider.');
  return context;
}

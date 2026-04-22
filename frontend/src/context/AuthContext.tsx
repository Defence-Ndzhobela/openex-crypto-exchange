import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types.ts';
import { mockApi } from '../services/api.ts';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  updateBalances: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (credentials: any) => {
    const res = await mockApi.login(credentials);
    setUser(res.data.user);
  };

  const register = async (data: any) => {
    await mockApi.register(data);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateBalances = async () => {
    const res = await mockApi.getBalances();
    if (user) {
      setUser({ ...user, balances: res.data });
      localStorage.setItem('user', JSON.stringify({ ...user, balances: res.data }));
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateBalances }}>
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

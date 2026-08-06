import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/api/axios';
import { useNavigate } from 'react-router-dom';

interface User {
  id: number;
  username: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'WAITER' | 'BILLER' | 'KITCHEN';
}

interface AuthContextType {
  user: User | null;
  settings: any;
  loading: boolean;
  login: (access: string, refresh: string, userData: User) => void;
  logout: () => void;
  refreshSettings: () => Promise<void>;
  canAccess: (featureId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const canAccess = (featureId: string) => {
    if (!user) return false;

    // 1. User specific override (highest priority)
    const userOverride = settings.user_overrides?.[featureId];
    if (userOverride !== undefined) return userOverride === true;

    // 2. Global flags (e.g. KOT master switch)
    if (featureId === 'kot' && !settings.flags?.enable_kot) return false;

    // 3. Role based defaults
    const perms = settings.permissions?.[featureId];
    if (perms) {
      return perms[user.role] === true;
    }

    // Default: Admin/Manager can do anything not specified
    return user.role === 'ADMIN' || user.role === 'MANAGER';
  };

  const refreshSettings = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    try {
      const res = await api.get('/core/settings/');
      setSettings(res.data);
    } catch (err) {
      console.error("Failed to fetch settings", err);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const [settingsRes, userRes] = await Promise.all([
            api.get('/core/settings/'),
            api.get('/auth/me/')
          ]);
          setSettings(settingsRes.data);
          setUser(userRes.data);
        } catch (error) {
          console.error("Auth init failed", error);
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
      } else {
        // Optional: Still fetch public flags if needed, but for now just stop loading
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = (access: string, refresh: string, userData: User) => {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    setUser(userData);
    refreshSettings();
    navigate('/');
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, settings, loading, login, logout, refreshSettings, canAccess }}>
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

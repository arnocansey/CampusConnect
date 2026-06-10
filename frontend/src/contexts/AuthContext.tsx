import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import api from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  signup: (data: any) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');

      if (token) {
        try {
          const { data } = await api.get('/auth/me');
          setUser(data.data);
          connectSocket();
        } catch (error: any) {
          if (error.response?.status === 401 && refreshToken) {
            try {
              const { data } = await axios.post('/api/auth/refresh-token', { refreshToken });
              const isPersisted = !!localStorage.getItem('refreshToken');
              const storage = isPersisted ? localStorage : sessionStorage;
              storage.setItem('accessToken', data.data.accessToken);
              storage.setItem('refreshToken', data.data.refreshToken);
              const { data: meData } = await api.get('/auth/me');
              setUser(meData.data);
              connectSocket();
            } catch {
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
              sessionStorage.removeItem('accessToken');
              sessionStorage.removeItem('refreshToken');
            }
          } else {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            sessionStorage.removeItem('accessToken');
            sessionStorage.removeItem('refreshToken');
          }
        }
      }
      setLoading(false);
    };

    initAuth();

    return () => {
      disconnectSocket();
    };
  }, []);

  const login = async (email: string, password: string, rememberMe: boolean = true) => {
    const { data } = await api.post('/auth/login', { email, password, rememberMe });
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem('accessToken', data.data.accessToken);
    storage.setItem('refreshToken', data.data.refreshToken);
    setUser(data.data.user);
    connectSocket();
  };

  const signup = async (signupData: any) => {
    await api.post('/auth/signup', signupData);
    // Don't auto-login — redirect to login page instead
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    setUser(null);
    disconnectSocket();
  };

  const updateUser = (data: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...data } : null));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateUser }}>
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

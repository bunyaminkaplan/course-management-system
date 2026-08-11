import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { setTokens, clearTokens, getTokens } from '../services/api';

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'ADMIN' | 'INSTRUCTOR' | 'STUDENT';
  is_counselor?: boolean;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<UserProfile>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const decodeToken = (token: string): { user_id: number } | null => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Failed to decode JWT token:', e);
    return null;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async (userId: number): Promise<UserProfile> => {
    const data = await api.get(`/api/users/${userId}/`);
    setUser(data);
    return data;
  };

  const loadInitialUser = async () => {
    const { access } = getTokens();
    if (access) {
      const decoded = decodeToken(access);
      if (decoded && decoded.user_id) {
        try {
          await fetchProfile(decoded.user_id);
        } catch (e) {
          console.error('Failed to load user profile with initial token', e);
          clearTokens();
          setUser(null);
        }
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadInitialUser();

    const handleAuthLogout = () => {
      setUser(null);
    };

    window.addEventListener('auth-logout', handleAuthLogout);
    return () => {
      window.removeEventListener('auth-logout', handleAuthLogout);
    };
  }, []);

  const login = async (username: string, password: string): Promise<UserProfile> => {
    setError(null);
    setLoading(true);
    try {
      const tokenData = await api.post('/api/token/', { username, password });
      setTokens(tokenData.access, tokenData.refresh);
      
      const decoded = decodeToken(tokenData.access);
      if (!decoded || !decoded.user_id) {
        throw new Error('Invalid response from server (missing user token claims)');
      }
      
      const profile = await fetchProfile(decoded.user_id);
      setLoading(false);
      return profile;
    } catch (e: any) {
      setLoading(false);
      const message = e.message || 'Login failed. Please check your credentials.';
      setError(message);
      throw new Error(message);
    }
  };

  const logout = async () => {
    try {
      await api.post('/api/logout/');
    } catch (e) {
      // Ignore network errors on logout
      console.warn("Backend logout notification failed", e);
    }
    clearTokens();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { User } from '../types/api';
import { apiClient } from '../api/client';
import { jwtDecode } from 'jwt-decode';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkToken();
    
    const handleLogout = () => {
      setUser(null);
    };
    const subscription = DeviceEventEmitter.addListener('auth:logout', handleLogout);
    console.log("AuthContext mounted");
    return () => subscription.remove();
  }, []);

  const checkToken = async () => {
    try {
      // Because we used localStorage in the mock, we can just get it synchronously
      // But we will use the async API
      const token = await apiClient.getTokens?.();
      if (token) {
        try {
          const decoded: any = jwtDecode(token);
          if (decoded.user_id) {
            const userData = await apiClient.get<User>(`/api/users/${decoded.user_id}/`);
            setUser(userData);
          }
        } catch (e) {
          // Token is likely expired or invalid. 
          // apiClient already emits 'auth:logout' to clear the state, 
          // but we can explicitly set it to null here as well without throwing a noisy RedBox.
          setUser(null);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    const { access, refresh } = await apiClient.post<{ access: string, refresh: string }>('/api/token/', { username, password });
    await apiClient.setTokens(access, refresh);
    const decoded: any = jwtDecode(access);
    const userData = await apiClient.get<User>(`/api/users/${decoded.user_id}/`);
    setUser(userData);
  };

  const logout = async () => {
    await apiClient.clearTokens();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

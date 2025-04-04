import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from '../services/api';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const [storedToken, storedUser] = await Promise.all([
        AsyncStorage.getItem('token'),
        AsyncStorage.getItem('user')
      ]);

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (newToken: string, newUser: User) => {
    try {
      await Promise.all([
        AsyncStorage.setItem('token', newToken),
        AsyncStorage.setItem('user', JSON.stringify(newUser))
      ]);
      setToken(newToken);
      setUser(newUser);
    } catch (error) {
      console.error('Error storing auth data:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem('token'),
        AsyncStorage.removeItem('user')
      ]);
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Error removing auth data:', error);
      throw error;
    }
  };

  const refreshToken = async () => {
    try {
      if (!token) throw new Error('No token to refresh');
      
      const response = await authApi.refreshToken(token);
      await login(response.token, response.user);
    } catch (error) {
      console.error('Error refreshing token:', error);
      await logout();
      throw error;
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    refreshToken
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

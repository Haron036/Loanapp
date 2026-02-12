import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { authApi } from './api';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Track the initial session check

  // Initialize auth state from storage on mount
  useEffect(() => {
    const initAuth = () => {
      const storedUser = localStorage.getItem('lendwise_user');
      const token = localStorage.getItem('token');
      
      if (storedUser && token) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (error) {
          console.error("Failed to parse stored user", error);
          localStorage.clear();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const { data } = await authApi.login({ email, password });
      const userData = { 
        id: data.userId, 
        name: data.name, 
        email: data.email, 
        role: data.role 
      };

      localStorage.setItem('token', data.token);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('lendwise_user', JSON.stringify(userData));

      setUser(userData);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Login failed' };
    }
  }, []);

  const register = useCallback(async (registrationData) => {
    try {
      const { data } = await authApi.register(registrationData);
      const userData = { id: data.userId, name: data.name, email: data.email, role: data.role };

      localStorage.setItem('token', data.token);
      localStorage.setItem('lendwise_user', JSON.stringify(userData));

      setUser(userData);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Registration failed' };
    }
  }, []);

  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch (e) { console.warn("Logout error", e); }
    localStorage.clear();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      loading, 
      login, 
      logout, 
      register 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
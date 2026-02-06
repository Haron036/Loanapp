import React, { createContext, useContext, useState, useCallback } from 'react';
import { authApi } from './api'; // Adjust path as needed

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('lendwise_user');
    const token = localStorage.getItem('token');
    
    try {
      if (storedUser && token) {
        return JSON.parse(storedUser);
      }
      return null;
    } catch (e) {
      return null;
    }
  });

  /* ================= LOGIN ================= */
  const login = useCallback(async (email, password) => {
  try {
    const response = await authApi.login({ email, password });
    const { token, refreshToken, name, userId, email: userEmail, role } = response.data;

    const userData = { id: userId, name, email: userEmail, role }; // singular 'role'

    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('lendwise_user', JSON.stringify(userData));

    setUser(userData);
    return { success: true };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: error.response?.data?.message || 'Invalid email or password' };
  }
}, []);

const register = useCallback(async (registrationData) => {
  try {
    const response = await authApi.register(registrationData);
    const { token, refreshToken, name, userId, email, role } = response.data;

    const userData = { id: userId, name, email, role }; // singular 'role'

    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('lendwise_user', JSON.stringify(userData));

    setUser(userData);
    return { success: true };
  } catch (error) {
    console.error('Registration error:', error);
    return { 
      success: false, 
      message: error.response?.data?.message || 'Registration failed.',
      details: error.response?.data?.details
    };
  }
}, []);

  /* ================= LOGOUT ================= */
  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('lendwise_user');
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      login, 
      logout, 
      register 
    }}>
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
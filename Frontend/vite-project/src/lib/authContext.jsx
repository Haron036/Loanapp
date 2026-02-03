import React, { createContext, useContext, useState, useCallback } from 'react';
import { authApi } from './api'; // Adjust import path as needed

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('lendwise_user');
    const token = localStorage.getItem('token');
    const refreshToken = localStorage.getItem('refreshToken');
    
    try {
      if (storedUser && token) {
        const parsedUser = JSON.parse(storedUser);
        // Optionally validate token here or check expiry
        return parsedUser;
      }
      return null;
    } catch (e) {
      return null;
    }
  });

  const login = useCallback(async (email, password) => {
    try {
      const response = await authApi.login({ email, password });
      const { token, refreshToken, user: userData } = response.data;
      
      // Store tokens and user data
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('lendwise_user', JSON.stringify(userData));
      
      setUser(userData);
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Invalid email or password' 
      };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with client-side logout even if API call fails
    } finally {
      // Clear all auth-related storage
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('lendwise_user');
      setUser(null);
    }
  }, []);

  const register = useCallback(async (name, email, password) => {
    try {
      const response = await authApi.register({ 
        name, 
        email, 
        password 
      });
      
      const { token, refreshToken, user: userData } = response.data;
      
      // Store tokens and user data
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('lendwise_user', JSON.stringify(userData));
      
      setUser(userData);
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Registration failed. Please try again.' 
      };
    }
  }, []);

  // Optional: Function to refresh user data from backend
  const refreshUserData = useCallback(async () => {
    if (!user) return;
    
    try {
      const response = await userApi.getProfile();
      const updatedUser = { ...user, ...response.data };
      localStorage.setItem('lendwise_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      return updatedUser;
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      // If unauthorized, force logout
      if (error.response?.status === 401) {
        logout();
      }
      return user;
    }
  }, [user, logout]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      login, 
      logout, 
      register,
      refreshUserData 
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
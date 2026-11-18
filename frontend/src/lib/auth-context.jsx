'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('silicon_token');
    const savedUser = localStorage.getItem('silicon_user');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        // Refresh profile in background
        authApi.getMe()
          .then((freshUser) => {
            setUser(freshUser);
            localStorage.setItem('silicon_user', JSON.stringify(freshUser));
          })
          .catch(() => {
            // Token expired or invalid
            logout();
          })
          .finally(() => setLoading(false));
        return;
      } catch (e) {
        logout();
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await authApi.login(email, password);
    setToken(res.token);
    setUser(res.user);
    localStorage.setItem('silicon_token', res.token);
    localStorage.setItem('silicon_user', JSON.stringify(res.user));
    return res.user;
  };

  const register = async (name, email, password, extra = {}) => {
    const res = await authApi.register(name, email, password, extra);
    if (res.token && res.user) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('silicon_token', res.token);
      localStorage.setItem('silicon_user', JSON.stringify(res.user));
    }
    return res;
  };

  const verifyEmail = async (email, code, extra = {}) => {
    const res = await authApi.verifyEmail(email, code, extra);
    if (res.token && res.user) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('silicon_token', res.token);
      localStorage.setItem('silicon_user', JSON.stringify(res.user));
    }
    return res.user;
  };

  const updateProfile = async (data) => {
    const res = await authApi.updateProfile(data);
    if (res.user) {
      setUser((prev) => ({ ...prev, ...res.user }));
      localStorage.setItem('silicon_user', JSON.stringify({ ...user, ...res.user }));
    }
    return res.user;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('silicon_token');
    localStorage.removeItem('silicon_user');
  };

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isClubAdmin = user?.role === 'CLUB_ADMIN';
  const isStudent = user?.role === 'STUDENT';
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        verifyEmail,
        updateProfile,
        logout,
        isAuthenticated,
        isSuperAdmin,
        isClubAdmin,
        isStudent,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

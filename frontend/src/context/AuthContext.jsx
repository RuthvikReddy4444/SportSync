import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('pr_user') || 'null');
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('pr_token') || null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login'); // 'login' or 'register'
  const [authRoleChoice, setAuthRoleChoice] = useState('customer'); // default for registration
  const [toast, setToast] = useState({ message: '', type: 'info' });

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast({ message: '', type: 'info' });
    }, 4000);
  };

  const handleAuthSuccess = (tokenStr, userObj, msg) => {
    localStorage.setItem('pr_token', tokenStr);
    localStorage.setItem('pr_user', JSON.stringify(userObj));
    setToken(tokenStr);
    setUser(userObj);
    setAuthModalOpen(false);
    showToast(msg || `Welcome, ${userObj.name}!`, 'success');
  };

  const login = async (email, password) => {
    const res = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    handleAuthSuccess(res.token, res.user, `Welcome back, ${res.user.name}!`);
    return res.user;
  };

  const register = async (userData) => {
    const res = await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    handleAuthSuccess(res.token, res.user, `Account created! Welcome to PlayReserve, ${res.user.name}.`);
    return res.user;
  };

  const demoLogin = async (email, password) => {
    try {
      const res = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      handleAuthSuccess(res.token, res.user, `Signed in as ${res.user.name} (${res.user.role.toUpperCase()})`);
      return res.user;
    } catch (err) {
      showToast(err.message, 'error');
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('pr_token');
    localStorage.removeItem('pr_user');
    setToken(null);
    setUser(null);
    showToast('Logged out successfully.', 'info');
  };

  const updateProfile = async (updates) => {
    const res = await api('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
    setUser(res.user);
    localStorage.setItem('pr_user', JSON.stringify(res.user));
    showToast('Profile updated successfully!', 'success');
    return res.user;
  };

  const changePassword = async (old_password, new_password) => {
    const res = await api('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ old_password, new_password })
    });
    showToast(res.message || 'Password changed successfully!', 'success');
  };

  const openAuth = (mode = 'login', role = 'customer') => {
    setAuthModalMode(mode);
    setAuthRoleChoice(role);
    setAuthModalOpen(true);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        role: user?.role || 'guest',
        login,
        register,
        demoLogin,
        logout,
        updateProfile,
        changePassword,
        authModalOpen,
        setAuthModalOpen,
        authModalMode,
        setAuthModalMode,
        authRoleChoice,
        setAuthRoleChoice,
        openAuth,
        toast,
        showToast
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

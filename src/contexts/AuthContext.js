import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from '../utils/axiosConfig';
import { getApiUrl } from '../config/api';

const AuthContext = createContext({
  user: null,
  loading: true,
  login: () => {},
  logout: () => {},
  updateUserSettings: () => {},
  refreshUser: () => {}
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching user data...');
      const response = await axios.get(getApiUrl('auth/me'));
      console.log('User data response:', response.data);
      setUser(response.data);
      localStorage.setItem('user', JSON.stringify(response.data));
    } catch (error) {
      console.error('Failed to load user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  // Fetch user data on mount and every 30 seconds
  useEffect(() => {
    fetchUserData();
    const interval = setInterval(fetchUserData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const login = async (credentials) => {
    try {
      const response = await axios.post(getApiUrl('auth/login'), credentials);
      const { token, user } = response.data;
      localStorage.setItem('authToken', token);
      localStorage.setItem('isAuthenticated', 'true');
      setUser(user);
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    localStorage.removeItem('isAuthenticated');
  };

  const updateUserSettings = async (settings) => {
    try {
      const response = await axios.put(getApiUrl('users/settings'), settings);
      const updatedUser = response.data.user;
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return { success: true };
    } catch (error) {
      console.error('Settings update failed:', error);
      return { success: false, error: error.response?.data?.error || 'Failed to update settings' };
    }
  };

  const refreshUser = async () => {
    try {
      console.log('Refreshing user data...');
      const response = await axios.get(getApiUrl('auth/me'));
      console.log('Refresh user data response:', response.data);
      setUser(response.data);
      localStorage.setItem('user', JSON.stringify(response.data));
      return response.data;
    } catch (error) {
      console.error('Failed to refresh user:', error);
      return null;
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    updateUserSettings,
    setUser,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
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

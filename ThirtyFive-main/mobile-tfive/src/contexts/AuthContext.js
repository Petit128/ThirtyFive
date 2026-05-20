import React, { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredData();
  }, []);

  const loadStoredData = async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      const storedUser = await AsyncStorage.getItem('user');
      
      if (token && storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        api.defaults.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user: userData } = response.data;
      
      await SecureStore.setItemAsync('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      
      api.defaults.headers.Authorization = `Bearer ${token}`;
      setUser(userData);
      
      return { success: true, user: userData };
    } catch (error) {
      console.error('Erreur login:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Erreur de connexion' 
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Erreur register:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Erreur d\'inscription' 
      };
    }
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('token');
    await AsyncStorage.removeItem('user');
    delete api.defaults.headers.Authorization;
    setUser(null);
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await api.put('/users/profile', profileData);
      const updatedUser = { ...user, ...response.data.user };
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      return { success: true, user: updatedUser };
    } catch (error) {
      console.error('Erreur update profile:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Erreur mise à jour' 
      };
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      logout,
      updateProfile,
      isAuthenticated: !!user,
      isStudent: user?.role === 'student',
      isProfessor: user?.role === 'professor',
      isAdmin: user?.role === 'admin'
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
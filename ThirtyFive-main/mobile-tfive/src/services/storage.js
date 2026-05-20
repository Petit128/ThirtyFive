import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

// Stockage sécurisé pour les tokens
export const storage = {
  // Token (sécurisé)
  setToken: async (token) => {
    try {
      await SecureStore.setItemAsync('token', token);
      return true;
    } catch (error) {
      console.error('Erreur sauvegarde token:', error);
      return false;
    }
  },
  
  getToken: async () => {
    try {
      return await SecureStore.getItemAsync('token');
    } catch (error) {
      console.error('Erreur lecture token:', error);
      return null;
    }
  },
  
  deleteToken: async () => {
    try {
      await SecureStore.deleteItemAsync('token');
      return true;
    } catch (error) {
      console.error('Erreur suppression token:', error);
      return false;
    }
  },
  
  // Utilisateur (AsyncStorage)
  setUser: async (user) => {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(user));
      return true;
    } catch (error) {
      console.error('Erreur sauvegarde user:', error);
      return false;
    }
  },
  
  getUser: async () => {
    try {
      const user = await AsyncStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Erreur lecture user:', error);
      return null;
    }
  },
  
  deleteUser: async () => {
    try {
      await AsyncStorage.removeItem('user');
      return true;
    } catch (error) {
      console.error('Erreur suppression user:', error);
      return false;
    }
  },
  
  // Données générales
  setItem: async (key, value) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Erreur sauvegarde ${key}:`, error);
      return false;
    }
  },
  
  getItem: async (key) => {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Erreur lecture ${key}:`, error);
      return null;
    }
  },
  
  removeItem: async (key) => {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Erreur suppression ${key}:`, error);
      return false;
    }
  },
  
  // Nettoyer tout
  clearAll: async () => {
    try {
      await SecureStore.deleteItemAsync('token');
      await AsyncStorage.clear();
      return true;
    } catch (error) {
      console.error('Erreur nettoyage:', error);
      return false;
    }
  },
};

export default storage;
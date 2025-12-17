import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiLogin } from '../utils/api';

const STORAGE_KEY = 'WTM_AUTH_USER';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load persisted session on app start (infinite session)
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          setUser(parsed);
        }
      } catch (e) {
        console.warn('Failed to load session', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async ({ username, avatarUri, viewMode }) => {
    try {
      const backendUser = await apiLogin(username);
      const nextUser = {
        id: backendUser.id,
        username: backendUser.username,
        name: backendUser.name,
        isEmployer: backendUser.isEmployer, // Rola z backendu
        viewMode: viewMode || (backendUser.isEmployer ? 'employer' : 'employee'), // Tryb widoku
        avatarUri: avatarUri || null,
      };
      setUser(nextUser);
      // Store session indefinitely (no expiry) in AsyncStorage
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
    } catch (e) {
      // Fallback to local-only session if backend unavailable
      // This allows offline mode: user can still use app with local data
      const nextUser = { 
        id: username, // Use username as temp ID when offline
        username, 
        name: username, 
        isEmployer: false,
        viewMode: viewMode || 'employee',
        avatarUri: avatarUri || null,
        isOffline: true, // Flag to indicate offline session
      };
      setUser(nextUser);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
    }
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem(STORAGE_KEY);
  };

  const updatePhoto = async (uri) => {
    const nextUser = user ? { ...user, avatarUri: uri } : { username: '', avatarUri: uri };
    setUser(nextUser);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
  };

  const value = useMemo(() => ({ user, loading, login, logout, updatePhoto }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

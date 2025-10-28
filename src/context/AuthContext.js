import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiLogin } from '../utils/api';

const STORAGE_KEY = 'WTM_AUTH_USER';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          setUser(JSON.parse(raw));
        }
      } catch (e) {
        console.warn('Failed to load session', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async ({ email, avatarUri, roleOverride }) => {
    try {
      const backendUser = await apiLogin(email);
      const nextUser = {
        id: backendUser.id,
        email: backendUser.email,
        name: backendUser.name,
        role: roleOverride || backendUser.role,
        avatarUri: avatarUri || null,
      };
      setUser(nextUser);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
    } catch (e) {
      // Fallback to local-only session if backend unavailable
      const nextUser = { id: null, email, name: email.split('@')[0], role: roleOverride || 'Kelner', avatarUri: avatarUri || null };
      setUser(nextUser);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
    }
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem(STORAGE_KEY);
  };

  const updatePhoto = async (uri) => {
    const nextUser = user ? { ...user, avatarUri: uri } : { email: '', avatarUri: uri };
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

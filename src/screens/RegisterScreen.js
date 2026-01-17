import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { colors, spacing, radius } from '../utils/theme';
import Screen from '../components/Screen';
import { apiRegister } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RegisterScreen({ navigation }) {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const onRegister = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Wszystkie pola są wymagane');
      return;
    }
    if (password !== confirmPassword) {
      setError('Hasła nie są identyczne');
      return;
    }
    if (password.length < 4) {
      setError('Hasło musi mieć min. 4 znaki');
      return;
    }
    
    setError('');
    setLoading(true);

    try {
      // 1. Register
      const user = await apiRegister(username, password);
      
      // 2. Auto-login
      await login({ username: user.username, password });
      
      // 3. Save username hint
      try { await AsyncStorage.setItem('WTM_LAST_USERNAME', username.trim()); } catch {}

      // 4. Navigate to Onboarding
      navigation.replace('Onboarding'); 
      
    } catch (e) {
      console.error(e);
      setError(e.message || 'Błąd rejestracji');
    } finally {
      setLoading(false);
    }
  };

  const valid = username.trim().length > 0 && password.length >= 4 && password === confirmPassword;

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Rejestracja</Text>
        <Text style={styles.subtitle}>Utwórz konto w WorkTime</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Nazwa użytkownika</Text>
        <TextInput
          value={username}
          onChangeText={setUsername}
          placeholder="np. jan.kowalski"
          autoCapitalize="none"
          style={styles.input}
          placeholderTextColor={colors.muted}
        />

        <Text style={[styles.label, { marginTop: spacing.md }]}>Hasło</Text>
        <View style={{ position: 'relative' }}>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry={!showPassword}
            style={[styles.input, { paddingRight: 64 }]}
            placeholderTextColor={colors.muted}
          />
          <TouchableOpacity style={styles.reveal} onPress={() => setShowPassword((v) => !v)}>
            <Text style={{ color: colors.primary, fontWeight: '600' }}>{showPassword ? 'Ukryj' : 'Pokaż'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.label, { marginTop: spacing.md }]}>Powtórz hasło</Text>
        <TextInput
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="••••••••"
          secureTextEntry={!showPassword}
          style={styles.input}
          placeholderTextColor={colors.muted}
        />

        {!!error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity 
          style={[styles.button, (!valid || loading) && styles.buttonDisabled]} 
          onPress={onRegister} 
          disabled={!valid || loading}
        >
          <Text style={styles.buttonText}>{loading ? 'Rejestrowanie...' : 'Utwórz konto'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={{ marginTop: spacing.lg, alignItems: 'center' }} onPress={() => navigation.navigate('Login')}>
           <Text style={{ color: colors.primary, fontWeight: '500' }}>Masz już konto? Zaloguj się</Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    marginTop: 6,
    color: colors.muted,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  label: {
    color: colors.muted,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F2F4F8',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: '#E6EAF2',
    color: colors.text,
  },
  error: {
    color: '#D7263D',
    marginTop: 8,
  },
  button: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
  },
  reveal: {
    position: 'absolute',
    right: spacing.md,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
});

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { colors, spacing, radius } from '../utils/theme';
import Screen from '../components/Screen';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [modeEmployer, setModeEmployer] = useState(false); // subtle mode toggle

  const onSubmit = async () => {
    if (!username.trim()) {
      setError('Podaj nazwę użytkownika');
      return;
    }
    if (!password.trim()) {
      setError('Podaj hasło');
      return;
    }
    if (password.length < 4) {
      setError('Hasło musi mieć min. 4 znaki');
      return;
    }
    setError('');
    await login({ username, viewMode: modeEmployer ? 'employer' : 'employee' });
    try { await AsyncStorage.setItem('WTM_LAST_USERNAME', username.trim()); } catch {}
  };

  const valid = username.trim().length > 0 && password.length >= 4;

  useEffect(() => {
    (async () => {
      try {
        const last = await AsyncStorage.getItem('WTM_LAST_USERNAME');
        if (last) setUsername(last);
      } catch {}
    })();
  }, []);

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>WorkTime</Text>
        <Text style={styles.subtitle}>Zaloguj się, aby kontynuować</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Nazwa użytkownika</Text>
        <TextInput
          value={username}
          onChangeText={setUsername}
          placeholder="jan.kowalski"
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

        {!!error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity style={[styles.button, !valid && styles.buttonDisabled]} onPress={onSubmit} disabled={!valid}>
          <Text style={styles.buttonText}>Zaloguj</Text>
        </TouchableOpacity>

        {/* <Text style={styles.hint}>To mock — wpisz dowolny e-mail i hasło.</Text> */}

        <View style={{ alignItems: 'center', marginTop: spacing.sm }}>
          <TouchableOpacity onPress={() => setModeEmployer((v) => !v)}>
            <Text style={{ color: colors.muted }}>
              Tryb: <Text style={{ color: colors.primary, fontWeight: '600' }}>{modeEmployer ? 'Pracodawca' : 'Pracownik'}</Text>
            </Text>
          </TouchableOpacity>
        </View>
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
  hint: {
    marginTop: spacing.md,
    color: colors.muted,
    textAlign: 'center',
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

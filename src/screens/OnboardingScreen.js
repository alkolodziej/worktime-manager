import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { colors, spacing, radius } from '../utils/theme';
import Screen from '../components/Screen';
import { apiGetPositions, apiUpdateUserProfile, apiAssignPositions } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Badge from '../components/Badge';

export default function OnboardingScreen() {
  const { user, login, refreshUser } = useAuth(); // login used here to refresh user context if needed
  const [name, setName] = useState(user?.name || user?.username || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [positions, setPositions] = useState([]);
  const [selectedPositionId, setSelectedPositionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const positionsData = await apiGetPositions();
      setPositions(positionsData);
    } catch (e) {
      console.error(e);
      Alert.alert('Błąd', 'Nie udało się pobrać stanowisk');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Uwaga', 'Proszę podać imię i nazwisko');
      return;
    }
    if (!selectedPositionId) {
      Alert.alert('Uwaga', 'Proszę wybrać stanowisko');
      return;
    }

    setSaving(true);
    try {
      // 1. Update Profile
      await apiUpdateUserProfile(user.id, {
        name,
        phone,
      });

      // 2. Assign Position
      await apiAssignPositions(user.id, [selectedPositionId]);

      // 3. Refresh Context to exit Onboarding
      await refreshUser();
      
    } catch (e) {
      console.error(e);
      Alert.alert('Błąd', 'Nie udało się zapisać zmian.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Witaj, {user?.username}!</Text>
        <Text style={styles.subtitle}>Uzupełnij swój profil, aby zacząć.</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Twoje dane</Text>
          
          <Text style={styles.label}>Imię i nazwisko</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Jan Kowalski"
            style={styles.input}
            placeholderTextColor={colors.muted}
          />

          <Text style={[styles.label, { marginTop: spacing.md }]}>Telefon (opcjonalnie)</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="123 456 789"
            keyboardType="phone-pad"
            style={styles.input}
            placeholderTextColor={colors.muted}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Wybierz stanowisko</Text>
          {loading ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <View style={styles.grid}>
              {positions.map((pos) => {
                const isSelected = selectedPositionId === pos.id;
                return (
                  <TouchableOpacity
                    key={pos.id}
                    style={[
                      styles.positionCard,
                      isSelected && { borderColor: pos.color, backgroundColor: pos.color + '10' }
                    ]}
                    onPress={() => setSelectedPositionId(pos.id)}
                  >
                     <Badge 
                        color={pos.color} 
                        style={{ alignSelf: 'flex-start', marginBottom: spacing.sm }} 
                        size="md"
                      />
                    <Text style={[styles.posName, isSelected && { color: pos.color }]}>{pos.name}</Text>
                    {/* <Text style={styles.posDesc} numberOfLines={2}>{pos.description}</Text> */}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        <TouchableOpacity 
          style={[styles.button, saving && styles.buttonDisabled]} 
          onPress={onSubmit}
          disabled={saving}
        >
          <Text style={styles.buttonText}>{saving ? 'Zapisywanie...' : 'Rozpocznij pracę'}</Text>
        </TouchableOpacity>

      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  positionCard: {
    width: '47%',
    backgroundColor: '#fff',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  posName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  posDesc: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  button: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: radius.xl,
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});

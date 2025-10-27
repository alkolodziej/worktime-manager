import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '../utils/theme';

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.avatar} />
      <Text style={styles.name}>Jan Kowalski</Text>
      <Text style={styles.email}>jan.kowalski@example.com</Text>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Przepracowane godziny</Text>
        <Text style={styles.cardValue}>128 h</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    padding: spacing.lg,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#DFE7F3',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  email: {
    marginTop: 4,
    color: colors.muted,
  },
  card: {
    width: '100%',
    marginTop: spacing.xl,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardLabel: {
    color: colors.muted,
  },
  cardValue: {
    marginTop: 6,
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
});

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, radius } from '../utils/theme';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dzisiejsza zmiana</Text>

      <View style={styles.card}>
        <Text style={styles.shiftText}>12:00 – 20:00</Text>
        <Text style={styles.metaText}>Restauracja • Kelner</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={[styles.button, styles.inButton]}>
          <Text style={styles.buttonText}>Wejdź do pracy</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.outButton]} disabled>
          <Text style={[styles.buttonText, styles.outText]}>Wyjdź z pracy</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>Ten tydzień</Text>
        <Text style={styles.summaryHours}>16 h 30 min</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.card,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  shiftText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  metaText: {
    marginTop: 6,
    color: colors.muted,
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  inButton: {
    backgroundColor: colors.primary,
  },
  outButton: {
    backgroundColor: '#E9EEF8',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  outText: {
    color: colors.primary,
  },
  summary: {
    marginTop: spacing.xl,
    backgroundColor: colors.card,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryTitle: {
    color: colors.muted,
  },
  summaryHours: {
    marginTop: 4,
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
});

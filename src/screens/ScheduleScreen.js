import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { colors, spacing, radius } from '../utils/theme';

const MOCK_SHIFTS = [
  { id: '1', date: 'Pon, 28.10', hours: '12:00 – 20:00' },
  { id: '2', date: 'Wto, 29.10', hours: '14:00 – 22:00' },
  { id: '3', date: 'Czw, 31.10', hours: '10:00 – 18:00' },
];

function ShiftItem({ item }) {
  return (
    <View style={styles.item}>
      <Text style={styles.date}>{item.date}</Text>
      <Text style={styles.hours}>{item.hours}</Text>
    </View>
  );
}

export default function ScheduleScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Najbliższe zmiany</Text>
      <FlatList
        data={MOCK_SHIFTS}
        keyExtractor={(it) => it.id}
        renderItem={ShiftItem}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        contentContainerStyle={{ paddingVertical: spacing.md }}
      />
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
  },
  item: {
    backgroundColor: colors.card,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  date: {
    color: colors.muted,
  },
  hours: {
    marginTop: 6,
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
});

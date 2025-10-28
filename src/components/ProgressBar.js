import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, radius } from '../utils/theme';

export default function ProgressBar({ value = 0 }) {
  const pct = Math.max(0, Math.min(1, value));
  return (
    <View style={styles.container}>
      <View style={[styles.fill, { width: `${pct * 100}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 10,
    backgroundColor: '#EEF2F8',
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
});

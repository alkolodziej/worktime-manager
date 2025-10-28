import React from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '../utils/theme';

export default function Badge({ label, tone = 'info', style }) {
  const bgMap = {
    info: '#EAF7FE',
    success: '#EAF9F0',
    warning: '#FFF8E6',
    danger: '#FFEDEE',
    neutral: '#F2F4F8',
  };
  const colorMap = {
    info: colors.info,
    success: colors.success,
    warning: '#C78900',
    danger: '#C72636',
    neutral: '#6B7280',
  };

  return (
    <View style={[styles.badge, { backgroundColor: bgMap[tone] }, style]}>
      <Text style={[styles.text, { color: colorMap[tone] }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.md,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});

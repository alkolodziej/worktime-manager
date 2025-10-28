import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../utils/theme';

export default function ListItem({ title, subtitle, meta, leftIcon, rightIcon = 'chevron-forward', style }) {
  return (
    <View style={[styles.row, style]}>
      <View style={styles.left}>
        {!!leftIcon && <Ionicons name={leftIcon} size={20} color={colors.muted} style={{ marginRight: spacing.md }} />}
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{title}</Text>
          {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.right}>
        {!!meta && <Text style={styles.meta}>{meta}</Text>}
        {!!rightIcon && <Ionicons name={rightIcon} size={18} color={'#C5CAD3'} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: spacing.md,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: colors.text,
    fontWeight: '600',
  },
  subtitle: {
    color: colors.muted,
    marginTop: 2,
  },
  meta: {
    color: colors.muted,
    marginRight: spacing.sm,
    fontSize: 12,
  },
});

import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import RNDateTimePicker from '@react-native-community/datetimepicker';
import { colors, spacing, radius } from '../utils/theme';

export default function DateTimePicker({ 
  value, 
  onChange,
  mode = 'date', // 'date' or 'time'
  label,
  placeholder = 'Wybierz',
  style
}) {
  const [show, setShow] = useState(false);

  const handleChange = (event, selectedValue) => {
    setShow(Platform.OS === 'ios'); // Only iOS keeps the picker open
    if (event.type === 'set' && selectedValue) {
      onChange(selectedValue);
    }
  };

  const formatValue = () => {
    if (!value) return placeholder;
    if (mode === 'date') {
      return value.toLocaleDateString('pl-PL');
    } else {
      return value.toLocaleTimeString('pl-PL', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    }
  };

  return (
    <View style={style}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity 
        onPress={() => setShow(true)}
        style={styles.input}
      >
        <Text style={[
          styles.value, 
          !value && styles.placeholder
        ]}>
          {formatValue()}
        </Text>
      </TouchableOpacity>

      {show && (
        <RNDateTimePicker
          value={value || new Date()}
          mode={mode}
          onChange={handleChange}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          is24Hour={true}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
    justifyContent: 'center',
  },
  value: {
    color: colors.text,
  },
  placeholder: {
    color: colors.muted,
  },
});
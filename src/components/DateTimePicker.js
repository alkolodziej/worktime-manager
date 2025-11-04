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
    
    // Na Androidzie event.type nie istnieje, ale otrzymujemy selectedValue
    // Na iOS sprawdzamy event.type === 'set'
    if (Platform.OS === 'android') {
      if (selectedValue) {
        onChange(selectedValue);
      }
    } else if (event.type === 'set' && selectedValue) {
      onChange(selectedValue);
    }
  };

  const formatValue = () => {
    if (!value || !(value instanceof Date)) return placeholder;
    try {
      if (mode === 'date') {
        return value.toLocaleDateString('pl-PL');
      } else {
        return value.toLocaleTimeString('pl-PL', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        });
      }
    } catch (error) {
      console.warn('Error formatting date:', error);
      return placeholder;
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
          value={value instanceof Date ? value : new Date()}
          mode={mode}
          onChange={handleChange}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          is24Hour={true}
          minimumDate={mode === 'date' ? new Date() : undefined}
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
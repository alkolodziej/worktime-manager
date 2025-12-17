import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform, Modal } from 'react-native';
import RNDateTimePicker from '@react-native-community/datetimepicker';
import { colors, spacing, radius } from '../utils/theme';

export default function DateTimePicker({ 
  value, 
  onChange,
  mode = 'date',
  label,
  placeholder = 'Wybierz',
  style
}) {
  const [show, setShow] = useState(false);

  const handleChange = (event, selectedValue) => {
    if (Platform.OS === 'android') {
      setShow(false);
    }
    if (selectedValue) {
      onChange(event, selectedValue);
      if (Platform.OS === 'ios') {
        setShow(false);
      }
    }
  };

  const handleCancel = () => {
    setShow(false);
  };

  const formatValue = () => {
    if (!value || !(value instanceof Date)) return placeholder;
    try {
      if (mode === 'date') {
        return value.toLocaleDateString('pl-PL', {
          weekday: 'short',
          day: 'numeric',
          month: 'short'
        });
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
        <Text style={{ fontSize: 18 }}>📅</Text>
      </TouchableOpacity>

      {/* iOS Modal Picker */}
      {show && Platform.OS === 'ios' && (
        <Modal
          transparent={true}
          animationType="slide"
          visible={show}
          onRequestClose={handleCancel}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalBackdrop} />
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={handleCancel}>
                  <Text style={styles.modalCancelText}>Anuluj</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>
                  {mode === 'date' ? 'Wybierz datę' : 'Wybierz godzinę'}
                </Text>
                <TouchableOpacity onPress={() => setShow(false)}>
                  <Text style={styles.modalConfirmText}>Gotowe</Text>
                </TouchableOpacity>
              </View>
              <RNDateTimePicker
                value={value instanceof Date ? value : new Date()}
                mode={mode}
                onChange={handleChange}
                display="spinner"
                is24Hour={true}
                minimumDate={mode === 'date' ? new Date() : undefined}
                textColor={colors.text}
                style={{ height: 200 }}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* Android Native Picker */}
      {show && Platform.OS === 'android' && (
        <RNDateTimePicker
          value={value instanceof Date ? value : new Date()}
          mode={mode}
          onChange={handleChange}
          display="default"
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  value: {
    color: colors.text,
    fontSize: 15,
  },
  placeholder: {
    color: colors.muted,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E6EAF2',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  modalCancelText: {
    fontSize: 16,
    color: colors.muted,
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
});
import React, { useState, useEffect } from 'react';
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
  const [tempDate, setTempDate] = useState(new Date());

  useEffect(() => {
    if (show && value) {
      setTempDate(value instanceof Date ? value : new Date(value));
    } else if (show && !value) {
      setTempDate(new Date());
    }
  }, [show, value]);

  const handleAndroidChange = (event, selectedValue) => {
    setShow(false);
    if (event.type === 'set' && selectedValue) {
      onChange(event, selectedValue);
    }
  };

  const handleIOSChange = (event, selectedValue) => {
    if (selectedValue) {
      setTempDate(selectedValue);
    }
  };

  const confirmIOS = () => {
    onChange({ type: 'set' }, tempDate);
    setShow(false);
  };

  const cancelIOS = () => {
    setShow(false);
  };

  const formatValue = () => {
    if (!value) return placeholder;
    const dateVal = value instanceof Date ? value : new Date(value);
    
    try {
      if (mode === 'date') {
        return dateVal.toLocaleDateString('pl-PL', {
          weekday: 'short',
          day: 'numeric',
          month: 'long'
        });
      } else {
        return dateVal.toLocaleTimeString('pl-PL', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        });
      }
    } catch (error) {
      return placeholder;
    }
  };

  return (
    <View style={style}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity 
        onPress={() => setShow(true)}
        style={styles.input}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.value, 
          !value && styles.placeholder
        ]}>
          {formatValue()}
        </Text>
        <View style={styles.iconContainer}>
            <Text style={styles.icon}>{mode === 'date' ? '📅' : '⏰'}</Text>
        </View>
      </TouchableOpacity>

      {/* iOS Modal Picker */}
      {show && Platform.OS === 'ios' && (
        <Modal
          transparent={true}
          animationType="fade"
          visible={show}
          onRequestClose={cancelIOS}
        >
          <TouchableOpacity 
            style={styles.modalOverlay} 
            activeOpacity={1} 
            onPress={cancelIOS}
          >
            <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={cancelIOS} style={styles.headerButton}>
                  <Text style={styles.modalCancelText}>Anuluj</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>
                  {mode === 'date' ? 'Wybierz datę' : 'Wybierz godzinę'}
                </Text>
                <TouchableOpacity onPress={confirmIOS} style={styles.headerButton}>
                  <Text style={styles.modalConfirmText}>Gotowe</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.pickerContainer}>
                <RNDateTimePicker
                  value={tempDate}
                  mode={mode}
                  onChange={handleIOSChange}
                  display="spinner"
                  is24Hour={true}
                  locale="pl-PL"
                  textColor={colors.text}
                  style={{ height: 200, width: '100%' }}
                />
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* Android Native Picker */}
      {show && Platform.OS === 'android' && (
        <RNDateTimePicker
          value={value instanceof Date ? value : new Date()}
          mode={mode}
          onChange={handleAndroidChange}
          display="default"
          is24Hour={true}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    color: colors.textSecondary,
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E6EAF2',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  value: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  placeholder: {
    color: colors.muted,
    fontWeight: '400',
  },
  iconContainer: {
    marginLeft: spacing.sm,
    backgroundColor: '#F2F4F8',
    padding: 6,
    borderRadius: 8,
  },
  icon: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F4F8',
  },
  headerButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  modalCancelText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  pickerContainer: {
    paddingTop: 10,
    alignItems: 'center',
  }
});
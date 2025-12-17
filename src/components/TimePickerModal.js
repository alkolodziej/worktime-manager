import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import RNDateTimePicker from '@react-native-community/datetimepicker';
import { colors, spacing } from '../utils/theme';

export default function TimePickerModal({
  visible,
  onClose,
  onSelect,
  initialTime = null,
  minTime = null,
  maxTime = null,
}) {
  const [hour, setHour] = useState(8);
  const [minute, setMinute] = useState(0);
  const [tempDate, setTempDate] = useState(new Date());

  const BASE_DATE = { year: 2024, month: 0, day: 1 };

  const timeStringToDate = (value) => {
    if (!value) return null;
    const parts = value.split(':').map(Number);
    if (parts.length !== 2 || parts.some((n) => Number.isNaN(n))) return null;
    return new Date(BASE_DATE.year, BASE_DATE.month, BASE_DATE.day, parts[0], parts[1]);
  };

  const clampDateToBounds = (date) => {
    if (!date) return date;
    const minDate = timeStringToDate(minTime);
    const maxDate = timeStringToDate(maxTime);
    if (minDate && date < minDate) return minDate;
    if (maxDate && date > maxDate) return maxDate;
    return date;
  };

  useEffect(() => {
    const initialDate = timeStringToDate(initialTime) || timeStringToDate(minTime);
    if (initialDate) {
      const clamped = clampDateToBounds(initialDate);
      setTempDate(clamped);
      setHour(clamped.getHours());
      setMinute(clamped.getMinutes());
    }
  }, [initialTime, minTime, maxTime]);

  const handleConfirm = () => {
    const selected = clampDateToBounds(new Date(BASE_DATE.year, BASE_DATE.month, BASE_DATE.day, hour, minute));
    const timeString = `${String(selected.getHours()).padStart(2, '0')}:${String(selected.getMinutes()).padStart(2, '0')}`;
    if (typeof onSelect === 'function') {
      onSelect(timeString);
    }
    onClose();
  };

  const handleTimeChange = (event, selectedDate) => {
    if (selectedDate) {
      const clamped = clampDateToBounds(selectedDate);
      setTempDate(clamped);
      setHour(clamped.getHours());
      setMinute(clamped.getMinutes());
    }
  };

  const handleAndroidTimeChange = (event, selectedDate) => {
    if (event.type === 'set' && selectedDate) {
      const clamped = clampDateToBounds(selectedDate);
      const h = clamped.getHours();
      const m = clamped.getMinutes();
      setHour(h);
      setMinute(m);
      const timeString = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      if (typeof onSelect === 'function') {
        onSelect(timeString);
      }
    }
    onClose();
  };

  // Android native time picker dialog
  if (Platform.OS === 'android') {
    const minDate = timeStringToDate(minTime);
    const maxDate = timeStringToDate(maxTime);
    return visible ? (
      <RNDateTimePicker
        value={new Date(2024, 0, 1, hour, minute)}
        mode="time"
        is24Hour={true}
        display="default"
        onChange={handleAndroidTimeChange}
        minimumDate={minDate || undefined}
        maximumDate={maxDate || undefined}
      />
    ) : null;
  }

  // iOS modal with native spinner
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity 
          style={styles.modalBackdrop} 
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.modalCancelText}>Anuluj</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Wybierz godzinę</Text>
            <TouchableOpacity onPress={handleConfirm}>
              <Text style={styles.modalConfirmText}>Gotowe</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.pickerContainer}>
            <RNDateTimePicker
              value={tempDate}
              mode="time"
              is24Hour={true}
              display="spinner"
              onChange={handleTimeChange}
              textColor={colors.text}
              style={{ height: 200 }}
              minimumDate={timeStringToDate(minTime) || undefined}
              maximumDate={timeStringToDate(maxTime) || undefined}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
  pickerContainer: {
    paddingVertical: spacing.md,
  },
});

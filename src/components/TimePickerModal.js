import React, { useState, useEffect } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import RNDateTimePicker from '@react-native-community/datetimepicker';
import { colors, spacing, radius } from '../utils/theme';

export default function TimePickerModal({
  visible,
  onConfirm,
  onCancel,
  value = '08:00',
}) {
  const [tempTime, setTempTime] = useState(value);
  const [hour, setHour] = useState(parseInt(value?.split(':')[0] || '08'));
  const [minute, setMinute] = useState(parseInt(value?.split(':')[1] || '00'));

  useEffect(() => {
    if (visible && value) {
      const [h, m] = value.split(':').map(Number);
      setHour(h);
      setMinute(m);
    }
  }, [visible, value]);

  const handleConfirm = () => {
    const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    onConfirm(timeStr);
  };

  const presetTimes = [
    { label: '08:00', hour: 8, minute: 0 },
    { label: '10:00', hour: 10, minute: 0 },
    { label: '12:00', hour: 12, minute: 0 },
    { label: '14:00', hour: 14, minute: 0 },
    { label: '16:00', hour: 16, minute: 0 },
    { label: '18:00', hour: 18, minute: 0 },
  ];

  const handleAndroidTimeChange = (event, date) => {
    if (date) {
      setHour(date.getHours());
      setMinute(date.getMinutes());
    }
  };

  const incrementHour = () => setHour(h => (h === 23 ? 0 : h + 1));
  const decrementHour = () => setHour(h => (h === 0 ? 23 : h - 1));
  const incrementMinute = () => setMinute(m => (m === 55 ? 0 : m + 5));
  const decrementMinute = () => setMinute(m => (m === 0 ? 55 : m - 5));

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onCancel}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.overlay} />
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onCancel} style={styles.headerButton}>
              <Text style={styles.headerButtonText}>Anuluj</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Wybierz godzinę</Text>
            <TouchableOpacity onPress={handleConfirm} style={styles.headerButton}>
              <Text style={[styles.headerButtonText, { color: colors.primary, fontWeight: '700' }]}>
                Gotowe
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Display */}
            <View style={styles.displayContainer}>
              <Text style={styles.displayText}>
                {String(hour).padStart(2, '0')}:{String(minute).padStart(2, '0')}
              </Text>
            </View>

            {/* Picker */}
            {Platform.OS === 'ios' ? (
              <View style={styles.iosPickerContainer}>
                <View style={styles.timeColumn}>
                  <Text style={styles.label}>Godzina</Text>
                  <View style={styles.pickerControls}>
                    <TouchableOpacity
                      style={styles.controlButton}
                      onPress={decrementHour}
                    >
                      <Text style={styles.controlButtonText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.timeValue}>{String(hour).padStart(2, '0')}</Text>
                    <TouchableOpacity
                      style={styles.controlButton}
                      onPress={incrementHour}
                    >
                      <Text style={styles.controlButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={styles.timeSeparator}>:</Text>

                <View style={styles.timeColumn}>
                  <Text style={styles.label}>Minuta</Text>
                  <View style={styles.pickerControls}>
                    <TouchableOpacity
                      style={styles.controlButton}
                      onPress={decrementMinute}
                    >
                      <Text style={styles.controlButtonText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.timeValue}>{String(minute).padStart(2, '0')}</Text>
                    <TouchableOpacity
                      style={styles.controlButton}
                      onPress={incrementMinute}
                    >
                      <Text style={styles.controlButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.androidPickerContainer}>
                <RNDateTimePicker
                  value={new Date(2024, 0, 1, hour, minute)}
                  mode="time"
                  onChange={handleAndroidTimeChange}
                  display="spinner"
                  is24Hour={true}
                />
              </View>
            )}

            {/* Preset Times */}
            <View style={styles.presetsContainer}>
              <Text style={styles.presetsLabel}>Popularne godziny</Text>
              <View style={styles.presetButtons}>
                {presetTimes.map(t => (
                  <TouchableOpacity
                    key={t.label}
                    style={[
                      styles.presetButton,
                      hour === t.hour && minute === t.minute && styles.presetButtonActive,
                    ]}
                    onPress={() => {
                      setHour(t.hour);
                      setMinute(t.minute);
                    }}
                  >
                    <Text
                      style={[
                        styles.presetButtonText,
                        hour === t.hour && minute === t.minute && styles.presetButtonTextActive,
                      ]}
                    >
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E4EA',
  },
  headerButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  headerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.muted,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  displayContainer: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  displayText: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.primary,
  },
  iosPickerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  timeColumn: {
    alignItems: 'center',
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.muted,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pickerControls: {
    alignItems: 'center',
    gap: spacing.md,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  timeValue: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    minWidth: 50,
    textAlign: 'center',
  },
  timeSeparator: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  androidPickerContainer: {
    height: 200,
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  presetsContainer: {
    marginTop: spacing.lg,
  },
  presetsLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  presetButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  presetButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: '#E0F2FE',
    marginBottom: spacing.sm,
  },
  presetButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  presetButtonActive: {
    backgroundColor: colors.primary,
  },
  presetButtonTextActive: {
    color: '#fff',
  },
});

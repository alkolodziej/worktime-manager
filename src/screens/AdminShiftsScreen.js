import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing } from '../utils/theme';
import Screen from '../components/Screen';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Toast, { showToast } from '../components/Toast';
import DateTimePicker from '../components/DateTimePicker';
import TimePickerModal from '../components/TimePickerModal';
import {
  apiCreateShift,
  apiGetAvailabilities,
  apiGetUsers,
  apiGetShifts,
} from '../utils/api';

const ROLES = ['Kelner', 'Barista', 'Kucharz'];
const LOCATIONS = ['Lokal główny', 'Patio', 'Kuchnia'];

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 14,
    color: colors.muted,
    marginBottom: spacing.lg,
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  helperText: {
    fontSize: 13,
    color: colors.muted,
    marginBottom: spacing.md,
  },
  selectedValue: {
    marginTop: spacing.md,
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
  },
  timeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  timeInput: {
    borderWidth: 1,
    borderColor: '#E0E4EA',
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  timeInputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEE2E2',
  },
  activateButton: {
    backgroundColor: '#E0F2FE',
    borderRadius: 12,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  activateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  cancelButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E4EA',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.muted,
  },
  warningBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  warningText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400E',
  },
  successBox: {
    backgroundColor: '#DCFCE7',
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: '#22C55E',
  },
  successText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#166534',
  },
  infoBox: {
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  infoNote: {
    fontSize: 12,
    color: colors.muted,
    fontStyle: 'italic',
  },
  pickerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E0E4EA',
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: '#F8FAFC',
  },
  pickerButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  noAvailableBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  noAvailableText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: spacing.sm,
  },
  noAvailableSubtext: {
    fontSize: 12,
    color: '#B45309',
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(59, 130, 246, 0.1)',
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.muted,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E4EA',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  closeButton: {
    fontSize: 20,
    color: colors.muted,
    fontWeight: '600',
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F8',
  },
  pickerItemSelected: {
    backgroundColor: '#E9F2FF',
  },
  pickerItemText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
  },
  pickerItemTextSelected: {
    fontWeight: '700',
    color: colors.primary,
  },
  employeeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F8',
  },
  employeeItemSelected: {
    backgroundColor: '#E9F2FF',
  },
  employeeName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  employeeRole: {
    fontSize: 12,
    color: colors.muted,
    marginBottom: 4,
  },
  employeeRate: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  emptyState: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.muted,
    fontWeight: '500',
  },
  quickTimeButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: '#E0F2FE',
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  quickTimeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  quickTimeButtonActive: {
    backgroundColor: colors.primary,
  },
  quickTimeButtonTextActive: {
    color: '#fff',
  },
  timePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  timePickerColumn: {
    alignItems: 'center',
  },
  timePickerLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.muted,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  timePickerDisplay: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.primary,
    minWidth: 60,
    textAlign: 'center',
  },
  timePickerButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  timePickerButton: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: '#F0F4F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timePickerButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  presetTimesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
    marginTop: spacing.md,
  },
  employeeQuickInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: '#F0F9FF',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  employeeQuickAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  employeeQuickAvatarText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  employeeQuickName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  employeeQuickChange: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
});

function PickerModal({ visible, title, items, selected, onSelect, onClose }) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={items}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.pickerItem,
                  selected === item && styles.pickerItemSelected,
                ]}
                onPress={() => onSelect(item)}
              >
                <Text
                  style={[
                    styles.pickerItemText,
                    selected === item && styles.pickerItemTextSelected,
                  ]}
                >
                  {item}
                </Text>
                {selected === item && (
                  <Text style={{ fontSize: 18, color: colors.primary }}>✓</Text>
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );
}

export default function AdminShiftsScreen() {
  const [loading, setLoading] = React.useState(false);
  const [shifts, setShifts] = React.useState([]);
  const [users, setUsers] = React.useState([]);
  const [availabilities, setAvailabilities] = React.useState([]);

  // Form state
  const [selectedDate, setSelectedDate] = React.useState(new Date());
  const [startTime, setStartTime] = React.useState('');
  const [endTime, setEndTime] = React.useState('');
  const [showTimeInputs, setShowTimeInputs] = React.useState(false);
  const [selectedRole, setSelectedRole] = React.useState('Kelner');
  const [selectedLocation, setSelectedLocation] = React.useState('Lokal główny');
  const [selectedEmployee, setSelectedEmployee] = React.useState(null);

  // UI state
  const [showRolePicker, setShowRolePicker] = React.useState(false);
  const [showLocationPicker, setShowLocationPicker] = React.useState(false);
  const [showEmployeePicker, setShowEmployeePicker] = React.useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = React.useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = React.useState(false);
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [tempDate, setTempDate] = React.useState(selectedDate);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [shiftsData, usersData, availData] = await Promise.all([
        apiGetShifts({}),
        apiGetUsers(),
        apiGetAvailabilities({ from: new Date(), to: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }),
      ]);
      setShifts(shiftsData);
      setUsers(usersData.filter(u => u.role !== 'Pracodawca'));
      setAvailabilities(availData);
    } catch (error) {
      console.error('Load error:', error);
      showToast('Błąd ładowania danych', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const getAvailableEmployees = useCallback(() => {
    const dateStr = selectedDate.toISOString().split('T')[0];
    const availableUserIds = availabilities
      .filter(a => {
        const availDate = typeof a.date === 'string' ? a.date.split('T')[0] : a.date;
        return availDate === dateStr;
      })
      .map(a => a.userId);

    return users.filter(u => availableUserIds.includes(u.id));
  }, [selectedDate, availabilities, users]);

  // Get employee's available hours for the selected date
  const getEmployeeAvailability = useCallback(() => {
    if (!selectedEmployee) return null;
    const dateStr = selectedDate.toISOString().split('T')[0];
    return availabilities.find(a => {
      const availDate = typeof a.date === 'string' ? a.date.split('T')[0] : a.date;
      return availDate === dateStr && a.userId === selectedEmployee.id;
    });
  }, [selectedEmployee, selectedDate, availabilities]);

  // Validate if shift times are within employee's availability
  const validateShiftTimes = useCallback(() => {
    if (!startTime || !endTime) return { valid: false, message: 'Podaj godziny' };
    
    const empAvail = getEmployeeAvailability();
    if (!empAvail) return { valid: false, message: 'Brak dostępności pracownika' };

    const shiftStart = parseInt(startTime.replace(':', ''));
    const shiftEnd = parseInt(endTime.replace(':', ''));
    const availStart = parseInt(empAvail.start.replace(':', ''));
    const availEnd = parseInt(empAvail.end.replace(':', ''));

    if (shiftStart < availStart || shiftEnd > availEnd) {
      return {
        valid: false,
        message: `Zmiana poza dostępnością (${empAvail.start} - ${empAvail.end})`,
        empAvail,
      };
    }

    if (shiftStart >= shiftEnd) {
      return { valid: false, message: 'Godzina końcowa musi być później niż początkowa' };
    }

    return { valid: true };
  }, [startTime, endTime, getEmployeeAvailability]);

  const handleCreateShift = async () => {
    if (!selectedEmployee) {
      showToast('Wybierz pracownika', 'error');
      return;
    }

    const validation = validateShiftTimes();
    if (!validation.valid) {
      if (validation.empAvail) {
        // Show warning with availability details
        Alert.alert(
          'Zmiana poza dostępnością',
          `Pracownik ${selectedEmployee.name} jest dostępny w godzinach ${validation.empAvail.start} - ${validation.empAvail.end}.\n\nTwoja zmiana: ${startTime} - ${endTime}`,
          [
            { text: 'Anuluj', style: 'cancel' },
            {
              text: 'Przypisz mimo to',
              style: 'destructive',
              onPress: async () => await doCreateShift(),
            },
          ]
        );
      } else {
        showToast(validation.message, 'error');
      }
      return;
    }

    await doCreateShift();
  };

  const doCreateShift = async () => {
    try {
      setLoading(true);
      await apiCreateShift({
        date: selectedDate.toISOString(),
        start: startTime,
        end: endTime,
        role: selectedRole,
        location: selectedLocation,
        assignedUserId: selectedEmployee.id,
      });

      showToast('Zmiana przypisana', 'success');
      resetForm();
      await loadData();
    } catch (error) {
      console.error('Create shift error:', error);
      showToast('Błąd tworzenia zmiany', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedDate(new Date());
    setStartTime('');
    setEndTime('');
    setShowTimeInputs(false);
    setSelectedRole('Kelner');
    setSelectedLocation('Lokal główny');
    setSelectedEmployee(null);
  };

  const handleDateSelect = (event, date) => {
    if (date) {
      setTempDate(date);
    }
  };

  const handleConfirmDate = () => {
    setSelectedDate(tempDate);
    setShowDatePicker(false);
    setShowTimeInputs(false);
    setStartTime('');
    setEndTime('');
    setSelectedEmployee(null);
  };

  const handleCancelDatePicker = () => {
    setTempDate(selectedDate);
    setShowDatePicker(false);
  };

  const handleCancelTimes = () => {
    setShowTimeInputs(false);
    setStartTime('');
    setEndTime('');
  };

  const availableEmployees = getAvailableEmployees();
  const empAvail = getEmployeeAvailability();
  const timeValidation = validateShiftTimes();

  return (
    <Screen>
      <Toast />
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Tworzenie grafiku</Text>
        <Text style={styles.subtitle}>Krok po kroku przypisz zmianę</Text>

        {/* Step 1: Date Picker */}
        <Card style={{ marginTop: spacing.lg }}>
          <Text style={styles.stepNumber}>Krok 1: Data</Text>
          <Text style={styles.fieldLabel}>Wybierz dzień</Text>
          <TouchableOpacity
            style={styles.activateButton}
            onPress={() => {
              setShowDatePicker(!showDatePicker);
              setTempDate(selectedDate);
            }}
          >
            <Text style={styles.activateButtonText}>
              {showDatePicker ? '▼ Ukryj datownik' : '▶ Pokaż datownik'}
            </Text>
          </TouchableOpacity>
          
          {showDatePicker && (
            <View style={{ marginVertical: spacing.md, paddingVertical: spacing.md, borderRadius: 8, backgroundColor: '#f9f9f9' }}>
              <Text style={{ marginHorizontal: spacing.md, marginBottom: spacing.sm, fontSize: 14, fontWeight: '500', color: '#666' }}>
                {tempDate.toLocaleDateString('pl-PL', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
              
              <DateTimePicker
                value={tempDate}
                onChange={handleDateSelect}
                mode="date"
              />
              
              <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, marginHorizontal: spacing.md }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    paddingVertical: spacing.md,
                    paddingHorizontal: spacing.lg,
                    backgroundColor: '#e8e8e8',
                    borderRadius: 8,
                    alignItems: 'center',
                  }}
                  onPress={handleCancelDatePicker}
                >
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: '#333',
                  }}>
                    Anuluj
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={{
                    flex: 1,
                    paddingVertical: spacing.md,
                    paddingHorizontal: spacing.lg,
                    backgroundColor: colors.primary,
                    borderRadius: 8,
                    alignItems: 'center',
                  }}
                  onPress={handleConfirmDate}
                >
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: '#fff',
                  }}>
                    Potwierdź
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          
          <Text style={styles.selectedValue}>
            {selectedDate.toLocaleDateString('pl-PL', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </Card>

        {/* Step 2: Select Employee */}
        <Card style={{ opacity: showTimeInputs ? 0.6 : 1 }}>
          <Text style={styles.stepNumber}>Krok 2: Pracownik</Text>
          <View style={{ marginBottom: spacing.md }}>
            <Text style={styles.fieldLabel}>Dostępni pracownicy</Text>
            <Text style={styles.helperText}>
              {availableEmployees.length} dostępny/ych
            </Text>
          </View>

          {availableEmployees.length > 0 ? (
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowEmployeePicker(true)}
            >
              <View>
                <Text style={styles.pickerButtonText}>
                  {selectedEmployee
                    ? `${selectedEmployee.name} (${selectedEmployee.role})`
                    : 'Wybierz pracownika...'}
                </Text>
              </View>
              <Text style={{ fontSize: 14 }}>▼</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.noAvailableBox}>
              <Text style={styles.noAvailableText}>⚠️ Brak dostępnych pracowników</Text>
              <Text style={styles.noAvailableSubtext}>w tym dniu</Text>
            </View>
          )}

          {/* Show employee's availability when selected */}
          {selectedEmployee && empAvail && (
            <View style={[styles.infoBox, { marginTop: spacing.md }]}>
              <Text style={styles.infoLabel}>Dostępne godziny pracownika:</Text>
              <Text style={styles.infoValue}>
                🕐 {empAvail.start} - {empAvail.end}
              </Text>
              {empAvail.notes && (
                <Text style={styles.infoNote}>{empAvail.notes}</Text>
              )}
            </View>
          )}
        </Card>

        {/* Step 3: Time Selection */}
        {selectedEmployee && (
          <Card style={{ backgroundColor: showTimeInputs ? '#F0F9FF' : '#fff' }}>
            <Text style={styles.stepNumber}>Krok 3: Godziny</Text>
            
            {!showTimeInputs ? (
              <TouchableOpacity
                style={styles.activateButton}
                onPress={() => setShowTimeInputs(true)}
              >
                <Text style={styles.activateButtonText}>📅 Ustaw godziny pracy</Text>
              </TouchableOpacity>
            ) : (
              <View>
                <Text style={styles.fieldLabel}>Godziny pracy</Text>
                <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.timeLabel}>Od:</Text>
                    <TouchableOpacity
                      style={[styles.pickerButton, !timeValidation.valid && startTime && styles.timeInputError]}
                      onPress={() => setShowStartTimePicker(true)}
                    >
                      <Text style={[styles.pickerButtonText, startTime && { color: colors.primary, fontWeight: '700' }]}>
                        {startTime || '08:00'}
                      </Text>
                      <Text style={{ fontSize: 14 }}>🕐</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.timeLabel}>Do:</Text>
                    <TouchableOpacity
                      style={[styles.pickerButton, !timeValidation.valid && endTime && styles.timeInputError]}
                      onPress={() => setShowEndTimePicker(true)}
                    >
                      <Text style={[styles.pickerButtonText, endTime && { color: colors.primary, fontWeight: '700' }]}>
                        {endTime || '16:00'}
                      </Text>
                      <Text style={{ fontSize: 14 }}>🕐</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Validation feedback */}
                {startTime && endTime && !timeValidation.valid && (
                  <View style={styles.warningBox}>
                    <Text style={styles.warningText}>⚠️ {timeValidation.message}</Text>
                  </View>
                )}

                {startTime && endTime && timeValidation.valid && (
                  <View style={styles.successBox}>
                    <Text style={styles.successText}>✓ Godziny są prawidłowe</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancelTimes}
                >
                  <Text style={styles.cancelButtonText}>✕ Odrzuć godziny</Text>
                </TouchableOpacity>
              </View>
            )}
          </Card>
        )}

        {/* Step 4: Role & Location */}
        {selectedEmployee && showTimeInputs && startTime && endTime && (
          <Card>
            <Text style={styles.stepNumber}>Krok 4: Szczegóły</Text>
            <Text style={styles.fieldLabel}>Stanowisko i miejsce</Text>
            
            <View style={{ marginBottom: spacing.md }}>
              <Text style={styles.pickerLabel}>Stanowisko</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowRolePicker(true)}
              >
                <Text style={styles.pickerButtonText}>{selectedRole}</Text>
                <Text style={{ fontSize: 14 }}>▼</Text>
              </TouchableOpacity>
            </View>

            <View>
              <Text style={styles.pickerLabel}>Lokalizacja</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowLocationPicker(true)}
              >
                <Text style={styles.pickerButtonText}>{selectedLocation}</Text>
                <Text style={{ fontSize: 14 }}>▼</Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}

        {/* Summary & Submit */}
        {selectedEmployee && showTimeInputs && startTime && endTime && timeValidation.valid && (
          <Card style={{ backgroundColor: '#F0F9FF', borderLeftWidth: 4, borderLeftColor: colors.primary }}>
            <Text style={styles.summaryTitle}>📋 Podsumowanie zmiany</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Pracownik:</Text>
              <Badge label={selectedEmployee.name} tone="primary" />
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Data:</Text>
              <Text style={styles.summaryValue}>
                {selectedDate.toLocaleDateString('pl-PL')}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Godziny:</Text>
              <Text style={styles.summaryValue}>
                {startTime} - {endTime}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Stanowisko:</Text>
              <Badge label={selectedRole} tone="neutral" />
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Lokalizacja:</Text>
              <Text style={styles.summaryValue}>{selectedLocation}</Text>
            </View>
          </Card>
        )}

        {/* Submit Button */}
        {selectedEmployee && showTimeInputs && startTime && endTime && (
          <TouchableOpacity
            style={[styles.submitButton, { opacity: loading ? 0.6 : 1 }]}
            onPress={handleCreateShift}
            disabled={loading || !timeValidation.valid}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>
                {timeValidation.valid ? '✓ Przypisz zmianę' : '⚠️ Nieprawidłowe godziny'}
              </Text>
            )}
          </TouchableOpacity>
        )}

        <View style={{ height: spacing.xl }} />
      </ScrollView>

      {/* Role Picker Modal */}
      <PickerModal
        visible={showRolePicker}
        title="Wybierz stanowisko"
        items={ROLES}
        selected={selectedRole}
        onSelect={(role) => {
          setSelectedRole(role);
          setShowRolePicker(false);
        }}
        onClose={() => setShowRolePicker(false)}
      />

      {/* Location Picker Modal */}
      <PickerModal
        visible={showLocationPicker}
        title="Wybierz lokalizację"
        items={LOCATIONS}
        selected={selectedLocation}
        onSelect={(location) => {
          setSelectedLocation(location);
          setShowLocationPicker(false);
        }}
        onClose={() => setShowLocationPicker(false)}
      />

      {/* Start Time Picker Modal */}
      <TimePickerModal
        visible={showStartTimePicker}
        onCancel={() => setShowStartTimePicker(false)}
        onConfirm={(time) => {
          setStartTime(time);
          setShowStartTimePicker(false);
        }}
        value={startTime}
      />

      {/* End Time Picker Modal */}
      <TimePickerModal
        visible={showEndTimePicker}
        onCancel={() => setShowEndTimePicker(false)}
        onConfirm={(time) => {
          setEndTime(time);
          setShowEndTimePicker(false);
        }}
        value={endTime}
      />

      {/* Employee Picker Modal */}
      <Modal
        visible={showEmployeePicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEmployeePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Wybierz pracownika</Text>
              <TouchableOpacity onPress={() => setShowEmployeePicker(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            {availableEmployees.length > 0 ? (
              <FlatList
                data={availableEmployees}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.employeeItem,
                      selectedEmployee?.id === item.id && styles.employeeItemSelected,
                    ]}
                    onPress={() => {
                      setSelectedEmployee(item);
                      setShowEmployeePicker(false);
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.employeeName}>{item.name}</Text>
                      <Text style={styles.employeeRole}>{item.role}</Text>
                      {item.hourlyRate && (
                        <Text style={styles.employeeRate}>
                          {item.hourlyRate.toFixed(2)} zł/h
                        </Text>
                      )}
                    </View>
                    {selectedEmployee?.id === item.id && (
                      <Text style={{ fontSize: 18, color: colors.primary }}>✓</Text>
                    )}
                  </TouchableOpacity>
                )}
              />
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>Brak dostępnych pracowników</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

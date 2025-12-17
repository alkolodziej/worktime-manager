import React, { useCallback, useState } from "react";
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
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { colors, spacing } from "../utils/theme";
import Screen from "../components/Screen";
import Card from "../components/Card";
import Badge from "../components/Badge";
import Toast, { showToast } from "../components/Toast";
import DateTimePicker from "../components/DateTimePicker";
import TimePickerModal from "../components/TimePickerModal";
import {
  apiCreateShift,
  apiGetAvailabilities,
  apiGetUsers,
  apiGetFilteredUsers,
  apiGetShifts,
  apiUpdateShift,
  apiDeleteShift,
  apiGetPositions,
} from "../utils/api";

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: colors.muted,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.muted,
    marginBottom: spacing.xs,
  },
  helperText: {
    fontSize: 12,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  selectedValue: {
    marginTop: spacing.md,
    fontSize: 16,
    fontWeight: "600",
    color: colors.primary,
    textAlign: "center",
  },
  timeLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  timeInput: {
    borderWidth: 1,
    borderColor: "#E0E4EA",
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  timeInputError: {
    borderColor: "#EF4444",
    backgroundColor: "#FEE2E2",
  },
  activateButton: {
    backgroundColor: "#E0F2FE",
    borderRadius: 12,
    paddingVertical: spacing.lg,
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.primary,
  },
  activateButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.primary,
  },
  cancelButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0E4EA",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.muted,
  },
  warningBox: {
    backgroundColor: "#FEF3C7",
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: "#F59E0B",
  },
  warningText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#92400E",
  },
  successBox: {
    backgroundColor: "#DCFCE7",
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: "#22C55E",
  },
  successText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#166534",
  },
  infoBox: {
    backgroundColor: "#F0F9FF",
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  infoNote: {
    fontSize: 12,
    color: colors.muted,
    fontStyle: "italic",
  },
  pickerLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  pickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#E6EAF2",
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: "#fff",
  },
  timePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1.5,
    borderColor: "#E6EAF2",
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    backgroundColor: "#F8FAFC",
    minHeight: 72,
  },
  timePickerContent: {
    flex: 1,
    justifyContent: "center",
  },
  timePickerLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  timePickerValue: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: 1,
  },
  timePickerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E0F2FE",
    justifyContent: "center",
    alignItems: "center",
  },
  timePickerButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E6EAF2",
    backgroundColor: "#F8FAFC",
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
  },
  filterChipTextActive: {
    color: "#fff",
  },
  pickerButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  noAvailableBox: {
    backgroundColor: "#FEF3C7",
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  noAvailableText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#92400E",
    marginBottom: spacing.sm,
  },
  noAvailableSubtext: {
    fontSize: 12,
    color: "#B45309",
  },
  forceAssignCheckbox: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
    backgroundColor: "#F3E8FF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DDD6FE",
  },
  checkboxBox: {
    fontSize: 18,
    marginRight: spacing.md,
  },
  checkboxLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
    flex: 1,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(59, 130, 246, 0.1)",
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.muted,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: spacing.lg,
    alignItems: "center",
    marginTop: spacing.lg,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  cancelEditButton: {
    backgroundColor: "#EF4444",
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.md,
    borderWidth: 2,
    borderColor: "#DC2626",
  },
  cancelEditButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E4EA",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  closeButton: {
    fontSize: 20,
    color: colors.muted,
    fontWeight: "600",
  },
  pickerItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F4F8",
  },
  pickerItemSelected: {
    backgroundColor: "#E9F2FF",
  },
  pickerItemText: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.text,
  },
  pickerItemTextSelected: {
    fontWeight: "700",
    color: colors.primary,
  },
  employeeItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F4F8",
  },
  employeeItemSelected: {
    backgroundColor: "#E9F2FF",
  },
  employeeName: {
    fontSize: 15,
    fontWeight: "700",
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
    fontWeight: "600",
    color: colors.primary,
  },
  emptyState: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.muted,
    fontWeight: "500",
  },
  quickTimeButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: "#E0F2FE",
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  quickTimeButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
  },
  quickTimeButtonActive: {
    backgroundColor: colors.primary,
  },
  quickTimeButtonTextActive: {
    color: "#fff",
  },
  timePickerHeader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  timePickerColumn: {
    alignItems: "center",
  },
  timePickerLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.muted,
    marginBottom: spacing.sm,
    textTransform: "uppercase",
  },
  timePickerDisplay: {
    fontSize: 32,
    fontWeight: "700",
    color: colors.primary,
    minWidth: 60,
    textAlign: "center",
  },
  timePickerButtons: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  timePickerButton: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: "#F0F4F8",
    justifyContent: "center",
    alignItems: "center",
  },
  timePickerButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primary,
  },
  presetTimesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: spacing.md,
    marginTop: spacing.md,
  },
  timeRangeCard: {
    marginTop: spacing.sm,
  },
  timeRangeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.sm,
  },
  timeRangeHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  timeRangeTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.muted,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  timeRangeMeta: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
  },
  timeRangeSubtitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  timeRangeTrackWrapper: {
    borderRadius: 16,
    backgroundColor: "#F0F4F8",
    padding: spacing.sm,
  },
  timeRangeTrack: {
    position: "relative",
    height: 6,
    backgroundColor: "#E0E4EA",
    borderRadius: 4,
    overflow: "hidden",
  },
  timeRangeHighlight: {
    position: "absolute",
    top: 0,
    bottom: 0,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  timeRangeDotRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.sm,
  },
  timeRangeDotOuter: {
    backgroundColor: "#fff",
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E0E4EA",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  timeRangeDotLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  timeRangeIndicatorLabels: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  timeRangeIndicatorLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.muted,
    letterSpacing: 0.6,
  },
  timeCardsRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  timeCard: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E6EAF2",
    padding: spacing.md,
    overflow: "hidden",
    minHeight: 96,
  },
  timeCardError: {
    borderColor: "#EF4444",
    borderWidth: 2,
  },
  timeCardLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  timeCardValue: {
    marginTop: 6,
    fontSize: 30,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: 0.5,
    lineHeight: 34,
    fontVariant: ["tabular-nums"],
  },
  timeCardHint: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "600",
    color: colors.muted,
  },
  employeeQuickInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: "#F0F9FF",
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
    justifyContent: "center",
    alignItems: "center",
  },
  employeeQuickAvatarText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },
  employeeQuickName: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
  },
  employeeQuickChange: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.primary,
  },
  shiftsListContainer: {
    marginBottom: spacing.lg,
  },
  shiftListItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F4F8",
    backgroundColor: "#F8FAFC",
  },
  shiftListItemContent: {
    flex: 1,
    marginRight: spacing.md,
  },
  shiftListEmployee: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  shiftListTime: {
    fontSize: 13,
    color: colors.muted,
    marginBottom: 2,
  },
  shiftListRole: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.primary,
  },
  shiftListActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  shiftActionButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E0E4EA",
    backgroundColor: "#fff",
    minWidth: 40,
    alignItems: "center",
  },
  shiftActionButtonDanger: {
    borderColor: "#EF4444",
    backgroundColor: "#FEE2E2",
  },
  shiftActionButtonText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.text,
  },
  shiftActionButtonTextDanger: {
    color: "#DC2626",
  },
  emptyShiftsText: {
    fontSize: 14,
    color: colors.muted,
    fontWeight: "500",
    textAlign: "center",
    paddingVertical: spacing.lg,
  },
  toggleButton: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 6,
    backgroundColor: "#E0F2FE",
    marginBottom: spacing.md,
  },
  toggleButtonText: {
    fontSize: 12,
    fontWeight: "600",
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
  const [positions, setPositions] = React.useState([]);
  const [availabilities, setAvailabilities] = React.useState([]);
  const [showShiftsList, setShowShiftsList] = React.useState(true);
  const [editingShiftId, setEditingShiftId] = React.useState(null);
  const [forceAssignOverride, setForceAssignOverride] = React.useState(false);

  const scrollViewRef = React.useRef(null);

  // Form state
  const [selectedDate, setSelectedDate] = React.useState(new Date());
  const [startTime, setStartTime] = React.useState("08:00");
  const [endTime, setEndTime] = React.useState("16:00");
  const [showTimeInputs, setShowTimeInputs] = React.useState(false);
  const [selectedPosition, setSelectedPosition] = React.useState(null);
  const [selectedEmployee, setSelectedEmployee] = React.useState(null);

  // UI state
  const [showPositionPicker, setShowPositionPicker] = React.useState(false);
  const [showEmployeePicker, setShowEmployeePicker] = React.useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = React.useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = React.useState(false);
  const [positionFilter, setPositionFilter] = React.useState(null);
  const [filteredEmployees, setFilteredEmployees] = React.useState([]);

  const MIN_SHIFT_DURATION_MINUTES = 30;
  const DEFAULT_SHIFT_DURATION_MINUTES = 8 * 60;
  const MAX_MINUTES_OF_DAY = 23 * 60 + 59;

  const timeStringToMinutes = (value) => {
    if (!value) return null;
    const parts = value.split(":").map(Number);
    if (parts.length !== 2 || parts.some((n) => Number.isNaN(n))) return null;
    return parts[0] * 60 + parts[1];
  };

  const minutesToTimeString = (minutes) => {
    const clamped = Math.min(Math.max(Math.round(minutes), 0), MAX_MINUTES_OF_DAY);
    const hours = Math.floor(clamped / 60);
    const mins = clamped % 60;
    return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
  };

  const handleStartTimeSelect = (time) => {
    setStartTime(time);
    const startMinutes = timeStringToMinutes(time);
    const endMinutes = timeStringToMinutes(endTime);

    // If end is empty, auto-fill a sensible default
    if (startMinutes !== null && endTime === "") {
      const autoEnd = minutesToTimeString(
        Math.min(startMinutes + DEFAULT_SHIFT_DURATION_MINUTES, MAX_MINUTES_OF_DAY)
      );
      setEndTime(autoEnd);
      showToast("Ustawiono koniec zmiany na +8h.", "info");
      return;
    }

    if (
      startMinutes !== null &&
      endMinutes !== null &&
      endMinutes <= startMinutes
    ) {
      const adjusted = minutesToTimeString(
        Math.min(startMinutes + MIN_SHIFT_DURATION_MINUTES, MAX_MINUTES_OF_DAY)
      );
      setEndTime(adjusted);
      showToast(
        "Godzina zakończenia została przesunięta — musi być co najmniej 30 minut po starcie.",
        "info"
      );
    }
  };

  const handleEndTimeSelect = (time) => {
    const startMinutes = timeStringToMinutes(startTime);
    const selectedMinutes = timeStringToMinutes(time);
    if (startMinutes !== null && selectedMinutes !== null) {
      const minAllowed = Math.min(
        startMinutes + MIN_SHIFT_DURATION_MINUTES,
        MAX_MINUTES_OF_DAY
      );
      if (selectedMinutes < minAllowed) {
        const adjusted = minutesToTimeString(minAllowed);
        showToast(
          "Godzina zakończenia musi być co najmniej 30 minut po rozpoczęciu. Ustawiam ją automatycznie.",
          "error"
        );
        setEndTime(adjusted);
        return;
      }
    }
    setEndTime(time);
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [shiftsData, usersData, positionsData, availData] =
        await Promise.all([
          apiGetShifts({}),
          apiGetUsers(),
          apiGetPositions(true),
          apiGetAvailabilities({
            from: new Date(),
            to: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          }),
        ]);
      setShifts(shiftsData);
      setUsers(usersData.filter((u) => !u.isEmployer));
      setPositions(positionsData);
      setAvailabilities(availData);

      // Don't auto-select first position - let user choose (including "All")
    } catch (error) {
      console.error("Load error:", error);
      showToast("Błąd ładowania danych", "error");
    } finally {
      setLoading(false);
    }
  }, [selectedPosition]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Clear selected employee when position changes (force re-selection)
  React.useEffect(() => {
    setSelectedEmployee(null);
    if (selectedPosition) {
      setPositionFilter(null);
    }
  }, [selectedPosition]);

  // Load filtered employees from backend when filters change
  const loadFilteredEmployees = useCallback(async () => {
    try {
      const positionIds = [];
      if (selectedPosition) positionIds.push(selectedPosition.id);
      if (positionFilter) positionIds.push(positionFilter.id);

      const result = await apiGetFilteredUsers({
        date: selectedDate,
        positionIds: positionIds.length > 0 ? positionIds.join(',') : 'all',
        includeUnavailable: forceAssignOverride,
      });
      setFilteredEmployees(result);
    } catch (error) {
      console.error('Error loading filtered employees:', error);
      setFilteredEmployees([]);
    }
  }, [selectedPosition, positionFilter, selectedDate, forceAssignOverride]);

  // Reload filtered employees when filters change
  React.useEffect(() => {
    loadFilteredEmployees();
  }, [loadFilteredEmployees]);

  const getAvailableEmployees = useCallback(() => {
    const dateStr = selectedDate.toISOString().split("T")[0];
    const availableUserIds = availabilities
      .filter((a) => {
        const availDate =
          typeof a.date === "string" ? a.date.split("T")[0] : a.date;
        return availDate === dateStr;
      })
      .map((a) => a.userId);

    return users.filter((u) => availableUserIds.includes(u.id));
  }, [selectedDate, availabilities, users]);

  // Get employees list - simplified, backend handles filtering and sorting
  const getEmployeesForPicker = useCallback(() => {
    return filteredEmployees;
  }, [filteredEmployees]);

  // Backend already sorts, so this just returns the same list
  const getSortedEmployeesForPicker = useCallback(() => {
    return filteredEmployees;
  }, [filteredEmployees]);

  // Get availability for a specific user (from backend-attached data)
  const getUserAvailability = useCallback((userId) => {
    const employee = filteredEmployees.find(emp => emp.id === userId);
    return employee?.availability || null;
  }, [filteredEmployees]);

  // Get employee's available hours for the selected date
  const getEmployeeAvailability = useCallback(() => {
    if (!selectedEmployee) return null;
    const dateStr = selectedDate.toISOString().split("T")[0];
    return availabilities.find((a) => {
      const availDate =
        typeof a.date === "string" ? a.date.split("T")[0] : a.date;
      return availDate === dateStr && a.userId === selectedEmployee.id;
    });
  }, [selectedEmployee, selectedDate, availabilities]);

  // Validate if shift times are within employee's availability
  const validateShiftTimes = useCallback(() => {
    if (!startTime || !endTime)
      return { valid: false, message: "Podaj godziny" };

    // Skip availability check if forceAssignOverride is active
    if (!forceAssignOverride) {
      const empAvail = getEmployeeAvailability();
      if (!empAvail)
        return { valid: false, message: "Brak dostępności pracownika" };

      const shiftStart = parseInt(startTime.replace(":", ""));
      const shiftEnd = parseInt(endTime.replace(":", ""));
      const availStart = parseInt(empAvail.start.replace(":", ""));
      const availEnd = parseInt(empAvail.end.replace(":", ""));

      if (shiftStart < availStart || shiftEnd > availEnd) {
        return {
          valid: false,
          message: `Zmiana poza dostępnością (${empAvail.start} - ${empAvail.end})`,
          empAvail,
        };
      }
    }

    // Always check time logic
    const shiftStart = parseInt(startTime.replace(":", ""));
    const shiftEnd = parseInt(endTime.replace(":", ""));

    if (shiftStart >= shiftEnd) {
      return {
        valid: false,
        message: "Godzina końcowa musi być później niż początkowa",
      };
    }

    return { valid: true };
  }, [startTime, endTime, getEmployeeAvailability, forceAssignOverride]);

  const handleCreateShift = async () => {
    if (!selectedEmployee) {
      showToast("Wybierz pracownika", "error");
      return;
    }

    const validation = validateShiftTimes();
    if (!validation.valid) {
      if (validation.empAvail) {
        // Show warning with availability details
        Alert.alert(
          "Zmiana poza dostępnością",
          `Pracownik ${selectedEmployee.name} jest dostępny w godzinach ${validation.empAvail.start} - ${validation.empAvail.end}.\n\nTwoja zmiana: ${startTime} - ${endTime}`,
          [
            { text: "Anuluj", style: "cancel" },
            {
              text: "Przypisz mimo to",
              style: "destructive",
              onPress: async () => await doCreateShift(),
            },
          ]
        );
      } else {
        showToast(validation.message, "error");
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
        role: selectedPosition?.name || "Zmiana",
        location: "Lokal",
        assignedUserId: selectedEmployee.id,
      });

      showToast("Zmiana przypisana", "success");
      resetForm();
      await loadData();
    } catch (error) {
      console.error("Create shift error:", error);
      showToast("Błąd tworzenia zmiany", "error");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedDate(new Date());
    setStartTime("08:00");
    setEndTime("16:00");
    setSelectedPosition(null); // Reset to "All" instead of first position
    setSelectedEmployee(null);
    setEditingShiftId(null);
    setForceAssignOverride(false);
    setPositionFilter(null);
  };

  const availableEmployees = getAvailableEmployees();
  const empAvail = getEmployeeAvailability();
  const timeValidation = validateShiftTimes();
  // Show error only if employee is selected and validation fails (not just missing employee)
  const showTimeValidationError = selectedEmployee && !timeValidation.valid && startTime && endTime && timeValidation.message !== "Brak dostępności pracownika";
  const startMinutes = timeStringToMinutes(startTime) ?? 8 * 60;
  const endMinutes = timeStringToMinutes(endTime) ?? 16 * 60;
  const clampedStart = Math.min(Math.max(startMinutes, 0), MAX_MINUTES_OF_DAY);
  const clampedEnd = Math.min(
    Math.max(endMinutes, clampedStart + MIN_SHIFT_DURATION_MINUTES),
    MAX_MINUTES_OF_DAY
  );
  const durationMinutes = Math.max(clampedEnd - clampedStart, 0);
  const durationHours = Math.floor(durationMinutes / 60);
  const durationRemainingMinutes = durationMinutes % 60;
  const durationText = `${durationHours}h ${String(durationRemainingMinutes).padStart(2, "0")}m`;

  const handleDeleteShift = (shiftId) => {
    Alert.alert("Usuń zmianę", "Czy na pewno chcesz usunąć tę zmianę?", [
      { text: "Anuluj", style: "cancel" },
      {
        text: "Usuń",
        style: "destructive",
        onPress: async () => {
          try {
            setLoading(true);
            await apiDeleteShift(shiftId);
            showToast("Zmiana usunięta", "success");
            await loadData();
          } catch (error) {
            console.error("Delete shift error:", error);
            showToast("Błąd usuwania zmiany", "error");
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const handleEditShift = (shift) => {
    // Pre-populate form with shift data
    setSelectedDate(
      typeof shift.date === "string" ? new Date(shift.date) : shift.date
    );
    setStartTime(shift.start);
    setEndTime(shift.end);

    // Find position by role name
    const position = positions.find((p) => p.name === shift.role);
    setSelectedPosition(
      position || (positions.length > 0 ? positions[0] : null)
    );

    setEditingShiftId(shift.id);
    // Find employee
    const emp = users.find((u) => u.id === shift.assignedUserId);
    if (emp) setSelectedEmployee(emp);

    // Hide shifts list and scroll to form
    setShowShiftsList(false);
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 300, animated: true });
    }, 100);

    // Show toast feedback
    showToast("Zmiana załadowana do edycji", "success");
  };

  const handleUpdateShift = async () => {
    if (!selectedEmployee) {
      showToast("Wybierz pracownika", "error");
      return;
    }

    const validation = validateShiftTimes();
    if (!validation.valid) {
      showToast(validation.message, "error");
      return;
    }

    try {
      setLoading(true);
      await apiUpdateShift(editingShiftId, {
        date: selectedDate.toISOString(),
        start: startTime,
        end: endTime,
        role: selectedPosition?.name || "Zmiana",
        location: "Lokal",
        assignedUserId: selectedEmployee.id,
      });

      showToast("Zmiana zaktualizowana", "success");
      setEditingShiftId(null);
      resetForm();
      await loadData();
    } catch (error) {
      console.error("Update shift error:", error);
      showToast("Błąd aktualizacji zmiany", "error");
    } finally {
      setLoading(false);
    }
  };

  const formatShiftDate = (date) => {
    if (typeof date === "string") {
      date = new Date(date);
    }
    return date.toLocaleDateString("pl-PL", { month: "short", day: "numeric" });
  };

  return (
    <Screen edges={['bottom']}>
      <Toast />
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
      >
        <View style={{ marginBottom: spacing.lg }}>
          <Text style={styles.title}>Grafik zmian</Text>
          <Text style={styles.subtitle}>
            {editingShiftId ? "Edytuj zmianę" : "Dodaj nową zmianę do grafiku"}
          </Text>
        </View>

        {/* Shifts List */}
        {showShiftsList && shifts.length > 0 && (
          <Card style={{ marginBottom: spacing.md }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: spacing.md,
              }}
            >
              <Text style={styles.sectionTitle}>
                Nadchodzące zmiany ({shifts.length})
              </Text>
              <TouchableOpacity onPress={() => setShowShiftsList(false)}>
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.primary,
                    fontWeight: "600",
                  }}
                >
                  Ukryj
                </Text>
              </TouchableOpacity>
            </View>
            {shifts.length > 0 ? (
              <FlatList
                data={shifts}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                renderItem={({ item: shift }) => {
                  const employee = users.find(
                    (u) => u.id === shift.assignedUserId
                  );
                  return (
                    <View key={shift.id} style={styles.shiftListItem}>
                      <View style={styles.shiftListItemContent}>
                        <Text style={styles.shiftListEmployee}>
                          {employee?.name || "Nieznany pracownik"}
                        </Text>
                        <Text style={styles.shiftListTime}>
                          {formatShiftDate(shift.date)} • {shift.start} -{" "}
                          {shift.end}
                        </Text>
                        <Text style={styles.shiftListRole}>
                          {shift.role} • {shift.location || "Lokal główny"}
                        </Text>
                      </View>
                      <View style={styles.shiftListActions}>
                        <TouchableOpacity
                          style={styles.shiftActionButton}
                          onPress={() => handleEditShift(shift)}
                        >
                          <Text style={styles.shiftActionButtonText}>✏️</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.shiftActionButton,
                            styles.shiftActionButtonDanger,
                          ]}
                          onPress={() => handleDeleteShift(shift.id)}
                        >
                          <Text
                            style={[
                              styles.shiftActionButtonText,
                              styles.shiftActionButtonTextDanger,
                            ]}
                          >
                            🗑️
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                }}
              />
            ) : (
              <Text style={styles.emptyShiftsText}>
                Brak zmian do wyświetlenia
              </Text>
            )}
          </Card>
        )}

        {!showShiftsList && shifts.length > 0 && (
          <TouchableOpacity
            onPress={() => setShowShiftsList(true)}
            style={{ marginBottom: spacing.md, alignSelf: "flex-start" }}
          >
            <Text
              style={{ fontSize: 13, color: colors.primary, fontWeight: "600" }}
            >
              ▶ Pokaż listę zmian ({shifts.length})
            </Text>
          </TouchableOpacity>
        )}

        {/* Formularz tworzenia zmiany */}
        <Card style={{ marginBottom: spacing.md }}>
          <Text style={styles.sectionTitle}>Data i godziny</Text>

          <View style={{ marginBottom: spacing.md }}>
            <Text style={styles.fieldLabel}>DATA</Text>
            <DateTimePicker
              value={selectedDate}
              onChange={(event, date) => {
                if (date) setSelectedDate(date);
              }}
              mode="date"
            />
            <Text style={styles.helperText}>
              {selectedDate.toLocaleDateString("pl-PL", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </Text>
          </View>

          {/* Godziny - zawsze widoczne */}
          <View style={styles.timeRangeCard}>
            <View style={styles.timeRangeHeaderRow}>
              <Text style={styles.timeRangeTitle}>Godziny zmiany</Text>
              <Text style={styles.timeRangeMeta}>⏱ {durationText}</Text>
            </View>

            <View style={styles.timeCardsRow}>
              <TouchableOpacity
                style={[styles.timeCard, showTimeValidationError && styles.timeCardError]}
                onPress={() => setShowStartTimePicker(true)}
              >
                <Text style={styles.timeCardLabel}>POCZĄTEK</Text>
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.85}
                  style={[
                    styles.timeCardValue,
                    startTime && { color: colors.primary },
                  ]}
                >
                  {startTime || "08:00"}
                </Text>
                <Text style={styles.timeCardHint}>Stuknij, aby zmienić</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.timeCard, showTimeValidationError && styles.timeCardError]}
                onPress={() => setShowEndTimePicker(true)}
              >
                <Text style={styles.timeCardLabel}>KONIEC</Text>
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.85}
                  style={[
                    styles.timeCardValue,
                    endTime && { color: colors.primary },
                  ]}
                >
                  {endTime || "16:00"}
                </Text>
                <Text style={styles.timeCardHint}>Stuknij, aby zmienić</Text>
              </TouchableOpacity>
            </View>
          </View>

          {startTime && endTime && !timeValidation.valid && (
            <View
              style={{
                backgroundColor: "#FEE2E2",
                padding: spacing.sm,
                borderRadius: 8,
                marginTop: spacing.sm,
              }}
            >
              <Text
                style={{ fontSize: 12, color: "#DC2626", fontWeight: "500" }}
              >
                ⚠️ {timeValidation.message}
              </Text>
            </View>
          )}
        </Card>

        {/* Wybór stanowiska i pracownika */}
        <Card style={{ marginBottom: spacing.md }}>
          <Text style={styles.sectionTitle}>Stanowisko i pracownik</Text>

          {/* Stanowisko - z przyciskiem Wszyscy */}
          <View style={{ marginBottom: spacing.md }}>
            <Text style={styles.fieldLabel}>STANOWISKO</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: "row", gap: spacing.xs }}>
                {/* Przycisk Wszyscy */}
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    !selectedPosition && styles.filterChipActive,
                  ]}
                  onPress={() => {
                    setSelectedPosition(null);
                    setPositionFilter(null);
                  }}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      !selectedPosition && styles.filterChipTextActive,
                    ]}
                  >
                    Wszyscy
                  </Text>
                </TouchableOpacity>
                
                {/* Lista stanowisk */}
                {positions.map((pos) => (
                  <TouchableOpacity
                    key={pos.id}
                    style={[
                      styles.filterChip,
                      selectedPosition?.id === pos.id && {
                        backgroundColor: pos.color,
                        borderColor: pos.color,
                      },
                    ]}
                    onPress={() => {
                      setSelectedPosition(pos);
                      setPositionFilter(null);
                    }}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        selectedPosition?.id === pos.id && { color: "#fff" },
                      ]}
                    >
                      {pos.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <Text style={styles.helperText}>
              {!selectedPosition 
                ? "Wyświetlam wszystkich pracowników z wszystkich stanowisk"
                : `Wyświetlam tylko: ${selectedPosition.name}`}
            </Text>
          </View>

          {/* Dodatkowe filtry stanowisk - gdy wybrane główne stanowisko */}
          {selectedPosition && positions.filter(p => p.id !== selectedPosition.id).length > 0 && (
            <View style={{ marginBottom: spacing.md }}>
              <Text style={styles.fieldLabel}>DODATKOWE STANOWISKA (opcjonalnie)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: "row", gap: spacing.xs }}>
                  {positions.filter(p => p.id !== selectedPosition.id).map((pos) => (
                    <TouchableOpacity
                      key={pos.id}
                      style={[
                        styles.filterChip,
                        positionFilter?.id === pos.id && {
                          backgroundColor: pos.color,
                          borderColor: pos.color,
                        },
                      ]}
                      onPress={() => setPositionFilter(positionFilter?.id === pos.id ? null : pos)}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          positionFilter?.id === pos.id && { color: "#fff" },
                        ]}
                      >
                        {positionFilter?.id === pos.id ? '✓ ' : '+ '}{pos.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
              <Text style={styles.helperText}>
                {positionFilter
                  ? `Wyświetlam: ${selectedPosition.name} + ${positionFilter.name}`
                  : `Wyświetlam tylko: ${selectedPosition.name}`}
              </Text>
            </View>
          )}

          {/* Wybór pracownika */}
          <View style={{ marginBottom: spacing.md }}>
            <Text style={styles.fieldLabel}>PRACOWNIK</Text>
            {getEmployeesForPicker().length > 0 || forceAssignOverride ? (
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => setShowEmployeePicker(true)}
                >
                  <View style={{ flex: 1 }}>
                    {selectedEmployee ? (
                      <View>
                        <Text style={styles.pickerButtonText}>
                          {selectedEmployee.name}
                        </Text>
                        {selectedEmployee.positions &&
                          selectedEmployee.positions.length > 0 && (
                            <View
                              style={{
                                flexDirection: "row",
                                gap: spacing.xs,
                                marginTop: 4,
                              }}
                            >
                              {selectedEmployee.positions.map((posId) => {
                                const pos = positions.find((p) => p.id === posId);
                                return pos ? (
                                  <View
                                    key={posId}
                                    style={{
                                      flexDirection: "row",
                                      alignItems: "center",
                                      gap: 4,
                                    }}
                                  >
                                    <View
                                      style={{
                                        width: 6,
                                        height: 6,
                                        borderRadius: 3,
                                        backgroundColor: pos.color,
                                      }}
                                    />
                                    <Text
                                      style={{
                                        fontSize: 11,
                                        color: colors.muted,
                                      }}
                                    >
                                      {pos.name}
                                    </Text>
                                  </View>
                                ) : null;
                              })}
                            </View>
                          )}
                      </View>
                    ) : (
                      <Text style={{ color: colors.muted }}>
                        Wybierz pracownika...
                      </Text>
                    )}
                  </View>
                  <Text style={{ fontSize: 14, color: colors.muted }}>▼</Text>
                </TouchableOpacity>
              ) : (
                <View
                  style={{
                    backgroundColor: "#FEF3C7",
                    padding: spacing.md,
                    borderRadius: 8,
                  }}
                >
                  <Text
                    style={{ fontSize: 13, color: "#92400E", fontWeight: "500" }}
                  >
                    ⚠️ Brak pracowników
                  </Text>
                  <Text style={{ fontSize: 12, color: "#B45309", marginTop: 4 }}>
                    {selectedPosition 
                      ? `Brak dostępnych na stanowisko ${selectedPosition.name}`
                      : "Brak dostępnych pracowników"}
                  </Text>
                </View>
              )}

              {/* Opcja przypisania pomimo braku dostępności */}
              <View style={{ marginTop: spacing.md }}>
                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    padding: spacing.sm,
                    backgroundColor: forceAssignOverride ? "#DBEAFE" : "#F0F9FF",
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: forceAssignOverride ? colors.primary : "#BAE6FD",
                  }}
                  onPress={() => setForceAssignOverride(!forceAssignOverride)}
                >
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 4,
                      borderWidth: 2,
                      borderColor: colors.primary,
                      marginRight: spacing.sm,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: forceAssignOverride ? colors.primary : "transparent",
                    }}
                  >
                    {forceAssignOverride && (
                      <Text
                        style={{ color: "#fff", fontSize: 14, fontWeight: "700" }}
                      >
                        ✓
                      </Text>
                    )}
                  </View>
                  <Text style={{ fontSize: 13, color: colors.text, flex: 1, fontWeight: forceAssignOverride ? "600" : "400" }}>
                    {forceAssignOverride 
                      ? "Wyświetlam wszystkich (w tym niedostępnych)"
                      : "Pokaż również niedostępnych pracowników"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

          {/* Dostępność pracownika */}
          {selectedEmployee && empAvail && (
            <View
              style={{
                backgroundColor: "#F0F9FF",
                padding: spacing.sm,
                borderRadius: 8,
                marginTop: spacing.md,
                borderLeftWidth: 3,
                borderLeftColor: colors.primary,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color: colors.primary,
                }}
              >
                ✓ Dostępny: {empAvail.start} - {empAvail.end}
              </Text>
              {empAvail.notes && (
                <Text
                  style={{
                    fontSize: 11,
                    color: colors.muted,
                    marginTop: 2,
                    fontStyle: "italic",
                  }}
                >
                  {empAvail.notes}
                </Text>
              )}
            </View>
          )}
        </Card>

        {/* Przyciski akcji */}
        {selectedEmployee && selectedPosition && startTime && endTime && (
          <View>
            <TouchableOpacity
              style={[
                styles.submitButton,
                { opacity: loading || !timeValidation.valid ? 0.5 : 1 },
              ]}
              onPress={editingShiftId ? handleUpdateShift : handleCreateShift}
              disabled={loading || !timeValidation.valid}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {editingShiftId ? "✓ Zaktualizuj zmianę" : "✓ Dodaj zmianę"}
                </Text>
              )}
            </TouchableOpacity>

            {editingShiftId && (
              <TouchableOpacity
                style={{
                  marginTop: spacing.sm,
                  paddingVertical: spacing.md,
                  alignItems: "center",
                }}
                onPress={() => {
                  resetForm();
                  setShowShiftsList(true);
                  showToast("Anulowano edycję", "info");
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    color: colors.muted,
                    fontWeight: "600",
                  }}
                >
                  Anuluj
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      {/* Position Picker Modal */}
      <Modal
        visible={showPositionPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPositionPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Wybierz stanowisko</Text>
              <TouchableOpacity onPress={() => setShowPositionPicker(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={positions}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.pickerItem,
                    selectedPosition?.id === item.id &&
                      styles.pickerItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedPosition(item);
                    setShowPositionPicker(false);
                  }}
                >
                  <View
                    style={{
                      flex: 1,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: spacing.md,
                    }}
                  >
                    <View
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 6,
                        backgroundColor: item.color,
                      }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.pickerItemText,
                          selectedPosition?.id === item.id &&
                            styles.pickerItemTextSelected,
                        ]}
                      >
                        {item.name}
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          color: colors.muted,
                          marginTop: 2,
                        }}
                      >
                        {item.description}
                      </Text>
                    </View>
                  </View>
                  {selectedPosition?.id === item.id && (
                    <Text style={{ fontSize: 18, color: colors.primary }}>
                      ✓
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Start Time Picker Modal */}
      <TimePickerModal
        visible={showStartTimePicker}
        onClose={() => setShowStartTimePicker(false)}
        onSelect={(time) => {
          handleStartTimeSelect(time);
          setShowStartTimePicker(false);
        }}
        initialTime={startTime}
      />

      {/* End Time Picker Modal */}
      <TimePickerModal
        visible={showEndTimePicker}
        onClose={() => setShowEndTimePicker(false)}
        onSelect={(time) => {
          handleEndTimeSelect(time);
          setShowEndTimePicker(false);
        }}
        initialTime={endTime}
        minTime={
          startTime
            ? minutesToTimeString(
                Math.min(
                  (timeStringToMinutes(startTime) ?? 0) + MIN_SHIFT_DURATION_MINUTES,
                  MAX_MINUTES_OF_DAY
                )
              )
            : null
        }
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
              <Text style={styles.modalTitle}>
                Wybierz pracownika
                {forceAssignOverride && (
                  <Text style={{ fontSize: 12, color: colors.primary }}>
                    {" "}
                    (All)
                  </Text>
                )}
              </Text>
              <TouchableOpacity onPress={() => setShowEmployeePicker(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            {getSortedEmployeesForPicker().length > 0 ? (
              <FlatList
                data={getSortedEmployeesForPicker()}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => {
                  const userAvail = getUserAvailability(item.id);
                  const isAvailable = !!userAvail;
                  
                  return (
                    <TouchableOpacity
                      style={[
                        styles.employeeItem,
                        selectedEmployee?.id === item.id &&
                          styles.employeeItemSelected,
                        !isAvailable && { opacity: 0.6, backgroundColor: '#F8F8F8' },
                      ]}
                      onPress={() => {
                        setSelectedEmployee(item);
                        setShowEmployeePicker(false);
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                          <Text style={styles.employeeName}>{item.name}</Text>
                          {isAvailable && (
                            <View
                              style={{
                                backgroundColor: "#DCFCE7",
                                paddingHorizontal: 6,
                                paddingVertical: 2,
                                borderRadius: 4,
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 10,
                                  fontWeight: "700",
                                  color: "#166534",
                                }}
                              >
                                ✓ DOSTĘPNY
                              </Text>
                            </View>
                          )}
                          {!isAvailable && (
                            <View
                              style={{
                                backgroundColor: "#FEE2E2",
                                paddingHorizontal: 6,
                                paddingVertical: 2,
                                borderRadius: 4,
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 10,
                                  fontWeight: "700",
                                  color: "#991B1B",
                                }}
                              >
                                NIEDOSTĘPNY
                              </Text>
                            </View>
                          )}
                        </View>
                        
                        {/* Availability hours */}
                        {userAvail && (
                          <Text
                            style={{
                              fontSize: 12,
                              color: colors.primary,
                              fontWeight: "600",
                              marginTop: 4,
                            }}
                          >
                            🕒 Dostępność: {userAvail.start} - {userAvail.end}
                          </Text>
                        )}
                        
                        {/* Positions */}
                        {item.positions && item.positions.length > 0 ? (
                          <View
                            style={{
                              flexDirection: "row",
                              flexWrap: "wrap",
                              gap: 4,
                              marginTop: 4,
                            }}
                          >
                            {item.positions.map((posId) => {
                              const pos = positions.find((p) => p.id === posId);
                              return pos ? (
                                <View
                                  key={posId}
                                  style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    gap: 4,
                                    backgroundColor: "#F8FAFC",
                                    paddingHorizontal: 6,
                                    paddingVertical: 2,
                                    borderRadius: 4,
                                  }}
                                >
                                  <View
                                    style={{
                                      width: 6,
                                      height: 6,
                                      borderRadius: 3,
                                      backgroundColor: pos.color,
                                    }}
                                  />
                                  <Text
                                    style={{ fontSize: 11, color: colors.muted }}
                                  >
                                    {pos.name}
                                  </Text>
                                </View>
                              ) : null;
                            })}
                          </View>
                        ) : (
                          <Text
                            style={{
                              fontSize: 12,
                              color: colors.muted,
                              marginTop: 2,
                            }}
                          >
                            Brak przypisanych stanowisk
                          </Text>
                        )}
                        {item.hourlyRate && (
                          <Text
                            style={{
                              fontSize: 12,
                              color: colors.muted,
                              fontWeight: "500",
                              marginTop: 4,
                            }}
                          >
                            {item.hourlyRate.toFixed(2)} zł/h
                          </Text>
                        )}
                      </View>
                      {selectedEmployee?.id === item.id && (
                        <Text style={{ fontSize: 18, color: colors.primary }}>
                          ✓
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                }}
              />
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  Brak dostępnych pracowników
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

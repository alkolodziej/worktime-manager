import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { colors, spacing, radius } from '../utils/theme';
import Screen from '../components/Screen';
import Card from '../components/Card';
import SectionHeader from '../components/SectionHeader';
import ProgressBar from '../components/ProgressBar';
import Badge from '../components/Badge';
import Toast from '../components/Toast';
import { LocationCheckModal } from '../components/LocationCheckModal';
import { Ionicons } from '@expo/vector-icons';
import { formatTimeRange, minutesToHhMm } from '../utils/format';
import { apiGetDashboard, apiClockIn, apiClockOut, apiGetActiveTimesheet } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  requestLocationPermissions,
  getCurrentLocation,
  isWithinRestaurant,
} from '../utils/location';

import { useNavigation, useFocusEffect } from '@react-navigation/native';

export default function HomeScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [dashboard, setDashboard] = React.useState(null);
  const [showShiftModal, setShowShiftModal] = React.useState(false);
  const [selectedShift, setSelectedShift] = React.useState(null);

  // Hoisted state
  const [activeStart, setActiveStart] = React.useState(null); 
  const [currentTime, setCurrentTime] = React.useState(new Date()); 
  const [isCheckingLocation, setIsCheckingLocation] = React.useState(false);
  const [locationToast, setLocationToast] = React.useState(null);
  
  const [locationStatus, setLocationStatus] = React.useState('loading'); 
  const [locationMessage, setLocationMessage] = React.useState('');
  const [locationDetails, setLocationDetails] = React.useState(null);

  useFocusEffect(
    React.useCallback(() => {
      if (!user?.id) return;

      let isActive = true;
      const sync = async () => {
        try {
          // 1. Fetch Dashboard (Stats & Next Shift)
          const data = await apiGetDashboard(user.id);
          if (isActive) setDashboard(data);

          // 2. Sync Active Timer
          let backendActive = null;
          try {
            const res = await apiGetActiveTimesheet(user.id);
            if (res && res.clockIn) backendActive = res;
          } catch (e) { /* ignore 404/null */ }

          if (isActive) {
             if (backendActive) {
                const startTime = new Date(backendActive.clockIn);
                setActiveStart(startTime);
                await AsyncStorage.setItem(ACTIVE_SHIFT_KEY, String(startTime.getTime()));
             } else {
                setActiveStart(null);
                await AsyncStorage.removeItem(ACTIVE_SHIFT_KEY);
             }
          }
        } catch (error) {
           console.error('Sync failed', error);
           // Fallback for timer
           const raw = await AsyncStorage.getItem(ACTIVE_SHIFT_KEY);
           if (isActive && raw) setActiveStart(new Date(parseInt(raw, 10)));
        }
      };

      sync();
      return () => { isActive = false; };
    }, [user?.id])
  );

  const now = currentTime;
  const nextShift = dashboard?.nextShift;
  const weekSummary = dashboard?.weekSummary || { workedMinutes: 0, plannedMinutes: 0, targetMinutes: 2400 };
  const clockInRules = dashboard?.clockInRules;

  const ACTIVE_SHIFT_KEY = `WTM_ACTIVE_SHIFT_START_${user?.id}`;

  // Removed redundant useEffect for apiGetActiveTimesheet since it's now in useFocusEffect above
  // React.useEffect(() => { ... }) has been removed here.

  React.useEffect(() => {
    // Update current time every second to refresh timer
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const isClockedIn = !!activeStart;

  const handleClockIn = async () => {
    // 1. Validation logic moved to backend
    if (clockInRules && !clockInRules.canClockIn) {
        Alert.alert('Info', clockInRules.message);
        return;
    }

    setIsCheckingLocation(true);
    setLocationStatus('loading');
    setLocationMessage('Weryfikacja uprawnień GPS...');
    setLocationDetails(null);

    try {
      // Step 1: Request location permissions
      await requestLocationPermissions();
      setLocationMessage('Pobieranie Twojej lokalizacji...');
      
      // Step 2: Get current location
      const userLocation = await getCurrentLocation();
      setLocationMessage('Weryfikacja miejsca pracy...');
      setLocationDetails({ accuracy: userLocation.accuracy });

      // Step 3: Check if user is within restaurant
      const locationCheck = await isWithinRestaurant(userLocation);
      
      setLocationDetails(prev => ({ 
        ...prev, 
        distance: locationCheck.distance,
        allowedRadius: locationCheck.radius
      }));
      
      if (!locationCheck.isWithin) {
        setLocationStatus('error');
        // Do not close automatically on error
        return;
      }

      // Success
      setLocationStatus('success');
      setLocationMessage('');
      
      // Persist state
      const now = Date.now();
      setActiveStart(new Date(now));
      await AsyncStorage.setItem(ACTIVE_SHIFT_KEY, String(now));
      if (user?.id) {
        // Fire and forget (or async without blocking UI too long)
        apiClockIn({
            userId: user.id,
            shiftId: nextShift?.id,
            timestamp: now,
            location: {
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
              accuracy: userLocation.accuracy,
            },
        }).catch(err => {
          // If backend says we are already clocked in, it's fine. Ignore.
          if (err.message && err.message.includes('already clocked in')) {
            console.log('Already clocked in (sync)');
            return;
          }
          console.error('BG ClockIn failed', err);
          // Optional: Revert UI state if it was a real network error?
          // For now, let's keep optimistic UI but shows toast if critical.
        });
      }
      
      // Auto-close success modal after short delay
      setTimeout(() => {
        setIsCheckingLocation(false);
        // Refresh dashboard to update UI instantly without waiting for focus
        apiGetDashboard(user.id).then(d => setDashboard(d)).catch(() => {});
      }, 1800);

    } catch (error) {
      setLocationStatus('error');
      setLocationMessage(error.message || 'Nie udało się pobrać lokalizacji');
    }
  };

  const handleClockOut = async () => {
    const now = Date.now();
    setActiveStart(null);
    await AsyncStorage.removeItem(ACTIVE_SHIFT_KEY);
    if (user?.id) {
      try { 
          await apiClockOut({ userId: user.id, timestamp: now });
          // Refresh dashboard stats immediately
          apiGetDashboard(user.id).then(d => setDashboard(d)).catch(() => {});
      } catch {}
    }
  };

  const startDate = nextShift?.startTime ? new Date(nextShift.startTime) : null;
  const endDate = nextShift?.endTime ? new Date(nextShift.endTime) : null;

  // Used globally: const now = currentTime; 
  const beforeStart = startDate ? now < startDate : false;
  const duringShift = startDate && endDate ? now >= startDate && now <= endDate : false;

  const countdownLabel = beforeStart ? formatCountdown(startDate, now) : null;
  const elapsedLabel = isClockedIn ? formatElapsed(activeStart, now) : null;

  return (
    <Screen>
      {/* Location Check Modal */}
      <LocationCheckModal
        visible={isCheckingLocation}
        status={locationStatus}
        message={locationMessage}
        technicalDetails={locationDetails}
        onRetry={handleClockIn}
        onClose={() => setIsCheckingLocation(false)}
      />

      {locationToast && (
        <Toast
          message={locationToast.message}
          type={locationToast.type}
          onDismiss={() => setLocationToast(null)}
        />
      )}
      <Text style={styles.greeting}>Cześć, {user?.name?.split(' ')[0] || 'Użytkowniku'}</Text>

      <SectionHeader title={nextShift?.isToday ? 'Dzisiejsza zmiana' : 'Najbliższa zmiana'} />
      <Card style={{ marginBottom: spacing.lg }}>
        {!nextShift ? (
          <Text style={styles.countdown}>Brak zaplanowanych zmian</Text>
        ) : (
        <TouchableOpacity
          onPress={() => {
            setSelectedShift(nextShift);
            setShowShiftModal(true);
          }}
          activeOpacity={0.7}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={styles.shiftText}>{formatTimeRange(nextShift.start, nextShift.end)}</Text>
              {!nextShift.isToday && (
                 <Text style={{ fontSize: 13, color: colors.primary, fontWeight: '500', marginBottom: 2 }}>
                    {new Date(nextShift.date).toLocaleDateString('pl-PL', { weekday: 'short', day: 'numeric', month: 'short' })}
                 </Text>
              )}
              <Text style={styles.metaText}>{nextShift.location} • {nextShift.role}</Text>
            </View>
            <View>
              <Badge label={nextShift.isToday ? 'Dziś' : 'Nadchodząca'} tone={nextShift.isToday ? 'success' : 'info'} />
              <Ionicons name="chevron-forward" size={20} color={colors.muted} style={{ marginTop: spacing.sm }} />
            </View>
          </View>
        </TouchableOpacity>
        )}
        {nextShift && beforeStart && countdownLabel && (
          <Text style={styles.countdown}>Start za {countdownLabel}</Text>
        )}
        {nextShift && !beforeStart && duringShift && !isClockedIn && (
          <Text style={styles.countdownLate}>Zmiana trwa — rozpocznij rejestrację</Text>
        )}
        {isClockedIn && (
          <Text style={styles.elapsed}>W pracy: {elapsedLabel}</Text>
        )}

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.inButton, (isClockedIn || isCheckingLocation || (clockInRules && !clockInRules.canClockIn) ? styles.disabledBtn : null)]}
            onPress={handleClockIn}
            disabled={isClockedIn || isCheckingLocation || (clockInRules && !clockInRules.canClockIn)}
            accessibilityLabel="Rozpocznij rejestrację czasu pracy"
            accessibilityHint="Wymaga weryfikacji lokalizacji GPS"
          >
            {isCheckingLocation ? (
              <>
                <ActivityIndicator size="small" color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.buttonText}>Sprawdzam...</Text>
              </>
            ) : (
              <>
                <Ionicons name="log-in-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.buttonText}>{isClockedIn ? 'W trakcie' : (clockInRules?.canClockIn ? 'Wejdź do pracy' : 'Brak zmiany')}</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.outButton]}
            onPress={handleClockOut}
            disabled={!isClockedIn}
            accessibilityLabel="Zakończ rejestrację czasu pracy"
          >
            <Ionicons name="log-out-outline" size={18} color={isClockedIn ? colors.primary : '#9AA1AE'} style={{ marginRight: 6 }} />
            <Text style={[styles.buttonText, styles.outText]}>Wyjdź z pracy</Text>
          </TouchableOpacity>
        </View>
      </Card>

      <SectionHeader title="Podsumowanie tygodnia (pon-nd)" />
      <Card style={{ marginBottom: spacing.lg }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm }}>
          <Text style={styles.summaryTitle}>Przepracowano</Text>
          <Text style={styles.summaryHours}>{minutesToHhMm(weekSummary.workedMinutes)}</Text>
        </View>
        <ProgressBar value={weekSummary.workedMinutes / (weekSummary.targetMinutes || 1)} />
        <Text style={styles.summaryHint}>
           Zaplanowane: {minutesToHhMm(weekSummary.plannedMinutes)} • Cel: {minutesToHhMm(weekSummary.targetMinutes)}
        </Text>
      </Card>

      <SectionHeader title="Szybkie akcje" />
      <View style={styles.quickGrid}>
        <QuickAction 
          icon="calendar-number-outline" 
          label="Dostępność" 
          onPress={() => navigation.navigate('Availability')}
        />
        <QuickAction 
          icon="swap-horizontal-outline" 
          label="Giełda Zmian" 
          onPress={() => navigation.navigate('Swaps')}
        />
      </View>

      {/* Shift Details Modal */}
      <Modal
        visible={showShiftModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowShiftModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Szczegóły zmiany</Text>
              <TouchableOpacity onPress={() => setShowShiftModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.lg }}>
              {selectedShift && (
                <>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>📅 Data</Text>
                    <Text style={styles.detailValue}>
                      {new Date(selectedShift.date).toLocaleDateString('pl-PL', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>🕐 Godziny</Text>
                    <Text style={styles.detailValue}>
                      {formatTimeRange(selectedShift.start, selectedShift.end)}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>📍 Lokalizacja</Text>
                    <Text style={styles.detailValue}>{selectedShift.location || 'Lokal główny'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>💼 Stanowisko</Text>
                    <Text style={styles.detailValue}>{selectedShift.role}</Text>
                  </View>
                  {selectedShift.notes && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>📝 Notatki</Text>
                      <Text style={styles.detailValue}>{selectedShift.notes}</Text>
                    </View>
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

function QuickAction({ icon, label, onPress, disabled }) {
  return (
    <TouchableOpacity
      style={[styles.qa, disabled && { opacity: 0.5 }]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Ionicons name={icon} size={18} color={colors.primary} />
      <Text style={styles.qaText}>{label}</Text>
    </TouchableOpacity>
  );
}



function formatCountdown(target, now) {
  const diff = Math.max(0, target.getTime() - now.getTime());
  
  // If > 24 hours, don't show countdown
  if (diff > 24 * 60 * 60 * 1000) {
      return null;
  }

  const s = Math.floor(diff / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h} h ${m} m`;
  if (m > 0) return `${m} m`;
  return 'mniej niż minutę';
}

function formatElapsed(start, now) {
  const diff = Math.max(0, now.getTime() - start.getTime());
  const s = Math.floor(diff / 1000);
  const h = Math.floor(s / 3600).toString().padStart(2, '0');
  const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${h}:${m}:${sec}`;
}

const styles = StyleSheet.create({
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  shiftText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  metaText: {
    marginTop: 6,
    color: colors.muted,
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    flexDirection: 'row',
  },
  inButton: {
    backgroundColor: colors.primary,
  },
  outButton: {
    backgroundColor: '#E9EEF8',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  outText: {
    color: colors.primary,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  summaryTitle: {
    color: colors.muted,
  },
  summaryHours: {
    marginTop: 4,
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  summaryHint: {
    marginTop: 8,
    color: colors.muted,
    fontSize: 12,
  },
  quickGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  qa: {
    flex: 1,
    backgroundColor: '#EFF5FF',
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E9FF',
  },
  qaText: {
    marginTop: 6,
    color: colors.primary,
    fontWeight: '600',
    fontSize: 12,
  },
  countdown: {
    marginTop: spacing.md,
    color: colors.muted,
  },
  countdownLate: {
    marginTop: spacing.md,
    color: colors.warning,
    fontWeight: '600',
  },
  elapsed: {
    marginTop: spacing.md,
    color: colors.success,
    fontWeight: '700',
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
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  detailRow: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F8',
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
});

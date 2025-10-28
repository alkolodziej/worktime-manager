import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, radius } from '../utils/theme';
import Screen from '../components/Screen';
import Card from '../components/Card';
import SectionHeader from '../components/SectionHeader';
import ProgressBar from '../components/ProgressBar';
import Badge from '../components/Badge';
import { Ionicons } from '@expo/vector-icons';
import { formatTimeRange, minutesToHhMm } from '../utils/format';
import { mockUser, generateShifts, getWeekSummary } from '../utils/mockData';
import { apiGetShifts, apiClockIn, apiClockOut } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HomeScreen() {
  const { user } = useAuth();
  // dynamic mock schedule
  const today = new Date();
  const todayStr = today.toDateString();
  const [shifts, setShifts] = React.useState([]);
  React.useEffect(() => {
    (async () => {
      try {
        const list = await apiGetShifts({});
        setShifts(list);
      } catch {
        // fallback to local generator if backend not available
        setShifts(generateShifts({ startDate: today, days: 21 }));
      }
    })();
  }, [todayStr]);
  const todaysShift = shifts.find(s => s && s.date && s.date.toDateString() === todayStr);
  const nextShift = todaysShift || shifts.find(s => s && s.date && s.date > today) || shifts[0];
  const weekSummary = React.useMemo(() => getWeekSummary(shifts, today, mockUser.targetWeekMinutes), [shifts, todayStr]);

  const [activeStart, setActiveStart] = React.useState(null); // Date | null
  const [tick, setTick] = React.useState(0); // force re-render each second when needed

  React.useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('WTM_ACTIVE_SHIFT_START');
        if (raw) setActiveStart(new Date(parseInt(raw, 10)));
      } catch {}
    })();
  }, []);

  React.useEffect(() => {
    // Run timer when counting down to next shift or when clocked in
    if (!nextShift) return;
    const startDate = parseShiftTime(nextShift.date, nextShift.start);
    const needsTick = activeStart || (startDate.getTime() > Date.now());
    if (!needsTick) return;
    const id = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(id);
  }, [activeStart, nextShift]);

  const isClockedIn = !!activeStart;

  const handleClockIn = async () => {
    const now = Date.now();
    setActiveStart(new Date(now));
    await AsyncStorage.setItem('WTM_ACTIVE_SHIFT_START', String(now));
    if (user?.id) {
      try { await apiClockIn({ userId: user.id, shiftId: nextShift?.id, timestamp: now }); } catch {}
    }
  };

  const handleClockOut = async () => {
    const now = Date.now();
    setActiveStart(null);
    await AsyncStorage.removeItem('WTM_ACTIVE_SHIFT_START');
    if (user?.id) {
      try { await apiClockOut({ userId: user.id, timestamp: now }); } catch {}
    }
  };

  const startDate = nextShift ? parseShiftTime(nextShift.date, nextShift.start) : null;
  const endDate = nextShift ? parseShiftTime(nextShift.date, nextShift.end) : null;
  const now = new Date();
  const beforeStart = startDate ? now < startDate : false;
  const duringShift = startDate && endDate ? now >= startDate && now <= endDate : false;

  const countdownLabel = beforeStart ? formatCountdown(startDate, now) : null;
  const elapsedLabel = isClockedIn ? formatElapsed(activeStart, now) : null;

  return (
    <Screen>
      <Text style={styles.greeting}>Cześć, {mockUser.name.split(' ')[0]} 👋</Text>

      <SectionHeader title={todaysShift ? 'Dzisiejsza zmiana' : 'Najbliższa zmiana'} />
      <Card style={{ marginBottom: spacing.lg }}>
        {!nextShift ? (
          <Text style={styles.countdown}>Brak zaplanowanych zmian</Text>
        ) : (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={styles.shiftText}>{formatTimeRange(nextShift.start, nextShift.end)}</Text>
            <Text style={styles.metaText}>{nextShift.location} • {nextShift.role}</Text>
          </View>
          <Badge label={todaysShift ? 'Dziś' : 'Jutro/Przyszłe'} tone={todaysShift ? 'success' : 'info'} />
        </View>
        )}
        {nextShift && beforeStart && (
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
            style={[styles.button, styles.inButton, (isClockedIn ? styles.disabledBtn : null)]}
            onPress={handleClockIn}
            disabled={isClockedIn}
          >
            <Ionicons name="log-in-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.buttonText}>{isClockedIn ? 'W trakcie' : 'Wejdź do pracy'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.outButton]}
            onPress={handleClockOut}
            disabled={!isClockedIn}
          >
            <Ionicons name="log-out-outline" size={18} color={isClockedIn ? colors.primary : '#9AA1AE'} style={{ marginRight: 6 }} />
            <Text style={[styles.buttonText, styles.outText]}>Wyjdź z pracy</Text>
          </TouchableOpacity>
        </View>
      </Card>

      <SectionHeader title="Podsumowanie tygodnia" />
      <Card style={{ marginBottom: spacing.lg }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm }}>
          <Text style={styles.summaryTitle}>Przepracowano</Text>
          <Text style={styles.summaryTitle}>{minutesToHhMm(weekSummary.workedMinutes)}</Text>
        </View>
        <ProgressBar value={weekSummary.workedMinutes / weekSummary.targetMinutes} />
        <Text style={styles.summaryHint}>Cel: {minutesToHhMm(weekSummary.targetMinutes)} (Plan: {minutesToHhMm(weekSummary.plannedMinutes)})</Text>
      </Card>

      <SectionHeader title="Szybkie akcje" />
      <View style={styles.quickGrid}>
        <QuickAction icon="time-outline" label="Spóźnię się" />
        <QuickAction icon="swap-horizontal-outline" label="Zamiana zmiany" />
        <QuickAction icon="document-text-outline" label="Zobacz regulamin" />
      </View>
    </Screen>
  );
}

function QuickAction({ icon, label }) {
  return (
    <View style={styles.qa}>
      <Ionicons name={icon} size={18} color={colors.primary} />
      <Text style={styles.qaText}>{label}</Text>
    </View>
  );
}

function parseShiftTime(dateObj, hhmm) {
  const [h, m] = hhmm.split(':').map((x) => parseInt(x, 10));
  const d = new Date(dateObj);
  d.setHours(h, m, 0, 0);
  return d;
}

function formatCountdown(target, now) {
  const diff = Math.max(0, target.getTime() - now.getTime());
  const s = Math.floor(diff / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h} h ${m} m`;
  if (m > 0) return `${m} m ${sec} s`;
  return `${sec} s`;
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
});

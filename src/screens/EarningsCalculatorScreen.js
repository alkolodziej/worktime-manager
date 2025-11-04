import React from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import Screen from '../components/Screen';
import Card from '../components/Card';
import ProgressBar from '../components/ProgressBar';
import { colors, spacing, radius } from '../utils/theme';
import { minutesToHhMm } from '../utils/format';
import { apiGetShifts, apiGetTimesheets } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function EarningsCalculatorScreen() {
  const { user } = useAuth();
  const [shifts, setShifts] = React.useState([]);
  const [timesheets, setTimesheets] = React.useState([]);
  const [rate, setRate] = React.useState('20'); // zł/h default

  React.useEffect(() => {
    (async () => {
      try {
        const list = await apiGetShifts({});
        setShifts(list);
      } catch (error) {
        console.error('Failed to fetch shifts:', error);
      }
    })();
  }, []);

  React.useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const list = await apiGetTimesheets({ userId: user.id });
        setTimesheets(list);
      } catch (error) {
        console.error('Failed to fetch timesheets:', error);
      }
    })();
  }, [user?.id]);

  const summary = React.useMemo(() => {
    const today = new Date();
    const start = new Date(today);
    start.setHours(0,0,0,0);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);

    // Calculate worked minutes from timesheets
    let workedMinutes = 0;
    timesheets.forEach(timesheet => {
      const clockIn = new Date(timesheet.clockIn);
      const clockOut = timesheet.clockOut ? new Date(timesheet.clockOut) : null;
      if (clockIn >= start && clockIn < end && clockOut) {
        workedMinutes += (clockOut - clockIn) / (1000 * 60); // Convert ms to minutes
      }
    });

    // Calculate planned minutes from shifts
    let plannedMinutes = 0;
    shifts.forEach(shift => {
      if (!shift?.date) return;
      const shiftDate = new Date(shift.date);
      if (shiftDate >= start && shiftDate < end) {
        const [startHour, startMin] = shift.start.split(':').map(x => parseInt(x, 10));
        const [endHour, endMin] = shift.end.split(':').map(x => parseInt(x, 10));
        let minutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
        if (minutes < 0) minutes += 24 * 60; // Handle overnight shifts
        plannedMinutes += minutes;
      }
    });

    return {
      workedMinutes,
      plannedMinutes,
      targetMinutes: 40 * 60, // 40 hours per week
    };
  }, [shifts, timesheets]);

  const workedHours = summary.workedMinutes / 60;
  const hourly = parseFloat(rate) || 0;
  const earnings = (workedHours * hourly);

  return (
    <Screen>
      <Text style={styles.title}>Kalkulator zarobków</Text>

      <Card style={{ marginTop: spacing.md }}>
        <Text style={styles.label}>Przepracowano (7 dni)</Text>
        <Text style={styles.value}>{minutesToHhMm(summary.workedMinutes)}</Text>

        <View style={{ marginTop: spacing.md }}>
          <Text style={styles.label}>Stawka (zł/h)</Text>
          <TextInput
            value={rate}
            onChangeText={setRate}
            keyboardType="numeric"
            style={styles.input}
            placeholder="20"
            placeholderTextColor="#999"
          />
        </View>

        <View style={{ marginTop: spacing.md }}>
          <Text style={styles.label}>Szacunkowe zarobki</Text>
          <Text style={[styles.value, { fontSize: 20 }]}>{earnings.toFixed(2)} zł</Text>
        </View>

        <View style={{ marginTop: spacing.md }}>
          <ProgressBar value={summary.workedMinutes / (summary.targetMinutes || 1)} />
          <Text style={styles.hint}>Cel: {minutesToHhMm(summary.targetMinutes)} • Plan: {minutesToHhMm(summary.plannedMinutes)}</Text>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '700', color: colors.text },
  label: { color: colors.muted },
  value: { marginTop: 6, color: colors.text, fontWeight: '700' },
  input: {
    marginTop: 8,
    backgroundColor: '#F2F4F8',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: '#E6EAF2',
    color: colors.text,
  },
  hint: { marginTop: 8, color: colors.muted, fontSize: 12 },
});
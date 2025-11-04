import React from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import Screen from '../components/Screen';
import Card from '../components/Card';
import ProgressBar from '../components/ProgressBar';
import { colors, spacing, radius } from '../utils/theme';
import { getWeekSummary, generateShifts } from '../utils/mockData';
import { minutesToHhMm } from '../utils/format';
import { apiGetShifts } from '../utils/api';

export default function EarningsCalculatorScreen() {
  const [shifts, setShifts] = React.useState([]);
  const [rate, setRate] = React.useState('20'); // zł/h default

  React.useEffect(() => {
    (async () => {
      try {
        const list = await apiGetShifts({});
        setShifts(list);
      } catch {
        setShifts(generateShifts({ startDate: new Date(), days: 21 }));
      }
    })();
  }, []);

  const summary = React.useMemo(() => getWeekSummary(shifts, new Date()), [shifts]);
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
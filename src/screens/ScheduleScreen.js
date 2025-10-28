import React from 'react';
import { View, Text, StyleSheet, SectionList, TouchableOpacity } from 'react-native';
import { colors, spacing } from '../utils/theme';
import Screen from '../components/Screen';
import Card from '../components/Card';
import Badge from '../components/Badge';
import SectionHeader from '../components/SectionHeader';
import { dayNamePl, formatDateLabel, formatTimeRange } from '../utils/format';
import { generateShifts } from '../utils/mockData';
import { apiGetShifts } from '../utils/api';

export default function ScheduleScreen() {
  const [range, setRange] = React.useState('week'); // 'week' | 'month'
  const [base, setBase] = React.useState([]);
  React.useEffect(() => {
    (async () => {
      try {
        const list = await apiGetShifts({});
        setBase(list);
      } catch {
        setBase(generateShifts({ startDate: new Date(), days: 28 }));
      }
    })();
  }, []);
  const filtered = React.useMemo(() => filterByRange(base, range), [base, range]);
  const sections = React.useMemo(() => groupByDate(filtered), [filtered]);
  return (
    <Screen>
      <Text style={styles.title}>Grafik</Text>
      <View style={styles.segmented}>
        <SegmentButton label="Tydzień" selected={range==='week'} onPress={() => setRange('week')} />
        <SegmentButton label="Miesiąc" selected={range==='month'} onPress={() => setRange('month')} />
      </View>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section }) => (
          <SectionHeader title={`${section.title}`} />
        )}
        renderItem={({ item }) => (
          <Card style={{ marginBottom: spacing.md }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={styles.hours}>{formatTimeRange(item.start, item.end)}</Text>
                <Text style={styles.meta}>{item.location} • {item.role}</Text>
              </View>
              <Badge label={item.role} tone="neutral" />
            </View>
          </Card>
        )}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ paddingVertical: spacing.md }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.text,
  },
  hours: {
    marginTop: 6,
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  meta: {
    marginTop: 4,
    color: colors.muted,
  },
  segmented: {
    flexDirection: 'row',
    gap: 8,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
});

function groupByDate(list) {
  const map = new Map();
  (list || []).filter(Boolean).forEach((shift) => {
    if (!shift?.date) return;
    const key = `${dayNamePl(shift.date)}, ${formatDateLabel(shift.date)}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(shift);
  });
  return Array.from(map.entries()).map(([title, data]) => ({ title, data }));
}

function filterByRange(list, range) {
  const now = new Date();
  if (range === 'month') {
    const m = now.getMonth();
    const y = now.getFullYear();
    return list.filter(s => s.date.getMonth() === m && s.date.getFullYear() === y);
  }
  // week: next 7 days including today
  const end = new Date(now);
  end.setDate(now.getDate() + 7);
  return list.filter(s => s.date >= startOfDay(now) && s.date <= end);
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0,0,0,0);
  return x;
}

function SegmentButton({ label, selected, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flex: 1,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: selected ? colors.primary : '#E0E4EA',
        backgroundColor: selected ? '#E9F2FF' : '#F3F6FA',
        alignItems: 'center',
      }}
    >
      <Text style={{ color: selected ? colors.primary : '#64748B', fontWeight: '600' }}>{label}</Text>
    </TouchableOpacity>
  );
}

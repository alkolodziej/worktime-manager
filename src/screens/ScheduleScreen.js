import React from 'react';
import { View, Text, StyleSheet, SectionList, TouchableOpacity, RefreshControl } from 'react-native';
import { colors, spacing } from '../utils/theme';
import Screen from '../components/Screen';
import Card from '../components/Card';
import Badge from '../components/Badge';
import SectionHeader from '../components/SectionHeader';
import { dayNamePl, formatDateLabel, formatTimeRange } from '../utils/format';
import { apiGetShifts } from '../utils/api';
import { showToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';

export default function ScheduleScreen() {
  const { user } = useAuth();
  const [range, setRange] = React.useState('week'); // 'week' | 'month'
  const [base, setBase] = React.useState([]);
  const [refreshing, setRefreshing] = React.useState(false);

  const loadShifts = React.useCallback(async () => {
    if (!user?.id) return;
    try {
      const list = await apiGetShifts({ assignedUserId: user.id });
      setBase(list);
    } catch (error) {
      console.error('Failed to fetch shifts:', error);
      showToast('Nie udało się załadować grafiku', 'error');
    }
  }, [user?.id]);

  React.useEffect(() => {
    loadShifts();
  }, [loadShifts]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadShifts();
    setRefreshing(false);
  }, [loadShifts]);

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
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Brak zmian w wybranym okresie</Text>
            <Text style={styles.emptyHint}>Pociągnij w dół, aby odświeżyć</Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
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
  emptyState: {
    paddingVertical: spacing.xl * 2,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  emptyHint: {
    marginTop: spacing.sm,
    fontSize: 14,
    color: colors.muted,
  },
});

function groupByDate(list) {
  const map = new Map();
  (list || []).filter(Boolean).forEach((shift) => {
    if (!shift?.date) return;
    // Ensure date is a Date object
    const dateObj = shift.date instanceof Date ? shift.date : new Date(shift.date);
    const key = `${dayNamePl(dateObj)}, ${formatDateLabel(dateObj)}`;
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
    return list.filter(s => {
      const dateObj = s.date instanceof Date ? s.date : new Date(s.date);
      return dateObj.getMonth() === m && dateObj.getFullYear() === y;
    });
  }
  // week: next 7 days including today
  const end = new Date(now);
  end.setDate(now.getDate() + 7);
  return list.filter(s => {
    const dateObj = s.date instanceof Date ? s.date : new Date(s.date);
    return dateObj >= startOfDay(now) && dateObj <= end;
  });
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
      accessibilityRole="button"
      accessibilityState={{ selected }}
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

import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import Screen from '../components/Screen';
import Card from '../components/Card';
import { colors, spacing, radius } from '../utils/theme';
import { useAuth } from '../context/AuthContext';
import { apiGetShifts, apiCreateSwap, apiGetSwaps } from '../utils/api';
import { formatTimeRange } from '../utils/format';


export default function SwapsScreen() {
  const { user } = useAuth();
  const [shifts, setShifts] = React.useState([]);
  const [swaps, setSwaps] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const s = await apiGetShifts({});
      const upcoming = s.filter((x) => x.date >= startOfDay(new Date()));
      setShifts(upcoming);
    } catch {}
    try {
      if (user?.id) {
        const my = await apiGetSwaps({ userId: user.id });
        setSwaps(my);
      }
    } catch {}
    setLoading(false);
  }, [user?.id]);

  React.useEffect(() => { load(); }, [load]);

  const requestSwap = async (shiftId) => {
    if (!user?.id) return;
    try { await apiCreateSwap({ shiftId, requesterId: user.id }); await load(); } catch {}
  };

  return (
    <Screen>
      <Text style={styles.title}>Zamiana zmian</Text>
      <Text style={styles.subtitle}>Wybierz zmianę, aby poprosić o zamianę</Text>

      <FlatList
        data={shifts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: spacing.md, paddingVertical: spacing.md }}
        refreshing={loading}
        onRefresh={load}
        renderItem={({ item }) => (
          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={styles.itemTitle}>{item.date.toDateString()}</Text>
                <Text style={styles.itemMeta}>{formatTimeRange(item.start, item.end)} • {item.location}</Text>
              </View>
              <TouchableOpacity style={styles.smallBtn} onPress={() => requestSwap(item.id)}>
                <Text style={styles.smallBtnText}>Poproś</Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}
      />

      <Text style={[styles.subtitle, { marginTop: spacing.lg }]}>Moje prośby</Text>
      <FlatList
        data={swaps}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: spacing.md, paddingVertical: spacing.md }}
        renderItem={({ item }) => (
          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text>Status: {prettyStatus(item.status)}</Text>
              <Text>#{item.shiftId}</Text>
            </View>
          </Card>
        )}
      />
    </Screen>
  );
}

function startOfDay(d) { const x = new Date(d); x.setHours(0,0,0,0); return x; }
function prettyStatus(s) {
  if (s === 'pending') return 'oczekujące';
  if (s === 'accepted') return 'zaakceptowane';
  if (s === 'rejected') return 'odrzucone';
  if (s === 'cancelled') return 'anulowane';
  return s;
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '700', color: colors.text },
  subtitle: { color: colors.muted },
  itemTitle: { fontWeight: '700', color: colors.text },
  itemMeta: { marginTop: 4, color: colors.muted },
  smallBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.md,
  },
  smallBtnText: { color: '#fff', fontWeight: '700' },
});

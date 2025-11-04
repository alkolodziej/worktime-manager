import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import Screen from '../components/Screen';
import Card from '../components/Card';
import { colors, spacing, radius } from '../utils/theme';
import { apiGetSwaps, apiAcceptSwap, apiRejectSwap, apiGetAvailabilities } from '../utils/api';

export default function AdminRequestsScreen() {
  const [swaps, setSwaps] = React.useState([]);
  const [avails, setAvails] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try { setSwaps(await apiGetSwaps({})); } catch {}
    try { setAvails(await apiGetAvailabilities({})); } catch {}
    setLoading(false);
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const accept = async (id) => { try { await apiAcceptSwap({ id }); await load(); } catch {} };
  const reject = async (id) => { try { await apiRejectSwap({ id }); await load(); } catch {} };

  return (
    <Screen>
      <Text style={styles.title}>Prośby i zgłoszenia</Text>

      <Text style={[styles.subtitle, { marginTop: spacing.md }]}>Zamiany zmian</Text>
      <FlatList
        data={swaps}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: spacing.md, paddingVertical: spacing.md }}
        refreshing={loading}
        onRefresh={load}
        renderItem={({ item }) => (
          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={styles.itemTitle}>Shift #{item.shiftId}</Text>
                <Text style={styles.itemMeta}>Od: {item.requesterId} • Status: {item.status}</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity style={styles.smallBtn} onPress={() => accept(item.id)}>
                  <Text style={styles.smallBtnText}>Akceptuj</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.smallBtnDanger} onPress={() => reject(item.id)}>
                  <Text style={styles.smallBtnText}>Odrzuć</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Card>
        )}
      />

      <Text style={styles.subtitle}>Dostępności</Text>
      <FlatList
        data={avails}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: spacing.md, paddingVertical: spacing.md }}
        renderItem={({ item }) => (
          <Card>
            <Text style={styles.itemTitle}>Użytkownik {item.userId}</Text>
            <Text style={styles.itemMeta}>{new Date(item.date).toLocaleDateString('pl-PL')} • {item.start}-{item.end}</Text>
          </Card>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '700', color: colors.text },
  subtitle: { color: colors.muted },
  itemTitle: { fontWeight: '700', color: colors.text },
  itemMeta: { marginTop: 4, color: colors.muted },
  smallBtn: { backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.md },
  smallBtnDanger: { backgroundColor: '#D7263D', paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.md },
  smallBtnText: { color: '#fff', fontWeight: '700' },
});

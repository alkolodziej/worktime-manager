import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import Screen from '../components/Screen';
import Card from '../components/Card';
import { colors, spacing, radius } from '../utils/theme';
import { apiGetSwaps, apiAcceptSwap, apiRejectSwap, apiGetAvailabilities, apiGetUsers } from '../utils/api';
import { showToast } from '../components/Toast';

export default function AdminRequestsScreen() {
  const [swaps, setSwaps] = React.useState([]);
  const [avails, setAvails] = React.useState([]);
  const [users, setUsers] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try { 
      setSwaps(await apiGetSwaps({}));
      setAvails(await apiGetAvailabilities({}));
      setUsers(await apiGetUsers());
    } catch (error) {
      showToast('Błąd ładowania danych', 'error');
    }
    setLoading(false);
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId);
    return user?.name || `Użytkownik #${userId}`;
  };

  const accept = async (id) => { 
    try { 
      await apiAcceptSwap({ id }); 
      showToast('Zamiana zaakceptowana', 'success');
      await load(); 
    } catch {
      showToast('Błąd akceptacji', 'error');
    } 
  };
  
  const reject = async (id) => { 
    try { 
      await apiRejectSwap({ id }); 
      showToast('Zamiana odrzucona', 'success');
      await load(); 
    } catch {
      showToast('Błąd odrzucenia', 'error');
    }
  };

  // Filter only pending swaps
  const pendingSwaps = swaps.filter(s => s.status === 'pending');

  return (
    <Screen>
      <Text style={styles.title}>Prośby i zgłoszenia</Text>

      <Text style={[styles.subtitle, { marginTop: spacing.md }]}>Zamiany zmian (oczekujące)</Text>
      <FlatList
        data={pendingSwaps}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: spacing.md, paddingVertical: spacing.md }}
        refreshing={loading}
        onRefresh={load}
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Brak oczekujących zamian</Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle}>Zmiana #{item.shiftId}</Text>
                <Text style={styles.itemMeta}>
                  Od: {getUserName(item.requesterId)}
                  {item.targetUserId && ` → Do: ${getUserName(item.targetUserId)}`}
                </Text>
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

      <Text style={styles.subtitle}>Dostępności pracowników</Text>
      <FlatList
        data={avails}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: spacing.md, paddingVertical: spacing.md }}
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Brak zgłoszeń dostępności</Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <Card>
            <Text style={styles.itemTitle}>{getUserName(item.userId)}</Text>
            <Text style={styles.itemMeta}>{new Date(item.date).toLocaleDateString('pl-PL')} • {item.start}–{item.end}</Text>
          </Card>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '700', color: colors.text },
  subtitle: { color: colors.muted, marginTop: spacing.md },
  itemTitle: { fontWeight: '700', color: colors.text },
  itemMeta: { marginTop: 4, color: colors.muted, fontSize: 13 },
  smallBtn: { backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.md },
  smallBtnDanger: { backgroundColor: '#D7263D', paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.md },
  smallBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  emptyState: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.muted,
  },
});

import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import Screen from '../components/Screen';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Toast, { showToast } from '../components/Toast';
import { colors, spacing, radius } from '../utils/theme';
import { useAuth } from '../context/AuthContext';
import { apiGetShifts, apiCreateSwap, apiGetSwaps, apiGetUsers, apiCancelSwap } from '../utils/api';
import { formatTimeRange } from '../utils/format';


export default function SwapsScreen() {
  const { user } = useAuth();
  const [shifts, setShifts] = React.useState([]);
  const [swaps, setSwaps] = React.useState([]);
  const [users, setUsers] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [cancelingSwapId, setCancelingSwapId] = React.useState(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const s = await apiGetShifts({});
      const upcoming = s.filter((x) => x.date >= startOfDay(new Date()));
      setShifts(upcoming);
    } catch {}
    try {
      const u = await apiGetUsers();
      setUsers(u);
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

  // Check if user already requested a swap for this shift
  const hasSwapRequest = (shiftId) => {
    return swaps.some(s => s.shiftId === shiftId && s.status === 'pending');
  };

  const requestSwap = async (shiftId, targetUserId) => {
    if (!user?.id) return;

    if (hasSwapRequest(shiftId)) {
      showToast('Masz już prośbę o zamianę dla tej zmiany', 'error');
      return;
    }

    try {
      await apiCreateSwap({ 
        shiftId, 
        requesterId: user.id,
        targetUserId: targetUserId || undefined
      });
      showToast('Prośba wysłana', 'success');
      await load();
    } catch (e) {
      showToast('Błąd podczas tworzenia prośby', 'error');
    }
  };

  const handleCancelSwap = (swapId) => {
    Alert.alert(
      'Anuluj prośbę',
      'Czy na pewno chcesz anulować tę prośbę o zamianę?',
      [
        { text: 'Nie', style: 'cancel' },
        {
          text: 'Tak, anuluj',
          style: 'destructive',
          onPress: async () => {
            try {
              setCancelingSwapId(swapId);
              await apiCancelSwap({ id: swapId, actorUserId: user.id });
              showToast('Prośba anulowana', 'success');
              await load();
            } catch (e) {
              showToast('Błąd anulowania prośby', 'error');
            } finally {
              setCancelingSwapId(null);
            }
          },
        },
      ]
    );
  };

  return (
    <Screen>
      <Toast />
      <Text style={styles.title}>Zamiana zmian</Text>
      <Text style={styles.subtitle}>Wybierz zmianę, aby poprosić o zamianę</Text>

      <FlatList
        data={shifts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: spacing.md, paddingVertical: spacing.md }}
        refreshing={loading}
        onRefresh={load}
        renderItem={({ item: shift }) => {
          const assignedUser = users.find(u => u.id === shift.assignedUserId);
          const hasRequest = hasSwapRequest(shift.id);
          return (
            <Card>
              <View style={{ marginBottom: spacing.md }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1, marginRight: spacing.md }}>
                    <Text style={styles.itemTitle}>
                      {new Date(shift.date).toLocaleDateString('pl-PL', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </Text>
                    <Text style={styles.itemMeta}>{formatTimeRange(shift.start, shift.end)}</Text>
                    <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
                      <Badge label={shift.role} tone="primary" size="small" />
                      <Badge label={shift.location || 'Lokal główny'} tone="neutral" size="small" />
                    </View>
                    {assignedUser && (
                      <Text style={[styles.itemMeta, { marginTop: spacing.sm }]}>
                        👤 {assignedUser.name}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={[styles.smallBtn, hasRequest && styles.smallBtnDisabled]}
                    onPress={() => requestSwap(shift.id, shift.assignedUserId)}
                    disabled={hasRequest}
                  >
                    {hasRequest ? (
                      <Text style={styles.smallBtnText}>✓ Prośba wysłana</Text>
                    ) : (
                      <Text style={styles.smallBtnText}>Poproś</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          );
        }}
      />

      <Text style={[styles.subtitle, { marginTop: spacing.lg }]}>Moje prośby o zamianę</Text>
      <FlatList
        data={swaps}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: spacing.md, paddingVertical: spacing.md }}
        renderItem={({ item: swap }) => {
          const shift = shifts.find(s => s.id === swap.shiftId);
          const targetUser = users.find(u => u.id === swap.targetUserId);
          const statusBadge = swap.status === 'pending' ? 'primary' : swap.status === 'accepted' ? 'success' : 'danger';
          
          return (
            <Card style={{ opacity: swap.status === 'cancelled' ? 0.6 : 1 }}>
              <View style={{ marginBottom: spacing.md }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md }}>
                  <View style={{ flex: 1, marginRight: spacing.md }}>
                    {shift && (
                      <>
                        <Text style={styles.itemTitle}>
                          {new Date(shift.date).toLocaleDateString('pl-PL', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </Text>
                        <Text style={styles.itemMeta}>{formatTimeRange(shift.start, shift.end)}</Text>
                        <Badge label={prettyStatus(swap.status)} tone={statusBadge} style={{ marginTop: spacing.sm }} />
                      </>
                    )}
                    {!shift && (
                      <Text style={styles.itemMeta}>Zmiana #id:{swap.shiftId}</Text>
                    )}
                  </View>
                  {swap.status === 'pending' && (
                    <TouchableOpacity
                      style={[styles.smallBtn, { backgroundColor: '#FEE2E2' }]}
                      onPress={() => handleCancelSwap(swap.id)}
                      disabled={cancelingSwapId === swap.id}
                    >
                      {cancelingSwapId === swap.id ? (
                        <ActivityIndicator size="small" color="#DC2626" />
                      ) : (
                        <Text style={[styles.smallBtnText, { color: '#DC2626' }]}>Anuluj</Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </Card>
          );
        }}
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
  title: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  subtitle: { color: colors.muted, marginTop: spacing.md, marginBottom: spacing.md },
  itemTitle: { fontWeight: '700', color: colors.text, fontSize: 15 },
  itemMeta: { marginTop: 4, color: colors.muted, fontSize: 13 },
  smallBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.md,
  },
  smallBtnDisabled: {
    backgroundColor: '#E0F2FE',
  },
  smallBtnText: { 
    color: '#fff', 
    fontWeight: '700',
    fontSize: 12,
  },
});

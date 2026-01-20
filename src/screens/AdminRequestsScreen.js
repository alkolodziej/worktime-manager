import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Screen from '../components/Screen';
import Card from '../components/Card';
import Badge from '../components/Badge';
import { colors, spacing, radius } from '../utils/theme';
import { apiGetSwaps, apiAcceptSwap, apiRejectSwap, apiGetAvailabilities } from '../utils/api';
import { showToast } from '../components/Toast';
import { Ionicons } from '@expo/vector-icons';

export default function AdminRequestsScreen() {
  const [activeTab, setActiveTab] = useState('swaps'); // 'swaps' | 'avails'
  const [swaps, setSwaps] = useState([]);
  const [avails, setAvails] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [s, a] = await Promise.all([
        apiGetSwaps({ includeNames: true }),
        apiGetAvailabilities({ includeNames: true })
      ]);
      setSwaps(s);
      setAvails(a);
    } catch (err) {
      showToast('Błąd pobierania danych', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleAcceptSwap = async (swapId) => {
    try {
      await apiAcceptSwap({ id: swapId });
      showToast('Zaakceptowano zamianę', 'success');
      loadData();
    } catch (error) {
           showToast('Wystąpił błąd', 'error');
    }
  };

  const handleRejectSwap = async (swapId) => {
      Alert.alert('Odrzucić?', 'Czy na pewno chcesz odrzucić tę prośbę?', [
          { text: 'Anuluj', style: 'cancel' },
          { 
              text: 'Odrzuć', 
              style: 'destructive', 
              onPress: async () => {
                try {
                    await apiRejectSwap({ id: swapId });
                    showToast('Odrzucono', 'success');
                    loadData();
                } catch {
                    showToast('Błąd', 'error');
                }
              }
          }
      ]);
  };

  // -- RENDERERS --

  const renderSwapItem = ({ item }) => {
    const requester = item.requesterName || `ID: ${item.requesterId}`;
    const target = item.targetName || 'Ktokolwiek';
    
    return (
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <Badge text={`Zmiana #${item.shiftId}`} variant="secondary" />
          <Badge text={item.status === 'pending' ? 'Oczekuje' : item.status} variant={item.status === 'pending' ? 'warning' : 'default'} />
        </View>
        
        <View style={styles.cardBody}>
            <View style={styles.row}>
                <Ionicons name="person-arrow-up-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.text}>{requester} chce oddać zmianę</Text>
            </View>
            <View style={styles.row}>
                <Ionicons name="person-arrow-down-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.text}>Dla: <Text style={{fontWeight:'bold'}}>{target}</Text></Text>
            </View>
            {item.reason && (
                <Text style={styles.reason}>"{item.reason}"</Text>
            )}
        </View>

        {item.status === 'pending' && (
            <View style={styles.actions}>
                <TouchableOpacity style={[styles.btn, styles.btnReject]} onPress={() => handleRejectSwap(item.id)}>
                    <Text style={styles.btnTextDanger}>Odrzuć</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, styles.btnAccept]} onPress={() => handleAcceptSwap(item.id)}>
                    <Text style={styles.btnTextWhite}>Akceptuj</Text>
                </TouchableOpacity>
            </View>
        )}
      </Card>
    );
  };

  const renderAvailItem = ({ item }) => {
    // availability item structure? assuming: { userId, date, start, end, ... }
    const user = item.userName || `ID: ${item.userId}`;
    const dateStr = new Date(item.date).toLocaleDateString('pl-PL', { weekday: 'short', day: '2-digit', month: 'short' });

    return (
        <Card style={styles.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                    <Text style={styles.availOwner}>{user}</Text>
                    <View style={styles.row}>
                        <Ionicons name="calendar-outline" size={14} color={colors.muted} />
                        <Text style={styles.availDate}>{dateStr}</Text>
                        <Ionicons name="time-outline" size={14} color={colors.muted} style={{marginLeft: 8}} />
                        <Text style={styles.availDate}>{item.start} - {item.end}</Text>
                    </View>
                </View>
                <Badge text="Dostępność" variant="outline" />
            </View>
        </Card>
    );
  };

  const pendingSwaps = swaps.filter(s => s.status === 'pending');
  
  const data = activeTab === 'swaps' ? pendingSwaps : avails;

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Zgłoszenia</Text>
      </View>

      <View style={styles.tabs}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'swaps' && styles.tabActive]} 
            onPress={() => setActiveTab('swaps')}
          >
              <Text style={[styles.tabText, activeTab === 'swaps' && styles.tabTextActive]}>Zamiany ({pendingSwaps.length})</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'avails' && styles.tabActive]} 
            onPress={() => setActiveTab('avails')}
          >
              <Text style={[styles.tabText, activeTab === 'avails' && styles.tabTextActive]}>Dostępności ({avails.length})</Text>
          </TouchableOpacity>
      </View>

      <FlatList
        data={data}
        keyExtractor={item => item.id}
        renderItem={activeTab === 'swaps' ? renderSwapItem : renderAvailItem}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        ListEmptyComponent={
            <View style={styles.empty}>
                <Ionicons name="file-tray-outline" size={48} color={colors.border} />
                <Text style={styles.emptyText}>Brak elementów</Text>
            </View>
        }
        refreshing={loading}
        onRefresh={loadData}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: spacing.md, marginTop: spacing.sm },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  
  tabs: { flexDirection: 'row', marginBottom: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md, padding: 4 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: radius.sm },
  tabActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  tabText: { fontWeight: '600', color: colors.muted },
  tabTextActive: { color: colors.primary },

  card: { marginBottom: spacing.sm }, // Override Card margin if needed
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  cardBody: { gap: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  text: { fontSize: 14, color: colors.text },
  reason: { fontStyle: 'italic', color: colors.muted, marginTop: 4, fontSize: 13 },
  
  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  btn: { flex: 1, paddingVertical: 10, borderRadius: radius.md, alignItems: 'center' },
  btnReject: { backgroundColor: '#FEE2E2' },
  btnAccept: { backgroundColor: colors.primary },
  btnTextDanger: { color: '#DC2626', fontWeight: '700' },
  btnTextWhite: { color: '#fff', fontWeight: '700' },

  availOwner: { fontSize: 16, fontWeight: '700', color: colors.text },
  availDate: { fontSize: 14, color: colors.muted },

  empty: { alignItems: 'center', padding: 40 },
  emptyText: { color: colors.muted, marginTop: 10 }
});

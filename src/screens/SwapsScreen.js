import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import Screen from '../components/Screen';
import Card from '../components/Card';
import Badge from '../components/Badge';
import { showToast } from '../components/Toast';
import { colors, spacing, radius } from '../utils/theme';
import { useAuth } from '../context/AuthContext';
import { apiGetSwaps, apiCancelSwap, apiAcceptSwap } from '../utils/api';
import { formatTimeRange } from '../utils/format';
import { Ionicons } from '@expo/vector-icons';

export default function SwapsScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('market'); // 'market' | 'mine'
  
  const [marketSwaps, setMarketSwaps] = useState([]);
  const [mySwaps, setMySwaps] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [market, mine] = await Promise.all([
        apiGetSwaps({ userId: user.id, type: 'market' }),
        apiGetSwaps({ userId: user.id, type: 'mine' }),
      ]);
      setMarketSwaps(market);
      setMySwaps(mine);
    } catch (e) {
      console.error(e);
      showToast('Błąd pobierania danych', 'error');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleTakeSwap = async (swap) => {
    Alert.alert(
      'Potwierdzenie',
      'Czy na pewno chcesz przejąć tę zmianę?',
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Tak, biorę!',
          onPress: async () => {
            setProcessingId(swap.id);
            try {
              await apiAcceptSwap({ id: swap.id, actorUserId: user.id });
              showToast('Zmiana przejęta! Sprawdź swój grafik.', 'success');
              await loadData();
            } catch (e) {
              showToast('Nie udało się przejąć zmiany', 'error');
            } finally {
              setProcessingId(null);
            }
          }
        }
      ]
    );
  };

  const handleCancelSwap = async (swap) => {
    if (swap.status !== 'pending') return;
    
    Alert.alert(
      'Anulowanie',
      'Czy chcesz wycofać ofertę zamiany?',
      [
        { text: 'Nie', style: 'cancel' },
        {
          text: 'Wycofaj',
          style: 'destructive',
          onPress: async () => {
            setProcessingId(swap.id);
            try {
              await apiCancelSwap({ id: swap.id, actorUserId: user.id });
              showToast('Oferta wycofana', 'success');
              await loadData();
            } catch (e) {
              showToast('Błąd usuwania oferty', 'error');
            } finally {
              setProcessingId(null);
            }
          }
        }
      ]
    );
  };

  const renderSwapItem = ({ item }) => {
    const shift = item.shift;
    if (!shift) return null; 

    const dateObj = new Date(shift.date);
    const isMine = item.requesterId === user?.id;
    const isPending = item.status === 'pending';
    const requesterName = item.requesterName || 'Nieznany';

    return (
      <Card style={[styles.card, !isPending && { opacity: 0.6 }]}>
        <View style={styles.cardHeader}>
          <View>
             <Text style={styles.dateText}>
               {dateObj.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })}
             </Text>
             <Text style={styles.timeText}>{formatTimeRange(shift.start, shift.end)}</Text>
          </View>
          <Badge 
            label={isMine ? prettyStatus(item.status) : requesterName} 
            tone={isMine ? getStatusTone(item.status) : 'info'} 
          />
        </View>

        <View style={styles.detailsRow}>
           <Text style={styles.positionText}>{shift.role}</Text>
           <Text style={styles.locationText}>• {shift.location || 'Lokal główny'}</Text>
        </View>

        {/* Action Buttons */}
        {isPending && (
          <View style={styles.actionRow}>
            {isMine ? (
               <TouchableOpacity 
                 style={[styles.btn, styles.btnCancel]} 
                 onPress={() => handleCancelSwap(item)}
                 disabled={!!processingId}
               >
                 {processingId === item.id ? <ActivityIndicator color="#C0392B" /> : <Text style={styles.btnCancelText}>Wycofaj ofertę</Text>}
               </TouchableOpacity>
            ) : (
               <TouchableOpacity 
                 style={[styles.btn, styles.btnTake]} 
                 onPress={() => handleTakeSwap(item)}
                 disabled={!!processingId}
               >
                  {processingId === item.id ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnTakeText}>Weź zmianę</Text>}
               </TouchableOpacity>
            )}
          </View>
        )}
      </Card>
    );
  };

  return (
    <Screen>
       <Text style={styles.headerTitle}>Giełda Zmian</Text>
       <Text style={{ color: colors.muted, marginBottom: spacing.lg }}>Przeglądaj dostępne zmiany lub zarządzaj swoimi ofertami zamiany.</Text>
       
       <View style={styles.tabs}>
         <TabButton title="Dostępne (Giełda)" active={activeTab === 'market'} onPress={() => setActiveTab('market')} count={marketSwaps.length} />
         <TabButton title="Moje Oferty" active={activeTab === 'mine'} onPress={() => setActiveTab('mine')} />
       </View>

       <FlatList
         data={activeTab === 'market' ? marketSwaps : mySwaps}
         keyExtractor={item => item.id}
         renderItem={renderSwapItem}
         contentContainerStyle={{ paddingVertical: spacing.md, paddingBottom: 100 }}
         refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} />}
         ListEmptyComponent={
           <View style={styles.emptyState}>
             <Ionicons name={activeTab === 'market' ? "basket-outline" : "list-outline"} size={48} color={colors.muted + '50'} />
             <Text style={styles.emptyText}>
               {activeTab === 'market' 
                 ? 'Jesteś na bieżąco! Brak dostępnych zmian do wzięcia.' 
                 : 'Nie masz aktywnych ofert zamiany.'}
             </Text>
           </View>
         }
       />
    </Screen>
  );
}

function TabButton({ title, active, onPress, count }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.tab, active && styles.tabActive]}>
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{title}</Text>
      {count > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function prettyStatus(s) {
  const map = { pending: 'Oczekuje', accepted: 'Zaakceptowana', rejected: 'Odrzucona', cancelled: 'Anulowana' };
  return map[s] || s;
}

function getStatusTone(s) {
  if (s === 'pending') return 'warning';
  if (s === 'accepted') return 'success';
  return 'neutral';
}

const styles = StyleSheet.create({
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    padding: 4,
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: radius.md,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  tabActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontWeight: '600',
    color: colors.textSecondary,
    fontSize: 14,
  },
  tabTextActive: {
    color: colors.text,
  },
  badge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  card: {
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    textTransform: 'capitalize',
  },
  timeText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  detailsRow: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  positionText: {
    fontWeight: '600',
    color: colors.text,
  },
  locationText: {
    color: colors.muted,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#F2F4F8',
    paddingTop: spacing.md,
  },
  btn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    minWidth: 120,
    alignItems: 'center',
  },
  btnTake: {
    backgroundColor: colors.primary,
  },
  btnTakeText: {
    color: '#fff',
    fontWeight: '600',
  },
  btnCancel: {
    backgroundColor: '#FEE2E2',
  },
  btnCancelText: {
    color: '#DC2626',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    marginTop: spacing.md,
    fontSize: 16,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 22,
  },
});

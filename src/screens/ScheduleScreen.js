import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, SectionList, TouchableOpacity, RefreshControl, Modal, Alert } from 'react-native';
import { colors, spacing, radius } from '../utils/theme';
import Screen from '../components/Screen';
import Card from '../components/Card';
import Badge from '../components/Badge';
import SectionHeader from '../components/SectionHeader';
import { dayNamePl, formatDateLabel, formatTimeRange, minutesToHhMm, getWeekRange } from '../utils/format';
import { apiGetShifts, apiCreateSwap } from '../utils/api'; 
import { showToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function ScheduleScreen() {
  const { user } = useAuth();
  const [range, setRange] = useState('week'); // 'week' | 'month'
  const [viewDate, setViewDate] = useState(new Date()); // Reference date for navigation
  const [sections, setSections] = useState([]);
  const [summary, setSummary] = useState('0h 00m');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null);

  const loadShifts = useCallback(async () => {
    if (!user?.id) return;
    try {
      let from, to;
      if (range === 'week') {
          const { start, end } = getWeekRange(viewDate);
          from = start; to = end;
      } else {
          from = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
          to = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);
      }

      const res = await apiGetShifts({ 
        assignedUserId: user.id,
        from,
        to,
        groupBy: 'date',
        summary: 'true'
      });
      
      // res.data is object { "YYYY-MM-DD": [...] }
      // Convert to sections
      const rawGroups = res.data || {};
      const newSections = Object.keys(rawGroups).sort().map(dateKey => ({
          title: dateKey, // Format handled in SectionHeader or here
          data: rawGroups[dateKey]
      }));
      
      setSections(newSections);
      setSummary(minutesToHhMm(res.totalMinutes || 0));
    } catch (error) {
      console.error('Failed to fetch shifts:', error);
      showToast('Nie udało się załadować grafiku', 'error');
    }
  }, [user?.id, range, viewDate]);

  useEffect(() => {
    loadShifts();
  }, [loadShifts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadShifts();
    setRefreshing(false);
  }, [loadShifts]);

  // Navigation Handlers
  const handlePrev = () => {
    const newDate = new Date(viewDate);
    if (range === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setViewDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(viewDate);
    if (range === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setViewDate(newDate);
  };

  // Date Label Calculation
  const dateLabel = useMemo(() => {
    if (range === 'month') {
      return viewDate.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' });
    } else {
      const { start, end } = getWeekRange(viewDate);
      // Format: 12 sty - 18 sty
      const f = d => d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' });
      return `${f(start)} - ${f(end)}`;
    }
  }, [viewDate, range]);

  const handleOfferSwap = async (shift) => {
    if (!shift) return;
    // Potentially navigate to SwapsScreen or do it inline
    // Inline simpler for now
    Alert.alert(
      'Wystaw na zamianę',
      `Czy chcesz wystawić zmianę ${shift.date instanceof Date ? shift.date.toLocaleDateString() : shift.date} na giełdę?`,
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Wystaw',
          onPress: async () => {
            try {
               // Assuming logic: create a swap request without targetUserId = 'market'
               await apiCreateSwap({ shiftId: shift.id, requesterId: user.id });
               showToast('Wystawiono zmianę na giełdę', 'success');
               setSelectedShift(null);
            } catch (e) {
               showToast('Błąd wystawiania zmiany', 'error');
            }
          }
        }
      ]
    );
  };

  return (
    <Screen>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Mój Grafik</Text>
        <View style={styles.summaryBadge}>
           <Ionicons name="time-outline" size={16} color={colors.primary} />
           <Text style={styles.summaryText}>{summary}</Text>
        </View>
      </View>

      <View style={styles.segmented}>
        <SegmentButton label="Tydzień" selected={range==='week'} onPress={() => setRange('week')} />
        <SegmentButton label="Miesiąc" selected={range==='month'} onPress={() => setRange('month')} />
      </View>

      {/* Date Navigation Bar */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.navBtn} onPress={handlePrev}>
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.navLabel}>{dateLabel}</Text>
        <TouchableOpacity style={styles.navBtn} onPress={handleNext}>
          <Ionicons name="chevron-forward" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        renderSectionHeader={({ section }) => (
          <SectionHeader title={`${section.title}`} />
        )}
        renderItem={({ item }) => (
          <TouchableOpacity 
            activeOpacity={0.7} 
            onPress={() => setSelectedShift(item)}
          >
            <Card style={styles.card}>
              <View style={styles.cardRow}>
                <View>
                  <Text style={styles.hours}>{formatTimeRange(item.start, item.end)}</Text>
                  <Text style={styles.meta}>{item.location} • {item.role}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                  <Badge label={item.role} tone="primary" size="small" />
                  {/* Future: If swap requested, show badge */}
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color={colors.muted + '40'} />
            <Text style={styles.emptyText}>Brak zmian w tym okresie</Text>
            <Text style={styles.emptyHint}>Odpocznij!</Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ paddingVertical: spacing.md, paddingBottom: 100 }}
      />
      
      {/* Shift Details Modal */}
      {selectedShift && (
        <Modal transparent animationType="fade" visible={!!selectedShift} onRequestClose={() => setSelectedShift(null)}>
          <View style={styles.modalOverlay}>
             <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Szczegóły zmiany</Text>
                <Text style={styles.modalDate}>
                   {new Date(selectedShift.date).toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })}
                </Text>
                <View style={styles.detailRow}>
                   <Text style={styles.detailLabel}>Godziny:</Text>
                   <Text style={styles.detailValue}>{formatTimeRange(selectedShift.start, selectedShift.end)}</Text>
                </View>
                <View style={styles.detailRow}>
                   <Text style={styles.detailLabel}>Stanowisko:</Text>
                   <Text style={styles.detailValue}>{selectedShift.role}</Text>
                </View>
                 <View style={styles.detailRow}>
                   <Text style={styles.detailLabel}>Lokalizacja:</Text>
                   <Text style={styles.detailValue}>{selectedShift.location || 'Główna'}</Text>
                </View>

                <TouchableOpacity style={styles.actionButton} onPress={() => handleOfferSwap(selectedShift)}>
                   <Ionicons name="swap-horizontal" size={20} color="#fff" style={{ marginRight: 8 }}/>
                   <Text style={styles.actionButtonText}>Wystaw na zamianę</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedShift(null)}>
                   <Text style={styles.closeButtonText}>Zamknij</Text>
                </TouchableOpacity>
             </View>
          </View>
        </Modal>
      )}

    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  summaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    gap: 6,
  },
  summaryText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  card: {
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  cardRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  hours: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  meta: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  segmented: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: spacing.md,
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 8,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#E0E4EA'
  },
  navBtn: {
    padding: 8,
  },
  navLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    textTransform: 'capitalize'
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
    opacity: 0.8,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.md,
  },
  emptyHint: {
    marginTop: spacing.xs,
    fontSize: 14,
    color: colors.muted,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.xl,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  modalDate: {
    fontSize: 16,
    color: colors.muted,
    marginBottom: spacing.xl,
    textTransform: 'capitalize',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F4F8',
  },
  detailLabel: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  detailValue: {
    fontWeight: '600',
    color: colors.text,
    fontSize: 16,
  },
  actionButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: radius.lg,
    marginTop: spacing.xl,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  closeButton: {
    marginTop: spacing.md,
    alignItems: 'center',
    paddingVertical: 12,
  },
  closeButtonText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
});

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


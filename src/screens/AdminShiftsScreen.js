import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert, FlatList, ActivityIndicator } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, radius } from '../utils/theme';
import Screen from '../components/Screen';
import { Ionicons } from '@expo/vector-icons';
import { apiGetShifts, apiCreateShift, apiDeleteShift, apiUpdateShift, apiGetUsers, apiGetPositions, apiGetAvailableUsers } from '../utils/api';
import { showToast } from '../components/Toast';
import DateTimePicker from '../components/DateTimePicker';

// Locale Configuration
LocaleConfig.locales['pl'] = {
  monthNames: ['Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec','Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień'],
  monthNamesShort: ['Sty','Lut','Mar','Kwi','Maj','Cze','Lip','Sie','Wrz','Paź','Lis','Gru'],
  dayNames: ['Niedziela','Poniedziałek','Wtorek','Środa','Czwartek','Piątek','Sobota'],
  dayNamesShort: ['Nie','Pn','Wt','Śr','Cz','Pt','So'],
  today: 'Dzisiaj'
};
LocaleConfig.defaultLocale = 'pl';

export default function AdminShiftsScreen() {
  // Data State
  const [items, setItems] = useState({}); // { "2024-01-01": [Shift, Shift], ... }
  const [users, setUsers] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);

  // For Picker
  const [availableUsers, setAvailableUsers] = useState([]);

  // UI State
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [modalVisible, setModalVisible] = useState(false);
  const [showUserPicker, setShowUserPicker] = useState(false);
  const [showPositionPicker, setShowPositionPicker] = useState(false);
  
  // Edit/Create Form State
  const [isEditing, setIsEditing] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  const [formUserId, setFormUserId] = useState('');
  const [formStart, setFormStart] = useState(new Date());
  const [formEnd, setFormEnd] = useState(new Date());
  const [formPositionId, setFormPositionId] = useState('');

  // 1. Initial Metadata Load
  useEffect(() => {
    fetchMetadata();
  }, []);

  const fetchMetadata = async () => {
    try {
      const [u, p] = await Promise.all([
        apiGetUsers(), 
        apiGetPositions()
      ]);
      setUsers(u);
      setPositions(p);
    } catch (e) {
      console.error("Metadata fetch error", e);
    }
  };

  // 2. Fetch Shifts on Focus
  useFocusEffect(
    useCallback(() => {
      // Load range: +/- 3 months from selected date (or now)
      const centerDate = new Date(selectedDate);
      const from = new Date(centerDate); from.setMonth(centerDate.getMonth() - 3); from.setDate(1);
      const to = new Date(centerDate); to.setMonth(centerDate.getMonth() + 3); to.setDate(0);
      
      fetchShifts(from, to);
    }, [selectedDate]) // Re-fetch only if we actively jump extremely far (simple impl for now just reload)
  );

  const fetchShifts = async (from, to) => {
    setLoading(true);
    try {
      // Use backend grouping
      const grouped = await apiGetShifts({ from, to, groupBy: 'date' });
      setItems(grouped);
    } catch (e) {
      showToast('Błąd pobierania grafiku', 'error');
    }
    setLoading(false);
  };

  // 3. Prepare Marked Dates for Calendar
  const markedDates = useMemo(() => {
    const marks = {};
    
    // Mark dates with dots
    Object.keys(items).forEach(date => {
      if (items[date] && items[date].length > 0) {
        marks[date] = { marked: true, dotColor: colors.primary };
      }
    });

    // Mark selected date
    marks[selectedDate] = {
      ...(marks[selectedDate] || {}),
      selected: true,
      selectedColor: colors.primary,
      selectedTextColor: '#fff'
    };

    return marks;
  }, [items, selectedDate]);

  // Modal Handlers
  const openModal = async (shift = null) => {
    setIsEditing(!!shift);
    // Fetch availability for the selected date
    try {
       const aUsers = await apiGetAvailableUsers(selectedDate);
       setAvailableUsers(aUsers);
    } catch (e) {
       console.error(e);
       setAvailableUsers(users); // Fallback
    }

    if (shift) {
      setEditingShift(shift);
      setFormUserId(shift.assignedUserId);
      setFormStart(new Date(shift.start));
      setFormEnd(new Date(shift.end));
      
      // Try to match position by ID first, then by name (role)
      let posId = shift.positionId;
      if (!posId && shift.role) {
         const found = positions.find(p => p.name === shift.role);
         if (found) posId = found.id;
      }
      setFormPositionId(posId || '');
      
    } else {
      setEditingShift(null);
      setFormUserId(users[0]?.id || '');
      const s = new Date(selectedDate); s.setHours(8, 0, 0, 0);
      const e = new Date(selectedDate); e.setHours(16, 0, 0, 0);
      setFormStart(s);
      setFormEnd(e);
      setFormPositionId(positions[0]?.id || '');
    }
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingShift(null);
  };

  const handleSave = async () => {
    if (!formUserId) {
      showToast('Wybierz pracownika', 'error');
      return;
    }

    if (formStart >= formEnd) {
      showToast('Godzina końca musi być późniejsza', 'error');
      return;
    }

    try {
      const payload = {
        date: selectedDate,
        start: formStart.toISOString(),
        end: formEnd.toISOString(),
        assignedUserId: formUserId,
        role: positions.find(p => p.id === formPositionId)?.name || 'Pracownik',
        positionId: formPositionId,
        location: 'Lokal główny' // Default location
      };

      if (isEditing) {
        if (!editingShift || !editingShift.id) {
           showToast('Błąd: brak ID zmiany', 'error');
           return;
        }
        await apiUpdateShift(editingShift.id, payload);
        showToast('Zmiana zaktualizowana', 'success');
      } else {
        await apiCreateShift(payload);
        showToast('Zmiana dodana', 'success');
      }
      closeModal();
      
      // Refresh
      const centerDate = new Date(selectedDate);
      const from = new Date(centerDate); from.setMonth(centerDate.getMonth() - 3); from.setDate(1);
      const to = new Date(centerDate); to.setMonth(centerDate.getMonth() + 3); to.setDate(0);
      fetchShifts(from, to);

    } catch (e) {
      showToast('Błąd zapisu', 'error');
    }
  };

  const handleDelete = () => {
    Alert.alert('Usuń zmianę', 'Czy na pewno chcesz usunąć tę zmianę?', [
      { text: 'Anuluj', style: 'cancel' },
      { 
        text: 'Usuń', 
        style: 'destructive', 
        onPress: async () => {
          try {
            await apiDeleteShift(editingShift.id);
            showToast('Usunięto', 'success');
            closeModal();
            // Refresh
            const centerDate = new Date(selectedDate);
            const from = new Date(centerDate); from.setMonth(centerDate.getMonth() - 3); from.setDate(1);
            const to = new Date(centerDate); to.setMonth(centerDate.getMonth() + 3); to.setDate(0);
            fetchShifts(from, to);
          } catch {
             showToast('Błąd usuwania', 'error');
          }
        }
      }
    ]);
  };

  // List Renderers
  const renderItem = ({ item }) => {
    const user = users.find(u => u.id === item.assignedUserId);
    const start = new Date(item.start);
    const end = new Date(item.end);
    const timeStr = `${start.getHours()}:${String(start.getMinutes()).padStart(2, '0')} - ${end.getHours()}:${String(end.getMinutes()).padStart(2, '0')}`;
    
    return (
      <TouchableOpacity 
        style={styles.item} 
        onPress={() => openModal(item)}
      >
        <View style={[styles.itemColorBar, { backgroundColor: item.color || colors.primary }]} />
        <View style={styles.itemContent}>
          <Text style={styles.itemTime}>{timeStr}</Text>
          <Text style={styles.itemName}>{user?.name || 'Pracownik'}</Text>
          <Text style={styles.itemRole}>{item.role}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.muted} />
      </TouchableOpacity>
    );
  };

  const currentUserName = users.find(u => u.id == formUserId)?.name || 'Wybierz pracownika';
  const currentPosName = positions.find(p => p.id == formPositionId)?.name || 'Brak stanowiska';
  
  // Data for current day
  const currentDayItems = items[selectedDate] || [];

  return (
    <Screen>
      <View style={styles.container}>
        {/* UPPER PART: CALENDAR */}
        <View style={styles.calendarContainer}>
          <Calendar
            current={selectedDate}
            onDayPress={(day) => setSelectedDate(day.dateString)}
            monthFormat={'yyyy MM'}
            markedDates={markedDates}
            theme={{
              todayTextColor: colors.primary,
              arrowColor: colors.primary,
              textDayFontWeight: '500',
              textMonthFontWeight: 'bold',
              textDayHeaderFontWeight: '500',
            }}
          />
        </View>

        {/* LOWER PART: LIST */}
        <View style={styles.listContainer}>
          <View style={styles.listHeader}>
             <Text style={styles.listTitle}>Zmiany: {selectedDate}</Text>
             <TouchableOpacity style={styles.addBtnSmall} onPress={() => openModal(null)}>
               <Ionicons name="add" size={20} color="#fff" />
               <Text style={styles.addBtnText}>Dodaj</Text>
             </TouchableOpacity>
          </View>

          {loading ? (
             <ActivityIndicator style={{marginTop: 20}} size="small" color={colors.primary} />
          ) : (
            <FlatList
              data={currentDayItems}
              keyExtractor={(item, index) => `${item.id || 'no-id'}-${index}`}
              renderItem={renderItem}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>Brak zmian w tym dniu.</Text>
                </View>
              }
              contentContainerStyle={{ paddingBottom: 80 }}
            />
          )}
        </View>
      </View>

      {/* MODAL */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
           <View style={styles.modalContent}>
             <Text style={styles.modalTitle}>{editingShift ? 'Edytuj Zmianę' : 'Nowa Zmiana'}</Text>
             <Text style={styles.modalDate}>{selectedDate}</Text>
             
             {/* Employee Select */}
             <Text style={styles.label}>Pracownik</Text>
             <TouchableOpacity style={styles.selectBtn} onPress={() => setShowUserPicker(true)}>
               <Text style={styles.selectVal}>{currentUserName}</Text>
               <Ionicons name="chevron-down" size={16} color={colors.muted} />
             </TouchableOpacity>
             
             {/* Position Select */}
             <Text style={styles.label}>Stanowisko</Text>
             <TouchableOpacity style={styles.selectBtn} onPress={() => setShowPositionPicker(true)}>
               <Text style={styles.selectVal}>{currentPosName}</Text>
               <Ionicons name="chevron-down" size={16} color={colors.muted} />
             </TouchableOpacity>

             {/* Times */}
             <View style={{ flexDirection: 'row', gap: 12, marginTop: 10 }}>
                <View style={{ flex: 1 }}>
                   <Text style={styles.label}>Start</Text>
                   <DateTimePicker value={formStart} mode="time" onChange={(e,d) => d && setFormStart(d)} />
                </View>
                <View style={{ flex: 1 }}>
                   <Text style={styles.label}>Koniec</Text>
                   <DateTimePicker value={formEnd} mode="time" onChange={(e,d) => d && setFormEnd(d)} />
                </View>
             </View>

             {/* Actions */}
             <View style={styles.modalActions}>
               {editingShift && (
                 <TouchableOpacity style={styles.delBtn} onPress={handleDelete}>
                    <Ionicons name="trash-outline" size={20} color="#fff" />
                 </TouchableOpacity>
               )}
               <TouchableOpacity style={styles.cancelBtn} onPress={closeModal}>
                 <Text style={{ color: colors.text }}>Anuluj</Text>
               </TouchableOpacity>
               <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                 <Text style={{ color: '#fff', fontWeight: 'bold' }}>Zapisz</Text>
               </TouchableOpacity>
             </View>
           </View>
        </View>

        {/* User Picker Modal */}
        {showUserPicker && (
          <Modal transparent animationType="fade">
            <TouchableOpacity style={styles.pickerOverlay} onPress={() => setShowUserPicker(false)}>
              <View style={styles.pickerContent}>
                <Text style={styles.pickerHeader}>Wybierz pracownika</Text>
                <FlatList 
                  data={availableUsers.length > 0 ? availableUsers : users}
                  keyExtractor={(i, index) => `${i.id}-${index}`}
                  renderItem={({ item }) => {
                    // Availability is attached by backend in availableUsers array
                    const avail = item.availability;
                    let availText = null;
                    let availColor = colors.muted;

                    if (avail) {
                        if (avail.type === 'unavailable') {
                            availText = 'Niedostępny';
                            availColor = colors.error;
                        } else {
                            availText = `${avail.start} - ${avail.end}`;
                            availColor = colors.success;
                        }
                    }

                    return (
                      <TouchableOpacity 
                        style={styles.pickerItem} 
                        onPress={() => { setFormUserId(item.id); setShowUserPicker(false); }}
                      > 
                        <View>
                          <Text style={[styles.pickerItemText, item.id === formUserId && styles.pickerItemSel]}>
                             {item.name}
                          </Text>
                          {availText ? (
                             <Text style={{ fontSize: 12, color: availColor, marginTop: 2 }}>
                               {availText}
                             </Text>
                          ) : (
                             <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>Brak danych o dyspozycyjności</Text>
                          )}
                        </View>
                        {item.id === formUserId && <Ionicons name="checkmark" size={20} color={colors.primary} />}
                      </TouchableOpacity>
                    );
                  }}
                />
              </View>
            </TouchableOpacity>
          </Modal>
        )}

        {/* Position Picker Modal */}
        {showPositionPicker && (
          <Modal transparent animationType="fade">
            <TouchableOpacity style={styles.pickerOverlay} onPress={() => setShowPositionPicker(false)}>
              <View style={styles.pickerContent}>
                <Text style={styles.pickerHeader}>Wybierz stanowisko</Text>
                <FlatList 
                  data={positions}
                  keyExtractor={(i, index) => `${i.id}-${index}`}
                  renderItem={({ item }) => {
                    const selectedUser = users.find(u => u.id === formUserId);
                    const isAssigned = selectedUser?.positions?.includes(item.id);
                    return (
                      <TouchableOpacity 
                        style={styles.pickerItem} 
                        onPress={() => { setFormPositionId(item.id); setShowPositionPicker(false); }}
                      > 
                        <View>
                           <Text style={[styles.pickerItemText, item.id === formPositionId && styles.pickerItemSel]}>
                              {item.name}
                           </Text>
                           {isAssigned && (
                                <Text style={{ fontSize: 11, color: colors.success, marginTop: 2 }}>
                                   <Ionicons name="checkmark-circle-outline" size={10} /> Przypisane
                                </Text>
                           )}
                        </View>
                        {item.id === formPositionId && <Ionicons name="checkmark" size={20} color={colors.primary} />}
                      </TouchableOpacity>
                    );
                  }}
                />
              </View>
            </TouchableOpacity>
          </Modal>
        )}
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  calendarContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 10
  },
  listContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F9FAFB'
  },
  listHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15
  },
  listTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  addBtnSmall: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20
  },
  addBtnText: { color: '#fff', fontSize: 14, fontWeight: '600', marginLeft: 4 },
  
  item: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1
  },
  itemColorBar: { width: 4, height: 40, borderRadius: 2, marginRight: 16 },
  itemContent: { flex: 1 },
  itemTime: { color: colors.muted, fontSize: 13, marginBottom: 2 },
  itemName: { color: colors.text, fontSize: 16, fontWeight: '600' },
  itemRole: { color: colors.primary, fontSize: 13, marginTop: 2 },
  
  emptyState: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: colors.muted },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 4, color: colors.text },
  modalDate: { fontSize: 14, color: colors.muted, marginBottom: 20 },
  
  label: { fontSize: 12, color: colors.muted, marginBottom: 6, marginTop: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  selectBtn: {
     flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
     backgroundColor: '#F9FAFB', padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB'
  },
  selectVal: { fontSize: 16, color: colors.text },
  
  modalActions: { flexDirection: 'row', marginTop: 32, gap: 12 },
  delBtn: { backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center', width: 48, borderRadius: 10 },
  cancelBtn: { flex: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#fff' },
  saveBtn: { flex: 2, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', borderRadius: 10, padding: 14 },

  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 40 },
  pickerContent: { backgroundColor: '#fff', borderRadius: 12, maxHeight: '60%' },
  pickerHeader: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', fontWeight: 'bold', fontSize: 16, color: colors.text },
  pickerItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pickerItemText: { fontSize: 16, color: colors.text },
  pickerItemSel: { color: colors.primary, fontWeight: 'bold' }
});

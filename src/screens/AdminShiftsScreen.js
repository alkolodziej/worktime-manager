import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList } from 'react-native';
import Screen from '../components/Screen';
import Card from '../components/Card';
import DateTimePicker from '../components/DateTimePicker';
import { colors, spacing, radius } from '../utils/theme';
import { apiGetShifts, apiCreateShift, apiDeleteShift, apiAssignShift } from '../utils/api';
import { showToast } from '../components/Toast';

export default function AdminShiftsScreen() {
  const [list, setList] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [date, setDate] = React.useState(null);
  const [startDate, setStartDate] = React.useState(null);
  const [endDate, setEndDate] = React.useState(null);
  const [role, setRole] = React.useState('Kelner');
  const [location, setLocation] = React.useState('Restauracja');

  const load = React.useCallback(async () => {
    setLoading(true);
    try { setList(await apiGetShifts({})); } catch {}
    setLoading(false);
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const onCreate = async () => {
    if (!date || !startDate || !endDate) {
      showToast('Wypełnij wszystkie pola', 'error');
      return;
    }
    try {
      const start = startDate.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit', hour12: false });
      const end = endDate.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit', hour12: false });
      await apiCreateShift({ 
        date: date.toISOString(), 
        start, 
        end, 
        role, 
        location 
      }); 
      await load(); 
      setDate(null); 
      setStartDate(null);
      setEndDate(null);
      showToast('Dodano zmianę', 'success');
    } catch (error) {
      showToast('Nie udało się dodać zmiany', 'error');
    }
  };

  const onDelete = async (id) => { 
    try { 
      await apiDeleteShift(id); 
      await load(); 
      showToast('Usunięto zmianę', 'success');
    } catch (error) {
      showToast('Nie udało się usunąć zmiany', 'error');
    } 
  };
  const onAssign = async (id, userId) => { 
    try { 
      await apiAssignShift(id, userId || null); 
      await load(); 
      showToast(userId ? 'Przypisano pracownika do zmiany' : 'Odłączono pracownika od zmiany', 'success');
    } catch (error) {
      showToast('Nie udało się zaktualizować przypisania', 'error');
    } 
  };

  return (
    <Screen>
      <Text style={styles.title}>Zarządzaj zmianami</Text>

      <Card style={{ marginTop: spacing.md }}>
        <DateTimePicker
          label="Data"
          value={date}
          onChange={setDate}
          mode="date"
          placeholder="Wybierz datę"
        />
        <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.md }}>
          <View style={{ flex: 1 }}>
            <DateTimePicker
              label="Od"
              value={startDate}
              onChange={setStartDate}
              mode="time"
              placeholder="08:00"
            />
          </View>
          <View style={{ flex: 1 }}>
            <DateTimePicker
              label="Do"
              value={endDate}
              onChange={setEndDate}
              mode="time"
              placeholder="16:00"
            />
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.md }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Rola</Text>
            <TextInput value={role} onChangeText={setRole} placeholder="Kelner" style={styles.input} placeholderTextColor={colors.muted} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Lokalizacja</Text>
            <TextInput value={location} onChangeText={setLocation} placeholder="Restauracja" style={styles.input} placeholderTextColor={colors.muted} />
          </View>
        </View>
        <TouchableOpacity style={[styles.button, (!date || !start || !end) && styles.buttonDisabled]} disabled={!date || !start || !end} onPress={onCreate}>
          <Text style={styles.buttonText}>Dodaj zmianę</Text>
        </TouchableOpacity>
      </Card>

      <FlatList
        data={list}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: spacing.md, paddingVertical: spacing.md }}
        refreshing={loading}
        onRefresh={load}
        renderItem={({ item }) => (
          <Card>
            <Text style={styles.itemTitle}>{item.date.toDateString()} • {item.start}-{item.end}</Text>
            <Text style={styles.itemMeta}>{item.location} • {item.role} • przypisany: {item.assignedUserId || '—'}</Text>
            <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.md }}>
              <TouchableOpacity style={styles.smallBtnDanger} onPress={() => onDelete(item.id)}>
                <Text style={styles.smallBtnText}>Usuń</Text>
              </TouchableOpacity>
              <AssignBox onAssign={(userId) => onAssign(item.id, userId)} />
            </View>
          </Card>
        )}
      />
    </Screen>
  );
}

function AssignBox({ onAssign }) {
  const [uid, setUid] = React.useState('');
  return (
    <View style={{ flexDirection: 'row', gap: 8, flex: 1 }}>
      <TextInput value={uid} onChangeText={setUid} placeholder="userId" style={[styles.input, { flex: 1 }]} placeholderTextColor={colors.muted} />
      <TouchableOpacity style={styles.smallBtn} onPress={() => onAssign(uid)}>
        <Text style={styles.smallBtnText}>Przypisz</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.smallBtn} onPress={() => onAssign(null)}>
        <Text style={styles.smallBtnText}>Odepnij</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '700', color: colors.text },
  label: { color: colors.muted },
  input: {
    backgroundColor: '#F2F4F8',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: '#E6EAF2',
    color: colors.text,
  },
  button: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontWeight: '700' },
  itemTitle: { fontWeight: '700', color: colors.text },
  itemMeta: { marginTop: 4, color: colors.muted },
  smallBtn: { backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.md },
  smallBtnDanger: { backgroundColor: '#D7263D', paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.md },
  smallBtnText: { color: '#fff', fontWeight: '700' },
});

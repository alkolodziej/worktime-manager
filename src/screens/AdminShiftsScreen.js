import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList } from 'react-native';
import Screen from '../components/Screen';
import Card from '../components/Card';
import { colors, spacing, radius } from '../utils/theme';
import { apiGetShifts, apiCreateShift, apiDeleteShift, apiAssignShift } from '../utils/api';

export default function AdminShiftsScreen() {
  const [list, setList] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [date, setDate] = React.useState('');
  const [start, setStart] = React.useState('08:00');
  const [end, setEnd] = React.useState('16:00');
  const [role, setRole] = React.useState('Kelner');
  const [location, setLocation] = React.useState('Restauracja');

  const load = React.useCallback(async () => {
    setLoading(true);
    try { setList(await apiGetShifts({})); } catch {}
    setLoading(false);
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const onCreate = async () => {
    if (!date || !start || !end) return;
    try { await apiCreateShift({ date, start, end, role, location }); await load(); setDate(''); } catch {}
  };

  const onDelete = async (id) => { try { await apiDeleteShift(id); await load(); } catch {} };
  const onAssign = async (id, userId) => { try { await apiAssignShift(id, userId || null); await load(); } catch {} };

  return (
    <Screen>
      <Text style={styles.title}>Zarządzaj zmianami</Text>

      <Card style={{ marginTop: spacing.md }}>
        <Text style={styles.label}>Data</Text>
        <TextInput value={date} onChangeText={setDate} placeholder="2025-10-28" style={styles.input} placeholderTextColor={colors.muted} />
        <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.md }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Od</Text>
            <TextInput value={start} onChangeText={setStart} placeholder="08:00" style={styles.input} placeholderTextColor={colors.muted} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Do</Text>
            <TextInput value={end} onChangeText={setEnd} placeholder="16:00" style={styles.input} placeholderTextColor={colors.muted} />
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

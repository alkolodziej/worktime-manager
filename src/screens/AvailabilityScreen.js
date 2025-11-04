import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList } from 'react-native';
import Screen from '../components/Screen';
import Card from '../components/Card';
import DateTimePicker from '../components/DateTimePicker';
import { colors, spacing, radius } from '../utils/theme';
import { useAuth } from '../context/AuthContext';
import { apiGetAvailabilities, apiCreateAvailability, apiDeleteAvailability } from '../utils/api';
import { showToast } from '../components/Toast';

export default function AvailabilityScreen() {
  const { user } = useAuth();
  const [list, setList] = React.useState([]);
  const [date, setDate] = React.useState(null);
  const [startDate, setStartDate] = React.useState(null);
  const [endDate, setEndDate] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await apiGetAvailabilities({ userId: user.id });
      setList(res);
    } catch {}
    setLoading(false);
  }, [user?.id]);

  React.useEffect(() => { load(); }, [load]);

  const onAdd = async () => {
    if (!user?.id || !date || !startDate || !endDate) {
      showToast('Wypełnij wszystkie pola', 'error');
      return;
    }
    try {
      const start = startDate.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit', hour12: false });
      const end = endDate.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit', hour12: false });
      await apiCreateAvailability({ 
        userId: user.id, 
        date: date.toISOString(), 
        start, 
        end 
      });
      setDate(null);
      setStartDate(null);
      setEndDate(null);
      await load();
      showToast('Dodano dostępność', 'success');
    } catch (error) {
      showToast('Nie udało się dodać dostępności', 'error');
    }
  };

  const onDelete = async (id) => {
    try { 
      await apiDeleteAvailability(id); 
      await load();
      showToast('Usunięto dostępność', 'success');
    } catch (error) {
      showToast('Nie udało się usunąć dostępności', 'error');
    }
  };

  return (
    <Screen>
      <Text style={styles.title}>Moja dostępność</Text>

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
        <TouchableOpacity style={[styles.button, (!date || !start || !end) && styles.buttonDisabled]} disabled={!date || !start || !end} onPress={onAdd}>
          <Text style={styles.buttonText}>Dodaj</Text>
        </TouchableOpacity>
      </Card>

      <Text style={[styles.subtitle, { marginTop: spacing.lg }]}>Twoje zgłoszenia</Text>
      <FlatList
        data={list}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: spacing.md, paddingVertical: spacing.md }}
        refreshing={loading}
        onRefresh={load}
        renderItem={({ item }) => (
          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={styles.itemTitle}>{new Date(item.date).toDateString()}</Text>
                <Text style={styles.itemMeta}>{item.start}–{item.end}</Text>
              </View>
              <TouchableOpacity onPress={() => onDelete(item.id)}>
                <Text style={{ color: '#D7263D', fontWeight: '600' }}>Usuń</Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '700', color: colors.text },
  subtitle: { color: colors.muted },
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
});

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
  const [startDate, setStartDate] = React.useState(() => {
    const d = new Date();
    d.setHours(8, 0, 0, 0);
    return d;
  });
  const [endDate, setEndDate] = React.useState(() => {
    const d = new Date();
    d.setHours(16, 0, 0, 0);
    return d;
  });
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

    // Validate time range
    if (startDate >= endDate) {
      showToast('Godzina końcowa musi być późniejsza niż początkowa', 'error');
      return;
    }

    try {
      // Formatowanie godzin w formacie HH:mm
      const formatTime = (date) => {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
      };

      const start = formatTime(startDate);
      const end = formatTime(endDate);

      // Formatowanie daty jako ISO string (tylko data, bez czasu)
      // Stwórz nową datę na północ UTC dla wybranego dnia
      const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 23, 0, 0));

      await apiCreateAvailability({ 
        userId: user.id, 
        date: utcDate.toISOString(),
        start,
        end
      });
      
      // Reset form with default values
      setDate(null);
      const defaultStart = new Date();
      defaultStart.setHours(8, 0, 0, 0);
      setStartDate(defaultStart);
      const defaultEnd = new Date();
      defaultEnd.setHours(16, 0, 0, 0);
      setEndDate(defaultEnd);
      
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
        <TouchableOpacity 
          style={[styles.button, (!date || !startDate || !endDate) && styles.buttonDisabled]} 
          disabled={!date || !startDate || !endDate} 
          onPress={onAdd}
        >
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
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Brak zgłoszeń dostępności</Text>
              <Text style={styles.emptyHint}>Dodaj swoją dostępność powyżej</Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={styles.itemTitle}>{new Date(item.date).toLocaleDateString('pl-PL')}</Text>
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
  emptyState: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  emptyHint: {
    marginTop: spacing.sm,
    fontSize: 12,
    color: colors.muted,
  },
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontWeight: '700' },
  itemTitle: { fontWeight: '700', color: colors.text },
  itemMeta: { marginTop: 4, color: colors.muted },
});

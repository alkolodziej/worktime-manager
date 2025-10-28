import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList } from 'react-native';
import Screen from '../components/Screen';
import Card from '../components/Card';
import { colors, spacing, radius } from '../utils/theme';
import { useAuth } from '../context/AuthContext';
import { apiGetAvailabilities, apiCreateAvailability, apiDeleteAvailability } from '../utils/api';

export default function AvailabilityScreen() {
  const { user } = useAuth();
  const [list, setList] = React.useState([]);
  const [date, setDate] = React.useState(''); // YYYY-MM-DD or ISO
  const [start, setStart] = React.useState('08:00');
  const [end, setEnd] = React.useState('16:00');
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
    if (!user?.id || !date || !start || !end) return;
    try {
      await apiCreateAvailability({ userId: user.id, date, start, end });
      setDate('');
      await load();
    } catch {}
  };

  const onDelete = async (id) => {
    try { await apiDeleteAvailability(id); await load(); } catch {}
  };

  return (
    <Screen>
      <Text style={styles.title}>Moja dostępność</Text>

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

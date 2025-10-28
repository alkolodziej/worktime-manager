import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { colors, spacing, radius } from '../utils/theme';
import Screen from '../components/Screen';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import ListItem from '../components/ListItem';
import { Ionicons } from '@expo/vector-icons';
import { apiGetCompany } from '../utils/api';
import { useNavigation } from '@react-navigation/native';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [notif, setNotif] = React.useState(true);
  const [reminders, setReminders] = React.useState(true);
  const [companyName, setCompanyName] = React.useState('');
  const nav = useNavigation();

  React.useEffect(() => {
    let mounted = true;
    apiGetCompany()
      .then((c) => {
        if (mounted) setCompanyName(c?.name || '');
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xl }}>
      <View style={{ alignItems: 'center' }}>
        <View style={styles.avatar} />
        <Text style={styles.name}>{user?.name || 'Profil'}</Text>
        <Text style={styles.email}>{user?.email || 'brak e-maila'}</Text>
      </View>

      <Card style={{ marginTop: spacing.lg }}>
        <Text style={styles.cardLabel}>Podsumowanie</Text>
        <View style={styles.statsRow}>
          <StatBox label="Ten tydzień" value="16 h 30 m" />
          <StatBox label="Rola" value={user?.role || '—'} />
          <StatBox label="Firma" value={companyName || '—'} />
        </View>
      </Card>

      <Card style={{ marginTop: spacing.lg }}>
        <Text style={styles.cardLabel}>Ustawienia</Text>
        <ListItem title="Powiadomienia" subtitle="Zmiany, przypomnienia" rightIcon={null} meta={<Switch value={notif} onValueChange={setNotif} />} />
        <ListItem title="Przypomnienia o zmianie" subtitle="30 min przed" rightIcon={null} meta={<Switch value={reminders} onValueChange={setReminders} />} />
      </Card>

      {/* Employee shortcuts */}
      {user?.role !== 'Pracodawca' && (
        <Card style={{ marginTop: spacing.lg }}>
          <Text style={styles.cardLabel}>Moje</Text>
          <TouchableOpacity onPress={() => nav.navigate('Availability')}>
            <ListItem title="Moja dostępność" subtitle="Dodaj/usuń terminy" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => nav.navigate('Swaps')}>
            <ListItem title="Zamiany zmian" subtitle="Poproś o zamianę" />
          </TouchableOpacity>
        </Card>
      )}

      {/* Employer shortcuts */}
      {user?.role === 'Pracodawca' && (
        <Card style={{ marginTop: spacing.lg }}>
          <Text style={styles.cardLabel}>Panel pracodawcy</Text>
          <TouchableOpacity onPress={() => nav.navigate('AdminShifts')}>
            <ListItem title="Zarządzaj zmianami" subtitle="Dodaj, usuń, przypisz" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => nav.navigate('AdminRequests')}>
            <ListItem title="Prośby i zgłoszenia" subtitle="Zamiany i dostępności" />
          </TouchableOpacity>
        </Card>
      )}

      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Ionicons name="log-out-outline" size={18} color={colors.primary} style={{ marginRight: 8 }} />
        <Text style={styles.logoutText}>Wyloguj</Text>
      </TouchableOpacity>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#DFE7F3',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  email: {
    marginTop: 4,
    color: colors.muted,
  },
  card: {
    width: '100%',
    marginTop: spacing.xl,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardLabel: {
    color: colors.muted,
  },
  cardValue: {
    marginTop: 6,
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  logoutBtn: {
    marginTop: spacing.lg,
    backgroundColor: '#E9EEF8',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutText: {
    color: colors.primary,
    fontWeight: '600',
  },
  cardLabel: {
    color: colors.muted,
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
});

function StatBox({ label, value }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ color: colors.muted }}>{label}</Text>
      <Text style={{ marginTop: 6, color: colors.text, fontSize: 20, fontWeight: '700' }}>{value}</Text>
    </View>
  );
}

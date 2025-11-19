import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, TextInput, Modal, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, radius } from '../utils/theme';
import Screen from '../components/Screen';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import ListItem from '../components/ListItem';
import { Ionicons } from '@expo/vector-icons';
import { apiGetCompany, apiGetUserProfile, apiUpdateUserProfile, apiGetUsers } from '../utils/api';
import { useNavigation } from '@react-navigation/native';
import { showToast } from '../components/Toast';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [notif, setNotif] = React.useState(true);
  const [reminders, setReminders] = React.useState(true);
  const [companyName, setCompanyName] = React.useState('');
  const [hourlyRate, setHourlyRate] = React.useState('30.5');
  const [employees, setEmployees] = React.useState([]);
  const [editingEmployee, setEditingEmployee] = React.useState(null);
  const [editingEmployeeRate, setEditingEmployeeRate] = React.useState('');
  const [editingProfile, setEditingProfile] = React.useState(false);
  const [profileName, setProfileName] = React.useState('');
  const [profilePhone, setProfilePhone] = React.useState('');
  const nav = useNavigation();

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [user?.id])
  );

  const loadData = async () => {
    try {
      const c = await apiGetCompany();
      setCompanyName(c?.name || '');

      const profile = await apiGetUserProfile(user.id);
      setHourlyRate(String(profile.hourlyRate || 30.5));
      setProfileName(profile.name || '');
      setProfilePhone(profile.phone || '');

      if (user?.role === 'Pracodawca') {
        const emps = await apiGetUsers();
        setEmployees(emps);
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xl }}>
      <View style={{ alignItems: 'center' }}>
        <View style={styles.avatar} />
        <Text style={styles.name}>{profileName || 'Profil'}</Text>
        <Text style={styles.email}>{user?.email || 'brak e-maila'}</Text>
      </View>

      <Card style={{ marginTop: spacing.lg }}>
        <Text style={styles.cardLabel}>Podsumowanie</Text>
        <View style={styles.statsRow}>
          <StatBox label="Ten tydzień" value="16 h 30 m" />
          <StatBox label="Rola" value={user?.role || '—'} />
          <StatBox label="Firma" value={companyName || '—'} />
          <StatBox label="Stawka" value={`${hourlyRate} zł/h`} />
        </View>
      </Card>

      {/* Edit personal data - available for all */}
      <Card style={{ marginTop: spacing.lg }}>
        <Text style={styles.cardLabel}>Moje dane</Text>
        <View style={{ gap: spacing.md }}>
          <View>
            <Text style={styles.label}>Imię i nazwisko</Text>
            <TextInput
              value={profileName}
              onChangeText={setProfileName}
              editable={editingProfile}
              style={[styles.input, { marginTop: spacing.sm }]}
              placeholder="Imię i nazwisko"
            />
          </View>
          <View>
            <Text style={styles.label}>Telefon</Text>
            <TextInput
              value={profilePhone}
              onChangeText={setProfilePhone}
              editable={editingProfile}
              keyboardType="phone-pad"
              style={[styles.input, { marginTop: spacing.sm }]}
              placeholder="+48 XXX XXX XXX"
            />
          </View>
          <TouchableOpacity
            style={[styles.btn, editingProfile && styles.btnPrimary]}
            onPress={async () => {
              if (editingProfile) {
                if (!profileName.trim()) {
                  showToast('Imię i nazwisko nie może być puste', 'error');
                  return;
                }
                try {
                  await apiUpdateUserProfile(user.id, {
                    name: profileName,
                    phone: profilePhone,
                    _currentUserRole: user.role,
                  });
                  setEditingProfile(false);
                  showToast('Dane zapisane', 'success');
                } catch (error) {
                  showToast('Błąd', 'error');
                }
              } else {
                setEditingProfile(true);
              }
            }}
          >
            <Text style={styles.btnText}>{editingProfile ? 'Zapisz' : 'Edytuj'}</Text>
          </TouchableOpacity>
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

      {/* Employer: manage employee rates */}
      {user?.role === 'Pracodawca' && employees.length > 0 && (
        <Card style={{ marginTop: spacing.lg }}>
          <Text style={styles.cardLabel}>Zarządzaj stawkami pracowników</Text>
          {employees.filter(e => e.id !== user.id).map(emp => (
            <TouchableOpacity
              key={emp.id}
              style={{ paddingVertical: spacing.sm }}
              onPress={() => {
                setEditingEmployee(emp);
                setEditingEmployeeRate(String(emp.hourlyRate || 30.5));
              }}
            >
              <Text style={{ color: colors.text, fontWeight: '600' }}>
                {emp.name} <Text style={{ color: colors.muted }}>({emp.hourlyRate || 30.5} zł/h)</Text>
              </Text>
            </TouchableOpacity>
          ))}
        </Card>
      )}

      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Ionicons name="log-out-outline" size={18} color={colors.primary} style={{ marginRight: 8 }} />
        <Text style={styles.logoutText}>Wyloguj</Text>
      </TouchableOpacity>

      {/* Edit employee rate modal */}
      {editingEmployee && (
        <Modal visible transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>
                Stawka dla {editingEmployee.name}
              </Text>
              <TextInput
                value={editingEmployeeRate}
                onChangeText={setEditingEmployeeRate}
                keyboardType="decimal-pad"
                style={[styles.input, { marginTop: spacing.md }]}
              />
              <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.md }}>
                <TouchableOpacity
                  style={[styles.btn, { flex: 1 }]}
                  onPress={() => setEditingEmployee(null)}
                >
                  <Text style={styles.btnText}>Anuluj</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btn, styles.btnPrimary, { flex: 1 }]}
                  onPress={async () => {
                    const rateNum = parseFloat(editingEmployeeRate);
                    if (isNaN(rateNum) || rateNum < 30.5) {
                      showToast('Minimum 30.5 zł/h', 'error');
                      return;
                    }
                    try {
                      await apiUpdateUserProfile(editingEmployee.id, { 
                        hourlyRate: rateNum,
                        _currentUserRole: user.role,
                      });
                      showToast('Stawka zapisana', 'success');
                      setEditingEmployee(null);
                      await loadData();
                    } catch (error) {
                      showToast('Błąd', 'error');
                    }
                  }}
                >
                  <Text style={styles.btnText}>Zapisz</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
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
  cardLabel: {
    color: colors.muted,
    marginBottom: spacing.md,
  },
  label: {
    color: colors.muted,
    fontSize: 14,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  input: {
    backgroundColor: '#F2F4F8',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: '#E6EAF2',
    color: colors.text,
  },
  btn: {
    backgroundColor: '#E9EEF8',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  btnPrimary: {
    backgroundColor: colors.primary,
  },
  btnText: {
    color: colors.primary,
    fontWeight: '600',
  },
  btnPrimaryText: {
    color: '#fff',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    width: '85%',
    maxWidth: 400,
  },
});

function StatBox({ label, value }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ color: colors.muted }}>{label}</Text>
      <Text style={{ marginTop: 6, color: colors.text, fontSize: 18, fontWeight: '700' }}>{value}</Text>
    </View>
  );
}

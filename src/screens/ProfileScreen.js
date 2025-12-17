import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, TextInput, Modal, Alert, Image, ActionSheetIOS, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, radius } from '../utils/theme';
import Screen from '../components/Screen';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import ListItem from '../components/ListItem';
import { Ionicons } from '@expo/vector-icons';
import { apiGetCompany, apiGetUserProfile, apiUpdateUserProfile, apiGetUsers, apiUploadProfilePhoto, apiGetPositions, apiAssignPositions } from '../utils/api';
import { useNavigation } from '@react-navigation/native';
import { showToast } from '../components/Toast';
import { CameraModal } from '../components/CameraModal';
import * as ImagePicker from 'expo-image-picker';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [notif, setNotif] = React.useState(true);
  const [reminders, setReminders] = React.useState(true);
  const [companyName, setCompanyName] = React.useState('');
  const [hourlyRate, setHourlyRate] = React.useState('30.5');
  const [employees, setEmployees] = React.useState([]);
  const [positions, setPositions] = React.useState([]);
  const [editingEmployee, setEditingEmployee] = React.useState(null);
  const [editingEmployeeName, setEditingEmployeeName] = React.useState('');
  const [editingEmployeePhone, setEditingEmployeePhone] = React.useState('');
  const [editingEmployeeRate, setEditingEmployeeRate] = React.useState('');
  const [editingEmployeePositions, setEditingEmployeePositions] = React.useState([]);
  const [editingProfile, setEditingProfile] = React.useState(false);
  const [profileName, setProfileName] = React.useState('');
  const [profilePhone, setProfilePhone] = React.useState('');
  const [profilePhoto, setProfilePhoto] = React.useState(null);
  const [showCamera, setShowCamera] = React.useState(false);
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
      
      // Load profile photo if available
      if (profile.photoBase64) {
        setProfilePhoto(`data:image/jpeg;base64,${profile.photoBase64}`);
      } else {
        setProfilePhoto(null);
      }

      if (user?.viewMode === 'employer') {
        const emps = await apiGetUsers();
        setEmployees(emps);
        
        const positionsData = await apiGetPositions(true);
        setPositions(positionsData);
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const handlePhotoUpload = async (photoUri, photoBase64) => {
    try {
      const base64Uri = `data:image/jpeg;base64,${photoBase64}`;
      setProfilePhoto(base64Uri);
      
      if (photoBase64) {
        await apiUploadProfilePhoto(user.id, photoBase64, `profile-${user.id}.jpg`);
        showToast('Zdjęcie profilowe zapisane', 'success');
      } else {
        showToast('Błąd: brak danych zdjęcia', 'error');
      }
    } catch (error) {
      showToast('Błąd przy zapisywaniu zdjęcia', 'error');
      console.error('Photo upload error:', error);
    }
  };

  const pickImageFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Błąd', 'Brak dostępu do galerii');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        await handlePhotoUpload(result.assets[0].uri, result.assets[0].base64);
      }
    } catch (error) {
      showToast('Błąd wyboru zdjęcia', 'error');
      console.error('Image picker error:', error);
    }
  };

  const showPhotoOptions = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Anuluj', 'Zrób selfie', 'Wybierz z galerii'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            setShowCamera(true);
          } else if (buttonIndex === 2) {
            pickImageFromGallery();
          }
        }
      );
    } else {
      // Android - use Alert
      Alert.alert(
        'Zdjęcie profilowe',
        'Wybierz opcję',
        [
          { text: 'Anuluj', style: 'cancel' },
          { text: 'Zrób selfie', onPress: () => setShowCamera(true) },
          { text: 'Wybierz z galerii', onPress: pickImageFromGallery },
        ]
      );
    }
  };

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xl }}>
      <View style={{ alignItems: 'center' }}>
        <TouchableOpacity 
          onPress={showPhotoOptions}
          style={styles.avatarContainer}
        >
          {profilePhoto ? (
            <Image 
              source={{ uri: profilePhoto }} 
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatar} />
          )}
          <View style={styles.cameraIconContainer}>
            <Ionicons name="camera" size={18} color="#fff" />
          </View>
        </TouchableOpacity>
        <Text style={styles.name}>{profileName || 'Profil'}</Text>
        <Text style={styles.email}>{user?.username || 'brak nazwy użytkownika'}</Text>
      </View>

      <Card style={{ marginTop: spacing.lg }}>
        <Text style={styles.cardLabel}>Podsumowanie</Text>
        <View style={styles.statsRow}>
          <StatBox label="Ten tydzień" value="16 h 30 m" />
          <StatBox label="Typ konta" value={user?.isEmployer ? 'Pracodawca' : 'Pracownik'} />
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
            <Text style={[styles.btnText, editingProfile && styles.btnPrimaryText]}>{editingProfile ? 'Zapisz' : 'Edytuj'}</Text>
          </TouchableOpacity>
        </View>
      </Card>

      <Card style={{ marginTop: spacing.lg }}>
        <Text style={styles.cardLabel}>Ustawienia</Text>
        <ListItem title="Powiadomienia" subtitle="Zmiany, przypomnienia" rightIcon={null} meta={<Switch value={notif} onValueChange={setNotif} />} />
        <ListItem title="Przypomnienia o zmianie" subtitle="30 min przed" rightIcon={null} meta={<Switch value={reminders} onValueChange={setReminders} />} />
      </Card>

      {/* Employee shortcuts */}
      {user?.viewMode !== 'employer' && (
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
      {user?.viewMode === 'employer' && (
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

      {/* Employer: manage employees */}
      {user?.viewMode === 'employer' && employees.length > 0 && (
        <Card style={{ marginTop: spacing.lg }}>
          <Text style={styles.cardLabel}>Zarządzaj pracownikami</Text>
          {employees.filter(e => e.id !== user.id).map(emp => {
            const empPositions = (emp.positions || []).map(posId => 
              positions.find(p => p.id === posId)?.name
            ).filter(Boolean).join(', ');
            
            return (
              <TouchableOpacity
                key={emp.id}
                style={{ paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: '#E6EAF2' }}
                onPress={() => {
                  setEditingEmployee(emp);
                  setEditingEmployeeName(emp.name || '');
                  setEditingEmployeePhone(emp.phone || '');
                  setEditingEmployeeRate(String(emp.hourlyRate || 30.5));
                  setEditingEmployeePositions(emp.positions || []);
                }}
              >
                <Text style={{ color: colors.text, fontWeight: '600', fontSize: 16 }}>
                  {emp.name}
                </Text>
                <Text style={{ color: colors.muted, fontSize: 14, marginTop: 4 }}>
                  {emp.phone || 'Brak telefonu'} • {emp.hourlyRate || 30.5} zł/h
                </Text>
                {empPositions && (
                  <Text style={{ color: colors.primary, fontSize: 13, marginTop: 4 }}>
                    {empPositions}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </Card>
      )}

      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Ionicons name="log-out-outline" size={18} color={colors.primary} style={{ marginRight: 8 }} />
        <Text style={styles.logoutText}>Wyloguj</Text>
      </TouchableOpacity>

      {/* Edit employee modal */}
      {editingEmployee && (
        <Modal visible transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: spacing.lg }}>
                Edytuj pracownika
              </Text>
              
              <ScrollView 
                showsVerticalScrollIndicator={false}
                style={{ maxHeight: '75%' }}
                contentContainerStyle={{ paddingBottom: spacing.sm }}
              >
                {/* Name */}
                <View style={{ marginBottom: spacing.md }}>
                  <Text style={styles.label}>Imię i nazwisko</Text>
                  <TextInput
                    value={editingEmployeeName}
                    onChangeText={setEditingEmployeeName}
                    style={[styles.input, { marginTop: spacing.xs }]}
                    placeholder="Imię i nazwisko"
                  />
                </View>

                {/* Phone */}
                <View style={{ marginBottom: spacing.md }}>
                  <Text style={styles.label}>Telefon</Text>
                  <TextInput
                    value={editingEmployeePhone}
                    onChangeText={setEditingEmployeePhone}
                    keyboardType="phone-pad"
                    style={[styles.input, { marginTop: spacing.xs }]}
                    placeholder="+48 XXX XXX XXX"
                  />
                </View>

                {/* Hourly rate */}
                <View style={{ marginBottom: spacing.md }}>
                  <Text style={styles.label}>Stawka godzinowa (zł/h)</Text>
                  <TextInput
                    value={editingEmployeeRate}
                    onChangeText={setEditingEmployeeRate}
                    keyboardType="decimal-pad"
                    style={[styles.input, { marginTop: spacing.xs }]}
                    placeholder="30.5"
                  />
                </View>

                {/* Positions */}
                <View style={{ marginBottom: spacing.md }}>
                  <Text style={styles.label}>Stanowiska</Text>
                  <View style={{ marginTop: spacing.xs, flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
                    {positions.map(position => {
                      const isSelected = editingEmployeePositions.includes(position.id);
                      return (
                        <TouchableOpacity
                          key={position.id}
                          style={[
                            styles.positionChipCompact,
                            isSelected && { backgroundColor: position.color, borderColor: position.color }
                          ]}
                          onPress={() => {
                            if (isSelected) {
                              setEditingEmployeePositions(prev => prev.filter(id => id !== position.id));
                            } else {
                              setEditingEmployeePositions(prev => [...prev, position.id]);
                            }
                          }}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            {isSelected && (
                              <Ionicons name="checkmark-circle" size={16} color="#fff" />
                            )}
                            <View style={{ flex: 1 }}>
                              <Text style={[
                                styles.positionNameCompact,
                                isSelected && { color: '#fff', fontWeight: '600' }
                              ]}>
                                {position.name}
                              </Text>
                              <Text 
                                style={[
                                  styles.positionDescriptionCompact,
                                  isSelected && { color: '#fff', opacity: 0.85 }
                                ]}
                                numberOfLines={1}
                              >
                                {position.description}
                              </Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </ScrollView>

              <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.md, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: '#E6EAF2' }}>
                <TouchableOpacity
                  style={[styles.btn, { flex: 1 }]}
                  onPress={() => setEditingEmployee(null)}
                >
                  <Text style={styles.btnText}>Anuluj</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btn, styles.btnPrimary, { flex: 1 }]}
                  onPress={async () => {
                    if (!editingEmployeeName.trim()) {
                      showToast('Imię i nazwisko wymagane', 'error');
                      return;
                    }
                    
                    const rateNum = parseFloat(editingEmployeeRate);
                    const MIN_RATE = 30.5;
                    if (isNaN(rateNum) || rateNum < MIN_RATE) {
                      showToast(`Minimalna stawka: ${MIN_RATE} zł/h`, 'error');
                      return;
                    }
                    
                    try {
                      // Update basic info
                      await apiUpdateUserProfile(editingEmployee.id, { 
                        name: editingEmployeeName,
                        phone: editingEmployeePhone,
                        hourlyRate: rateNum,
                      });
                      
                      // Update positions
                      await apiAssignPositions(editingEmployee.id, editingEmployeePositions);
                      
                      showToast('Dane pracownika zapisane', 'success');
                      setEditingEmployee(null);
                      await loadData();
                    } catch (error) {
                      showToast('Błąd zapisu', 'error');
                      console.error('Error saving employee:', error);
                    }
                  }}
                >
                  <Text style={[styles.btnText, styles.btnPrimaryText]}>Zapisz</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Camera modal */}
      {showCamera && (
        <Modal visible animationType="slide" presentationStyle="fullScreen">
          <CameraModal 
            onPhotoCapture={async (photo) => {
              setShowCamera(false);
              await handlePhotoUpload(photo.uri, photo.base64);
            }}
            onCancel={() => setShowCamera(false)}
          />
        </Modal>
      )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  avatarContainer: {
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    position: 'relative',
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#DFE7F3',
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
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
    width: '90%',
    maxWidth: 500,
  },
  positionChip: {
    backgroundColor: '#F2F4F8',
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: '#E6EAF2',
  },
  positionChipCompact: {
    backgroundColor: '#F2F4F8',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1.5,
    borderColor: '#E6EAF2',
    minWidth: '48%',
    maxWidth: '100%',
  },
  positionName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '500',
  },
  positionNameCompact: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '500',
  },
  positionDescription: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 2,
  },
  positionDescriptionCompact: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 1,
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

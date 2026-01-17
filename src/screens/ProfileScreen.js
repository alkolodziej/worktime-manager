import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, TextInput, Modal, Alert, Image, ActionSheetIOS, Platform, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, radius } from '../utils/theme';
import Screen from '../components/Screen';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import ListItem from '../components/ListItem';
import { Ionicons } from '@expo/vector-icons';
import { apiGetCompany, apiGetUserProfile, apiUpdateUserProfile, apiGetUsers, apiUploadProfilePhoto, apiGetPositions, apiAssignPositions, apiGetTimesheets } from '../utils/api';
import { useNavigation } from '@react-navigation/native';
import { showToast } from '../components/Toast';
import { CameraModal } from '../components/CameraModal';
import * as ImagePicker from 'expo-image-picker';
import { minutesToHhMm } from '../utils/format';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const nav = useNavigation();

  // Settings
  const [notif, setNotif] = useState(true);
  const [reminders, setReminders] = useState(true);
  
  // Data
  const [companyName, setCompanyName] = useState('');
  const [hourlyRate, setHourlyRate] = useState('30.5');
  const [weeklyHours, setWeeklyHours] = useState(0);
  
  // Employer Data
  const [employees, setEmployees] = useState([]);
  const [positions, setPositions] = useState([]);
  
  // Editing State
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profilePhoto, setProfilePhoto] = useState(null);
  
  // Camera
  const [showCamera, setShowCamera] = useState(false);
  
  // Edit Employee State (Employer only)
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [editingEmployeeName, setEditingEmployeeName] = useState('');
  const [editingEmployeePhone, setEditingEmployeePhone] = useState('');
  const [editingEmployeeRate, setEditingEmployeeRate] = useState('');
  const [editingEmployeeGoal, setEditingEmployeeGoal] = useState('');
  const [editingEmployeePositions, setEditingEmployeePositions] = useState([]);
  
  const isAdmin = user?.isEmployer;

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [user?.id, isAdmin])
  );

  const loadData = async () => {
    try {
      if (isAdmin) {
         try {
            const c = await apiGetCompany();
            setCompanyName(c?.name || '');
         } catch {}
         
         const emps = await apiGetUsers();
         setEmployees(emps);
         
         const pos = await apiGetPositions(true);
         setPositions(pos);
      }

      // Load User Profile
      const profile = await apiGetUserProfile(user.id);
      setHourlyRate(String(profile.hourlyRate || 30.5));
      setProfileName(profile.name || '');
      setProfilePhone(profile.phone || '');
      
      if (profile.photoBase64) {
        setProfilePhoto(`data:image/jpeg;base64,${profile.photoBase64}`);
      }

      // Calculate This Week Hours
      const timesheets = await apiGetTimesheets({ userId: user.id });
      const now = new Date();
      // Find Monday
      const monday = new Date(now);
      monday.setHours(0,0,0,0);
      const day = monday.getDay() || 7; 
      if (day !== 1) monday.setDate(monday.getDate() - (day - 1));
      
      let minutes = 0;
      timesheets.forEach(t => {
        const d = new Date(t.clockIn);
        if (d >= monday && t.clockOut) {
           minutes += (new Date(t.clockOut) - d) / (1000 * 60);
        }
      });
      setWeeklyHours(minutes);

    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const handlePhotoUpload = async (photoUri, photoBase64) => {
    try {
      const base64Uri = `data:image/jpeg;base64,${photoBase64}`;
      setProfilePhoto(base64Uri);
      setShowCamera(false);
      
      if (photoBase64) {
        await apiUploadProfilePhoto(user.id, photoBase64, `profile-${user.id}.jpg`);
        showToast('Zdjęcie profilowe zapisane', 'success');
      }
    } catch (error) {
      showToast('Błąd przy zapisywaniu zdjęcia', 'error');
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
          if (buttonIndex === 1) setShowCamera(true);
          else if (buttonIndex === 2) pickImageFromGallery();
        }
      );
    } else {
      Alert.alert('Zdjęcie profilowe', 'Wybierz opcję', [
        { text: 'Anuluj', style: 'cancel' },
        { text: 'Zrób selfie', onPress: () => setShowCamera(true) },
        { text: 'Wybierz z galerii', onPress: pickImageFromGallery },
      ]);
    }
  };

  const saveProfile = async () => {
    if (!profileName.trim()) {
      showToast('Imię i nazwisko wymagane', 'error');
      return;
    }
    try {
      await apiUpdateUserProfile(user.id, {
        name: profileName,
        phone: profilePhone,
      });
      setEditingProfile(false);
      showToast('Dane zapisane', 'success');
      await loadData();
    } catch (error) {
      showToast('Błąd zapisu', 'error');
    }
  };

  const saveEmployee = async () => {
    if (!editingEmployee) return;
    try {
      await apiUpdateUserProfile(editingEmployee.id, {
        name: editingEmployeeName,
        phone: editingEmployeePhone,
        hourlyRate: parseFloat(editingEmployeeRate) || 30.5,
        monthlyGoal: parseInt(editingEmployeeGoal) || 160
      });

      if (editingEmployeePositions && editingEmployeePositions.length > 0) {
         await apiAssignPositions(editingEmployee.id, editingEmployeePositions);
      }

      setEditingEmployee(null);
      showToast('Pracownik zaktualizowany', 'success');
      loadData();
    } catch (e) {
      showToast('Błąd', 'error');
    }
  };

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* HEADER / AVATAR */}
        <View style={styles.header}>
          <TouchableOpacity onPress={showPhotoOptions} style={styles.avatarContainer}>
            {profilePhoto ? (
              <Image source={{ uri: profilePhoto }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons name='person' size={40} color='#fff' />
              </View>
            )}
            <View style={styles.cameraIcon}>
              <Ionicons name='camera' size={14} color='#fff' />
            </View>
          </TouchableOpacity>
          <Text style={styles.name}>{profileName || user?.username || 'Użytkownik'}</Text>
          <Text style={styles.roleLabel}>{isAdmin ? 'Pracodawca' : 'Pracownik'}</Text>
        </View>

        {/* STATS */}
        <Card style={styles.statsCard}>
          <View style={styles.statsRow}>
            <StatBox label='W tym tygodniu' value={minutesToHhMm(weeklyHours)} />
            <StatBox label='Stawka' value={`${hourlyRate} zł/h`} />
            <StatBox label='Firma' value={companyName || 'WTM'} />
          </View>
        </Card>

        {/* PERSONAL DATA */}
        <Card style={styles.card}>
          <View style={styles.cardHeaderRow}>
             <Text style={styles.cardTitle}>Moje Dane</Text>
             <TouchableOpacity onPress={() => editingProfile ? saveProfile() : setEditingProfile(true)}>
               <Text style={styles.editLink}>{editingProfile ? 'Zapisz' : 'Edytuj'}</Text>
             </TouchableOpacity>
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Imię i Nazwisko</Text>
            <TextInput
              value={profileName}
              onChangeText={setProfileName}
              editable={editingProfile}
              style={[styles.input, editingProfile && styles.inputEditable]}
              placeholder='Jan Kowalski'
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Telefon</Text>
            <TextInput
              value={profilePhone}
              onChangeText={setProfilePhone}
              editable={editingProfile}
              keyboardType='phone-pad'
              style={[styles.input, editingProfile && styles.inputEditable]}
              placeholder='+48 000 000 000'
            />
          </View>
        </Card>

        {/* SHORTCUTS */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Narzędzia</Text>
          <TouchableOpacity onPress={() => nav.navigate('Availability')}>
            <ListItem title='Dostępność' subtitle='Zarządzaj grafikiem' icon='calendar-outline' />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => nav.navigate('Swaps')}>
            <ListItem title='Giełda Zmian' subtitle='Wymieniaj się zmianami' icon='swap-horizontal-outline' />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => nav.navigate('EarningsCalculator')}>
             <ListItem title='Kalkulator' subtitle='Oblicz wypłatę' icon='calculator-outline' />
          </TouchableOpacity>
        </Card>

        {/* ADMIN SECTION */}
        {isAdmin && (
          <View>
            <Text style={styles.sectionHeader}>Panel Administratora</Text>
            
            <Card style={styles.card}>
              <Text style={styles.cardTitle}>Zarządzanie</Text>
              <TouchableOpacity onPress={() => nav.navigate('AdminShifts')}>
                <ListItem title='Grafik Pracy' subtitle='Planowanie zmian' icon='calendar' />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => nav.navigate('AdminRequests')}>
                <ListItem title='Zgłoszenia' subtitle='Akceptacja wniosków' icon='notifications' />
              </TouchableOpacity>
            </Card>

            {employees.length > 0 && (
              <Card style={styles.card}>
                <Text style={styles.cardTitle}>Pracownicy ({employees.length})</Text>
                {employees.map(emp => (
                  <TouchableOpacity 
                    key={emp.id} 
                    style={styles.empRow}
                    onPress={() => {
                      setEditingEmployee(emp);
                      setEditingEmployeeName(emp.name || '');
                      setEditingEmployeePhone(emp.phone || '');
                      setEditingEmployeeRate(String(emp.hourlyRate || 30.5));
                      setEditingEmployeeGoal(String(emp.monthlyGoal || 160));
                      setEditingEmployeePositions(emp.positions || []);
                    }}
                  >
                    <View style={styles.empAvatar}>
                      <Text style={styles.empInitials}>{(emp.name || emp.username || '?').charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.empName}>{emp.name || emp.username}</Text>
                      <Text style={styles.empRole}>{emp.isEmployer ? 'Pracodawca' : 'Pracownik'}</Text>
                    </View>
                    <Ionicons name='pencil' size={16} color={colors.muted} />
                  </TouchableOpacity>
                ))}
              </Card>
            )}
          </View>
        )}

        {/* LOGOUT */}
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name='log-out-outline' size={18} color={colors.primary} />
          <Text style={styles.logoutText}>Wyloguj się</Text>
        </TouchableOpacity>

      </ScrollView>
      
      {/* CAMERA MODAL */}
      <CameraModal 
        visible={showCamera} 
        onClose={() => setShowCamera(false)} 
        onPhotoTaken={handlePhotoUpload} 
      />

      {/* EDIT EMPLOYEE MODAL */}
      <Modal visible={!!editingEmployee} animationType='slide' transparent>
         <View style={styles.modalOverlay}>
           <View style={styles.modalContent}>
             <Text style={styles.modalTitle}>Edycja Pracownika</Text>
             
             <ScrollView style={{ maxHeight: '80%' }}>
                <Text style={styles.label}>Imię i nazwisko</Text>
                <TextInput style={styles.modalInput} value={editingEmployeeName} onChangeText={setEditingEmployeeName} />
                
                <Text style={styles.label}>Telefon</Text>
                <TextInput style={styles.modalInput} value={editingEmployeePhone} onChangeText={setEditingEmployeePhone} keyboardType='phone-pad' />
                
                <Text style={styles.label}>Stawka (zł/h)</Text>
                <TextInput style={styles.modalInput} value={editingEmployeeRate} onChangeText={setEditingEmployeeRate} keyboardType='decimal-pad' />

                <Text style={styles.label}>Miesięczny Cel (h)</Text>
                <TextInput style={styles.modalInput} value={editingEmployeeGoal} onChangeText={setEditingEmployeeGoal} keyboardType='number-pad' />

                <Text style={styles.label}>Stanowiska</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                   {positions.map(pos => {
                     const isSel = editingEmployeePositions.includes(pos.id);
                     return (
                       <TouchableOpacity
                         key={pos.id}
                         style={[styles.chip, isSel && styles.chipSel, { borderColor: pos.color }]}
                         onPress={() => {
                           setEditingEmployeePositions(prev => isSel ? prev.filter(id => id !== pos.id) : [...prev, pos.id]);
                         }}
                       >
                         <Text style={[styles.chipText, isSel && styles.chipTextSel]}>{pos.name}</Text>
                       </TouchableOpacity>
                     );
                   })}
                </View>
             </ScrollView>

             <View style={styles.modalActions}>
                <TouchableOpacity style={{ flex: 1, padding: 12 }} onPress={() => setEditingEmployee(null)}>
                  <Text style={{ textAlign: 'center', color: colors.muted, fontWeight: '600' }}>Anuluj</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalSaveBtn} onPress={saveEmployee}>
                  <Text style={{ color: '#fff', fontWeight: '700' }}>Zapisz</Text>
                </TouchableOpacity>
             </View>
           </View>
         </View>
      </Modal>

    </Screen>
  );
}

function StatBox({ label, value }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', marginBottom: spacing.lg },
  avatarContainer: { position: 'relative', marginBottom: spacing.sm },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#E1E4E8' },
  avatarPlaceholder: { justifyContent: 'center', alignItems: 'center', backgroundColor: colors.primary },
  cameraIcon: {
    position: 'absolute', bottom: 0, right: 0,
    backgroundColor: colors.primary, width: 32, height: 32, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff'
  },
  name: { fontSize: 24, fontWeight: '800', color: colors.text },
  roleLabel: { fontSize: 14, color: colors.primary, fontWeight: '600', marginTop: 4 },
  
  statsCard: { padding: spacing.lg, marginBottom: spacing.lg, backgroundColor: colors.text },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statBox: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 4 },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  
  card: { padding: spacing.lg, marginBottom: spacing.lg },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md, alignItems: 'center' },
  cardTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  editLink: { color: colors.primary, fontWeight: '600' },
  
  formGroup: { marginBottom: spacing.md },
  label: { fontSize: 13, color: colors.muted, marginBottom: 6 },
  input: {
    backgroundColor: '#F9FAFB', borderRadius: radius.md, padding: 12,
    fontSize: 16, color: colors.textSecondary,
  },
  inputEditable: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: colors.primary, color: colors.text,
  },
  
  logoutBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: spacing.md, padding: spacing.lg },
  logoutText: { color: colors.primary, fontWeight: '600', marginLeft: 8 },
  
  sectionHeader: { fontSize: 14, fontWeight: '700', color: colors.muted, marginBottom: spacing.sm, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 1 },
  
  empRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  empAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E0E7FF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  empInitials: { color: colors.primary, fontWeight: '700', fontSize: 14 },
  empName: { fontSize: 16, fontWeight: '600', color: colors.text },
  empRole: { fontSize: 12, color: colors.muted },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: spacing.lg },
  modalContent: { backgroundColor: '#fff', borderRadius: radius.xl, padding: spacing.xl, maxHeight: '80%' },
  modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: spacing.lg, textAlign: 'center' },
  modalInput: { backgroundColor: '#F3F4F6', borderRadius: radius.md, padding: 12, fontSize: 16, marginBottom: spacing.md },
  modalActions: { flexDirection: 'row', marginTop: spacing.md },
  modalSaveBtn: { flex: 1, backgroundColor: colors.primary, borderRadius: radius.md, padding: 12, alignItems: 'center' },
  
  chip: { padding: 8, borderWidth: 1, borderRadius: 20, marginBottom: 4 },
  chipSel: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 12, color: colors.text },
  chipTextSel: { color: '#fff' },
});
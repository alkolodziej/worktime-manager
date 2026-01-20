import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, ActivityIndicator, Alert } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import Screen from '../components/Screen';
import DateTimePicker from '../components/DateTimePicker'; 
import { colors, spacing, radius } from '../utils/theme';
import { useAuth } from '../context/AuthContext';
import { apiGetAvailabilities, apiCreateAvailability, apiDeleteAvailability, apiUpdateAvailability } from '../utils/api';
import { showToast } from '../components/Toast';

// Configure Polish locale
LocaleConfig.locales['pl'] = {
  monthNames: [
    'Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec',
    'Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień'
  ],
  monthNamesShort: ['Sty.','Lut.','Mar.','Kwi.','Maj','Cze.','Lip.','Sie.','Wrz.','Paź.','Lis.','Gru.'],
  dayNames: ['Niedziela','Poniedziałek','Wtorek','Środa','Czwartek','Piątek','Sobota'],
  dayNamesShort: ['Ndz','Pon','Wt','Śr','Czw','Pt','Sob'],
  today: 'Dzisiaj'
};
LocaleConfig.defaultLocale = 'pl';

export default function AvailabilityScreen() {
  const { user } = useAuth();
  const [availabilities, setAvailabilities] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Selection state
  const [selectedDate, setSelectedDate] = useState('');
  const [isWorking, setIsWorking] = useState(true);
  
  // Time state
  const [startTime, setStartTime] = useState(() => {
    const d = new Date(); d.setHours(8,0,0,0); return d;
  });
  const [endTime, setEndTime] = useState(() => {
    const d = new Date(); d.setHours(16,0,0,0); return d;
  });
  
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await apiGetAvailabilities({ userId: user.id });
      setAvailabilities(res);
    } catch (e) {
      console.error(e);
      showToast('Błąd pobierania dostępności', 'error');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { loadData(); }, [loadData]);

  // Handle Date Selection
  const onDayPress = (day) => {
    const dateStr = day.dateString;
    setSelectedDate(dateStr);
    
    // Check if we have an existing record
    const existing = availabilities.find(a => {
      if (!a.date) return false;
      return a.date.startsWith(dateStr) || a.date.split('T')[0] === dateStr;
    });

    if (existing) {
      setIsWorking(true);
      const [sh, sm] = existing.start.split(':').map(Number);
      const [eh, em] = existing.end.split(':').map(Number);
      
      const s = new Date(); s.setHours(sh, sm, 0, 0);
      const e = new Date(); e.setHours(eh, em, 0, 0);
      
      setStartTime(s);
      setEndTime(e);
    } else {
      setIsWorking(true); // Default to working when selecting new day
      const defS = new Date(); defS.setHours(8,0,0,0);
      const defE = new Date(); defE.setHours(16,0,0,0);
      setStartTime(defS);
      setEndTime(defE);
    }
  };

  const markedDates = useMemo(() => {
    const marks = {};
    availabilities.forEach(a => {
      if (!a.date) return;
      const d = a.date.split('T')[0];
      marks[d] = { marked: true, dotColor: colors.primary };
    });
    
    if (selectedDate) {
      marks[selectedDate] = {
        ...(marks[selectedDate] || {}),
        selected: true,
        selectedColor: colors.primary,
        disableTouchEvent: true
      };
    }
    return marks;
  }, [availabilities, selectedDate]);

  const onSave = async () => {
    if (!selectedDate) return;
    setSaving(true);
    
    try {
      const existing = availabilities.find(a => a.date && a.date.split('T')[0] === selectedDate);
      
      if (!isWorking) {
        if (existing) {
          Alert.alert(
            'Usuwanie dostępności',
            'Czy na pewno chcesz usunąć dostępność w tym dniu?',
            [
               { text: 'Anuluj', style: 'cancel', onPress: () => setSaving(false) },
               { 
                 text: 'Usuń', 
                 style: 'destructive', 
                 onPress: async () => {
                    try {
                      await apiDeleteAvailability(existing.id);
                      showToast('Usunięto dostępność', 'success');
                      await loadData();
                    } finally {
                      setSaving(false);
                    }
                 }
               }
            ]
          );
          return; // Exit here, handled in Alert callback
        } else {
           showToast('Brak dostępności do usunięcia', 'info');
        }
      } else {
        // Validation
        const s = new Date(startTime);
        const e = new Date(endTime);
        if (s >= e) {
          Alert.alert('Błąd', 'Godzina końcowa musi być późniejsza niż początkowa');
          setSaving(false);
          return;
        }

        const formatTime = (d) => {
          const hours = String(d.getHours()).padStart(2, '0');
          const minutes = String(d.getMinutes()).padStart(2, '0');
          return `${hours}:${minutes}`;
        };

        const payload = {
          date: new Date(selectedDate).toISOString(), 
          start: formatTime(s),
          end: formatTime(e),
          userId: user.id
        };
        
        if (existing) {
          await apiUpdateAvailability(existing.id, payload);
          showToast('Zaktualizowano godzinę', 'success');
        } else {
          await apiCreateAvailability(payload);
          showToast('Dodano dostępność', 'success');
        }
        await loadData();
      }

    } catch (e) {
      console.error(e);
      showToast('Wystąpił błąd', 'error');
    } finally {
      if (isWorking) setSaving(false); // Only unset if not handled by Alert
    }
  };

  return (
    <Screen edges={['bottom']}>      
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <Calendar
          onDayPress={onDayPress}
          markedDates={markedDates}
          theme={{
            selectedDayBackgroundColor: colors.primary,
            todayTextColor: colors.primary,
            arrowColor: colors.primary,
            textDayFontWeight: '600',
            textMonthFontWeight: '800',
            textDayHeaderFontWeight: '600',
            textDayFontSize: 16,
          }}
          enableSwipe
        />

        {selectedDate ? (
          <View style={styles.configContainer}>
             <Text style={styles.dateLabel}>
               {new Date(selectedDate).toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })}
             </Text>
             
             <View style={styles.switchRow}>
               <Text style={styles.switchLabel}>Zgłaszam dyspozycyjność</Text>
               <Switch 
                 value={isWorking} 
                 onValueChange={setIsWorking}
                 trackColor={{ false: '#767577', true: colors.primary + '80' }}
                 thumbColor={isWorking ? colors.primary : '#f4f3f4'}
               />
             </View>

             {isWorking && (
               <View style={styles.timesContainer}>
                  <View style={{ flex: 1 }}>
                    <DateTimePicker
                      label="Od godziny"
                      value={startTime}
                      onChange={(e, d) => setStartTime(d)}
                      mode="time"
                    />
                  </View>
                  <View style={{ width: spacing.md }} />
                  <View style={{ flex: 1 }}>
                    <DateTimePicker
                      label="Do godziny"
                      value={endTime}
                      onChange={(e, d) => setEndTime(d)}
                      mode="time"
                    />
                  </View>
               </View>
             )}

             <TouchableOpacity 
               style={[
                 styles.saveButton, 
                 !isWorking && styles.deleteButton,
                 saving && styles.disabledButton
               ]} 
               onPress={onSave}
               disabled={saving}
             >
               {saving ? (
                 <ActivityIndicator color="#fff"/>
               ) : (
                 <Text style={styles.saveText}>
                   {isWorking ? 'Zapisz dostępność' : 'Usuń / Wolne'}
                 </Text>
               )}
             </TouchableOpacity>

             <Text style={styles.hint}>
               {isWorking 
                 ? 'Kierownik zobaczy te godziny przy planowaniu grafiku.' 
                 : 'Usuwając dostępność sygnalizujesz brak możliwości pracy.'}
             </Text>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Dotknij dnia w kalendarzu aby edytować.</Text>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  configContainer: {
    padding: spacing.lg,
    backgroundColor: '#fff',
    borderRadius: radius.xl,
    marginTop: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: spacing.xl,
  },
  dateLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.lg,
    textTransform: 'capitalize',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
    backgroundColor: '#F3F4F6',
    padding: spacing.md,
    borderRadius: radius.lg,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  timesContainer: {
    flexDirection: 'row',
    marginBottom: spacing.xl,
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  deleteButton: {
    backgroundColor: '#EF4444', 
  },
  disabledButton: {
    backgroundColor: colors.muted,
  },
  saveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  hint: {
    marginTop: spacing.lg,
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  emptyState: {
    padding: spacing.xl,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  emptyText: {
    color: colors.mutedSecondary,
    textAlign: 'center',
    fontSize: 15,
  },
});

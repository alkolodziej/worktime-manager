import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Keyboard, ActivityIndicator, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Screen from '../components/Screen';
import Card from '../components/Card';
import ProgressBar from '../components/ProgressBar';
import { colors, spacing, radius } from '../utils/theme';
import { minutesToHhMm } from '../utils/format';
import { apiGetEarningsReport, apiGetUserProfile, apiUpdateUserProfile } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../components/Toast';

export default function EarningsCalculatorScreen() {
  const { user } = useAuth();
  
  const [report, setReport] = useState(null);
  const [rate, setRate] = useState('30.5'); // Default minimal hourly rate
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Focus effect to reload data
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [user?.id])
  );

  const loadData = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const [data, profile] = await Promise.all([
        apiGetEarningsReport(user.id, today),
        apiGetUserProfile(user.id)
      ]);

      setReport(data);
      if (profile.hourlyRate) {
        setRate(String(profile.hourlyRate));
      }
    } catch (error) {
      console.error('Failed to load earnings data:', error);
      showToast('Nie udało się załadować danych', 'error');
    } finally {
      setLoading(false);
    }
  };

  const saveRate = async () => {
    Keyboard.dismiss();
    const rateNum = parseFloat(rate.replace(',', '.'));
    if (isNaN(rateNum) || rateNum < 30.5) {
      showToast('Minimalna stawka to 30.50 zł/h', 'error');
      setRate('30.5');
      return;
    }
    
    setSaving(true);
    try {
      await apiUpdateUserProfile(user.id, { hourlyRate: rateNum });
      showToast('Stawka zaktualizowana', 'success');
      // format to 2 decimals
      setRate(rateNum.toFixed(2)); 
    } catch (error) {
      showToast('Błąd zapisu', 'error');
    } finally {
      setSaving(false);
    }
  };

  const currentMonthData = report || {
      monthName: '',
      workedMinutes: 0,
      plannedMinutes: 0,
      targetMinutes: 160 * 60,
      earnedValue: 0,
      projectedValue: 0
  };

  const earnedSoFar = currentMonthData.earnedValue || 0;
  const projectedExtra = currentMonthData.projectedValue || 0;
  const totalProjected = earnedSoFar + projectedExtra;

  return (
    <Screen>
      <Text style={styles.headerTitle}>Moje Zarobki</Text>
      
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* MONTH HEADER */}
        <Text style={styles.monthLabel}>{currentMonthData.monthName}</Text>

        {/* SUMMARY CARD */}
        <Card style={styles.mainCard}>
          <Text style={styles.cardLabel}>Przewidywana wypłata</Text>
          <Text style={styles.bigTotal}>{totalProjected.toFixed(2)} zł</Text>
          
          <View style={styles.row}>
            <View>
              <Text style={styles.subLabel}>Już zarobiono</Text>
              <Text style={styles.subValue}>{earnedSoFar.toFixed(2)} zł</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
               <Text style={styles.subLabel}>Z grafiku</Text>
               <Text style={styles.subValue}>+{projectedExtra.toFixed(2)} zł</Text>
            </View>
          </View>
          
          <View style={styles.progressContainer}>
             <ProgressBar 
               value={ (currentMonthData.workedMinutes + currentMonthData.plannedMinutes) / (currentMonthData.targetMinutes || 1)} 
               height={8}
               color={colors.primary}
             />
             <View style={styles.progressLabels}>
               <Text style={styles.progressText}>
                 {minutesToHhMm(currentMonthData.workedMinutes + currentMonthData.plannedMinutes)}
               </Text>
               <Text style={styles.progressText}>
                 Cel: {minutesToHhMm(currentMonthData.targetMinutes)}
               </Text>
             </View>
          </View>
        </Card>

        {/* SETTINGS CARD */}
        <Card style={styles.settingsCard}>
          <Text style={styles.cardHeader}>Ustawienia</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Stawka godzinowa (brutto)</Text>
            <View style={styles.inputRow}>
              <TextInput
                value={rate}
                onChangeText={setRate}
                keyboardType="numeric" // decimal-pad is buggy on some androids
                returnKeyType="done"
                editable={!!user?.isEmployer}
                onSubmitEditing={user?.isEmployer ? saveRate : undefined}
                style={[styles.input, !user?.isEmployer && styles.inputDisabled]}
              />
              <Text style={styles.currency}>PLN / h</Text>
            </View>
            {user?.isEmployer ? (
               <Text style={styles.helperText}>Minimalna stawka: 30.50 zł</Text>
            ) : (
               <Text style={styles.helperText}>Stawka ustalana przez pracodawcę</Text>
            )}
          </View>

          {user?.isEmployer && (
            <TouchableOpacity 
              style={styles.saveBtn} 
              onPress={saveRate}
              disabled={saving}
            >
               {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Zapisz Stawkę</Text>}
            </TouchableOpacity>
          )}
        </Card>

        {/* STATS */}
        <View style={styles.statsGrid}>
           <View style={styles.statItem}>
              <Text style={styles.statVal}>{minutesToHhMm(currentMonthData.workedMinutes)}</Text>
              <Text style={styles.statLab}>Godziny przepracowane</Text>
           </View>
           <View style={styles.statItem}>
              <Text style={styles.statVal}>{minutesToHhMm(currentMonthData.plannedMinutes)}</Text>
              <Text style={styles.statLab}>Godziny zaplanowane</Text>
           </View>
        </View>

      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.md,
  },
  monthLabel: {
    fontSize: 18,
    color: colors.muted,
    marginBottom: spacing.md,
    textTransform: 'capitalize',
    fontWeight: '600',
  },
  mainCard: {
    backgroundColor: colors.text, // Dark card
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  cardLabel: {
    color: '#fff',
    opacity: 0.7,
    fontSize: 14,
    marginBottom: 4,
  },
  bigTotal: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '800',
    marginBottom: spacing.xl,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  subLabel: {
    color: '#fff',
    opacity: 0.5,
    fontSize: 12,
  },
  subValue: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    marginTop: 2,
  },
  progressContainer: {
    marginTop: spacing.sm,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  progressText: {
    color: '#fff',
    opacity: 0.6,
    fontSize: 12,
  },
  
  settingsCard: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  cardHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  inputDisabled: {
    color: colors.muted,
    backgroundColor: '#E5E7EB',
  },
  currency: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.muted,
  },
  helperText: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 6,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statItem: {
    flex: 1,
    backgroundColor: '#fff',
    padding: spacing.md,
    borderRadius: radius.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statVal: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  statLab: {
    fontSize: 12,
    color: colors.muted,
    textAlign: 'center',
  },
});
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Animated,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../utils/theme';

const { width } = Dimensions.get('window');

export const LocationCheckModal = ({ 
  visible, 
  status = 'loading', // loading, success, error
  message,
  technicalDetails, // { accuracy, distance, allowedRadius }
  onRetry,
  onClose
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  const renderContent = () => {
    if (status === 'success') {
      return (
        <View style={styles.resultContainer}>
          <View style={[styles.iconCircle, { backgroundColor: colors.success + '20' }]}>
            <MaterialCommunityIcons name="map-marker-check" size={48} color={colors.success} />
          </View>
          <Text style={styles.resultTitle}>Jesteś na miejscu</Text>
          <Text style={styles.resultDesc}>
            Twój czas pracy został rozpoczęty.
          </Text>
          {technicalDetails?.distance !== undefined && (
            <View style={styles.statsBadge}>
              <MaterialCommunityIcons name="ruler" size={14} color={colors.success} />
              <Text style={styles.statsText}>{Math.round(technicalDetails.distance)}m od celu</Text>
            </View>
          )}
        </View>
      );
    }

    if (status === 'error') {
      return (
        <View style={styles.resultContainer}>
          <View style={[styles.iconCircle, { backgroundColor: colors.danger + '20' }]}>
            <MaterialCommunityIcons name="map-marker-remove" size={48} color={colors.danger} />
          </View>
          <Text style={styles.resultTitle}>Jesteś zbyt daleko</Text>
          <Text style={styles.resultDesc}>
            {message || 'Nie możemy potwierdzić Twojej obecności w pracy.'}
          </Text>
          
          {technicalDetails && (
            <View style={styles.detailsRow}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Odległość</Text>
                <Text style={[styles.detailValue, { color: colors.danger }]}>
                  {Math.round(technicalDetails.distance)}m
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.detailItem}>
                 <Text style={styles.detailLabel}>Wymagane</Text>
                 <Text style={[styles.detailValue, { color: colors.text }]}>
                   &lt;{technicalDetails.allowedRadius}m
                 </Text>
              </View>
            </View>
          )}

          <View style={styles.actions}>
            <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
              <Text style={styles.retryText}>Spróbuj ponownie</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeText}>Anuluj</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // Loading / Processing
    return (
      <View style={styles.loadingWrapper}>
        <View style={styles.radarContainer}>
           <View style={[styles.radarRing, styles.radarRing1]} />
           <View style={[styles.radarRing, styles.radarRing2]} />
           <View style={styles.mapPin}>
             <MaterialCommunityIcons name="map-marker" size={32} color="#fff" />
           </View>
        </View>
        
        <Text style={styles.loadingTitle}>{message || 'Weryfikacja lokalizacji...'}</Text>
        
        {technicalDetails?.accuracy && (
           <Text style={styles.accuracyText}>
             Dokładność GPS: ±{Math.round(technicalDetails.accuracy)}m
           </Text>
        )}
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.card,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {renderContent()}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  card: {
    backgroundColor: '#fff',
    width: '100%',
    maxWidth: 340,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  loadingWrapper: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  radarContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  radarRing: {
    position: 'absolute',
    borderRadius: 50,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  radarRing1: {
    width: 60,
    height: 60,
    opacity: 0.3,
  },
  radarRing2: {
    width: 90,
    height: 90,
    opacity: 0.1,
  },
  mapPin: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  accuracyText: {
    fontSize: 13,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  resultContainer: {
    alignItems: 'center',
    width: '100%',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  resultDesc: {
    fontSize: 15,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  statsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success + '15',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
    gap: 6,
  },
  statsText: {
    color: colors.success,
    fontWeight: '600',
    fontSize: 14,
  },
  detailsRow: {
    flexDirection: 'row',
    backgroundColor: '#F7F7F7',
    borderRadius: radius.lg,
    padding: spacing.md,
    width: '100%',
    marginBottom: spacing.lg,
  },
  detailItem: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    backgroundColor: '#E6EAF2',
  },
  detailLabel: {
    fontSize: 12,
    color: colors.muted,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  actions: {
    width: '100%',
    gap: spacing.sm,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  closeButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeText: {
    color: colors.textSecondary,
    fontSize: 15,
  },
});

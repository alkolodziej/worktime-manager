import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../utils/theme';

export const LocationCheckModal = ({ visible, steps, currentStep, error }) => {
  const scaleAnim = React.useRef(new Animated.Value(0)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  const stepsList = [
    { key: 'permissions', label: 'Włączanie uprawnień', icon: 'shield-check' },
    { key: 'userLocation', label: 'Pobieranie Twojej lokalizacji', icon: 'map-marker' },
    { key: 'restaurantLocation', label: 'Pobieranie lokalizacji restauracji', icon: 'store' },
    { key: 'calculating', label: 'Obliczanie odległości', icon: 'ruler' },
    { key: 'verification', label: 'Weryfikacja', icon: 'check-circle' },
  ];

  const getStepStatus = (stepKey) => {
    if (currentStep === stepKey) return 'current';
    const currentIndex = stepsList.findIndex(s => s.key === currentStep);
    const stepIndex = stepsList.findIndex(s => s.key === stepKey);
    if (stepIndex < currentIndex) return 'completed';
    return 'pending';
  };

  const getStepColor = (status) => {
    switch (status) {
      case 'completed':
        return colors.success;
      case 'current':
        return colors.primary;
      case 'pending':
        return colors.muted;
      default:
        return colors.muted;
    }
  };

  const currentStepIndex = stepsList.findIndex(s => s.key === currentStep);
  const progress = ((currentStepIndex + 1) / stepsList.length) * 100;

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.container,
            {
              transform: [
                { scale: scaleAnim },
                {
                  translateY: scaleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }),
                },
              ],
              opacity: fadeAnim,
            },
          ]}
        >
          <Text style={styles.title}>Weryfikacja lokalizacji</Text>
          
          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBarBackground}>
              <View
                style={[
                  styles.progressBar,
                  { width: `${progress}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {Math.round(progress)}%
            </Text>
          </View>

          {/* Steps */}
          <View style={styles.stepsContainer}>
            {stepsList.map((step, index) => {
              const status = getStepStatus(step.key);
              const color = getStepColor(status);

              return (
                <View key={step.key} style={styles.step}>
                  <View style={styles.stepHeader}>
                    <View
                      style={[
                        styles.stepIcon,
                        { backgroundColor: color },
                      ]}
                    >
                      {status === 'current' ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : status === 'completed' ? (
                        <MaterialCommunityIcons
                          name="check"
                          size={18}
                          color="#fff"
                        />
                      ) : (
                        <MaterialCommunityIcons
                          name={step.icon}
                          size={18}
                          color="#fff"
                        />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.stepLabel,
                        { color: status === 'pending' ? colors.muted : colors.text },
                        status === 'current' && { fontWeight: '700' },
                      ]}
                    >
                      {step.label}
                    </Text>
                  </View>

                  {/* Connector line */}
                  {index < stepsList.length - 1 && (
                    <View
                      style={[
                        styles.connector,
                        {
                          backgroundColor:
                            status === 'completed' ? colors.success : '#E6EAF2',
                        },
                      ]}
                    />
                  )}
                </View>
              );
            })}
          </View>

          {/* Error message */}
          {error && (
            <View style={styles.errorContainer}>
              <MaterialCommunityIcons
                name="alert-circle"
                size={20}
                color={colors.danger}
                style={{ marginRight: spacing.sm }}
              />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Loading indicator */}
          {!error && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator
                size="large"
                color={colors.primary}
                style={{ marginBottom: spacing.md }}
              />
              <Text style={styles.loadingText}>Sprawdzam lokalizację...</Text>
            </View>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 380,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.lg,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  progressContainer: {
    marginBottom: spacing.xl,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: '#F0F0F0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 13,
    color: colors.muted,
    textAlign: 'right',
    fontWeight: '600',
  },
  stepsContainer: {
    marginVertical: spacing.md,
  },
  step: {
    marginVertical: spacing.xs,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  stepIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  stepLabel: {
    fontSize: 15,
    color: colors.text,
    flex: 1,
    fontWeight: '500',
  },
  connector: {
    width: 2,
    height: 12,
    marginLeft: 15,
    marginVertical: 2,
    borderRadius: 1,
  },
  errorContainer: {
    backgroundColor: '#FFE8E8',
    borderRadius: 12,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: '#FFD0D0',
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    flex: 1,
    fontWeight: '500',
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
  },
  loadingText: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: '500',
  },
});

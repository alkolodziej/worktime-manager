import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { colors, radius } from '../utils/theme';

const TOAST_DURATION = 3000; // 3 seconds

export function showToast(message, type = 'success') {
  if (global.toastRef?.current?.show) {
    global.toastRef.current.show(message, type);
  }
}

export default function Toast() {
  const translateY = useRef(new Animated.Value(100)).current;
  const [message, setMessage] = React.useState('');
  const [type, setType] = React.useState('success');
  const timeoutRef = useRef(null);

  const show = (text, toastType = 'success') => {
    setMessage(text);
    setType(toastType);
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Animate in
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
    }).start();

    // Set timeout to hide
    timeoutRef.current = setTimeout(hide, TOAST_DURATION);
  };

  const hide = () => {
    Animated.timing(translateY, {
      toValue: 100,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setMessage('');
    });
  };

  // Expose show method via ref
  React.useEffect(() => {
    global.toastRef = { current: { show } };
    return () => {
      global.toastRef = null;
    };
  }, []);

  if (!message) return null;

  const backgroundColor = type === 'success' ? colors.success 
    : type === 'error' ? colors.danger 
    : type === 'warning' ? colors.warning 
    : colors.info;

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY }], backgroundColor },
      ]}
    >
      <TouchableOpacity onPress={hide} style={styles.content}>
        <Text style={styles.text}>{message}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 60,
    left: 20,
    right: 20,
    borderRadius: radius.md,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  content: {
    padding: 16,
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
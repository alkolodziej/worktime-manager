import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../utils/theme';
import AppTabs from './BottomTabs';
import LoginScreen from '../screens/LoginScreen';
import { useAuth } from '../context/AuthContext';
import { View, ActivityIndicator } from 'react-native';
import AvailabilityScreen from '../screens/AvailabilityScreen';
import SwapsScreen from '../screens/SwapsScreen';
import AdminShiftsScreen from '../screens/AdminShiftsScreen';
import AdminRequestsScreen from '../screens/AdminRequestsScreen';

const Stack = createNativeStackNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    primary: colors.primary,
    card: '#fff',
    text: '#111',
    border: '#E5E5EA',
  },
};

function Loading() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="small" color={colors.primary} />
    </View>
  );
}

export default function RootNavigation() {
  const { user, loading } = useAuth();

  return (
    <NavigationContainer theme={navTheme}>
      {loading ? (
        <Loading />
      ) : user ? (
        <Stack.Navigator>
          <Stack.Screen name="Tabs" component={AppTabs} options={{ headerShown: false }} />
          <Stack.Screen name="Availability" component={AvailabilityScreen} options={{ title: 'Dostępność' }} />
          <Stack.Screen name="Swaps" component={SwapsScreen} options={{ title: 'Zamiana zmian' }} />
          <Stack.Screen name="AdminShifts" component={AdminShiftsScreen} options={{ title: 'Zarządzaj zmianami' }} />
          <Stack.Screen name="AdminRequests" component={AdminRequestsScreen} options={{ title: 'Prośby i zgłoszenia' }} />
        </Stack.Navigator>
      ) : (
        <Stack.Navigator>
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}

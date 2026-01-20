import * as Location from 'expo-location';
import { API_BASE_URL } from './api';

export const requestLocationPermissions = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Brak dostępu do lokalizacji');
    }
    return true;
  } catch (error) {
    console.error('Błąd uprawnień lokalizacji:', error);
    throw error;
  }
};

export const getCurrentLocation = async () => {
  try {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.BestForNavigation,
    });
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy,
    };
  } catch (error) {
    console.error('Błąd pobierania lokalizacji:', error);
    throw error;
  }
};

export const isWithinRestaurant = async (userLocation) => {
  try {
    const response = await fetch(`${API_BASE_URL}/company/check-location`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userLocation)
    });
    
    if (!response.ok) throw new Error('Check failed');
    return await response.json();
  } catch (error) {
    console.error('Błąd sprawdzania lokalizacji (backend):', error);
    // Fail safe
    return { isWithin: false, distance: -1, radius: 0 };
  }
};

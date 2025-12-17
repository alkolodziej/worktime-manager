import * as Location from 'expo-location';
import { API_BASE_URL } from './api';

// Default restaurant location (fallback if API fails)
let RESTAURANT_LOCATION = {
  latitude: 52.2297,
  longitude: 21.0122,
  radius: 100,
};

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

export const loadRestaurantLocation = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/company/location`);
    if (!response.ok) throw new Error('Failed to fetch location');
    const location = await response.json();
    console.log('Pobrana lokalizacja restauracji:', location);
    RESTAURANT_LOCATION = {
      latitude: location.latitude,
      longitude: location.longitude,
      radius: location.radius || 100,
    };
    return RESTAURANT_LOCATION;
  } catch (error) {
    console.error('Błąd pobierania lokalizacji restauracji:', error);
    // Return default location
    return RESTAURANT_LOCATION;
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

export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // distance in meters
};  

export const isWithinRestaurant = async (userLocation) => {
  try {
    // Ensure we have the latest restaurant location
    await loadRestaurantLocation();

    const distance = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      RESTAURANT_LOCATION.latitude,
      RESTAURANT_LOCATION.longitude
    );

    console.log(`dane przekazane do funkcji isWithinRestaurant:`, userLocation, RESTAURANT_LOCATION);

    return {
      isWithin: distance <= RESTAURANT_LOCATION.radius,
      distance: Math.round(distance),
      radius: RESTAURANT_LOCATION.radius,
    };
  } catch (error) {
    console.error('Błąd sprawdzania lokalizacji:', error);
    throw error;
  }
};

export const getRestaurantLocation = () => {
  return { ...RESTAURANT_LOCATION };
};

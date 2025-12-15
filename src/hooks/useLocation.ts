import { useState, useEffect } from 'react';

export interface Location {
  latitude: number;
  longitude: number;
}

// Fallback location from environment variables
const HOME_LAT = import.meta.env.VITE_HOME_LAT ? parseFloat(import.meta.env.VITE_HOME_LAT) : null;
const HOME_LON = import.meta.env.VITE_HOME_LON ? parseFloat(import.meta.env.VITE_HOME_LON) : null;

export function useLocation() {
  // Start with fallback location if available
  const fallbackLocation = HOME_LAT && HOME_LON
    ? { latitude: HOME_LAT, longitude: HOME_LON }
    : null;

  const [location, setLocation] = useState<Location | null>(fallbackLocation);
  const [error, setError] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(!!fallbackLocation);

  useEffect(() => {
    // Check if geolocation is available and we're in a secure context
    if (!navigator.geolocation) {
      if (!fallbackLocation) {
        setError('Geolocation is not supported. Set VITE_HOME_LAT and VITE_HOME_LON in your .env file.');
      }
      return;
    }

    // Try to get actual location
    const watcher = navigator.geolocation.watchPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setUsingFallback(false);
        setError(null);
      },
      (err) => {
        // If we have fallback, use it silently
        if (fallbackLocation) {
          console.log('Geolocation unavailable, using configured home location');
          setUsingFallback(true);
        } else if (err.code !== err.PERMISSION_DENIED) {
          setError(err.message);
        } else {
          setError('Location access denied. Set VITE_HOME_LAT and VITE_HOME_LON in your .env file.');
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,  // Reduced timeout since we have fallback
        maximumAge: 10000
      }
    );

    return () => navigator.geolocation.clearWatch(watcher);
  }, []);

  return { location, error, usingFallback };
}


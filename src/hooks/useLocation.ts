import { useState, useEffect } from 'react';

export interface Location {
  latitude: number;
  longitude: number;
}

export function useLocation() {
  const [location, setLocation] = useState<Location | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    // watchPosition calls success callback immediately with current position
    const watcher = navigator.geolocation.watchPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setError(null);
      },
      (err) => {
        // Don't show error if it's just a permission denial on load (common)
        if (err.code !== err.PERMISSION_DENIED) {
           setError(err.message);
        }
      },
      {
        enableHighAccuracy: false, // Low power is fine for finding general area
        timeout: 15000,
        maximumAge: 10000
      }
    );

    return () => navigator.geolocation.clearWatch(watcher);
  }, []);

  return { location, error };
}

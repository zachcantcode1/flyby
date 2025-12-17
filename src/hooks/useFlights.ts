import { useState, useEffect } from 'react';
import { getFlights, type FlightState } from '@/services/airplaneslive';
import type { Location } from './useLocation';

// Radius in nautical miles for flight search (~185km)
const SEARCH_RADIUS_NM = 100;
// Polling interval in milliseconds (2 seconds for smooth updates)
const POLL_INTERVAL_MS = 2000;

export function useFlights(location: Location | null) {
  const [flights, setFlights] = useState<FlightState[]>([]);

  // Stabilize the location to avoid excessive API calls
  // Round to ~1km (2 decimal places)
  const stabilizedLat = location ? Math.round(location.latitude * 100) / 100 : null;
  const stabilizedLon = location ? Math.round(location.longitude * 100) / 100 : null;
  const stabilizedLocation = stabilizedLat && stabilizedLon ? `${stabilizedLat},${stabilizedLon}` : null;

  useEffect(() => {
    if (!stabilizedLocation) return;

    const fetchFlights = async () => {
      const [lat, lon] = stabilizedLocation.split(',').map(Number);
      console.log(`Fetching flights for: ${lat}, ${lon} (radius: ${SEARCH_RADIUS_NM}nm)`);

      const data = await getFlights(lat, lon, SEARCH_RADIUS_NM);
      setFlights(data);
    };

    fetchFlights();
    const interval = setInterval(fetchFlights, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [stabilizedLocation]);

  return { flights };
}


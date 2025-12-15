import { useState, useEffect } from 'react';
import { getFlights, type FlightState } from '@/services/opensky';
import type { Location } from './useLocation';

export function useFlights(location: Location | null) {
  const [flights, setFlights] = useState<FlightState[]>([]);

  // Stabilize the location to avoid jitter resizing the bounding box constantly
  // Round to ~1km (2 decimal places)
  const stabilizedLat = location ? Math.round(location.latitude * 100) / 100 : null;
  const stabilizedLon = location ? Math.round(location.longitude * 100) / 100 : null;
  const stabilizedLocation = stabilizedLat && stabilizedLon ? `${stabilizedLat},${stabilizedLon}` : null;

  useEffect(() => {
    if (!stabilizedLocation || !location) return;

    const fetch = async () => {
      // Define a bounding box approx 200km around the user
      const delta = 2.0;

      // Use the *actual* location for the center, but rely on the effect 
      // only triggering when the rough area changes.
      // Actually, to be consistent, we should use the stabilized location for the box too,
      // or else we drift slightly within the same effect cycle. 
      // Let's use the stabilized center for the query to be distinct.

      // Re-parsing the string matches the stable dependency
      const [lat, lon] = stabilizedLocation.split(',').map(Number);

      console.log(`Fetching flights for stable center: ${lat}, ${lon}`);

      const data = await getFlights(
        lat - delta,
        lon - delta,
        lat + delta,
        lon + delta
      );
      setFlights(data);
    };

    fetch();
    const interval = setInterval(fetch, 6000); // Poll every 6 seconds

    return () => clearInterval(interval);
  }, [stabilizedLocation]); // Only re-run if we move significantly (>1km)

  return { flights };
}

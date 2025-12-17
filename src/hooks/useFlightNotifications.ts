import { useEffect, useRef } from 'react';
import type { FlightState } from '@/services/airplaneslive';
import type { Location } from './useLocation';
import { sendNtfyNotification, isNtfyEnabled } from '@/services/ntfy';
import { getAirlineName } from '@/data/airlines';

// Configuration from environment variables
const HOME_LAT = import.meta.env.VITE_HOME_LAT ? parseFloat(import.meta.env.VITE_HOME_LAT) : null;
const HOME_LON = import.meta.env.VITE_HOME_LON ? parseFloat(import.meta.env.VITE_HOME_LON) : null;
const NOTIFICATION_RADIUS_KM = parseFloat(import.meta.env.VITE_NOTIFICATION_RADIUS_KM || '10');
const NOTIFICATION_COOLDOWN = 1000 * 60 * 30; // 30 minutes cooldown per flight

/**
 * Hook to send notifications when flights are overhead
 * Supports both browser notifications and ntfy push notifications
 * 
 * @param location - Browser geolocation (fallback if HOME_LAT/HOME_LON not set)
 * @param flights - Current list of flights from the API
 */
export function useFlightNotifications(location: Location | null, flights: FlightState[]) {
  const notifiedFlights = useRef<Set<string>>(new Set());

  // Request browser notification permission
  useEffect(() => {
    if (!("Notification" in window)) {
      console.log("This browser does not support desktop notification");
      return;
    }

    if (Notification.permission !== "granted" && Notification.permission !== "denied") {
      Notification.requestPermission();
    }
  }, []);

  // Check for overhead flights
  useEffect(() => {
    // Determine the reference location (prefer configured home location)
    const refLat = HOME_LAT ?? location?.latitude;
    const refLon = HOME_LON ?? location?.longitude;

    if (refLat === null || refLat === undefined || refLon === null || refLon === undefined) {
      return;
    }

    if (!flights.length) return;

    flights.forEach(async (flight) => {
      // Skip if already notified recently
      if (notifiedFlights.current.has(flight.icao24)) return;

      // Skip if no position data
      if (flight.latitude === null || flight.longitude === null) return;

      // Use pre-calculated distance from Airplanes.live if available, otherwise compute
      let distanceKm: number;
      if (flight.distance_nm !== null) {
        distanceKm = flight.distance_nm * 1.852; // Convert nautical miles to km
      } else {
        distanceKm = getDistanceFromLatLonInKm(
          refLat,
          refLon,
          flight.latitude,
          flight.longitude
        );
      }

      if (distanceKm < NOTIFICATION_RADIUS_KM) {
        // Build notification content - prefer Airplanes.live data
        const callsign = flight.callsign?.trim() || 'Unknown';
        // Use operator from Airplanes.live, fallback to airline lookup
        const airlineName = flight.operator || getAirlineName(callsign);

        const altitudeFt = flight.baro_altitude
          ? Math.round(flight.baro_altitude).toLocaleString()
          : 'N/A';

        const speedKnots = flight.velocity
          ? Math.round(flight.velocity).toLocaleString()
          : 'N/A';

        const title = `✈️ Flight Overhead!`;
        const body = [
          `${callsign}${airlineName ? ` (${airlineName})` : ''}`,
          `Distance: ${distanceKm.toFixed(1)} km`,
          `Altitude: ${altitudeFt} ft`,
          `Speed: ${speedKnots} kts`,
          flight.is_military ? '🟢 MILITARY' : '',
          flight.is_interesting && !flight.is_military ? '🟠 SPECIAL' : '',
        ].filter(Boolean).join('\n');

        // Send browser notification
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(title, {
            body,
            icon: '/plane-icon.png',
            tag: flight.icao24, // Prevents duplicate browser notifications
          });
        }

        // Send ntfy notification
        if (isNtfyEnabled()) {
          // Build FlightRadar24 URL for click action
          const fr24Url = callsign !== 'Unknown'
            ? `https://www.flightradar24.com/${callsign}`
            : `https://www.flightradar24.com/${flight.icao24}`;

          await sendNtfyNotification(title, body, {
            priority: 3,
            tags: ['airplane', flight.origin_country?.toLowerCase().replace(/\s+/g, '_') || 'unknown'],
            click: fr24Url,
          });
        }

        // Add to cooldown set
        notifiedFlights.current.add(flight.icao24);

        // Remove from cooldown set after delay
        setTimeout(() => {
          notifiedFlights.current.delete(flight.icao24);
        }, NOTIFICATION_COOLDOWN);
      }
    });
  }, [location, flights]);
}

/**
 * Calculate distance between two coordinates in kilometers (Haversine formula)
 */
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

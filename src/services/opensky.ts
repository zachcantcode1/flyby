import axios from 'axios';

const BASE_URL = '/api';

export interface FlightState {
  icao24: string;
  callsign: string | null;
  origin_country: string;
  time_position: number | null;
  last_contact: number;
  longitude: number | null;
  latitude: number | null;
  baro_altitude: number | null;
  on_ground: boolean;
  velocity: number | null;
  true_track: number | null;
  vertical_rate: number | null;
  sensors: number[] | null;
  geo_altitude: number | null;
  squawk: string | null;
  spi: boolean;
  position_source: number;
  category: number;
}

const CLIENT_ID = import.meta.env.VITE_OPENSKY_CLIENT_ID;
const CLIENT_SECRET = import.meta.env.VITE_OPENSKY_CLIENT_SECRET;

let accessToken: string | null = null;
let tokenExpiration: number = 0;
let tokenRefreshPromise: Promise<string | null> | null = null;

const getAccessToken = async (): Promise<string | null> => {
  if (!CLIENT_ID || !CLIENT_SECRET) return null;

  if (accessToken && Date.now() < tokenExpiration) {
    return accessToken;
  }

  if (tokenRefreshPromise) {
    return tokenRefreshPromise;
  }

  tokenRefreshPromise = (async () => {
    try {
      const params = new URLSearchParams();
      params.append('grant_type', 'client_credentials');
      params.append('client_id', CLIENT_ID);
      params.append('client_secret', CLIENT_SECRET);

      // Use our proxy at /api/auth which forwards to https://auth.opensky-network.org/auth
      // The proxy rewrite rule removes /api/auth so we append the rest of the path
      const response = await axios.post(
        '/api/auth/realms/opensky-network/protocol/openid-connect/token',
        params,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      if (response.data && response.data.access_token) {
        accessToken = response.data.access_token;
        // expires_in is in seconds. Buffer by 60s
        tokenExpiration = Date.now() + (response.data.expires_in * 1000) - 60000;
        return accessToken;
      }
    } catch (error) {
      console.error('Error fetching access token:', error);
    } finally {
      tokenRefreshPromise = null;
    }
    return null;
  })();

  return tokenRefreshPromise;
};

export const getFlights = async (
  lamin: number,
  lomin: number,
  lamax: number,
  lomax: number
): Promise<FlightState[]> => {
  try {
    const token = await getAccessToken();
    const headers: Record<string, string> = {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await axios.get(`${BASE_URL}/states/all`, {
      params: {
        lamin,
        lomin,
        lamax,
        lomax,
      },
      headers
    });

    if (response.data && response.data.states) {
      // Map the array of arrays to objects
      const flights = response.data.states.map((state: any[]) => ({
        icao24: state[0],
        callsign: state[1]?.trim() || null,
        origin_country: state[2],
        time_position: state[3],
        last_contact: state[4],
        longitude: state[5],
        latitude: state[6],
        baro_altitude: state[7],
        on_ground: state[8],
        velocity: state[9],
        true_track: state[10],
        vertical_rate: state[11],
        sensors: state[12],
        geo_altitude: state[13],
        squawk: state[14],
        spi: state[15],
        position_source: state[16],
        category: state[17] || 0,
      }));

      // Filter out flights with no location or stale data (> 120s)
      const now = Math.floor(Date.now() / 1000);
      return flights.filter((f: FlightState) =>
        f.latitude !== null &&
        f.longitude !== null &&
        (now - f.last_contact) < 120
      );
    }
    return [];
  } catch (error) {
    console.error('Error fetching flights:', error);
    return [];
  }
};

export interface FlightTrack {
  icao24: string;
  startTime: number;
  endTime: number;
  callsign: string | null;
  path: [number, number, number, number, number, boolean][]; // time, lat, lon, baro_altitude, true_track, on_ground
}

export interface FlightRoute {
  callsign: string;
  estDepartureAirport: string | null;
  estArrivalAirport: string | null;
  estDepartureAirportHorizDistance: number | null;
  estDepartureAirportVertDistance: number | null;
  estArrivalAirportHorizDistance: number | null;
  estArrivalAirportVertDistance: number | null;
  departureAirportCandidatesCount: number;
  arrivalAirportCandidatesCount: number;
}

export const getFlightTrack = async (icao24: string): Promise<FlightTrack | null> => {
  try {
    const token = await getAccessToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await axios.get(`${BASE_URL}/tracks/all`, {
      params: { icao24, time: 0 },
      headers
    });
    return response.data;
  } catch (error) {
    console.warn('Error fetching flight track:', error);
    return null;
  }
};

export const getFlightRoute = async (icao24: string): Promise<FlightRoute | null> => {
  try {
    const token = await getAccessToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    // Look back 24 hours to avoid "query across 2 partitions" errors
    const end = Math.floor(Date.now() / 1000);
    const begin = end - 86400; // 24 hours

    console.log(`Fetching route for ${icao24} from ${begin} to ${end}`);

    const response = await axios.get(`${BASE_URL}/flights/aircraft`, {
      params: { icao24, begin, end },
      headers
    });

    console.log(`Route Response for ${icao24}:`, response.data);

    if (Array.isArray(response.data) && response.data.length > 0) {
      // Sort by lastSeen (descending) to get the most recent flight
      const flights = response.data.sort((a: any, b: any) => b.lastSeen - a.lastSeen);
      return flights[0];
    }
    return null;
  } catch (error) {
    console.warn('Error fetching flight route:', error);
    return null;
  }
};

/**
 * OpenSky Network API - Flight Tracks Only
 * This is a minimal service that only fetches historical flight tracks
 * Live position data comes from Airplanes.live instead
 */

import axios from 'axios';

const BASE_URL = '/api/opensky';

const CLIENT_ID = import.meta.env.VITE_OPENSKY_CLIENT_ID;
const CLIENT_SECRET = import.meta.env.VITE_OPENSKY_CLIENT_SECRET;

let accessToken: string | null = null;
let tokenExpiration: number = 0;
let tokenRefreshPromise: Promise<string | null> | null = null;

/**
 * Get OAuth access token for OpenSky API
 */
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

            const response = await axios.post(
                '/api/opensky-auth/realms/opensky-network/protocol/openid-connect/token',
                params,
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );

            if (response.data && response.data.access_token) {
                accessToken = response.data.access_token;
                tokenExpiration = Date.now() + (response.data.expires_in * 1000) - 60000;
                return accessToken;
            }
        } catch (error) {
            console.error('Error fetching OpenSky access token:', error);
        } finally {
            tokenRefreshPromise = null;
        }
        return null;
    })();

    return tokenRefreshPromise;
};

export interface FlightTrack {
    icao24: string;
    startTime: number;
    endTime: number;
    callsign: string | null;
    path: [number, number, number, number, number, boolean][]; // time, lat, lon, baro_altitude, true_track, on_ground
}

/**
 * Fetch historical flight track for an aircraft
 */
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
        console.warn('Error fetching flight track from OpenSky:', error);
        return null;
    }
};

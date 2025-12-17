/**
 * Airplanes.live API Service
 * Free, auth-free ADS-B flight tracking data
 * https://airplanes.live/api-guide/
 */

const API_BASE = 'https://api.airplanes.live/v2';

/**
 * Enhanced flight state with all available data from Airplanes.live
 */
export interface FlightState {
    // Core identifiers
    icao24: string;           // ICAO hex code (mapped from 'hex')
    callsign: string | null;  // Flight callsign (mapped from 'flight')

    // NEW: Aircraft info from database
    registration: string | null;   // Tail number (from 'r')
    aircraftType: string | null;   // ICAO type code (from 't')
    description: string | null;    // Full aircraft description (from 'desc')
    operator: string | null;       // Owner/operator (from 'ownOp')
    year: string | null;           // Manufacture year

    // Position
    latitude: number | null;
    longitude: number | null;

    // Altitude & Speed
    baro_altitude: number | null;  // Barometric altitude in feet
    geo_altitude: number | null;   // Geometric altitude in feet
    velocity: number | null;       // Ground speed in knots
    true_track: number | null;     // Track in degrees
    vertical_rate: number | null;  // Climb/descent rate ft/min

    // Status
    on_ground: boolean;
    squawk: string | null;

    // Distance from query point (pre-calculated by API!)
    distance_nm: number | null;    // Distance in nautical miles
    direction: number | null;      // Direction from query point

    // Flags
    is_military: boolean;
    is_interesting: boolean;

    // Compatibility with OpenSky (deprecated fields)
    origin_country: string;        // Mapped from operator for compatibility
    last_contact: number;
    time_position: number | null;
    sensors: number[] | null;
    spi: boolean;
    position_source: number;
    category: number;
}

interface AirplanesLiveAircraft {
    hex: string;
    flight?: string;
    r?: string;
    t?: string;
    desc?: string;
    ownOp?: string;
    year?: string;
    lat?: number;
    lon?: number;
    alt_baro?: number | string;
    alt_geom?: number;
    gs?: number;
    track?: number;
    baro_rate?: number;
    on_ground?: boolean;
    squawk?: string;
    dst?: number;
    dir?: number;
    dbFlags?: number;
    seen?: number;
    seen_pos?: number;
    category?: string;
}

/**
 * Map Airplanes.live response to our FlightState format
 */
function mapToFlightState(ac: AirplanesLiveAircraft): FlightState {
    const dbFlags = ac.dbFlags || 0;

    return {
        // Core identifiers
        icao24: ac.hex,
        callsign: ac.flight?.trim() || null,

        // NEW: Aircraft info
        registration: ac.r || null,
        aircraftType: ac.t || null,
        description: ac.desc || null,
        operator: ac.ownOp || null,
        year: ac.year || null,

        // Position
        latitude: ac.lat ?? null,
        longitude: ac.lon ?? null,

        // Altitude & Speed  
        baro_altitude: typeof ac.alt_baro === 'number' ? ac.alt_baro : null,
        geo_altitude: ac.alt_geom ?? null,
        velocity: ac.gs ?? null,
        true_track: ac.track ?? null,
        vertical_rate: ac.baro_rate ?? null,

        // Status
        on_ground: ac.alt_baro === 'ground' || ac.on_ground === true,
        squawk: ac.squawk || null,

        // Distance from query point
        distance_nm: ac.dst ?? null,
        direction: ac.dir ?? null,

        // Flags
        is_military: (dbFlags & 1) === 1,
        is_interesting: (dbFlags & 2) === 2,

        // Compatibility fields
        origin_country: ac.ownOp || 'Unknown',
        last_contact: Math.floor(Date.now() / 1000) - (ac.seen || 0),
        time_position: ac.seen_pos ? Math.floor(Date.now() / 1000) - ac.seen_pos : null,
        sensors: null,
        spi: false,
        position_source: 0,
        category: parseInt(ac.category?.slice(1) || '0') || 0,
    };
}

/**
 * Fetch all aircraft within a radius of a point
 * @param lat Center latitude
 * @param lon Center longitude  
 * @param radiusNm Radius in nautical miles (default 100nm = ~185km)
 */
export async function getFlights(
    lat: number,
    lon: number,
    radiusNm: number = 100
): Promise<FlightState[]> {
    try {
        const response = await fetch(
            `${API_BASE}/point/${lat.toFixed(4)}/${lon.toFixed(4)}/${radiusNm}`
        );

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

        if (!data.ac || !Array.isArray(data.ac)) {
            return [];
        }

        // Map to our format and filter out aircraft with no position
        return data.ac
            .map(mapToFlightState)
            .filter((f: FlightState) => f.latitude !== null && f.longitude !== null);

    } catch (error) {
        console.error('Error fetching flights from Airplanes.live:', error);
        return [];
    }
}

/**
 * Fetch a specific aircraft by ICAO hex code
 */
export async function getFlightByIcao(icao24: string): Promise<FlightState | null> {
    try {
        const response = await fetch(`${API_BASE}/icao/${icao24}`);

        if (!response.ok) {
            return null;
        }

        const data = await response.json();

        if (data.ac && data.ac.length > 0) {
            return mapToFlightState(data.ac[0]);
        }

        return null;
    } catch (error) {
        console.error('Error fetching flight by ICAO:', error);
        return null;
    }
}

/**
 * Fetch aircraft by callsign
 */
export async function getFlightByCallsign(callsign: string): Promise<FlightState[]> {
    try {
        const response = await fetch(`${API_BASE}/callsign/${callsign.toUpperCase()}`);

        if (!response.ok) {
            return [];
        }

        const data = await response.json();

        if (data.ac && Array.isArray(data.ac)) {
            return data.ac.map(mapToFlightState);
        }

        return [];
    } catch (error) {
        console.error('Error fetching flight by callsign:', error);
        return [];
    }
}

/**
 * Fetch aircraft by registration (tail number)
 */
export async function getFlightByRegistration(registration: string): Promise<FlightState | null> {
    try {
        const response = await fetch(`${API_BASE}/reg/${registration.toUpperCase()}`);

        if (!response.ok) {
            return null;
        }

        const data = await response.json();

        if (data.ac && data.ac.length > 0) {
            return mapToFlightState(data.ac[0]);
        }

        return null;
    } catch (error) {
        console.error('Error fetching flight by registration:', error);
        return null;
    }
}


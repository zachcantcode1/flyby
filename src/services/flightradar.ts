import axios from 'axios';

const BASE_URL = '/api/fr24';
const API_KEY = import.meta.env.VITE_FR24_API_KEY;

export interface FR24FlightDetails {
    origin: {
        name: string;
        code: { iata: string; icao: string };
        city: string;
    } | null;
    destination: {
        name: string;
        code: { iata: string; icao: string };
        city: string;
    } | null;
    aircraft: {
        model: string; // e.g. "Boeing 737-800"
        code: string;  // e.g. "B738"
    } | null;
    registration: string | null;
    eta: string | null;
    vertical_speed: number | null; // feet per minute
    altitude: number | null;       // feet (barometric)
    gspeed: number | null;         // knots (ground speed)
    track: number | null;
    squawk: string | null;
    lat: number | null;
    lon: number | null;
    hex: string | null;
    callsign: string | null;
    flight: string | null;
    timestamp: string | null;      // ISO 8601 UTC
    // New fields for landed/completed/scheduled flights
    status: 'live' | 'landed' | 'scheduled' | 'unknown';
    landedAt: string | null;           // ISO 8601 UTC
    departedAt: string | null;         // ISO 8601 UTC (actual departure)
    scheduledDeparture: string | null; // ISO 8601 UTC (scheduled departure time)
    operatingAs: string | null;        // e.g. "Republic 4379"
}

const IATA_TO_ICAO: Record<string, string> = {
    'AA': 'AAL', // American Airlines
    'UA': 'UAL', // United Airlines
    'DL': 'DAL', // Delta Air Lines
    'WN': 'SWA', // Southwest Airlines
    'BA': 'BAW', // British Airways
    'LH': 'DLH', // Lufthansa
    'AF': 'AFR', // Air France
    'EK': 'UAE', // Emirates
    'QR': 'QTR', // Qatar Airways
    'SQ': 'SIA', // Singapore Airlines
    'CX': 'CPA', // Cathay Pacific
    'JL': 'JAL', // Japan Airlines
    'NH': 'ANA', // All Nippon Airways
    'QF': 'QFA', // Qantas
    'AC': 'ACA', // Air Canada
    'AS': 'ASA', // Alaska Airlines
    'B6': 'JBU', // JetBlue
    'NK': 'NKS', // Spirit Airlines
    'F9': 'FFT', // Frontier Airlines
    'HA': 'HAL', // Hawaiian Airlines
};

export const getFR24FlightDetails = async (callsign: string): Promise<FR24FlightDetails | null> => {
    if (!API_KEY || !callsign) {
        console.warn('FR24 API Key missing or no callsign');
        return null;
    }

    let convertedCallsign: string | null = null;

    // specific check for IATA format (2 letters + numbers, e.g. AA123)
    const iataMatch = callsign.match(/^([A-Z]{2})(\d+)$/);
    if (iataMatch) {
        const airlineIata = iataMatch[1];
        const flightNum = iataMatch[2];
        const airlineIcao = IATA_TO_ICAO[airlineIata];

        if (airlineIcao) {
            convertedCallsign = `${airlineIcao}${flightNum}`;
            console.log(`Converted IATA ${callsign} to ICAO ${convertedCallsign}`);
        }
    }

    // Helper function to fetch details
    const fetchDetails = async (queryValue: string, paramType: 'callsigns' | 'flights') => {
        try {
            const response = await axios.get(`${BASE_URL}/live/flight-positions/full`, {
                params: { [paramType]: queryValue },
                headers: {
                    'Accept': 'application/json',
                    'Accept-Version': 'v1',
                    'Authorization': `Bearer ${API_KEY}`
                }
            });
            console.log(`FR24 Live Response for ${paramType}=${queryValue}:`, response.data);

            if (response.data && response.data.data && response.data.data.length > 0) {
                return response.data.data[0];
            }
        } catch (error) {
            console.warn(`Fetch failed for ${queryValue}`, error);
        }
        return null;
    };

    // Attempt 1: Try the input as a flight number first (most common user input like AA4379)
    // This handles codeshare/regional flights where AA4379 might fly as RPA4379 (Republic)
    console.log(`[FR24] Searching for flight number: ${callsign}`);
    let flight = await fetchDetails(callsign, 'flights');

    // Attempt 2: If not found, try converted ICAO callsign (e.g., AA4379 -> AAL4379)
    if (!flight && convertedCallsign) {
        console.log(`[FR24] Flight number search returned no results, trying converted ICAO callsign: ${convertedCallsign}`);
        flight = await fetchDetails(convertedCallsign, 'callsigns');
    }

    // Attempt 3: Try the raw input as a callsign directly (for users entering ICAO callsigns like AAL4379)
    if (!flight && callsign !== convertedCallsign) {
        console.log(`[FR24] Converted callsign failed, trying raw input as callsign: ${callsign}`);
        flight = await fetchDetails(callsign, 'callsigns');
    }

    console.log(`[FR24] Final result:`, flight ? 'FOUND' : 'NOT FOUND', flight);

    // If live search found the flight, return it
    if (flight) {
        return {
            origin: {
                name: '',
                code: {
                    iata: flight.orig_iata || flight.org_iata || '',
                    icao: flight.orig_icao || flight.org_icao || ''
                },
                city: ''
            },
            destination: {
                name: '',
                code: {
                    iata: flight.dest_iata || '',
                    icao: flight.dest_icao || ''
                },
                city: ''
            },
            aircraft: (flight.aircraft_model || flight.type || flight.ac_type) ? {
                model: flight.aircraft_model || '',
                code: flight.type || flight.ac_type || ''
            } : null,
            registration: flight.reg || flight.registration || '',
            eta: flight.eta || null,
            vertical_speed: flight.vspeed ?? null,
            altitude: flight.alt ?? null,
            gspeed: flight.gspeed ?? null,
            track: flight.track ?? null,
            squawk: flight.squawk || null,
            lat: flight.lat ?? null,
            lon: flight.lon ?? null,
            hex: flight.hex || flight.icao24 || null,
            callsign: flight.callsign || null,
            flight: flight.flight || null,
            timestamp: flight.timestamp || null,
            status: 'live' as const,
            landedAt: null,
            departedAt: null,
            scheduledDeparture: null,
            operatingAs: flight.operating_as || null
        };
    }

    // Flight not found in live data - try flight-summary for landed/historical flights
    console.log(`[FR24] Live search failed, checking flight-summary for landed flights...`);
    const summary = await searchFlightSummary(callsign, convertedCallsign);

    if (summary) {
        return summary;
    }

    return null;
};

// Search flight-summary API for landed/scheduled/historical flights
const searchFlightSummary = async (flightNumber: string, icaoCallsign: string | null): Promise<FR24FlightDetails | null> => {
    const now = new Date();
    // Look back 24 hours for landed flights, forward 12 hours for scheduled flights
    const from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const to = new Date(now.getTime() + 12 * 60 * 60 * 1000);
    const formatTime = (date: Date) => date.toISOString().split('.')[0];

    const fetchSummary = async (queryValue: string) => {
        try {
            const response = await axios.get(`${BASE_URL}/flight-summary/full`, {
                params: {
                    flights: queryValue,
                    flight_datetime_from: formatTime(from),
                    flight_datetime_to: formatTime(to),
                    sort: 'desc',  // Get most recent/upcoming first
                    limit: 10
                },
                headers: {
                    'Accept': 'application/json',
                    'Accept-Version': 'v1',
                    'Authorization': `Bearer ${API_KEY}`
                }
            });
            console.log(`[FR24] Flight Summary Response for ${queryValue}:`, response.data);

            if (response.data && response.data.data && response.data.data.length > 0) {
                // If multiple results, pick the most relevant one:
                // Priority: in-flight > scheduled (upcoming) > landed (most recent)
                const flights = response.data.data;

                // Debug: Log all flights with their status indicators
                console.log(`[FR24] Found ${flights.length} flights:`);
                flights.forEach((f: any, i: number) => {
                    console.log(`  [${i}] ${f.flight}: takeoff=${f.datetime_takeoff}, ended=${f.flight_ended}, orig=${f.orig_icao}, dest=${f.dest_icao}`);
                });

                // First, look for any flight currently in the air
                const inFlight = flights.find((f: any) => f.datetime_takeoff && !f.flight_ended);
                if (inFlight) {
                    console.log(`[FR24] Selected IN-FLIGHT: ${inFlight.flight}`);
                    return inFlight;
                }

                // Next, look for scheduled flights (not yet departed)
                const scheduled = flights.find((f: any) => !f.datetime_takeoff && !f.flight_ended);
                if (scheduled) {
                    console.log(`[FR24] Selected SCHEDULED: ${scheduled.flight}`);
                    return scheduled;
                }

                // Otherwise, return the most recent landed flight (first in list)
                console.log(`[FR24] Selected LANDED: ${flights[0].flight}`);
                return flights[0];
            }
        } catch (error) {
            console.warn(`[FR24] Flight summary fetch failed for ${queryValue}`, error);
        }
        return null;
    };

    // Try flight number first (e.g., AA4379)
    let summary = await fetchSummary(flightNumber);

    // If not found and we have an ICAO callsign, try that
    if (!summary && icaoCallsign) {
        summary = await fetchSummary(icaoCallsign);
    }

    if (summary) {
        // Determine status based on flight_ended flag
        let status: 'live' | 'landed' | 'scheduled' | 'unknown' = 'unknown';
        if (summary.flight_ended) {
            status = 'landed';
        } else if (summary.datetime_takeoff) {
            status = 'live'; // Took off but hasn't ended = still in air (edge case)
        } else {
            status = 'scheduled';
        }

        console.log(`[FR24] Found in flight-summary with status: ${status}`);

        return {
            origin: {
                name: '',
                code: {
                    iata: summary.orig_iata || '',
                    icao: summary.orig_icao || ''
                },
                city: ''
            },
            destination: {
                name: '',
                code: {
                    iata: summary.dest_iata || summary.dest_iata_actual || '',
                    icao: summary.dest_icao || summary.dest_icao_actual || ''
                },
                city: ''
            },
            aircraft: summary.type ? {
                model: '',
                code: summary.type
            } : null,
            registration: summary.reg || '',
            eta: null,
            vertical_speed: null,
            altitude: null,
            gspeed: null,
            track: null,
            squawk: null,
            // For landed flights, use destination airport coordinates (we don't have them directly)
            lat: null,
            lon: null,
            hex: summary.hex || null,
            callsign: summary.callsign || null,
            flight: summary.flight || null,
            timestamp: summary.last_seen || null,
            status,
            landedAt: summary.datetime_landed || null,
            departedAt: summary.datetime_takeoff || null,
            scheduledDeparture: summary.std || null,  // Scheduled Time of Departure
            operatingAs: summary.operating_as || null
        };
    }

    return null;
};

export interface FR24Departure {
    flight: string;
    callsign: string;
    dest_icao: string;
    type: string;
    status: string;
}

export const getAirportDepartures = async (icao: string): Promise<FR24Departure[]> => {
    if (!API_KEY) return [];

    const now = new Date();
    // Format required: YYYY-MM-DDTHH:MM:SS (no milliseconds)
    const formatTime = (date: Date) => date.toISOString().split('.')[0];

    // FR24 API flight-summary endpoint mostly returns active/live flights.
    // It does NOT return future scheduled flights that haven't appeared on radar yet.
    // To show "upcoming" or "active" departures (e.g. taxiing), we must look back in time
    // to find flights that have recently appeared ("first_seen") but are still active.
    // We limit the window to 2 hours to ensure the 'limit=100' captures recent flights
    // rather than getting filled with old flights from 6 hours ago.
    const from = formatTime(new Date(now.getTime() - 15 * 60 * 1000)); // Look back only 15 mins for active/taxiing
    const to = formatTime(new Date(now.getTime() + 12 * 60 * 60 * 1000));   // Look ahead 12 hours for scheduled

    console.log(`Fetching FR24 departures for ${icao} from ${from} to ${to}`);

    try {
        const response = await axios.get(`${BASE_URL}/flight-summary/light`, {
            params: {
                airports: icao,
                flight_datetime_from: from,
                flight_datetime_to: to,
                limit: 100
            },
            headers: {
                'Accept': 'application/json',
                'Accept-Version': 'v1',
                'Authorization': `Bearer ${API_KEY}`
            }
        });

        console.log('FR24 Raw Departures Response:', response.data);

        if (response.data && response.data.data) {
            // Filter for departures
            let departures = response.data.data.filter((f: any) => {
                if (f.orig_icao !== icao) return false;
                // Exclude flights that have already landed (completed)
                if (f.flight_ended || f.datetime_landed) return false;
                return true;
            });

            console.log(`Found ${departures.length} departures after filtering`);

            // Sort: 
            // 1. Scheduled/Taxiing (Not taken off yet) - Sort by Scheduled Time (Ascending)
            // 2. Departed - Sort by Takeoff Time (Descending)
            departures.sort((a: any, b: any) => {
                const aActive = !a.datetime_takeoff;
                const bActive = !b.datetime_takeoff;

                if (aActive && bActive) {
                    // Both upcoming/taxiing: sort by scheduled departure (std)
                    return (a.std || '').localeCompare(b.std || '');
                }
                if (aActive && !bActive) return -1; // a is upcoming, b is departed -> a first
                if (!aActive && bActive) return 1;  // a is departed, b is upcoming -> b first

                // Both departed: Newest first
                return b.datetime_takeoff.localeCompare(a.datetime_takeoff);
            });

            // Return simplified objects
            return departures.slice(0, 5).map((f: any) => {
                let status = 'Scheduled';
                if (f.datetime_takeoff) status = 'Departed';
                else if (f.datetime_out) status = 'Taxiing';
                else if (f.std) {
                    const date = new Date(f.std);
                    status = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                }

                return {
                    flight: f.flight || f.callsign || 'Unknown',
                    callsign: f.callsign,
                    dest_icao: f.dest_icao,
                    type: f.type || 'Unknown',
                    status: status
                };
            });
        }
        return [];
    } catch (error) {
        console.error('Error fetching departures:', error);
        return [];
    }
}

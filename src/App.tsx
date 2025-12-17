import { useState, useEffect, useMemo } from 'react'
import { Toaster } from "@/components/ui/sonner"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Card } from "@/components/ui/card"
import { useLocation, type Location } from '@/hooks/useLocation'
import { useFlights } from '@/hooks/useFlights'
import { useFlightNotifications } from '@/hooks/useFlightNotifications'
import Map from '@/components/Map'
import { useAircraftImage } from '@/hooks/useAircraftImage'
import { FlightSummaryCard } from '@/components/FlightSummaryCard'
import { FlightSearch } from '@/components/FlightSearch'
import type { FlightState } from '@/services/airplaneslive'
import { getFlightTrack, type FlightTrack } from '@/services/opensky-tracks'
import { getFR24FlightDetails, type FR24FlightDetails } from '@/services/flightradar'
import { Plane, Navigation, Gauge, ArrowUp, Clock, Compass, Activity } from 'lucide-react'
import { getAirlineName } from '@/data/airlines'
import { getDistance } from '@/utils/geo'
import { isHelicopter } from '@/utils/aircraft'

function App() {
  const { location } = useLocation()
  const [viewCenter, setViewCenter] = useState<Location | null>(null)
  const [searchedFlight, setSearchedFlight] = useState<FR24FlightDetails | null>(null)

  // Initialize view center with user location once available
  useEffect(() => {
    if (location && !viewCenter) {
      setViewCenter(location)
    }
  }, [location, viewCenter])

  // Use viewCenter for fetching flights, fallback to location if viewCenter not yet set
  const activeCenter = viewCenter || location
  const { flights } = useFlights(activeCenter)
  const [selectedFlight, setSelectedFlight] = useState<FlightState | null>(null)

  const handleFlightFound = (details: FR24FlightDetails) => {
    // Store the FR24 details for display
    setFr24Details(details);
    setSearchedFlight(details);

    if (details.lat && details.lon) {
      // Live flight with coordinates - move map and show marker
      setViewCenter({ latitude: details.lat, longitude: details.lon });

      // Select the flight immediately by creating a pseudo FlightState
      const pseudoFlight: FlightState = {
        icao24: details.hex || 'searched_' + Date.now(),
        callsign: details.flight || details.callsign || details.registration || 'SEARCHED',
        origin_country: 'Unknown',
        time_position: details.timestamp ? new Date(details.timestamp).getTime() / 1000 : Date.now() / 1000,
        last_contact: details.timestamp ? new Date(details.timestamp).getTime() / 1000 : Date.now() / 1000,
        longitude: details.lon,
        latitude: details.lat,
        baro_altitude: details.altitude ?? null,
        on_ground: details.altitude === 0,
        velocity: details.gspeed ?? null,
        true_track: details.track ?? null,
        vertical_rate: details.vertical_speed ?? null,
        sensors: null,
        geo_altitude: details.altitude ?? null,
        squawk: details.squawk ?? null,
        spi: false,
        position_source: 0,
        category: 0,
        registration: details.registration || null,
        aircraftType: details.aircraft?.code || null,
        description: details.aircraft?.model || null,
        operator: null,
        year: null,
        distance_nm: null,
        direction: null,
        is_military: false,
        is_interesting: false,
      };

      setSelectedFlight(pseudoFlight);
    } else {
      // Landed/historical flight without live coordinates
      // Create a minimal pseudo flight for display purposes
      const pseudoFlight: FlightState = {
        icao24: details.hex || 'landed_' + Date.now(),
        callsign: details.flight || details.callsign || details.registration || 'LANDED',
        origin_country: 'Unknown',
        time_position: details.timestamp ? new Date(details.timestamp).getTime() / 1000 : Date.now() / 1000,
        last_contact: details.timestamp ? new Date(details.timestamp).getTime() / 1000 : Date.now() / 1000,
        longitude: null,
        latitude: null,
        baro_altitude: null,
        on_ground: true,
        velocity: null,
        true_track: null,
        vertical_rate: null,
        sensors: null,
        geo_altitude: null,
        squawk: null,
        spi: false,
        position_source: 0,
        category: 0,
        registration: details.registration || null,
        aircraftType: details.aircraft?.code || null,
        description: details.aircraft?.model || null,
        operator: null,
        year: null,
        distance_nm: null,
        direction: null,
        is_military: false,
        is_interesting: false,
      };

      setSelectedFlight(pseudoFlight);
    }

    setIsExpanded(true);
  };

  // Find closest flight to user
  const closestFlight = useMemo(() => {
    if (!location || flights.length === 0) return null;
    let minInfo = { flight: null as FlightState | null, dist: Infinity };

    flights.forEach(f => {
      if (f.latitude && f.longitude) {
        const d = getDistance(location.latitude, location.longitude, f.latitude, f.longitude);
        if (d < minInfo.dist) {
          minInfo = { flight: f, dist: d };
        }
      }
    });
    return minInfo;
  }, [flights, location]);
  const [isExpanded, setIsExpanded] = useState(false)

  const [flightTrack, setFlightTrack] = useState<FlightTrack | null>(null)
  const [fr24Details, setFr24Details] = useState<FR24FlightDetails | null>(null)

  // Fetch image for the main sheet view
  // Prioritize Airplanes.live registration, then FR24, then callsign
  const candidateRegistration = selectedFlight?.registration || fr24Details?.registration || selectedFlight?.callsign?.trim() || null;
  const candidateIcaoCode = selectedFlight?.aircraftType || fr24Details?.aircraft?.code || null;
  const { imageUrl } = useAircraftImage(candidateIcaoCode, candidateRegistration)

  useEffect(() => {
    if (selectedFlight) {
      // Check if this is our searched pseudo-flight
      const isSearched = selectedFlight.icao24.startsWith('searched_') || (searchedFlight && selectedFlight.icao24 === searchedFlight.hex);

      if (isSearched) {
        // If it's the searched flight, we already have details in searchedFlight or fr24Details
        // Just clear tracks as we don't have historical track for searched flights
        setFlightTrack(null);
        // Ensure fr24Details is set (if not already by handleFlightFound)
        if (searchedFlight) setFr24Details(searchedFlight);
      } else {
        // Standard Flight from map selection
        // Reset previous details
        setFlightTrack(null)
        setFr24Details(null)
        // setIsExpanded(false) // Don't auto-minimize if switching? Actually, standard behavior:
        if (!isExpanded) setIsExpanded(false);

        getFlightTrack(selectedFlight.icao24).then(setFlightTrack)
        if (selectedFlight.callsign) {
          getFR24FlightDetails(selectedFlight.callsign.trim()).then(setFr24Details)
        } else {
          setFr24Details(null)
        }
      }
    } else {
      setFlightTrack(null)
      setFr24Details(null)
      setIsExpanded(false)
    }
  }, [selectedFlight])

  useFlightNotifications(location, flights)

  // Determine best aircraft name to display - prefer Airplanes.live description
  const displayAircraft = selectedFlight?.description ||
    fr24Details?.aircraft?.model ||
    (fr24Details?.aircraft?.code ? `${fr24Details.aircraft.code} (Type)` : null) ||
    (selectedFlight?.aircraftType ? `${selectedFlight.aircraftType} (Type)` : null) ||
    (selectedFlight?.category === 7 ? 'Helicopter' : null);

  const airlineName = getAirlineName(selectedFlight?.callsign);

  // Calculate generic Route string for display reuse
  const originCode = fr24Details?.origin?.code?.iata || fr24Details?.origin?.code?.icao;
  const destCode = fr24Details?.destination?.code?.iata || fr24Details?.destination?.code?.icao;
  const displayOrigin = originCode || 'Unknown';
  const displayDest = destCode || 'Unknown';

  return (
    <div className="h-screen w-screen bg-zinc-950 text-white overflow-hidden relative">
      <Map
        center={activeCenter}
        userLocation={location}
        flights={flights}
        selectedFlightTrack={flightTrack?.path.map((p: any) => [p[1], p[2]]) as [number, number][] | null}
        selectedFlightIcao24={selectedFlight?.icao24}
        selectedAircraftCode={fr24Details?.aircraft?.code}
        onFlightSelect={setSelectedFlight}
        isExpanded={isExpanded}
        searchedFlight={searchedFlight}
      />

      {/* Top Bar: Search & Stats */}
      <div className="absolute top-4 left-4 right-4 z-[500] flex justify-between items-start pointer-events-none">

        {/* Left: Stats */}
        <Card className="bg-zinc-900/80 backdrop-blur border-zinc-800 text-zinc-100 w-auto p-4 pointer-events-auto">
          <div className="flex flex-col">
            <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Flights Nearby</span>
            <span className="text-2xl font-bold">{flights.length}</span>

            {closestFlight?.flight && (
              <div
                className="mt-3 pt-3 border-t border-zinc-700/50 flex flex-col cursor-pointer hover:bg-zinc-800/50 -mx-4 px-4 pb-2 transition-colors"
                onClick={() => setSelectedFlight(closestFlight.flight!)}
              >
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-0.5">Closest Flight</span>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-emerald-400 font-bold">
                    {closestFlight.flight.callsign?.trim() || closestFlight.flight.icao24}
                  </span>
                  <span className="text-xs text-zinc-400 font-mono">
                    {Math.round(closestFlight.dist)} km
                  </span>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Right: Search */}
        <div className="pointer-events-auto">
          <FlightSearch onFlightFound={handleFlightFound} />
        </div>
      </div>

      {/* Mini Flight Card (shown when selected but NOT expanded) */}
      {selectedFlight && !isExpanded && (
        <FlightSummaryCard
          flight={selectedFlight}
          origin={displayOrigin}
          destination={displayDest}
          aircraft={displayAircraft || undefined}
          registration={candidateRegistration || undefined}
          icaoCode={fr24Details?.aircraft?.code}
          onExpand={() => setIsExpanded(true)}
          onClose={() => setSelectedFlight(null)}
        />
      )}

      {/* Flight Details Sheet */}
      <Sheet
        modal={false}
        open={isExpanded}
        onOpenChange={(open: boolean) => {
          if (!open) {
            setIsExpanded(false);
            setSelectedFlight(null);
          }
        }}
      >
        <SheetContent side="bottom" className="max-h-[85vh] h-auto overflow-y-auto bg-zinc-900 border-t-zinc-800 text-zinc-100 outline-none p-6">
          <SheetHeader>
            <SheetTitle className="text-zinc-50 flex items-center gap-2 text-2xl flex-wrap">
              {/* Aircraft type icon - helicopter or plane */}
              {(selectedFlight?.category === 7 || isHelicopter(candidateIcaoCode)) ? (
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 text-blue-500">
                  <rect x="11" y="2" width="2" height="20" rx="1" />
                  <rect x="2" y="11" width="20" height="2" rx="1" />
                  <path d="M12 6 C 10 6 8 8 8 12 L 8 16 C 8 19 10 21 12 21 C 14 21 16 19 16 16 L 16 12 C 16 8 14 6 12 6 Z" />
                  <rect x="11" y="21" width="2" height="3" />
                  <rect x="9" y="23" width="6" height="1" />
                </svg>
              ) : (
                <Plane className="h-6 w-6 text-blue-500" />
              )}
              {selectedFlight?.callsign || 'Unknown Flight'}
              {/* Military/Interesting Badge */}
              {selectedFlight?.is_military && (
                <span className="text-xs font-bold bg-lime-600 text-white px-2 py-1 rounded-full uppercase tracking-wide">
                  Military
                </span>
              )}
              {selectedFlight?.is_interesting && !selectedFlight?.is_military && (
                <span className="text-xs font-bold bg-amber-500 text-white px-2 py-1 rounded-full uppercase tracking-wide">
                  Special
                </span>
              )}
              {/* Flight Status Badge */}
              {fr24Details?.status === 'landed' && (
                <span className="text-xs font-bold bg-emerald-600 text-white px-2 py-1 rounded-full uppercase tracking-wide">
                  Arrived
                </span>
              )}
              {fr24Details?.status === 'live' && (
                <span className="text-xs font-bold bg-blue-600 text-white px-2 py-1 rounded-full uppercase tracking-wide animate-pulse">
                  Live
                </span>
              )}
              {fr24Details?.status === 'scheduled' && (
                <span className="text-xs font-bold bg-amber-600 text-white px-2 py-1 rounded-full uppercase tracking-wide">
                  Scheduled
                </span>
              )}
            </SheetTitle>
            <SheetDescription className="text-zinc-400 text-lg">
              {/* Operating airline info */}
              <span className="block text-emerald-400 font-semibold text-sm mb-1">
                {fr24Details?.operatingAs
                  ? `Operating as ${getAirlineName(fr24Details.operatingAs) || fr24Details.operatingAs}`
                  : airlineName}
              </span>
              <span>
                {displayOrigin} &rarr; {displayDest}
              </span>
              {/* Landed/Departed times for historical flights */}
              {fr24Details?.status === 'landed' && (
                <span className="flex gap-4 mt-2 text-sm">
                  {fr24Details.departedAt && (
                    <span className="text-zinc-400">
                      <span className="text-zinc-500">Departed:</span>{' '}
                      <span className="text-zinc-200 font-mono">
                        {new Date(fr24Details.departedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </span>
                  )}
                  {fr24Details.landedAt && (
                    <span className="text-zinc-400">
                      <span className="text-zinc-500">Landed:</span>{' '}
                      <span className="text-emerald-400 font-mono">
                        {new Date(fr24Details.landedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </span>
                  )}
                </span>
              )}
              {/* Scheduled departure for upcoming flights */}
              {fr24Details?.status === 'scheduled' && fr24Details.scheduledDeparture && (
                <span className="block mt-2 text-sm">
                  <span className="text-amber-400 font-semibold">
                    Scheduled to depart at{' '}
                    <span className="font-mono">
                      {new Date(fr24Details.scheduledDeparture).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </span>
                </span>
              )}
            </SheetDescription>
          </SheetHeader>

          <div className="grid grid-cols-4 gap-2 mt-4">
            {imageUrl && (
              <div className="col-span-1 relative h-28 rounded-xl overflow-hidden bg-zinc-800 border border-zinc-700 shadow-inner">
                <img src={imageUrl} alt="Aircraft" className="w-full h-full object-cover" />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                  <p className="text-[10px] text-white/80 font-mono truncate">
                    {candidateRegistration || 'Unknown'}
                  </p>
                </div>
              </div>
            )}

            {displayAircraft && (
              <div className={`flex flex-col gap-1 p-2 bg-zinc-800/50 rounded-lg justify-center ${imageUrl ? 'col-span-3 h-28' : 'col-span-4 h-auto'}`}>
                <div className="flex items-center gap-2 text-zinc-400 text-xs">
                  <Plane className="h-3 w-3" /> Aircraft
                </div>
                <span className="text-lg font-mono text-indigo-300 leading-tight">{displayAircraft}</span>
                {/* Owner/Operator beneath aircraft type */}
                {selectedFlight?.operator && (
                  <div className="mt-1 text-xs text-zinc-400">
                    <span className="text-zinc-500">Operated by </span>
                    <span className="text-emerald-400 font-medium">{selectedFlight.operator}</span>
                  </div>
                )}
              </div>
            )}

            {/* ETA Card */}
            {fr24Details?.eta && (
              <div className="flex items-center justify-between p-2 bg-zinc-800/50 rounded-lg col-span-4 border border-zinc-700/50">
                <div className="flex items-center gap-2 text-zinc-400 text-xs uppercase tracking-wide">
                  <Clock className="h-3 w-3 text-emerald-500" /> Est. Arrival
                </div>
                <span className="text-lg font-mono text-emerald-400 flex items-center gap-2">
                  {new Date(fr24Details.eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  <span className="text-xs text-zinc-500">
                    ({new Date(fr24Details.eta).toLocaleDateString()})
                  </span>
                </span>
              </div>
            )}

            <div className="flex flex-col gap-0.5 p-2 bg-zinc-800/50 rounded-lg col-span-2">
              <div className="flex items-center gap-2 text-zinc-400 text-xs">
                <ArrowUp className="h-3 w-3" /> Altitude
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-mono">{selectedFlight?.baro_altitude ? Math.round(selectedFlight.baro_altitude) + ' m' : 'N/A'}</span>
                {selectedFlight?.vertical_rate !== undefined && selectedFlight.vertical_rate !== null && (
                  <span className={`text-[10px] font-mono flex items-center gap-1 ${selectedFlight.vertical_rate > 0 ? 'text-emerald-400' : selectedFlight.vertical_rate < 0 ? 'text-amber-400' : 'text-zinc-500'}`}>
                    {selectedFlight.vertical_rate > 0 ? '↑' : selectedFlight.vertical_rate < 0 ? '↓' : '–'}
                    {Math.abs(Math.round(selectedFlight.vertical_rate * 196.85))} fpm
                  </span>
                )}
                {!selectedFlight?.vertical_rate && fr24Details?.vertical_speed && (
                  <span className="text-[10px] font-mono text-zinc-400">
                    {fr24Details.vertical_speed} fpm
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-0.5 p-2 bg-zinc-800/50 rounded-lg col-span-2">
              <div className="flex items-center gap-2 text-zinc-400 text-xs">
                <Gauge className="h-3 w-3" /> Velocity
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-mono">{selectedFlight?.velocity ? Math.round(selectedFlight.velocity * 3.6) + ' km/h' : 'N/A'}</span>
                {(selectedFlight?.true_track !== undefined || fr24Details?.track !== undefined) && (
                  <span className="text-[10px] font-mono text-zinc-400 flex items-center gap-1">
                    <Compass className="h-3 w-3" />
                    {Math.round(selectedFlight?.true_track ?? fr24Details?.track ?? 0)}°
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-0.5 p-2 bg-zinc-800/50 rounded-lg col-span-2">
              <div className="flex items-center gap-2 text-zinc-400 text-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" /> Signal
              </div>
              <span className="text-xs font-mono text-zinc-300 truncate">
                {selectedFlight ? `${Math.floor(Date.now() / 1000) - selectedFlight.last_contact}s ago` : 'N/A'}
              </span>
            </div>

            <div className="flex flex-col gap-0.5 p-2 bg-zinc-800/50 rounded-lg col-span-2">
              <div className="flex items-center gap-2 text-zinc-400 text-xs">
                <Activity className="h-3 w-3" /> Squawk
              </div>
              <span className="text-lg font-mono text-zinc-300 leading-tight">
                {fr24Details?.squawk || selectedFlight?.squawk || 'N/A'}
              </span>
            </div>

            <div className="flex flex-col gap-0.5 p-2 bg-zinc-800/50 rounded-lg col-span-4">
              <div className="flex items-center gap-2 text-zinc-400 text-xs">
                <Navigation className="h-3 w-3" /> Position
              </div>
              <span className="text-xs font-mono text-zinc-300">
                {selectedFlight?.latitude?.toFixed(4) ?? 'N/A'}, {selectedFlight?.longitude?.toFixed(4) ?? 'N/A'}
              </span>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Toaster theme="dark" />
    </div>
  )
}

export default App
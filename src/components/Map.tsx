import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMap, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import type { FlightState } from '@/services/opensky';
import type { FR24FlightDetails } from '@/services/flightradar';
import type { Location } from '@/hooks/useLocation';
import { renderToStaticMarkup } from 'react-dom/server';
import { isHelicopter } from '@/utils/aircraft';
import { AirportMarkers } from './AirportMarkers';

// Fix Leaflet's default icon path issues
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface MapProps {
  center: Location | null;
  userLocation: Location | null;
  flights: FlightState[];
  selectedFlightTrack: [number, number][] | null;
  selectedFlightIcao24?: string | null;
  selectedAircraftCode?: string | null;
  onFlightSelect: (flight: FlightState) => void;
  isExpanded?: boolean;
  searchedFlight?: FR24FlightDetails | null;
}

function MapUpdater({ center }: { center: Location | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView([center.latitude, center.longitude], map.getZoom());
    }
  }, [center, map]);
  return null;
}

const createPlaneIcon = (track: number, size: number, category: number, isSearched: boolean = false) => {
  const isHeli = category === 7;
  // Plane icon points East (90deg), so we rotate -90 to align with 0deg North
  // Heli icon points North (0deg), so no offset needed
  const rotationOffset = isHeli ? 0 : -90;

  const markup = renderToStaticMarkup(
    <div style={{
      transform: `rotate(${track + rotationOffset}deg)`,
      width: `${size}px`,
      height: `${size}px`,
      filter: isSearched ? 'drop-shadow(0 0 8px #ef4444)' : 'drop-shadow(0 0 4px rgba(0,0,0,0.5))' // Red glow for searched
    }}>
      {isHeli ? (
        <svg viewBox="0 0 24 24" fill={isSearched ? "#ef4444" : "white"} xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.8))' }}>
          {/* Main Rotor */}
          <rect x="11" y="2" width="2" height="20" rx="1" />
          <rect x="2" y="11" width="20" height="2" rx="1" />
          {/* Body */}
          <path d="M12 6 C 10 6 8 8 8 12 L 8 16 C 8 19 10 21 12 21 C 14 21 16 19 16 16 L 16 12 C 16 8 14 6 12 6 Z" />
          {/* Tail */}
          <rect x="11" y="21" width="2" height="3" />
          <rect x="9" y="23" width="6" height="1" />
        </svg>
      ) : (
        <img
          src="/plane-icon.png"
          alt="plane"
          style={{ width: '100%', height: '100%', objectFit: 'contain', filter: isSearched ? 'brightness(0) saturate(100%) invert(27%) sepia(51%) saturate(2878%) hue-rotate(346deg) brightness(104%) contrast(97%)' : undefined }}
        />
      )}
    </div>
  );

  return L.divIcon({
    html: markup,
    className: '!bg-transparent border-none', // Override leaflet defaults
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

function PlaneMarkers({ flights, selectedFlightIcao24, selectedAircraftCode, onFlightSelect, isExpanded, searchedFlight }: {
  flights: FlightState[],
  selectedFlightIcao24?: string | null,
  selectedAircraftCode?: string | null,
  onFlightSelect: (flight: FlightState) => void,
  isExpanded?: boolean,
  searchedFlight?: FR24FlightDetails | null
}) {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());

  useMapEvents({
    zoomend: () => {
      setZoom(map.getZoom());
    },
  });

  // Calculate generic size based on zoom
  // Zoom 11 is default. 
  // <10: 20px
  // 10-12: 30px
  // >12: 40px
  const size = zoom < 10 ? 20 : zoom < 13 ? 30 : 45;

  // Merge flights with searchedFlight if needed
  const displayFlights = useMemo(() => {
    let list = [...flights];

    if (searchedFlight && searchedFlight.lat && searchedFlight.lon) {
      // Check if already in list (by fuzzy lat/lon matching since we might not have icao24)
      const exists = list.some(f =>
        Math.abs(f.latitude! - searchedFlight.lat!) < 0.001 &&
        Math.abs(f.longitude! - searchedFlight.lon!) < 0.001
      );

      if (!exists) {
        // Create a pseudo FlightState for the searched flight
        const pseudoFlight: FlightState = {
          icao24: searchedFlight.hex || 'searched_' + Date.now(),
          callsign: searchedFlight.flight || searchedFlight.callsign || searchedFlight.registration || 'SEARCHED',
          origin_country: 'Unknown',
          time_position: searchedFlight.timestamp ? new Date(searchedFlight.timestamp).getTime() / 1000 : Date.now() / 1000,
          last_contact: searchedFlight.timestamp ? new Date(searchedFlight.timestamp).getTime() / 1000 : Date.now() / 1000,
          longitude: searchedFlight.lon,
          latitude: searchedFlight.lat,
          // FR24 returns altitude in feet, OpenSky uses meters
          baro_altitude: searchedFlight.altitude ? searchedFlight.altitude * 0.3048 : null,
          on_ground: searchedFlight.altitude === 0,
          // FR24 returns gspeed in knots, OpenSky uses m/s
          velocity: searchedFlight.gspeed ? searchedFlight.gspeed * 0.514444 : null,
          true_track: searchedFlight.track,
          // vspeed is ft/min from FR24, OpenSky uses m/s
          vertical_rate: searchedFlight.vertical_speed ? searchedFlight.vertical_speed * 0.00508 : null,
          sensors: null,
          geo_altitude: searchedFlight.altitude ? searchedFlight.altitude * 0.3048 : null,
          squawk: searchedFlight.squawk,
          spi: false,
          position_source: 0,
          category: 0 // Default plane
        };
        list.push(pseudoFlight);
      }
    }

    if (isExpanded && selectedFlightIcao24) {
      return list.filter(f => f.icao24 === selectedFlightIcao24);
    }
    return list;
  }, [flights, isExpanded, selectedFlightIcao24, searchedFlight]);

  return (
    <>
      {displayFlights.map((flight) => {
        // Determine category: use OpenSky data first, but override if this is the selected flight and we know it's a heli
        let category = flight.category;
        if (flight.icao24 === selectedFlightIcao24 && isHelicopter(selectedAircraftCode)) {
          category = 7; // Force helicopter category
        }

        // Check if this is the searched flight
        const isSearched = searchedFlight && (flight.icao24 === searchedFlight.hex || flight.icao24.startsWith('searched_'));

        return (
          <Marker
            key={flight.icao24}
            position={[flight.latitude!, flight.longitude!]}
            icon={createPlaneIcon(flight.true_track ?? 0, size, category, !!isSearched)}
            eventHandlers={{
              click: () => onFlightSelect(flight),
            }}
          />
        )
      })}
    </>
  );
}

const createUserLocationIcon = () => {
  const markup = renderToStaticMarkup(
    <div className="relative flex items-center justify-center w-6 h-6">
      <div className="absolute w-full h-full bg-white rounded-full opacity-75 animate-ping" />
      <div className="relative w-3 h-3 bg-white border-2 border-zinc-900 rounded-full shadow-lg" />
    </div>
  );

  return L.divIcon({
    html: markup,
    className: '!bg-transparent border-none',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

// Component to handle auto-zooming to flight track
function FlightFocusController({ track, isExpanded }: { track: [number, number][] | null, isExpanded: boolean }) {
  const map = useMap();

  useEffect(() => {
    if (isExpanded && track && track.length > 0) {
      const bounds = L.latLngBounds(track);
      map.fitBounds(bounds, {
        paddingTopLeft: [40, 40],
        paddingBottomRight: [40, 400], // Increased bottom padding to clear the 400px+ high flight card
        animate: true,
        duration: 1.5
      });
    }
  }, [isExpanded, track, map]);

  return null;
}

export default function Map({ center, userLocation, flights, selectedFlightTrack, selectedFlightIcao24, selectedAircraftCode, onFlightSelect, isExpanded = false, searchedFlight }: MapProps) {
  if (!center) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-zinc-950 text-zinc-400">
        <p>Locating...</p>
      </div>
    );
  }

  // Find the selected flight to get its realtime position
  const selectedFlight = flights.find(f => f.icao24 === selectedFlightIcao24);

  // Combine historical track with current live position to fix the "lag" gap
  const displayTrack = useMemo(() => {
    if (!selectedFlightTrack) return null;
    if (!selectedFlight) return selectedFlightTrack;

    // Check if the last point is already close to current position to avoid duplicates/jitter
    // But simplistic append is usually fine for visual connecting line
    return [...selectedFlightTrack, [selectedFlight.latitude, selectedFlight.longitude] as [number, number]];
  }, [selectedFlightTrack, selectedFlight]);

  return (
    <MapContainer
      center={[center.latitude, center.longitude]}
      zoom={11}
      className="h-full w-full z-0 bg-zinc-950"
      zoomControl={false}
    >
      <MapUpdater center={center} />
      <FlightFocusController track={displayTrack} isExpanded={isExpanded} />

      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        className="contrast-110 brightness-90"
      />

      {/* Airport Markers Layer */}
      <AirportMarkers />

      {/* Flight Path */}
      {displayTrack && (
        <>
          {/* Animated dashed line for active flight */}
          <Polyline
            positions={displayTrack}
            pathOptions={{
              color: '#ffffff', // White
              weight: 2,
              opacity: 0.3,     // Faint base line
              dashArray: '4 8', // Dashed
              className: 'flight-path-animated' // CSS animation class
            }}
          />
          {/* Solid subtle line overlay for better visibility */}
          <Polyline
            positions={displayTrack}
            pathOptions={{
              color: '#ffffff',
              weight: 1,
              opacity: 0.1,
            }}
          />
        </>
      )}

      {/* Plane Markers */}
      <PlaneMarkers
        flights={flights}
        onFlightSelect={onFlightSelect}
        selectedFlightIcao24={selectedFlightIcao24}
        selectedAircraftCode={selectedAircraftCode}
        isExpanded={isExpanded}
        searchedFlight={searchedFlight}
      />

      {/* User Location - only render if we have it */}
      {userLocation && (
        <Marker position={[userLocation.latitude, userLocation.longitude]} icon={createUserLocationIcon()} />
      )}
    </MapContainer>
  );
}

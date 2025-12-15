import { useState, useMemo, useEffect } from 'react';
import { Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { renderToStaticMarkup } from 'react-dom/server';
import { AIRPORTS, type Airport } from '../data/airports';
import { getAirportDepartures, type FR24Departure } from '@/services/flightradar';

const createAirportIcon = (iata: string, showLabel: boolean) => {
    const markup = renderToStaticMarkup(
        <div className="flex flex-col items-center justify-center -translate-x-1/2 -translate-y-1/2 w-20 h-20 pointer-events-none">
            <div className="w-3 h-3 bg-zinc-900/50 border-2 border-zinc-400 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.3)] hover:bg-white hover:scale-125 transition-all duration-300 pointer-events-auto cursor-pointer" />
            {showLabel && (
                <span className="text-[10px] font-mono font-bold text-zinc-300 mt-1 drop-shadow-md bg-zinc-950/40 px-1 rounded backdrop-blur-[1px]">
                    {iata}
                </span>
            )}
        </div>
    );

    return L.divIcon({
        html: markup,
        className: '!bg-transparent border-none',
        iconSize: [80, 80], // Large enough container to hold label without clipping
        iconAnchor: [40, 40],
    });
};

function AirportPopupContent({ airport }: { airport: Airport }) {
    const [departures, setDepartures] = useState<FR24Departure[] | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDepartures = async () => {
            setLoading(true);
            const data = await getAirportDepartures(airport.icao);
            setDepartures(data);
            setLoading(false);
        };
        fetchDepartures();
    }, [airport.icao]);

    return (
        <div className="p-1 min-w-[220px]">
            <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-lg">{airport.iata}</span>
                <span className="text-xs text-zinc-500 font-mono">{airport.icao}</span>
            </div>
            <h3 className="font-medium text-sm text-zinc-700 dark:text-zinc-200 leading-tight mb-1">
                {airport.name}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
                {airport.city}, {airport.country}
            </p>

            <div className="border-t border-zinc-200 dark:border-zinc-700 pt-2">
                <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Live Departures</h4>

                {loading ? (
                    <div className="space-y-2">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <ul className="space-y-1.5">
                        {departures && departures.length > 0 ? (
                            departures.map((dep, idx) => (
                                <li key={idx} className="flex justify-between items-start text-xs">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono font-medium text-blue-600 dark:text-blue-400">{dep.flight}</span>
                                            <span className="text-zinc-400 text-[10px]">{dep.type}</span>
                                        </div>
                                        <span className={`text-[10px] ${dep.status === 'Taxiing' ? 'text-amber-500' : 'text-emerald-500'}`}>
                                            {dep.status}
                                        </span>
                                    </div>
                                    <span className="font-mono text-zinc-600 dark:text-zinc-300 mt-0.5">→ {dep.dest_icao}</span>
                                </li>
                            ))
                        ) : (
                            <li className="text-xs text-zinc-400 italic">No active flights found</li>
                        )}
                    </ul>
                )}
            </div>
        </div>
    );
}

export function AirportMarkers() {
    const map = useMap();
    const [bounds, setBounds] = useState(map.getBounds());
    const [zoom, setZoom] = useState(map.getZoom());

    useMapEvents({
        moveend: () => {
            setBounds(map.getBounds());
            setZoom(map.getZoom());
        },
        zoomend: () => {
            setZoom(map.getZoom());
        }
    });

    const visibleAirports = useMemo(() => {
        return AIRPORTS.filter(airport =>
            bounds.contains([airport.lat, airport.lon])
        );
    }, [bounds]);

    // Only show airports if zoomed in enough to avoid clutter
    if (zoom < 6) return null;

    const showLabels = zoom >= 9;

    // Limit rendered airports if there are too many in view (e.g. zoomed out over Europe)
    const renderedAirports = visibleAirports.length > 200 ? visibleAirports.slice(0, 200) : visibleAirports;

    return (
        <>
            {renderedAirports.map(airport => (
                <Marker
                    key={airport.icao}
                    position={[airport.lat, airport.lon]}
                    icon={createAirportIcon(airport.iata, showLabels)}
                >
                    <Popup className="airport-popup">
                        <AirportPopupContent airport={airport} />
                    </Popup>
                </Marker>
            ))}
        </>
    );
}

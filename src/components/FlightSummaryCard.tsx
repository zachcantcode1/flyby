import type { FlightState } from '@/services/airplaneslive';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Maximize2, X, Navigation } from 'lucide-react';
import { useAircraftImage } from '@/hooks/useAircraftImage';

// Convert degrees to compass direction
const degreesToCompass = (degrees: number | null): string => {
    if (degrees === null) return '';
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
};

interface FlightSummaryCardProps {
    flight: FlightState;
    origin?: string;
    destination?: string;
    aircraft?: string;
    registration?: string;
    icaoCode?: string | null;
    onExpand: () => void;
    onClose: () => void;
}

export function FlightSummaryCard({ flight, origin, destination, aircraft, registration, icaoCode, onExpand, onClose }: FlightSummaryCardProps) {
    // Prefer Airplanes.live data, fall back to props (from FR24)
    const displayRegistration = flight.registration || registration;
    const displayAircraft = flight.description || aircraft;
    const displayIcaoCode = flight.aircraftType || icaoCode;

    const { imageUrl } = useAircraftImage(displayIcaoCode || null, displayRegistration);

    // Format distance/direction
    const distanceDisplay = flight.distance_nm !== null
        ? `${Math.round(flight.distance_nm)}nm ${degreesToCompass(flight.direction)}`
        : null;

    return (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-[500]">
            <Card className="bg-zinc-900/95 border-zinc-800 backdrop-blur-sm p-4 text-zinc-100 shadow-xl flex items-center justify-between gap-4 relative overflow-hidden">
                {/* Background Image Overlay (optional) */}
                {imageUrl && (
                    <div className="absolute right-0 top-0 bottom-0 w-32 opacity-20 pointer-events-none">
                        <div className="w-full h-full bg-gradient-to-l from-black/0 to-zinc-900 absolute inset-0 z-10" />
                        <img src={imageUrl} alt="Aircraft" className="h-full w-full object-cover" />
                    </div>
                )}

                <div className="flex-1 min-w-0 z-10">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-bold text-lg leading-none truncate">
                            {flight.callsign || 'Unknown Flight'}
                        </h3>
                        {flight.is_military && (
                            <span className="text-[10px] font-bold bg-lime-600 text-white px-1.5 py-0.5 rounded uppercase tracking-wide">
                                Military
                            </span>
                        )}
                        {flight.is_interesting && !flight.is_military && (
                            <span className="text-[10px] font-bold bg-amber-500 text-white px-1.5 py-0.5 rounded uppercase tracking-wide">
                                Special
                            </span>
                        )}
                        <span className="text-xs font-mono text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">
                            {displayRegistration || flight.icao24}
                        </span>
                        {/* Distance/Direction Badge */}
                        {distanceDisplay && (
                            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/50 border border-cyan-800/50 px-1.5 py-0.5 rounded flex items-center gap-1">
                                <Navigation className="h-2.5 w-2.5" />
                                {distanceDisplay}
                            </span>
                        )}
                    </div>
                    {displayAircraft && (
                        <p className="text-xs text-indigo-400 font-semibold mb-0.5">
                            {displayAircraft}
                        </p>
                    )}
                    <p className="text-sm text-zinc-400 truncate">
                        {origin || 'Unknown'} &rarr; {destination || 'Unknown'}
                    </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 z-10">
                    {imageUrl && (
                        <div className="h-10 w-16 rounded-md overflow-hidden bg-zinc-800 border border-zinc-700 hidden sm:block">
                            <img src={imageUrl} alt="Plane" className="h-full w-full object-cover" />
                        </div>
                    )}
                    <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8 border-zinc-700 bg-zinc-800 hover:bg-zinc-700 hover:text-white"
                        onClick={onExpand}
                    >
                        <Maximize2 className="h-4 w-4" />
                    </Button>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 hover:bg-red-500/20 hover:text-red-400"
                        onClick={onClose}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </Card>
        </div>
    );
}


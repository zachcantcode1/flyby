import type { FlightState } from '@/services/opensky';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Maximize2, X } from 'lucide-react';
import { useAircraftImage } from '@/hooks/useAircraftImage';

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
    const { imageUrl } = useAircraftImage(icaoCode || null, registration);

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
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-lg leading-none truncate">
                            {flight.callsign || 'Unknown Flight'}
                        </h3>
                        <span className="text-xs font-mono text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">
                            {registration || flight.icao24}
                        </span>
                    </div>
                    {aircraft && (
                        <p className="text-xs text-indigo-400 font-semibold mb-0.5">
                            {aircraft}
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

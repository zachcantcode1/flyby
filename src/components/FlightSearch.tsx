import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getFR24FlightDetails, type FR24FlightDetails } from '@/services/flightradar';
import { toast } from 'sonner';

interface FlightSearchProps {
    onFlightFound: (details: FR24FlightDetails) => void;
}

export function FlightSearch({ onFlightFound }: FlightSearchProps) {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        try {
            // Search by callsign
            const result = await getFR24FlightDetails(query.trim().toUpperCase());

            if (result) {
                // Found a flight (could be live, landed, or scheduled)
                if (result.status === 'landed') {
                    toast.success(`${result.flight || query} has landed`, {
                        description: result.landedAt
                            ? `Arrived at ${new Date(result.landedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                            : 'Flight completed'
                    });
                } else if (result.status === 'scheduled') {
                    toast.info(`${result.flight || query} is scheduled`, {
                        description: result.scheduledDeparture
                            ? `Departing at ${new Date(result.scheduledDeparture).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                            : 'Awaiting departure'
                    });
                }
                onFlightFound(result);
                setQuery('');
            } else {
                toast.error('Flight not found', {
                    description: 'No active or recent flights match this search'
                });
            }
        } catch (error) {
            console.error('Search failed', error);
            toast.error('Error searching for flight');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSearch} className="flex gap-2 w-full max-w-sm pointer-events-auto">
            <div className="relative flex-1">
                <Input
                    type="text"
                    placeholder="Search Flight (e.g. SWA123)"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="pl-9 bg-zinc-900/80 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 backdrop-blur-sm focus-visible:ring-blue-500"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            </div>
            <Button
                type="submit"
                disabled={loading}
                variant="secondary"
                className="bg-zinc-800/80 text-zinc-100 hover:bg-zinc-700/80 backdrop-blur-sm border border-zinc-700"
            >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Go'}
            </Button>
        </form>
    );
}

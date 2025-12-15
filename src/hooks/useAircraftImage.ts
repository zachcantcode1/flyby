import { useState, useEffect } from 'react';
import { AIRCRAFT_TYPE_IMAGES } from '../data/aircraftImages';

export function useAircraftImage(icaoCode: string | null, registration?: string | null) {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let mounted = true;

        const fetchImage = async () => {
            console.log('Fetching image for:', { registration, icaoCode });
            if (registration) {
                setLoading(true);
                try {
                    // Use the proxy configured in vite.config.ts
                    const res = await fetch(`/api/planespotters/${registration}`);
                    if (res.ok) {
                        const data = await res.json();
                        if (data.photos && data.photos.length > 0) {
                            if (mounted) {
                                setImageUrl(data.photos[0].thumbnail_large.src);
                                setLoading(false);
                                return;
                            }
                        }
                    }
                } catch (e) {
                    console.error("Failed to fetch image from Planespotters", e);
                }
            }

            // Fallback to static ICAO code map
            if (icaoCode) {
                const normalizedCode = icaoCode.toUpperCase();
                if (AIRCRAFT_TYPE_IMAGES[normalizedCode]) {
                    if (mounted) {
                        setImageUrl(AIRCRAFT_TYPE_IMAGES[normalizedCode]);
                        setLoading(false);
                    }
                } else {
                    if (mounted) {
                        setImageUrl(null);
                        setLoading(false);
                    }
                }
            } else {
                if (mounted) {
                    setImageUrl(null);
                    setLoading(false);
                }
            }
        };

        fetchImage();

        return () => { mounted = false; };
    }, [icaoCode, registration]);

    return { imageUrl, loading };
}


import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Coordinates } from '@/types';
import { Loader2 } from 'lucide-react';

// Updated to a working public access token
const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4M29iazA2Z2gycXA4N2pmbDZmangifQ.-g_vE53SD2WrJ6tFX7QHmA';

interface ItemLocationMapProps {
  latitude: number;
  longitude: number;
}

const ItemLocationMap = ({ latitude, longitude }: ItemLocationMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!mapContainer.current) return;
    
    console.log('Initializing map with coords:', latitude, longitude);

    // Initialize map with token
    mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;
    
    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [longitude, latitude],
        zoom: 14,
      });

      // Add navigation controls
      map.current.addControl(
        new mapboxgl.NavigationControl({
          visualizePitch: true,
        }),
        'top-right'
      );

      map.current.on('load', () => {
        console.log('Map loaded successfully');
        setLoading(false);
      });

      // Add marker
      marker.current = new mapboxgl.Marker({
        color: "#FF0000"
      })
        .setLngLat([longitude, latitude])
        .addTo(map.current);
        
      console.log('Map marker added at:', longitude, latitude);
    } catch (error) {
      console.error('Error initializing map:', error);
      setLoading(false);
    }

    // Cleanup
    return () => {
      if (map.current) {
        console.log('Removing map');
        map.current.remove();
      }
    };
  }, [latitude, longitude]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="absolute inset-0" />
      {loading && (
        <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
    </div>
  );
};

export default ItemLocationMap;

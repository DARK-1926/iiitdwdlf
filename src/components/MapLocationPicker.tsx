
import { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from "@/components/ui/button";
import { MapPin, Loader2 } from 'lucide-react';
import { toast } from "sonner";

// Updated to a working public access token
const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4M29iazA2Z2gycXA4N2pmbDZmangifQ.-g_vE53SD2WrJ6tFX7QHmA';

interface MapLocationPickerProps {
  onLocationSelect: (location: { latitude: number; longitude: number }) => void;
  defaultLocation?: { latitude: number; longitude: number };
}

const MapLocationPicker = ({ onLocationSelect, defaultLocation }: MapLocationPickerProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPosition, setCurrentPosition] = useState(
    defaultLocation || { latitude: 40.7128, longitude: -74.0060 } // Default to New York if no position
  );

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return;
    
    console.log('Initializing map picker with coords:', currentPosition);
    
    try {
      mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [currentPosition.longitude, currentPosition.latitude],
        zoom: 13,
      });
      
      // Add navigation control
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
      
      // Add marker
      marker.current = new mapboxgl.Marker({ draggable: true })
        .setLngLat([currentPosition.longitude, currentPosition.latitude])
        .addTo(map.current);
      
      // Handle marker dragend event
      marker.current.on('dragend', () => {
        if (!marker.current) return;
        const lngLat = marker.current.getLngLat();
        console.log('Marker dragged to:', lngLat);
        const newLocation = { latitude: lngLat.lat, longitude: lngLat.lng };
        setCurrentPosition(newLocation);
        onLocationSelect(newLocation);
      });
      
      map.current.on('click', (e) => {
        console.log('Map clicked at:', e.lngLat);
        if (!marker.current) return;
        marker.current.setLngLat(e.lngLat);
        const newLocation = { latitude: e.lngLat.lat, longitude: e.lngLat.lng };
        setCurrentPosition(newLocation);
        onLocationSelect(newLocation);
      });
      
      map.current.on('load', () => {
        console.log('Map picker loaded successfully');
        setLoading(false);
      });
    } catch (error) {
      console.error('Error initializing map picker:', error);
      toast.error('Failed to load map. Please try again later.');
      setLoading(false);
    }
    
    // Clean up on unmount
    return () => {
      if (map.current) {
        console.log('Removing map picker');
        map.current.remove();
      }
    };
  }, []);
  
  useEffect(() => {
    // Update marker and map when default location changes
    if (defaultLocation && map.current && marker.current) {
      marker.current.setLngLat([defaultLocation.longitude, defaultLocation.latitude]);
      map.current.setCenter([defaultLocation.longitude, defaultLocation.latitude]);
      setCurrentPosition(defaultLocation);
    }
  }, [defaultLocation]);
  
  // Try to get user's current location
  const getUserLocation = () => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newPos = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          
          console.log('Got user location:', newPos);
          setCurrentPosition(newPos);
          
          if (marker.current && map.current) {
            marker.current.setLngLat([newPos.longitude, newPos.latitude]);
            map.current.flyTo({
              center: [newPos.longitude, newPos.latitude],
              zoom: 15
            });
          }
          
          onLocationSelect(newPos);
          setLoading(false);
          toast.success('Location updated to your current position');
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.error('Could not access your location. Please check your browser permissions.');
          setLoading(false);
        }
      );
    } else {
      console.error('Geolocation is not supported by this browser');
      toast.error('Geolocation is not supported by your browser');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="h-[300px] relative border rounded-md overflow-hidden">
        <div ref={mapContainer} className="absolute inset-0" />
        
        {loading && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm font-medium">Loading map...</p>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Click on the map or drag the marker to set the location
        </p>
        
        <Button 
          type="button" 
          variant="outline" 
          size="sm"
          onClick={getUserLocation}
          className="flex items-center space-x-2"
        >
          <MapPin className="h-4 w-4" />
          <span>Use My Location</span>
        </Button>
      </div>
    </div>
  );
};

export default MapLocationPicker;

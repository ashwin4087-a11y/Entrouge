import { useRef, useEffect } from 'react';
import { Map, NavigationControl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import './DigitalTwinMap.css';

const MAPTILER_API_KEY = import.meta.env.VITE_MAPTILER_API_KEY as string;

interface DigitalTwinMapProps {
  className?: string;
}

export default function DigitalTwinMap({ className }: DigitalTwinMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = new Map({
      container: mapContainerRef.current,
      style: `https://api.maptiler.com/maps/streets-v2-dark/style.json?key=${MAPTILER_API_KEY}`,
      center: [80.2707, 13.0827], // Chennai, India
      zoom: 12,
    });

    map.addControl(new NavigationControl(), 'top-right');

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  return (
    <div
      ref={mapContainerRef}
      className={`digital-twin-map-container ${className ?? ''}`}
    />
  );
}

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

import type { Property } from '@/types/property';

interface Props {
  property: Property;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';

const PropertyMap: React.FC<Props> = ({ property }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapToken, setMapToken] = useState<string>('');

  useEffect(() => {
    const fetchMapToken = async () => {
      try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/get-mapbox-token`);
        const data = await response.json();
        if (data.token) setMapToken(data.token);
      } catch (error) {
        console.error('Failed to fetch Mapbox token:', error);
      }
    };
    fetchMapToken();
  }, []);

  useEffect(() => {
    if (!mapContainer.current || !property || !mapToken || map.current) return;

    const lng = property.longitude || 36.8219;
    const lat = property.latitude || -1.2921;

    try {
      mapboxgl.accessToken = mapToken;
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [lng, lat],
        zoom: 14,
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      new mapboxgl.Marker({ color: '#2563eb' })
        .setLngLat([lng, lat])
        .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(
          `<h3 class="font-semibold">${property.title}</h3><p>${property.location}</p>`
        ))
        .addTo(map.current);
    } catch (error) {
      console.error('Map initialization error:', error);
    }

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [property, mapToken]);

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-4">Location</h2>
      <div ref={mapContainer} className="w-full h-[400px] rounded-xl overflow-hidden border border-border" />
      <p className="text-sm text-muted-foreground mt-2">{property.location}{property.county ? `, ${property.county}` : ''}</p>
    </div>
  );
};

export default PropertyMap;

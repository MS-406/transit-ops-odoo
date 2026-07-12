import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { tripsApi } from '../../api/trips';
import { Loader2 } from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Approximate coordinates for the hubs
const HUBS = {
  nairobi: [-1.2921, 36.8219],
  mombasa: [-4.0435, 39.6682],
  kisumu: [-0.0917, 34.7680]
};

export const MapSimulation = () => {
  // Query trips to see if there are active dispatches
  const { data: trips, isLoading } = useQuery({
    queryKey: ['trips'],
    queryFn: () => tripsApi.getTrips(),
    select: (res) => res.data
  });

  const activeTrips = (trips || []).filter(t => t.status === 'Dispatched');

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full py-16">
        <Loader2 className="animate-spin text-uber-black" size={24} />
      </div>
    );
  }

  // Check which vectors are active based on dispatch routes
  const hasNairobiMombasa = activeTrips.some(t => 
    t.source.toLowerCase().includes('nairobi') && t.destination.toLowerCase().includes('mombasa')
  );

  const hasNairobiKisumu = activeTrips.some(t => 
    t.source.toLowerCase().includes('nairobi') && t.destination.toLowerCase().includes('kisumu')
  );

  const hasKisumuMombasa = activeTrips.some(t => 
    t.source.toLowerCase().includes('kisumu') && t.destination.toLowerCase().includes('mombasa')
  );

  return (
    <div className="relative w-full h-full bg-gray-950 rounded-2xl overflow-hidden border border-uber-gray-900 select-none">
      
      {/* Simulation Header */}
      <div className="absolute top-4 left-4 z-[400] flex items-center gap-2 bg-gray-900/90 border border-gray-800 rounded-full px-3 py-1 text-[10px] text-gray-300">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-uber-green opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-uber-green"></span>
        </span>
        <span className="font-extrabold uppercase tracking-wider">
          {activeTrips.length > 0 ? `${activeTrips.length} Active Dispatches` : 'Live Fleet Telemetry'}
        </span>
      </div>

      <MapContainer 
        center={[-1.2, 37.5]} 
        zoom={6} 
        style={{ height: '100%', width: '100%', minHeight: '300px' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* Routes */}
        <Polyline 
          positions={[HUBS.nairobi, HUBS.mombasa]} 
          pathOptions={{ 
            color: hasNairobiMombasa || activeTrips.length === 0 ? '#06C167' : '#374151', 
            weight: 3, 
            dashArray: hasNairobiMombasa ? undefined : '5, 5' 
          }} 
        />
        <Polyline 
          positions={[HUBS.nairobi, HUBS.kisumu]} 
          pathOptions={{ 
            color: hasNairobiKisumu ? '#06C167' : '#374151', 
            weight: 3, 
            dashArray: hasNairobiKisumu ? undefined : '5, 5' 
          }} 
        />
        <Polyline 
          positions={[HUBS.kisumu, HUBS.mombasa]} 
          pathOptions={{ 
            color: hasKisumuMombasa ? '#06C167' : '#374151', 
            weight: 3, 
            dashArray: hasKisumuMombasa ? undefined : '5, 5' 
          }} 
        />

        {/* Hubs */}
        <CircleMarker center={HUBS.nairobi} radius={8} pathOptions={{ color: '#276EF1', fillColor: '#276EF1', fillOpacity: 1 }}>
          <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent>Nairobi Depot</Tooltip>
        </CircleMarker>

        <CircleMarker center={HUBS.mombasa} radius={8} pathOptions={{ color: '#06C167', fillColor: '#06C167', fillOpacity: 1 }}>
          <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent>Mombasa Port</Tooltip>
        </CircleMarker>

        <CircleMarker center={HUBS.kisumu} radius={8} pathOptions={{ color: '#FFC043', fillColor: '#FFC043', fillOpacity: 1 }}>
          <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent>Kisumu Hub</Tooltip>
        </CircleMarker>
      </MapContainer>

      {/* Map Legend */}
      <div className="absolute bottom-4 right-4 z-[400] bg-gray-900/90 border border-gray-800 rounded-xl p-3 flex flex-col gap-1.5 text-[9px] text-gray-400 select-none text-left">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-uber-blue"></span>
          <span>Nairobi Hub (Origin Depot)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-uber-green"></span>
          <span>Mombasa Hub (Coastal Terminal)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-uber-amber"></span>
          <span>Kisumu Hub (Western Terminal)</span>
        </div>
      </div>

    </div>
  );
};

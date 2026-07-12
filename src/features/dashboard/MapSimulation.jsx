import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { tripsApi } from '../../api/trips';
import { Loader2 } from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Approximate coordinates for the hubs across India
const HUBS = {
  pune: [18.5204, 73.8567],
  mumbai: [19.0760, 72.8777],
  bangalore: [12.9716, 77.5946],
  chennai: [13.0827, 80.2707],
  ahmedabad: [23.0225, 72.5714],
  jaipur: [26.9124, 75.7873],
  delhi: [28.6139, 77.2090],
  mysore: [12.2958, 76.6394],
  rajkot: [22.3039, 70.8022],
  pondicherry: [11.9416, 79.8083],
  nashik: [19.9975, 73.7898],
  solapur: [17.6599, 75.9064],
  hubli: [15.3647, 75.1240],
  agra: [27.1767, 78.0081],
  kolhapur: [16.7050, 74.2433],
  udaipur: [24.5854, 73.7125]
};

const MAJOR_HUBS = {
  pune: { name: 'Pune Depot', color: '#276EF1' },
  mumbai: { name: 'Mumbai Hub', color: '#276EF1' },
  bangalore: { name: 'Bangalore Warehouse', color: '#06C167' },
  chennai: { name: 'Chennai Depot', color: '#06C167' },
  delhi: { name: 'Delhi Depot', color: '#FFC043' },
  ahmedabad: { name: 'Ahmedabad Hub', color: '#FFC043' },
  jaipur: { name: 'Jaipur Hub', color: '#FFC043' }
};

const DEFAULT_CONNECTIONS = [
  ['pune', 'mumbai'],
  ['pune', 'nashik'],
  ['pune', 'solapur'],
  ['pune', 'kolhapur'],
  ['bangalore', 'mysore'],
  ['bangalore', 'hubli'],
  ['bangalore', 'chennai'],
  ['ahmedabad', 'rajkot'],
  ['chennai', 'pondicherry'],
  ['delhi', 'agra'],
  ['jaipur', 'udaipur']
];

const findHubKey = (cityString) => {
  if (!cityString) return null;
  const str = cityString.toLowerCase();
  for (const hub of Object.keys(HUBS)) {
    if (str.includes(hub)) {
      return hub;
    }
  }
  return null;
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

  const isConnectionActive = (hubA, hubB) => {
    return activeTrips.some(t => {
      const src = findHubKey(t.source);
      const dest = findHubKey(t.destination);
      return (src === hubA && dest === hubB) || (src === hubB && dest === hubA);
    });
  };

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
        center={[20.5937, 78.9629]} 
        zoom={5} 
        style={{ height: '100%', width: '100%', minHeight: '300px' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* Routes */}
        {DEFAULT_CONNECTIONS.map(([hubA, hubB], idx) => {
          const active = isConnectionActive(hubA, hubB);
          return (
            <Polyline
              key={idx}
              positions={[HUBS[hubA], HUBS[hubB]]}
              pathOptions={{
                color: active ? '#06C167' : '#374151',
                weight: active ? 4 : 2,
                dashArray: active ? undefined : '5, 5'
              }}
            />
          );
        })}

        {/* Major Hubs */}
        {Object.entries(MAJOR_HUBS).map(([key, info]) => (
          <CircleMarker 
            key={key} 
            center={HUBS[key]} 
            radius={8} 
            pathOptions={{ color: info.color, fillColor: info.color, fillOpacity: 1 }}
          >
            <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent>{info.name}</Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>

      {/* Map Legend */}
      <div className="absolute bottom-4 right-4 z-[400] bg-gray-900/90 border border-gray-800 rounded-xl p-3 flex flex-col gap-1.5 text-[9px] text-gray-400 select-none text-left">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#276EF1]"></span>
          <span>Maharashtra (Pune / Mumbai Hubs)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#06C167]"></span>
          <span>South India (Bangalore / Chennai Hubs)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#FFC043]"></span>
          <span>North & West India (Delhi / Jaipur / Ahmedabad)</span>
        </div>
      </div>

    </div>
  );
};

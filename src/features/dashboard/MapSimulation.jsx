import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { tripsApi } from '../../api/trips';
import { Loader2, Radio } from 'lucide-react';

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
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-gray-900/90 border border-gray-800 rounded-full px-3 py-1 text-[10px] text-gray-300">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-uber-green opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-uber-green"></span>
        </span>
        <span className="font-extrabold uppercase tracking-wider">
          {activeTrips.length > 0 ? `${activeTrips.length} Active Dispatches` : 'Simulated Fleet Telemetry'}
        </span>
      </div>

      {/* SVG Canvas Map */}
      <svg className="w-full h-full min-h-[300px]" viewBox="0 0 400 250" fill="none" xmlns="http://www.w3.org/2000/svg">
        
        {/* Style configurations for smooth animations */}
        <style>
          {`
            @keyframes pulseMarker {
              0% { r: 4; opacity: 1; }
              50% { r: 8; opacity: 0.4; }
              100% { r: 4; opacity: 1; }
            }
            .marker-pulse {
              animation: pulseMarker 2s infinite ease-in-out;
            }
          `}
        </style>

        {/* Grid pattern background */}
        <defs>
          <pattern id="mapGrid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.04" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#mapGrid)" />

        {/* Vectors (Connecting Paths) */}
        {/* Path 1: Nairobi (80, 150) -> Mombasa (320, 200) */}
        <path id="nairobi_mombasa" d="M 80 150 Q 200 140 320 200" stroke="#374151" strokeWidth="2" strokeDasharray="4 4" />
        
        {/* Path 2: Nairobi (80, 150) -> Kisumu (120, 60) */}
        <path id="nairobi_kisumu" d="M 80 150 Q 90 95 120 60" stroke="#374151" strokeWidth="2" strokeDasharray="4 4" />

        {/* Path 3: Kisumu (120, 60) -> Mombasa (320, 200) */}
        <path id="kisumu_mombasa" d="M 120 60 Q 230 100 320 200" stroke="#374151" strokeWidth="2" strokeDasharray="4 4" />

        {/* Active Animated Paths (Glow paths if dispatched) */}
        {hasNairobiMombasa && (
          <path d="M 80 150 Q 200 140 320 200" stroke="#06C167" strokeWidth="2" strokeOpacity="0.6" />
        )}
        {hasNairobiKisumu && (
          <path d="M 80 150 Q 90 95 120 60" stroke="#06C167" strokeWidth="2" strokeOpacity="0.6" />
        )}
        {hasKisumuMombasa && (
          <path d="M 120 60 Q 230 100 320 200" stroke="#06C167" strokeWidth="2" strokeOpacity="0.6" />
        )}

        {/* Pulse Dot Animations along active paths */}
        {/* If no real dispatches, show simulated telemetry loop */}
        {(hasNairobiMombasa || activeTrips.length === 0) && (
          <circle r="4" fill="#06C167">
            <animateMotion dur="6s" repeatCount="indefinite" path="M 80 150 Q 200 140 320 200" />
            <animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite" />
          </circle>
        )}

        {hasNairobiKisumu && (
          <circle r="4" fill="#06C167">
            <animateMotion dur="4s" repeatCount="indefinite" path="M 80 150 Q 90 95 120 60" />
          </circle>
        )}

        {(hasKisumuMombasa || (activeTrips.length === 0)) && (
          <circle r="4" fill="#276EF1">
            <animateMotion dur="8s" repeatCount="indefinite" path="M 120 60 Q 230 100 320 200" />
          </circle>
        )}

        {/* Hub Points/Markers */}
        {/* Hub A: Nairobi Depot */}
        <circle cx="80" cy="150" r="5" fill="#276EF1" />
        <circle cx="80" cy="150" r="10" stroke="#276EF1" strokeWidth="1" className="marker-pulse" />
        <text x="75" y="135" fill="#E2E2E2" fontSize="8" fontWeight="bold" textAnchor="end">Nairobi Depot</text>

        {/* Hub B: Mombasa Port */}
        <circle cx="320" cy="200" r="5" fill="#06C167" />
        <circle cx="320" cy="200" r="10" stroke="#06C167" strokeWidth="1" className="marker-pulse" />
        <text x="325" y="215" fill="#E2E2E2" fontSize="8" fontWeight="bold" textAnchor="start">Mombasa Port</text>

        {/* Hub C: Kisumu Hub */}
        <circle cx="120" cy="60" r="5" fill="#FFC043" />
        <circle cx="120" cy="60" r="10" stroke="#FFC043" strokeWidth="1" className="marker-pulse" />
        <text x="120" y="48" fill="#E2E2E2" fontSize="8" fontWeight="bold" textAnchor="middle">Kisumu Hub</text>

      </svg>

      {/* Map Legend */}
      <div className="absolute bottom-4 right-4 bg-gray-900/90 border border-gray-800 rounded-xl p-3 flex flex-col gap-1.5 text-[9px] text-gray-400 select-none text-left">
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

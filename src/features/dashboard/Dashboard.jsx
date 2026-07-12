import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../../api/dashboard';
import { vehiclesApi } from '../../api/vehicles';
import { tripsApi } from '../../api/trips';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  AlertTriangle,
  Loader2,
  Navigation,
  ShieldCheck,
  Zap,
  Calendar,
  Route,
  Activity
} from 'lucide-react';

export const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [selectedType, setSelectedType] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');

  // Query KPIs based on active filters
  const { data: kpis, isLoading: isKpisLoading } = useQuery({
    queryKey: ['dashboard-kpis', { vehicle_type: selectedType, region: selectedRegion }],
    queryFn: () => dashboardApi.getKpis({ vehicle_type: selectedType, region: selectedRegion }),
    select: (res) => res.data
  });

  // Query recent logs (vehicles and trips)
  const { data: vehicles } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => vehiclesApi.getVehicles(),
    select: (res) => res.data
  });

  const { data: trips } = useQuery({
    queryKey: ['trips'],
    queryFn: () => tripsApi.getTrips(),
    select: (res) => res.data
  });

  const isReadOnly = user?.role === 'Financial Analyst';

  // Build a feed of recent operational events
  const eventsFeed = [];

  if (vehicles) {
    vehicles.forEach(v => {
      // Maintenance logs
      (v.maintenance_records || []).forEach(m => {
        eventsFeed.push({
          type: 'maintenance',
          date: m.date,
          title: `${v.registration_number} entered maintenance`,
          subtitle: m.description,
          badge: m.status === 'Open' ? 'In Shop' : 'Completed',
          timestamp: new Date(m.date).getTime()
        });
      });
    });
  }

  if (trips) {
    trips.forEach(t => {
      const vPlate = vehicles?.find(veh => veh.id === t.vehicle_id)?.registration_number || 'Vehicle';
      if (t.status === 'Dispatched') {
        eventsFeed.push({
          type: 'trip',
          date: t.created_at?.split('T')[0] || '2026-07-12',
          title: `Trip #${t.id} Dispatched`,
          subtitle: `Vehicle: ${vPlate} | Cargo: ${t.cargo_weight} Tons`,
          badge: 'On Trip',
          timestamp: new Date(t.created_at || '2026-07-12').getTime()
        });
      } else if (t.status === 'Completed') {
        eventsFeed.push({
          type: 'trip',
          date: t.completed_at?.split('T')[0] || '2026-07-12',
          title: `Trip #${t.id} Completed`,
          subtitle: `Fuel: ${t.fuel_consumed} L | Final Odo: ${t.final_odometer} km`,
          badge: 'Delivered',
          timestamp: new Date(t.completed_at || '2026-07-12').getTime()
        });
      }
    });
  }

  // Sort feed descending
  eventsFeed.sort((a, b) => b.timestamp - a.timestamp);
  const recentEvents = eventsFeed.slice(0, 5);

  return (
    <div className="text-left animate-fade-in">
      
      {/* Page Title & Filter panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-xs uppercase font-extrabold tracking-widest text-gray-500">
            Operations / Dashboard
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight mt-1 text-uber-black uppercase">
            Fleet Overview
          </h2>
        </div>

        {/* Filters Panel */}
        <div className="flex items-center gap-3">
          <div className="w-36 md:w-44">
            <Select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              options={[
                { value: '', label: 'All Classifications' },
                { value: 'Heavy Hauler', label: 'Heavy Hauler' },
                { value: 'Box Body', label: 'Box Body' },
                { value: 'Dry Van', label: 'Dry Van' },
                { value: 'Flatbed', label: 'Flatbed' }
              ]}
            />
          </div>
          <div className="w-36 md:w-44">
            <Select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              options={[
                { value: '', label: 'All Regions' },
                { value: 'Nairobi East', label: 'Nairobi East' },
                { value: 'Nairobi West', label: 'Nairobi West' },
                { value: 'Mombasa Port', label: 'Mombasa Port' }
              ]}
            />
          </div>
        </div>
      </div>

      {/* Dark KPI Banner Section */}
      <div className="bg-uber-black text-uber-white rounded-2xl p-6 md:p-8 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl border border-uber-gray-900 select-none">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-uber-green font-extrabold flex items-center gap-1.5">
            <Zap size={10} className="fill-uber-green" /> Operations Command Center
          </span>
          <h3 className="text-2xl font-bold mt-1">Hello, {user?.name || 'Operator'}</h3>
          <p className="text-gray-400 text-xs mt-1">
            Active simulator session. Click settings to preview role-based access lists.
          </p>
        </div>
        {!isReadOnly && (
          <div className="flex gap-3">
            <Button
              variant="success"
              size="sm"
              onClick={() => navigate('/trips')}
              className="flex items-center gap-1.5"
            >
              <Route size={14} /> Dispatch Board
            </Button>
          </div>
        )}
      </div>

      {/* KPI Stats Strip Grid */}
      {isKpisLoading ? (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="animate-spin text-uber-black" size={28} />
        </div>
      ) : kpis ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 select-none">
          
          <Card>
            <span className="text-[10px] uppercase font-bold text-gray-400">Fleet Utilization</span>
            <div className="text-3xl font-extrabold mt-1 text-uber-blue">
              {kpis.utilizationRate}%
            </div>
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-2 flex items-center gap-1">
              <TrendingUp size={12} className="text-uber-blue" />
              Active operational rate
            </div>
          </Card>

          <Card>
            <span className="text-[10px] uppercase font-bold text-gray-400">Active Dispatches</span>
            <div className="text-3xl font-extrabold mt-1">
              {kpis.activeTrips} Trips
            </div>
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-2">
              {kpis.pendingTrips} in draft mode
            </div>
          </Card>

          <Card>
            <span className="text-[10px] uppercase font-bold text-gray-400">Vehicles in Service</span>
            <div className="text-3xl font-extrabold mt-1 text-uber-green">
              {kpis.availableVehicles} / {kpis.totalVehicles}
            </div>
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-2">
              {kpis.retiredVehicles} retired units excluded
            </div>
          </Card>

          <Card>
            <span className="text-[10px] uppercase font-bold text-gray-400">Workshop Capacity</span>
            <div className="text-3xl font-extrabold mt-1 text-uber-amber">
              {kpis.inMaintenance} in Shop
            </div>
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-2">
              {kpis.driversOnDuty} active drivers on duty
            </div>
          </Card>

        </div>
      ) : null}

      {/* Map and Operations Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Route Map Panel */}
        <Card className="lg:col-span-2 select-none">
          <CardHeader className="flex justify-between items-center pb-2">
            <h4 className="font-extrabold uppercase text-xs tracking-wider text-gray-500 flex items-center gap-1.5">
              <Navigation size={14} /> Fleet Map Tracker
            </h4>
            <Badge status="available">Live</Badge>
          </CardHeader>
          <CardContent className="h-72 flex items-center justify-center bg-gray-50 border border-dashed border-gray-200 rounded-xl text-xs text-gray-400">
            <div className="flex flex-col items-center gap-2">
              <Activity size={24} className="text-gray-300 animate-pulse" />
              <span>Map simulation loads in Trip Details panel.</span>
            </div>
          </CardContent>
        </Card>

        {/* Recent Events Card */}
        <Card>
          <CardHeader>
            <h4 className="font-extrabold uppercase text-xs tracking-wider text-gray-500 flex items-center gap-1.5">
              <Calendar size={14} /> Recent Fleet Events
            </h4>
          </CardHeader>
          <CardContent>
            {recentEvents.length === 0 ? (
              <div className="text-xs text-gray-400 py-12 text-center italic">No recent events logged.</div>
            ) : (
              <ul className="divide-y divide-uber-gray-300 text-xs">
                {recentEvents.map((evt, idx) => (
                  <li key={idx} className="py-3 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-uber-black">{evt.title}</p>
                      <p className="text-[10px] text-gray-400 truncate max-w-[180px] mt-0.5">{evt.subtitle}</p>
                    </div>
                    <Badge status={evt.badge}>{evt.badge}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

      </div>

    </div>
  );
};

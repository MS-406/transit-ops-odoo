import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vehiclesApi } from '../../api/vehicles';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { VehicleForm } from './VehicleForm';
import { useAuthStore } from '../../store/authStore';
import {
  ArrowLeft,
  Edit2,
  Trash2,
  Wrench,
  Fuel,
  Info,
  Calendar,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

export const VehicleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Check role authorization for write access
  const isManager = user?.role === 'Fleet Manager' || user?.role === 'Admin';

  // Query details
  const { data: vehicle, isLoading, error } = useQuery({
    queryKey: ['vehicle', id],
    queryFn: () => vehiclesApi.getVehicle(id),
    select: (res) => res.data
  });

  // Delete vehicle mutation
  const deleteMutation = useMutation({
    mutationFn: () => vehiclesApi.deleteVehicle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Vehicle deleted successfully.');
      navigate('/vehicles');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to delete vehicle.');
    }
  });

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete vehicle ${vehicle.registration_number}?`)) {
      deleteMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Loader2 className="animate-spin text-uber-black" size={32} />
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="text-left py-12">
        <Button variant="secondary" onClick={() => navigate('/vehicles')} className="mb-6">
          <ArrowLeft size={16} className="mr-2" /> Back to Vehicles
        </Button>
        <Card className="border-uber-red/30 bg-red-50/50">
          <div className="flex items-center gap-3 text-uber-red">
            <AlertTriangle size={24} />
            <div>
              <h3 className="font-bold">Error loading vehicle details</h3>
              <p className="text-xs text-red-700 mt-1">
                {error?.message || 'Vehicle not found. It may have been deleted or the ID is invalid.'}
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Calculate totals
  const totalFuelCost = (vehicle.fuel_logs || []).reduce((acc, log) => acc + (log.cost || 0), 0);
  const totalFuelLiters = (vehicle.fuel_logs || []).reduce((acc, log) => acc + (log.liters || 0), 0);
  const totalMaintenanceCost = (vehicle.maintenance_records || []).reduce((acc, log) => acc + (log.cost || 0), 0);
  const totalCostRollup = totalFuelCost + totalMaintenanceCost;

  return (
    <div className="text-left animate-fade-in">
      
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/vehicles')}
            className="p-2 hover:bg-uber-gray-300/40 rounded-full transition-colors text-uber-black"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-extrabold tracking-widest text-gray-500">
                Registry / Vehicle Details
              </span>
              {vehicle.status === 'Retired' && <Badge status="retired">Out of Service</Badge>}
              {vehicle.status === 'In Shop' && <Badge status="maintenance">Maintenance</Badge>}
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight mt-1 text-uber-black">
              {vehicle.registration_number}
            </h2>
          </div>
        </div>

        {isManager && (
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setIsEditOpen(true)}
              className="flex items-center gap-2"
            >
              <Edit2 size={14} /> Edit Info
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              className="flex items-center gap-2"
              disabled={deleteMutation.isPending}
            >
              <Trash2 size={14} /> Delete
            </Button>
          </div>
        )}
      </div>

      {/* Main Grid: Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Core Specs Card */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-gray-500 flex items-center gap-2">
              <Info size={16} /> Specifications
            </h3>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 text-sm">
            <div className="grid grid-cols-2 py-2 border-b border-uber-gray-300">
              <span className="text-gray-400 font-medium">Model</span>
              <span className="font-bold text-uber-black text-right">{vehicle.model}</span>
            </div>
            <div className="grid grid-cols-2 py-2 border-b border-uber-gray-300">
              <span className="text-gray-400 font-medium">Type</span>
              <span className="font-bold text-uber-black text-right">{vehicle.type}</span>
            </div>
            <div className="grid grid-cols-2 py-2 border-b border-uber-gray-300">
              <span className="text-gray-400 font-medium">Status</span>
              <span className="text-right">
                <Badge status={vehicle.status}>{vehicle.status}</Badge>
              </span>
            </div>
            <div className="grid grid-cols-2 py-2 border-b border-uber-gray-300">
              <span className="text-gray-400 font-medium">Capacity</span>
              <span className="font-bold text-uber-black text-right">{vehicle.capacity} Tons</span>
            </div>
            <div className="grid grid-cols-2 py-2 border-b border-uber-gray-300">
              <span className="text-gray-400 font-medium">Odometer</span>
              <span className="font-bold text-uber-black text-right">
                {vehicle.odometer.toLocaleString()} km
              </span>
            </div>
            <div className="grid grid-cols-2 py-2 border-b border-uber-gray-300">
              <span className="text-gray-400 font-medium">Region</span>
              <span className="font-bold text-uber-black text-right">{vehicle.region}</span>
            </div>
            <div className="grid grid-cols-2 py-2">
              <span className="text-gray-400 font-medium">Est. Fuel Efficiency</span>
              <span className="font-bold text-uber-blue text-right">{vehicle.fuel_efficiency} km/L</span>
            </div>
          </CardContent>
        </Card>

        {/* Operational History and Financial Summary */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          
          {/* Costs Rollup Stats Card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Card className="bg-gray-50">
              <span className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1.5"><Fuel size={12} /> Total Fuel Cost</span>
              <div className="text-2xl font-extrabold mt-1">${totalFuelCost.toFixed(2)}</div>
              <span className="text-[10px] text-gray-400 font-medium">{totalFuelLiters} Liters refueled</span>
            </Card>
            <Card className="bg-gray-50">
              <span className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1.5"><Wrench size={12} /> Maintenance Cost</span>
              <div className="text-2xl font-extrabold mt-1">${totalMaintenanceCost.toFixed(2)}</div>
              <span className="text-[10px] text-gray-400 font-medium">{vehicle.maintenance_records?.length || 0} repairs logged</span>
            </Card>
            <Card className="bg-uber-black text-uber-white">
              <span className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1.5">Combined Rollup Cost</span>
              <div className="text-2xl font-extrabold text-uber-green mt-1">${totalCostRollup.toFixed(2)}</div>
              <span className="text-[10px] text-gray-400 font-medium">Operations spending</span>
            </Card>
          </div>

          {/* Maintenance Records Section */}
          <Card>
            <CardHeader className="flex justify-between items-center">
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-gray-500 flex items-center gap-2">
                <Wrench size={16} /> Maintenance Log
              </h3>
            </CardHeader>
            <CardContent>
              {!vehicle.maintenance_records || vehicle.maintenance_records.length === 0 ? (
                <p className="text-xs text-gray-400 py-4 italic text-center">No maintenance logs recorded for this vehicle.</p>
              ) : (
                <div className="divide-y divide-uber-gray-300">
                  {vehicle.maintenance_records.map((rec, idx) => (
                    <div key={idx} className="py-3 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-uber-black">{rec.description}</p>
                        <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                          <Calendar size={12} /> {rec.date}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-uber-black">${rec.cost.toFixed(2)}</p>
                        <p className="mt-0.5"><Badge status={rec.status === 'Open' ? 'maintenance' : 'success'}>{rec.status}</Badge></p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Fuel History Section */}
          <Card>
            <CardHeader>
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-gray-500 flex items-center gap-2">
                <Fuel size={16} /> Refueling History
              </h3>
            </CardHeader>
            <CardContent>
              {!vehicle.fuel_logs || vehicle.fuel_logs.length === 0 ? (
                <p className="text-xs text-gray-400 py-4 italic text-center">No refuel logs recorded for this vehicle.</p>
              ) : (
                <div className="divide-y divide-uber-gray-300">
                  {vehicle.fuel_logs.map((log, idx) => (
                    <div key={idx} className="py-3 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-uber-black">{log.liters} Liters</p>
                        <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                          <Calendar size={12} /> {log.date}
                        </p>
                      </div>
                      <p className="font-bold text-uber-black">${log.cost.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Edit Form Modal */}
      <VehicleForm
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        vehicleId={id}
      />
    </div>
  );
};

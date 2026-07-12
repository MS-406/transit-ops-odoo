import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tripsApi } from '../../api/trips';
import { vehiclesApi } from '../../api/vehicles';
import { driversApi } from '../../api/drivers';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { TripForm } from './TripForm';
import { useAuthStore } from '../../store/authStore';
import { useForm } from 'react-hook-form';
import {
  Plus,
  Play,
  CheckCircle,
  XCircle,
  Loader2,
  Navigation,
  Scale,
  Calendar,
  AlertTriangle,
  User,
  Truck
} from 'lucide-react';
import toast from 'react-hot-toast';

// Separate complete trip form modal
const CompleteTripModal = ({ isOpen, onClose, trip, vehicle, onSubmit, isSaving }) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      final_odometer: '',
      fuel_consumed: ''
    }
  });

  React.useEffect(() => {
    if (isOpen && vehicle) {
      // Suggest odometer based on previous + a planned distance estimate or empty for entry
      reset({
        final_odometer: vehicle.odometer + (trip?.planned_distance || 0),
        fuel_consumed: ''
      });
    }
  }, [isOpen, vehicle, trip, reset]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Complete Trip & Log Metrics" size="sm">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 text-left">
        <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 text-xs text-gray-500 mb-2">
          <strong>Odometer Reference:</strong> Current odometer of vehicle {vehicle?.registration_number} is <strong>{vehicle?.odometer.toLocaleString()} km</strong>.
        </div>

        <Input
          label="Final Odometer Reading (km)"
          type="number"
          error={errors.final_odometer?.message}
          disabled={isSaving}
          {...register('final_odometer', {
            required: 'Final odometer is required',
            validate: val => parseInt(val, 10) >= (vehicle?.odometer || 0) || 'Cannot be less than current odometer'
          })}
        />

        <Input
          label="Fuel Consumed (Liters)"
          type="number"
          step="0.1"
          placeholder="e.g. 85.5"
          error={errors.fuel_consumed?.message}
          disabled={isSaving}
          {...register('fuel_consumed', {
            required: 'Fuel consumed is required',
            min: { value: 0.1, message: 'Fuel consumed must be greater than 0' }
          })}
        />

        <div className="flex items-center justify-end gap-3 border-t border-uber-gray-300 pt-4 mt-2">
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSaving} className="flex items-center gap-2">
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : null}
            <span>Complete Trip</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export const TripBoard = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCompleteOpen, setIsCompleteOpen] = useState(false);
  const [activeTrip, setActiveTrip] = useState(null);

  // Check roles
  const isDriver = user?.role === 'Driver';
  const isReadOnly = user?.role === 'Financial Analyst';
  const isAuthorized = user?.role === 'Fleet Manager' || user?.role === 'Safety Officer' || user?.role === 'Driver' || user?.role === 'Admin';

  // Query Trips, Vehicles, and Drivers pools
  const { data: trips, isLoading: isTripsLoading } = useQuery({
    queryKey: ['trips'],
    queryFn: () => tripsApi.getTrips(),
    select: (res) => res.data
  });

  const { data: vehicles } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => vehiclesApi.getVehicles(),
    select: (res) => res.data
  });

  const { data: drivers } = useQuery({
    queryKey: ['drivers'],
    queryFn: () => driversApi.getDrivers(),
    select: (res) => res.data
  });

  // Mutate: Dispatch
  const dispatchMutation = useMutation({
    mutationFn: tripsApi.dispatchTrip,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
      toast.success('Trip successfully dispatched!');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to dispatch trip.');
    }
  });

  // Mutate: Cancel
  const cancelMutation = useMutation({
    mutationFn: tripsApi.cancelTrip,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
      toast.success('Trip cancelled.');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to cancel trip.');
    }
  });

  // Mutate: Complete
  const completeMutation = useMutation({
    mutationFn: ({ id, data }) => tripsApi.completeTrip(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['fuel-logs'] });
      toast.success('Trip completed! Fuel expenses auto-logged. Add any additional tolls or fees here.');
      setIsCompleteOpen(false);
      navigate('/fuel-expenses', { state: { recentTrip: activeTrip } });
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Failed to complete trip.');
    }
  });

  const handleCompleteSubmit = (data) => {
    completeMutation.mutate({
      id: activeTrip.id,
      data: {
        final_odometer: parseInt(data.final_odometer, 10),
        fuel_consumed: parseFloat(data.fuel_consumed)
      }
    });
  };

  if (isTripsLoading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Loader2 className="animate-spin text-uber-black" size={32} />
      </div>
    );
  }

  // Group trips by status
  const columns = {
    Draft: (trips || []).filter(t => t.status === 'Draft'),
    Dispatched: (trips || []).filter(t => t.status === 'Dispatched'),
    Completed: (trips || []).filter(t => t.status === 'Completed'),
    Cancelled: (trips || []).filter(t => t.status === 'Cancelled')
  };

  const getVehicleReg = (vId) => {
    const v = (vehicles || []).find(veh => veh.id === vId);
    return v ? v.registration_number : 'Unknown Vehicle';
  };

  const getDriverName = (dId) => {
    const d = (drivers || []).find(drv => drv.id === dId);
    return d ? d.name : 'Unknown Driver';
  };

  const getVehicleObj = (vId) => {
    return (vehicles || []).find(veh => veh.id === vId);
  };

  return (
    <div className="text-left animate-fade-in">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-xs uppercase font-extrabold tracking-widest text-gray-500">
            Dispatch Board / Controls
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight mt-1 text-uber-black uppercase">
            Trip Board
          </h2>
        </div>

        {isAuthorized && !isDriver && !isReadOnly && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus size={16} /> Dispatch New Trip
          </Button>
        )}
      </div>

      {/* Board Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 select-none">
        
        {Object.entries(columns).map(([colName, colTrips]) => (
          <div key={colName} className="bg-gray-50 border border-uber-gray-300 rounded-2xl p-4 flex flex-col gap-4 min-h-[500px]">
            
            {/* Column Header */}
            <div className="flex items-center justify-between pb-2 border-b border-uber-gray-300">
              <span className="text-xs uppercase tracking-wider font-black text-gray-500">{colName}s</span>
              <Badge status={colName}>{colTrips.length}</Badge>
            </div>

            {/* Column Cards */}
            <div className="flex flex-col gap-4 overflow-y-auto max-h-[80vh]">
              {colTrips.length === 0 ? (
                <div className="py-8 text-center text-gray-400 italic text-xs">No trips in {colName}</div>
              ) : (
                colTrips.map((trip) => (
                  <Card key={trip.id} className="p-4 flex flex-col gap-3 hover:border-uber-black/20 transition-all duration-200">
                    
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase tracking-tight font-black text-uber-black">{trip.id}</span>
                      <Badge status={trip.status}>{trip.status}</Badge>
                    </div>

                    {/* Route */}
                    <div className="text-xs leading-relaxed">
                      <div className="flex items-center gap-1.5 font-bold text-uber-black">
                        <Navigation size={12} className="text-uber-blue" />
                        <span>{trip.source}</span>
                      </div>
                      <div className="text-[10px] text-gray-400 pl-4 py-0.5">&darr; in transit to</div>
                      <div className="flex items-center gap-1.5 font-bold text-uber-black pl-4">
                        <span>{trip.destination}</span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-500 py-1.5 border-y border-uber-gray-300">
                      <div className="flex items-center gap-1">
                        <Scale size={10} />
                        <span>Cargo: <strong>{trip.cargo_weight} T</strong></span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar size={10} />
                        <span>Dist: <strong>{trip.planned_distance} km</strong></span>
                      </div>
                    </div>

                    {/* Allocations */}
                    <div className="text-[10px] text-gray-600 flex flex-col gap-1">
                      <div className="flex items-center gap-1.5">
                        <Truck size={10} className="text-gray-400" />
                        <span className="truncate">Vehicle: <strong>{getVehicleReg(trip.vehicle_id)}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <User size={10} className="text-gray-400" />
                        <span className="truncate">Driver: <strong>{getDriverName(trip.driver_id)}</strong></span>
                      </div>
                    </div>

                    {/* Buttons: Transitions */}
                    {isAuthorized && !isReadOnly && (
                      <div className="flex gap-2 mt-1">
                        {trip.status === 'Draft' && (
                          <>
                            {!isDriver && (
                              <Button
                                variant="primary"
                                size="sm"
                                className="flex-1 py-1 text-[10px] flex items-center justify-center gap-1"
                                onClick={() => dispatchMutation.mutate(trip.id)}
                                disabled={dispatchMutation.isPending}
                              >
                                <Play size={10} /> Dispatch
                              </Button>
                            )}
                            <Button
                              variant="danger"
                              size="sm"
                              className={`py-1 text-[10px] flex items-center justify-center gap-1 ${isDriver ? 'w-full' : 'px-3'}`}
                              onClick={() => cancelMutation.mutate(trip.id)}
                              disabled={cancelMutation.isPending}
                            >
                              <XCircle size={12} /> {isDriver ? 'Reject Dispatch' : ''}
                            </Button>
                          </>
                        )}
                        
                        {trip.status === 'Dispatched' && (
                          <>
                            <Button
                              variant="success"
                              size="sm"
                              className="flex-1 py-1 text-[10px] flex items-center justify-center gap-1"
                              onClick={() => {
                                setActiveTrip(trip);
                                setIsCompleteOpen(true);
                              }}
                            >
                              <CheckCircle size={10} /> Complete
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              className="py-1 px-3 text-[10px] flex items-center justify-center gap-1"
                              onClick={() => cancelMutation.mutate(trip.id)}
                              disabled={cancelMutation.isPending}
                              title="Cancel / Reject Trip"
                            >
                              <XCircle size={12} /> {isDriver ? 'Reject' : ''}
                            </Button>
                          </>
                        )}
                      </div>
                    )}

                  </Card>
                ))
              )}
            </div>

          </div>
        ))}

      </div>

      {/* Dispatch Modal form */}
      <TripForm isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />

      {/* Complete trip values prompts */}
      <CompleteTripModal
        isOpen={isCompleteOpen}
        onClose={() => setIsCompleteOpen(false)}
        trip={activeTrip}
        vehicle={activeTrip ? getVehicleObj(activeTrip.vehicle_id) : null}
        onSubmit={handleCompleteSubmit}
        isSaving={completeMutation.isPending}
      />

    </div>
  );
};

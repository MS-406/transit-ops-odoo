import React, { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tripsApi } from '../../api/trips';
import { vehiclesApi } from '../../api/vehicles';
import { driversApi } from '../../api/drivers';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { parseISO, differenceInDays } from 'date-fns';
import { Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export const TripForm = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors }
  } = useForm({
    defaultValues: {
      source: '',
      destination: '',
      vehicle_id: '',
      driver_id: '',
      cargo_weight: '',
      planned_distance: ''
    }
  });

  // Query Vehicles and Drivers pools
  const { data: vehicles, isLoading: isVehiclesLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => vehiclesApi.getVehicles(),
    select: (res) => res.data
  });

  const { data: drivers, isLoading: isDriversLoading } = useQuery({
    queryKey: ['drivers'],
    queryFn: () => driversApi.getDrivers(),
    select: (res) => res.data
  });

  // Filter lists according to operational compliance rules
  const availableVehicles = (vehicles || []).filter(v => v.status === 'Available');

  const today = parseISO('2026-07-12');
  const availableDrivers = (drivers || []).filter(d => {
    if (d.status !== 'Available') return false;
    // Enforce license validity check (exclude expired licenses)
    const expiry = parseISO(d.license_expiry);
    return differenceInDays(expiry, today) >= 0;
  });

  // Watch selected vehicle and cargo weight for client-side pre-checks
  const selectedVehicleId = useWatch({ control, name: 'vehicle_id' });
  const cargoWeightVal = useWatch({ control, name: 'cargo_weight' });

  const selectedVehicle = availableVehicles.find(v => v.id === selectedVehicleId);
  const capacityOverload =
    selectedVehicle && cargoWeightVal && parseFloat(cargoWeightVal) > selectedVehicle.capacity;

  useEffect(() => {
    if (isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  // Create Trip mutation
  const createMutation = useMutation({
    mutationFn: tripsApi.createTrip,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      toast.success('Trip draft created successfully!');
      onClose();
    },
    onError: (err) => {
      const errMsg = err.response?.data?.detail || 'Failed to dispatch trip.';
      toast.error(errMsg);
    }
  });

  const onSubmit = (data) => {
    if (capacityOverload) {
      toast.error(`Cannot dispatch: Cargo weight exceeds vehicle limit of ${selectedVehicle.capacity} Tons.`);
      return;
    }

    createMutation.mutate({
      ...data,
      cargo_weight: parseFloat(data.cargo_weight),
      planned_distance: parseInt(data.planned_distance, 10)
    });
  };

  const isSaving = createMutation.isPending;
  const isLoadingData = isVehiclesLoading || isDriversLoading;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Dispatch Trip"
      size="md"
    >
      {isLoadingData ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-uber-black" size={24} />
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 text-left">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Source Hub"
              placeholder="e.g. Nairobi Depot"
              error={errors.source?.message}
              disabled={isSaving}
              {...register('source', { required: 'Source hub is required' })}
            />

            <Input
              label="Destination Hub"
              placeholder="e.g. Mombasa Port"
              error={errors.destination?.message}
              disabled={isSaving}
              {...register('destination', { required: 'Destination hub is required' })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Assign Vehicle"
              placeholder="Select available vehicle..."
              error={errors.vehicle_id?.message}
              disabled={isSaving}
              {...register('vehicle_id', { required: 'Vehicle assignment is required' })}
            >
              <option value="">Select available vehicle...</option>
              {availableVehicles.map(v => (
                <option key={v.id} value={v.id}>
                  {v.registration_number} — {v.model} ({v.capacity} Tons capacity)
                </option>
              ))}
            </Select>

            <Select
              label="Assign Driver"
              placeholder="Select available driver..."
              error={errors.driver_id?.message}
              disabled={isSaving}
              {...register('driver_id', { required: 'Driver assignment is required' })}
            >
              <option value="">Select available driver...</option>
              {availableDrivers.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name} — {d.license_class} (Rating: {d.safety_score})
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Cargo Weight (Tons)"
              type="number"
              step="0.1"
              placeholder="e.g. 12.5"
              error={errors.cargo_weight?.message}
              disabled={isSaving}
              {...register('cargo_weight', {
                required: 'Cargo weight is required',
                min: { value: 0.1, message: 'Weight must be greater than 0' }
              })}
            />

            <Input
              label="Planned Distance (km)"
              type="number"
              placeholder="e.g. 480"
              error={errors.planned_distance?.message}
              disabled={isSaving}
              {...register('planned_distance', {
                required: 'Planned distance is required',
                min: { value: 1, message: 'Distance must be positive' }
              })}
            />
          </div>

          {/* Inline Capacity Warning Check */}
          {capacityOverload && (
            <div className="p-3 bg-red-50 border border-uber-red/20 rounded-xl flex items-center gap-2 text-uber-red text-xs font-semibold">
              <AlertCircle size={16} />
              <span>
                Overload Warning: Cargo weight exceeds vehicle limit of {selectedVehicle.capacity} Tons.
              </span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 border-t border-uber-gray-300 pt-4 mt-2">
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSaving || capacityOverload}
              className="flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Creating Draft...</span>
                </>
              ) : (
                <span>Save Draft</span>
              )}
            </Button>
          </div>

        </form>
      )}
    </Modal>
  );
};

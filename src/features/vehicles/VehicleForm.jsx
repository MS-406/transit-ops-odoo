import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vehiclesApi } from '../../api/vehicles';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const VehicleForm = ({ isOpen, onClose, vehicleId }) => {
  const queryClient = useQueryClient();
  const isEditMode = !!vehicleId;

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors }
  } = useForm({
    defaultValues: {
      registration_number: '',
      model: '',
      type: 'Box Body',
      capacity: '',
      odometer: '',
      region: '',
      status: 'Available'
    }
  });

  // Query vehicle details if in edit mode
  const { data: vehicleData, isLoading: isFetching } = useQuery({
    queryKey: ['vehicle', vehicleId],
    queryFn: () => vehiclesApi.getVehicle(vehicleId),
    enabled: isOpen && isEditMode,
    select: (res) => res.data
  });

  // Pre-fill form when data is loaded
  useEffect(() => {
    if (vehicleData && isEditMode) {
      reset({
        registration_number: vehicleData.registration_number,
        model: vehicleData.model,
        type: vehicleData.type,
        capacity: vehicleData.capacity,
        odometer: vehicleData.odometer,
        region: vehicleData.region,
        status: vehicleData.status
      });
    } else if (!isEditMode) {
      reset({
        registration_number: '',
        model: '',
        type: 'Box Body',
        capacity: '',
        odometer: '',
        region: '',
        status: 'Available'
      });
    }
  }, [vehicleData, isEditMode, reset, isOpen]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: vehiclesApi.createVehicle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Vehicle registered successfully!');
      onClose();
    },
    onError: (err) => {
      const errMsg = err.response?.data?.detail || 'Failed to register vehicle.';
      if (errMsg.toLowerCase().includes('registration number')) {
        setError('registration_number', { type: 'manual', message: errMsg });
      } else {
        toast.error(errMsg);
      }
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => vehiclesApi.updateVehicle(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle', vehicleId] });
      toast.success('Vehicle updated successfully!');
      onClose();
    },
    onError: (err) => {
      const errMsg = err.response?.data?.detail || 'Failed to update vehicle.';
      if (errMsg.toLowerCase().includes('registration number')) {
        setError('registration_number', { type: 'manual', message: errMsg });
      } else {
        toast.error(errMsg);
      }
    }
  });

  const onSubmit = (data) => {
    const payload = {
      ...data,
      capacity: parseFloat(data.capacity),
      odometer: parseInt(data.odometer, 10),
    };

    if (isEditMode) {
      updateMutation.mutate({ id: vehicleId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isLoadingState = isFetching && isEditMode;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit Vehicle Info' : 'Register New Vehicle'}
      size="md"
    >
      {isLoadingState ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-uber-black" size={24} />
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 text-left">
          
          <Input
            label="Registration Number (Plate)"
            placeholder="e.g. KCB 123A"
            error={errors.registration_number?.message}
            disabled={isSaving}
            {...register('registration_number', {
              required: 'Registration number is required',
              pattern: {
                value: /^[A-Z0-9\s-]+$/i,
                message: 'Invalid characters in registration plate'
              }
            })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Model Name"
              placeholder="e.g. Scania R450"
              error={errors.model?.message}
              disabled={isSaving}
              {...register('model', { required: 'Model is required' })}
            />

            <Select
              label="Vehicle Type"
              error={errors.type?.message}
              disabled={isSaving}
              options={[
                { value: 'Bus', label: 'Bus' },
                { value: 'Truck', label: 'Truck' },
                { value: 'Mini Bus', label: 'Mini Bus' },
                { value: 'LCV', label: 'LCV' }
              ]}
              {...register('type', { required: 'Type is required' })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Cargo Capacity (Tons)"
              type="number"
              step="0.1"
              placeholder="e.g. 25"
              error={errors.capacity?.message}
              disabled={isSaving}
              {...register('capacity', {
                required: 'Capacity is required',
                min: { value: 0.1, message: 'Capacity must be greater than 0' }
              })}
            />

            <Input
              label="Current Odometer (km)"
              type="number"
              placeholder="e.g. 142500"
              error={errors.odometer?.message}
              disabled={isSaving}
              {...register('odometer', {
                required: 'Odometer is required',
                min: { value: 0, message: 'Odometer cannot be negative' }
              })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Operations Region"
              placeholder="e.g. Mombasa Port"
              error={errors.region?.message}
              disabled={isSaving}
              {...register('region', { required: 'Region is required' })}
            />

            <Select
              label="Fleet Status"
              error={errors.status?.message}
              disabled={isSaving}
              options={[
                { value: 'Available', label: 'Available (Active Duty)' },
                { value: 'On Trip', label: 'On Trip (Dispatched)' },
                { value: 'In Shop', label: 'In Shop (Maintenance)' },
                { value: 'Retired', label: 'Retired (Out of Service)' }
              ]}
              {...register('status', { required: 'Status is required' })}
            />
          </div>

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
              disabled={isSaving}
              className="flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Vehicle</span>
              )}
            </Button>
          </div>

        </form>
      )}
    </Modal>
  );
};

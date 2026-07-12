import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { maintenanceApi } from '../../api/maintenance';
import { vehiclesApi } from '../../api/vehicles';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const MaintenanceForm = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: {
      vehicle_id: '',
      description: '',
      cost: '',
      date: new Date().toISOString().split('T')[0]
    }
  });

  // Query Vehicles
  const { data: vehicles, isLoading: isVehiclesLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => vehiclesApi.getVehicles(),
    select: (res) => res.data
  });

  // Filter vehicles: Exclude Retired, allow Available / On Trip
  const assignableVehicles = (vehicles || []).filter(v => v.status !== 'Retired');

  useEffect(() => {
    if (isOpen) {
      reset({
        vehicle_id: '',
        description: '',
        cost: '',
        date: new Date().toISOString().split('T')[0]
      });
    }
  }, [isOpen, reset]);

  // Create Maintenance Log mutation
  const createMutation = useMutation({
    mutationFn: maintenanceApi.createMaintenanceLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-logs'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Vehicle sent to shop. Status updated to In Shop.');
      onClose();
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to open maintenance ticket.');
    }
  });

  const onSubmit = (data) => {
    createMutation.mutate({
      ...data,
      cost: parseFloat(data.cost)
    });
  };

  const isSaving = createMutation.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Open Maintenance Ticket"
      size="md"
    >
      {isVehiclesLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-uber-black" size={24} />
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 text-left">
          
          <Select
            label="Select Vehicle"
            placeholder="Choose vehicle for service..."
            error={errors.vehicle_id?.message}
            disabled={isSaving}
            {...register('vehicle_id', { required: 'Vehicle selection is required' })}
          >
            <option value="">Choose vehicle for service...</option>
            {assignableVehicles.map(v => (
              <option key={v.id} value={v.id}>
                {v.registration_number} — {v.model} ({v.status})
              </option>
            ))}
          </Select>

          <Input
            label="Service Issue Description"
            placeholder="e.g. Front brake pads renewal, engine oil leakage inspection"
            error={errors.description?.message}
            disabled={isSaving}
            {...register('description', { required: 'Service description is required' })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Estimated Cost ($)"
              type="number"
              step="0.01"
              placeholder="e.g. 350.00"
              error={errors.cost?.message}
              disabled={isSaving}
              {...register('cost', {
                required: 'Cost estimate is required',
                min: { value: 0.01, message: 'Cost estimate must be greater than 0' }
              })}
            />

            <Input
              label="Entry Date"
              type="date"
              error={errors.date?.message}
              disabled={isSaving}
              {...register('date', { required: 'Entry date is required' })}
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
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Submit Ticket</span>
              )}
            </Button>
          </div>

        </form>
      )}
    </Modal>
  );
};

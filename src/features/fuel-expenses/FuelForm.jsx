import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expensesApi } from '../../api/expenses';
import { vehiclesApi } from '../../api/vehicles';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Loader2 } from 'lucide-react';
import { parseISO, isAfter } from 'date-fns';
import toast from 'react-hot-toast';

export const FuelForm = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const maxDate = '2026-07-12'; // Server context current date reference

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: {
      vehicle_id: '',
      liters: '',
      cost: '',
      date: maxDate
    }
  });

  // Query Vehicles list
  const { data: vehicles, isLoading: isVehiclesLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => vehiclesApi.getVehicles(),
    select: (res) => res.data
  });

  // Select active/non-retired vehicles
  const assignableVehicles = (vehicles || []).filter(v => v.status !== 'Retired');

  useEffect(() => {
    if (isOpen) {
      reset({
        vehicle_id: '',
        liters: '',
        cost: '',
        date: maxDate
      });
    }
  }, [isOpen, reset]);

  // Create Fuel Log mutation
  const createMutation = useMutation({
    mutationFn: expensesApi.createFuelLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel-logs'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Fuel log recorded successfully!');
      onClose();
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to record fuel log.');
    }
  });

  const onSubmit = (data) => {
    createMutation.mutate({
      vehicle_id: parseInt(data.vehicle_id, 10),
      liters: parseFloat(data.liters),
      cost: parseFloat(data.cost),
      log_date: data.date
    });
  };

  const isSaving = createMutation.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Fuel Log"
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
            placeholder="Select refueled vehicle..."
            error={errors.vehicle_id?.message}
            disabled={isSaving}
            {...register('vehicle_id', { required: 'Vehicle selection is required' })}
          >
            <option value="">Select refueled vehicle...</option>
            {assignableVehicles.map(v => (
              <option key={v.id} value={v.id}>
                {v.registration_number} — {v.model}
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Fuel Volume (Liters)"
              type="number"
              step="0.01"
              placeholder="e.g. 150"
              error={errors.liters?.message}
              disabled={isSaving}
              {...register('liters', {
                required: 'Fuel volume is required',
                min: { value: 0.1, message: 'Liters must be greater than 0' }
              })}
            />

            <Input
              label="Total Cost ($)"
              type="number"
              step="0.01"
              placeholder="e.g. 225.00"
              error={errors.cost?.message}
              disabled={isSaving}
              {...register('cost', {
                required: 'Total cost is required',
                min: { value: 0.01, message: 'Cost must be greater than 0' }
              })}
            />
          </div>

          <Input
            label="Transaction Date"
            type="date"
            max={maxDate}
            error={errors.date?.message}
            disabled={isSaving}
            {...register('date', {
              required: 'Transaction date is required',
              validate: val => !isAfter(parseISO(val), parseISO(maxDate)) || 'Future dates are prohibited'
            })}
          />

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
                <span>Log Refueling</span>
              )}
            </Button>
          </div>

        </form>
      )}
    </Modal>
  );
};

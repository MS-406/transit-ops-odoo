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

export const ExpenseForm = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const maxDate = '2026-07-12';

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: {
      category: 'Tolls',
      description: '',
      cost: '',
      date: maxDate,
      vehicle_id: ''
    }
  });

  // Query Vehicles
  const { data: vehicles, isLoading: isVehiclesLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => vehiclesApi.getVehicles(),
    select: (res) => res.data
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        category: 'Tolls',
        description: '',
        cost: '',
        date: maxDate,
        vehicle_id: ''
      });
    }
  }, [isOpen, reset]);

  // Create Expense mutation
  const createMutation = useMutation({
    mutationFn: expensesApi.createExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Expense logged successfully!');
      onClose();
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to log expense.');
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
      title="Log General Expense"
      size="md"
    >
      {isVehiclesLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-uber-black" size={24} />
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 text-left">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Expense Category"
              error={errors.category?.message}
              disabled={isSaving}
              options={[
                { value: 'Tolls', label: 'Tolls (Expressways/Transit)' },
                { value: 'Maintenance', label: 'Maintenance (Ad-hoc repairs)' },
                { value: 'Miscellaneous', label: 'Miscellaneous (Administrative)' }
              ]}
              {...register('category', { required: 'Expense category is required' })}
            />

            <Select
              label="Associated Vehicle (Optional)"
              placeholder="Select associated vehicle..."
              error={errors.vehicle_id?.message}
              disabled={isSaving}
              {...register('vehicle_id')}
            >
              <option value="">None (Generic Expense)</option>
              {(vehicles || []).map(v => (
                <option key={v.id} value={v.id}>
                  {v.registration_number} — {v.model}
                </option>
              ))}
            </Select>
          </div>

          <Input
            label="Expense Description"
            placeholder="e.g. Highway Expressway Toll fees"
            error={errors.description?.message}
            disabled={isSaving}
            {...register('description', { required: 'Expense description is required' })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Transaction Cost ($)"
              type="number"
              step="0.01"
              placeholder="e.g. 15.00"
              error={errors.cost?.message}
              disabled={isSaving}
              {...register('cost', {
                required: 'Transaction cost is required',
                min: { value: 0.01, message: 'Cost must be greater than 0' }
              })}
            />

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
                <span>Log Expense</span>
              )}
            </Button>
          </div>

        </form>
      )}
    </Modal>
  );
};

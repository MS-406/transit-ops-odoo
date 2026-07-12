import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { driversApi } from '../../api/drivers';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const DriverForm = ({ isOpen, onClose, driverId }) => {
  const queryClient = useQueryClient();
  const isEditMode = !!driverId;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: {
      name: '',
      license_class: '',
      license_expiry: '',
      status: 'Available',
      safety_score: 90 // Default value, shown read-only in UI
    }
  });

  // Query details if editing
  const { data: driverData, isLoading: isFetching } = useQuery({
    queryKey: ['driver', driverId],
    queryFn: () => driversApi.getDriver(driverId),
    enabled: isOpen && isEditMode,
    select: (res) => res.data
  });

  // Pre-fill form
  useEffect(() => {
    if (driverData && isEditMode) {
      reset({
        name: driverData.name,
        license_class: driverData.license_class,
        license_expiry: driverData.license_expiry,
        status: driverData.status,
        safety_score: driverData.safety_score
      });
    } else if (!isEditMode) {
      reset({
        name: '',
        license_class: '',
        license_expiry: '',
        status: 'Available',
        safety_score: 90
      });
    }
  }, [driverData, isEditMode, reset, isOpen]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: driversApi.createDriver,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success('Driver profile registered successfully.');
      onClose();
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to create driver.');
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => driversApi.updateDriver(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['driver', driverId] });
      toast.success('Driver profile updated successfully.');
      onClose();
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to update driver.');
    }
  });

  const onSubmit = (data) => {
    // safety_score is read-only, ensure we don't try to send a modified client value or let them alter it
    const payload = {
      name: data.name,
      license_class: data.license_class,
      license_expiry: data.license_expiry,
      status: data.status
    };

    if (isEditMode) {
      // Retain original safety score computed by backend
      payload.safety_score = driverData?.safety_score;
      updateMutation.mutate({ id: driverId, data: payload });
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
      title={isEditMode ? 'Edit Driver Profile' : 'Register New Driver'}
      size="md"
    >
      {isLoadingState ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-uber-black" size={24} />
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 text-left">
          
          <Input
            label="Driver Full Name"
            placeholder="e.g. John Doe"
            error={errors.name?.message}
            disabled={isSaving}
            {...register('name', { required: 'Driver name is required' })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="License Class (Categories)"
              placeholder="e.g. Class A, CE"
              error={errors.license_class?.message}
              disabled={isSaving}
              {...register('license_class', { required: 'License category is required' })}
            />

            <Input
              label="License Expiry Date"
              type="date"
              error={errors.license_expiry?.message}
              disabled={isSaving}
              {...register('license_expiry', { required: 'License expiry date is required' })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Duty Status"
              error={errors.status?.message}
              disabled={isSaving}
              options={[
                { value: 'Available', label: 'Available (On Call)' },
                { value: 'On Trip', label: 'On Trip (Dispatched)' },
                { value: 'Suspended', label: 'Suspended (Out of Compliance)' }
              ]}
              {...register('status', { required: 'Status is required' })}
            />

            {/* Safety Score: Strictly read-only in UI */}
            <div>
              <Input
                label="Safety Score (Computed by Backend)"
                type="text"
                disabled={true}
                className="opacity-75"
                {...register('safety_score')}
              />
              <span className="text-[9px] text-gray-400 font-semibold mt-1 block">
                This score is auto-calculated based on vehicle telematics data.
              </span>
            </div>
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
                <span>Save Driver</span>
              )}
            </Button>
          </div>

        </form>
      )}
    </Modal>
  );
};

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { maintenanceApi } from '../../api/maintenance';
import { vehiclesApi } from '../../api/vehicles';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Select } from '../../components/ui/Select';
import { MaintenanceForm } from './MaintenanceForm';
import { useAuthStore } from '../../store/authStore';
import {
  Wrench,
  Plus,
  Loader2,
  Calendar,
  DollarSign,
  CheckCircle,
  FilterX
} from 'lucide-react';
import toast from 'react-hot-toast';

export const MaintenanceList = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Fleet Managers have write permissions
  const isManager = user?.role === 'Fleet Manager' || user?.role === 'Admin';

  // React Query: Fetch maintenance logs
  const { data: logs, isLoading, isError, error } = useQuery({
    queryKey: ['maintenance-logs', { vehicle_id: selectedVehicle }],
    queryFn: () => maintenanceApi.getMaintenanceLogs({ vehicle_id: selectedVehicle })
  });

  // React Query: Fetch vehicles for dropdown filter
  const { data: vehicles } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => vehiclesApi.getVehicles(),
    select: (res) => res.data
  });

  // Mutation: Close Ticket
  const closeMutation = useMutation({
    mutationFn: maintenanceApi.closeMaintenanceLog,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-logs'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Maintenance ticket closed. Vehicle returned to service.');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to close maintenance ticket.');
    }
  });

  const handleCloseTicket = (logId) => {
    if (window.confirm('Are you sure you want to close this ticket and return the vehicle to service?')) {
      closeMutation.mutate(logId);
    }
  };

  const clearFilters = () => {
    setSelectedVehicle('');
  };

  return (
    <div className="text-left animate-fade-in">
      
      {/* Page Title banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-xs uppercase font-extrabold tracking-widest text-gray-500">
            Operations / Maintenance
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight mt-1 text-uber-black uppercase">
            Maintenance Logs
          </h2>
        </div>

        {isManager && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus size={16} /> Open Ticket
          </Button>
        )}
      </div>

      {/* Filter panel */}
      <Card className="mb-8">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="w-full sm:w-64">
            <Select
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
              options={[
                { value: '', label: 'All Fleet Vehicles' },
                ...(vehicles || []).map(v => ({ value: v.id, label: v.registration_number }))
              ]}
            />
          </div>

          {selectedVehicle && (
            <button
              onClick={clearFilters}
              className="text-xs uppercase font-extrabold tracking-wider text-uber-red hover:underline shrink-0 px-2 py-3 flex items-center gap-1.5"
            >
              <FilterX size={14} /> Clear
            </button>
          )}
        </div>
      </Card>

      {/* Logs Table */}
      {isLoading ? (
        <div className="flex justify-center items-center py-24">
          <Loader2 className="animate-spin text-uber-black" size={32} />
        </div>
      ) : isError ? (
        <Card className="border-uber-red/30 bg-red-50/50 p-6">
          <p className="text-sm font-semibold text-uber-red">
            Error loading maintenance history: {error.message || 'Server connection failed.'}
          </p>
        </Card>
      ) : !logs || logs.data.length === 0 ? (
        <Card className="py-16 text-center">
          <div className="max-w-md mx-auto flex flex-col items-center gap-4">
            <Wrench size={40} className="text-gray-300" />
            <h3 className="text-lg font-bold text-uber-black uppercase">No Tickets Registered</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              No maintenance work orders exist under this filter selection. Use "Open Ticket" to send a vehicle to the workshop.
            </p>
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-uber-gray-300 bg-gray-50 text-gray-400 uppercase tracking-wider font-extrabold select-none">
                  <th className="py-4 px-6">Vehicle Plate</th>
                  <th className="py-4 px-6">Service Details</th>
                  <th className="py-4 px-6"><Calendar size={14} className="inline mr-1" /> Reported Date</th>
                  <th className="py-4 px-6 text-right"><DollarSign size={14} className="inline mr-0.5" /> Est. Cost</th>
                  <th className="py-4 px-6 text-center">Status</th>
                  <th className="py-4 px-6 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-uber-gray-300">
                {logs.data.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-uber-gray-100/40 transition-colors duration-150"
                  >
                    <td 
                      onClick={() => navigate(`/vehicles/${log.vehicle_id}`)}
                      className="py-4 px-6 font-bold text-uber-black uppercase hover:underline cursor-pointer"
                    >
                      {log.vehicle_reg}
                      <span className="text-[10px] text-gray-400 font-medium block mt-0.5">{log.vehicle_model}</span>
                    </td>
                    <td className="py-4 px-6 font-semibold text-gray-700 max-w-xs truncate">
                      {log.description}
                    </td>
                    <td className="py-4 px-6 font-medium text-gray-500">
                      {log.date}
                    </td>
                    <td className="py-4 px-6 text-right font-bold text-gray-700">
                      ${log.cost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <Badge status={log.status === 'Open' ? 'maintenance' : 'success'}>
                        {log.status}
                      </Badge>
                    </td>
                    <td className="py-4 px-6 text-right">
                      {isManager && log.status === 'Open' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCloseTicket(log.id)}
                          disabled={closeMutation.isPending}
                          className="flex items-center gap-1.5 ml-auto border-gray-300 py-1 px-3 text-[10px]"
                        >
                          <CheckCircle size={10} /> Close Ticket
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Create Ticket Modal */}
      {isManager && (
        <MaintenanceForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
        />
      )}
    </div>
  );
};

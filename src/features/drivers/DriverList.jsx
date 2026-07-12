import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { driversApi } from '../../api/drivers';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { DriverForm } from './DriverForm';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import { parseISO, differenceInDays } from 'date-fns';
import {
  Search,
  Plus,
  Loader2,
  ChevronRight,
  AlertTriangle,
  Users,
  FilterX
} from 'lucide-react';

export const DriverList = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Safety Officers and Fleet Managers have write permissions
  const isAuthorized = currentUser?.role === 'Fleet Manager' || currentUser?.role === 'Safety Officer' || currentUser?.role === 'Admin';

  // React Query: Fetch drivers list
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['drivers', { search: searchTerm, status: statusFilter }],
    queryFn: () => driversApi.getDrivers({
      search: searchTerm,
      status: statusFilter
    }),
    select: (res) => res.data
  });

  const queryClient = useQueryClient();
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => driversApi.updateDriver(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success('Driver status updated');
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || err.message || 'Failed to update status');
    }
  });

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
  };

  // Date parsing reference date (2026-07-12)
  const today = parseISO('2026-07-12');

  const checkExpiryStatus = (expiryString) => {
    if (!expiryString) return { status: 'valid', label: '' };
    const expiryDate = parseISO(expiryString);
    const daysLeft = differenceInDays(expiryDate, today);

    if (daysLeft < 0) {
      return { status: 'expired', label: 'Expired' };
    }
    if (daysLeft <= 30) {
      return { status: 'warning', label: `${daysLeft} Days left` };
    }
    return { status: 'valid', label: 'Valid' };
  };

  return (
    <div className="text-left animate-fade-in">
      
      {/* Page Title Header banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-xs uppercase font-extrabold tracking-widest text-gray-500">
            Registry / Drivers
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight mt-1 text-uber-black uppercase">
            Driver Management
          </h2>
        </div>

        {isAuthorized && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus size={16} /> Add Driver
          </Button>
        )}
      </div>

      {/* Filter Options */}
      <Card className="mb-8">
        <div className="flex flex-col lg:flex-row items-center gap-4">
          
          <div className="w-full lg:flex-1">
            <Input
              placeholder="Search by name, license class..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="w-full lg:w-48">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'Available', label: 'Available' },
                { value: 'On Trip', label: 'On Trip' },
                { value: 'Suspended', label: 'Suspended' }
              ]}
            />
          </div>

          {(searchTerm || statusFilter) && (
            <button
              onClick={clearFilters}
              className="text-xs uppercase font-extrabold tracking-wider text-uber-red hover:underline shrink-0 px-2 py-3 flex items-center gap-1.5"
            >
              <FilterX size={14} /> Clear
            </button>
          )}
        </div>
      </Card>

      {/* Driver List Display */}
      {isLoading ? (
        <div className="flex justify-center items-center py-24">
          <Loader2 className="animate-spin text-uber-black" size={32} />
        </div>
      ) : isError ? (
        <Card className="border-uber-red/30 bg-red-50/50 p-6">
          <p className="text-sm font-semibold text-uber-red">
            Error loading driver records: {error.message || 'Server connection failed.'}
          </p>
        </Card>
      ) : !data || data.length === 0 ? (
        <Card className="py-16 text-center">
          <div className="max-w-md mx-auto flex flex-col items-center gap-4">
            <Users size={40} className="text-gray-300" />
            <h3 className="text-lg font-bold text-uber-black uppercase">No Drivers Found</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              No driver files matched your query. Adjust filters or register a new driver profile.
            </p>
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-uber-gray-300 bg-gray-50 text-gray-400 uppercase tracking-wider font-extrabold select-none">
                  <th className="py-4 px-6">Driver Name</th>
                  <th className="py-4 px-6">License Category</th>
                  <th className="py-4 px-6">Safety Rating</th>
                  <th className="py-4 px-6">License Expiry status</th>
                  <th className="py-4 px-6 text-right">Status</th>
                  <th className="py-4 px-6"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-uber-gray-300">
                {data.map((driver) => {
                  const expInfo = checkExpiryStatus(driver.license_expiry);
                  return (
                    <tr
                      key={driver.id}
                      onClick={() => navigate(`/drivers/${driver.id}`)}
                      className="hover:bg-uber-gray-100/40 cursor-pointer transition-colors duration-150 group"
                    >
                      <td className="py-4 px-6 font-bold text-uber-black">
                        {driver.name}
                      </td>
                      <td className="py-4 px-6 font-semibold text-gray-600">
                        {driver.license_class}
                      </td>
                      <td className="py-4 px-6 font-bold text-gray-700">
                        <span className={`inline-flex items-center gap-1
                          ${driver.safety_score >= 90 ? 'text-uber-green' : ''}
                          ${driver.safety_score < 80 ? 'text-uber-red' : 'text-gray-700'}
                        `}>
                          {driver.safety_score} / 100
                        </span>
                      </td>
                      <td className="py-4 px-6 font-semibold">
                        {expInfo.status === 'expired' && (
                          <span className="text-uber-red flex items-center gap-1.5 select-none">
                            <AlertTriangle size={14} /> Expired ({driver.license_expiry})
                          </span>
                        )}
                        {expInfo.status === 'warning' && (
                          <span className="text-uber-amber flex items-center gap-1.5 select-none">
                            <AlertTriangle size={14} /> {expInfo.label} ({driver.license_expiry})
                          </span>
                        )}
                        {expInfo.status === 'valid' && (
                          <span className="text-uber-green select-none">
                            Valid ({driver.license_expiry})
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        {isAuthorized ? (
                          <div className="inline-block relative">
                            <select
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => {
                                e.stopPropagation();
                                updateStatusMutation.mutate({ id: driver.id, status: e.target.value });
                              }}
                              value={driver.status}
                              disabled={updateStatusMutation.isPending && updateStatusMutation.variables?.id === driver.id}
                              className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-md border appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-uber-black transition-colors ${
                                driver.status === 'Available' ? 'bg-green-50 text-uber-green border-green-200 hover:bg-green-100' :
                                driver.status === 'On Trip' ? 'bg-blue-50 text-uber-blue border-blue-200 hover:bg-blue-100' :
                                'bg-red-50 text-uber-red border-red-200 hover:bg-red-100'
                              }`}
                            >
                              <option value="Available">Available</option>
                              <option value="On Trip">On Trip</option>
                              <option value="Suspended">Suspended</option>
                            </select>
                            {updateStatusMutation.isPending && updateStatusMutation.variables?.id === driver.id && (
                              <Loader2 size={12} className="animate-spin absolute -right-4 top-2 text-gray-400" />
                            )}
                          </div>
                        ) : (
                          <Badge status={driver.status}>{driver.status}</Badge>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right text-gray-400 group-hover:text-uber-black transition-colors">
                        <ChevronRight size={16} className="inline-block transform group-hover:translate-x-0.5 transition-transform" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Add Driver Modal */}
      {isAuthorized && (
        <DriverForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
        />
      )}
    </div>
  );
};

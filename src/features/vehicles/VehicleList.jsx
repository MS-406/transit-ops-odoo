import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { vehiclesApi } from '../../api/vehicles';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { VehicleForm } from './VehicleForm';
import { useAuthStore } from '../../store/authStore';
import {
  Search,
  Plus,
  Loader2,
  SlidersHorizontal,
  ChevronRight,
  FilterX
} from 'lucide-react';

export const VehicleList = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  // Search and Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Check write authorization
  const isManager = user?.role === 'Fleet Manager';

  // React Query: Fetch vehicles
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['vehicles', { search: searchTerm, status: statusFilter, type: typeFilter }],
    queryFn: () => vehiclesApi.getVehicles({
      search: searchTerm,
      status: statusFilter,
      type: typeFilter
    }),
    select: (res) => res.data
  });

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setTypeFilter('');
  };

  return (
    <div className="text-left animate-fade-in">
      
      {/* Page Header banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-xs uppercase font-extrabold tracking-widest text-gray-500">
            Registry / Vehicles
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight mt-1 text-uber-black uppercase">
            Vehicle Registry
          </h2>
        </div>
        
        {isManager && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus size={16} /> Add Vehicle
          </Button>
        )}
      </div>

      {/* Filter panel card */}
      <Card className="mb-8">
        <div className="flex flex-col lg:flex-row items-center gap-4">
          
          {/* Search field */}
          <div className="w-full lg:flex-1 relative">
            <Input
              placeholder="Search by plate, model, region..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Type Filter */}
          <div className="w-full lg:w-48">
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              options={[
                { value: '', label: 'All Types' },
                { value: 'Heavy Hauler', label: 'Heavy Hauler' },
                { value: 'Box Body', label: 'Box Body' },
                { value: 'Dry Van', label: 'Dry Van' },
                { value: 'Flatbed', label: 'Flatbed' }
              ]}
            />
          </div>

          {/* Status Filter */}
          <div className="w-full lg:w-48">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'Available', label: 'Available' },
                { value: 'On Trip', label: 'On Trip' },
                { value: 'In Shop', label: 'In Shop' },
                { value: 'Retired', label: 'Retired' }
              ]}
            />
          </div>

          {(searchTerm || statusFilter || typeFilter) && (
            <button
              onClick={clearFilters}
              className="text-xs uppercase font-extrabold tracking-wider text-uber-red hover:underline shrink-0 px-2 py-3 flex items-center gap-1.5"
            >
              <FilterX size={14} /> Clear
            </button>
          )}
        </div>
      </Card>

      {/* Grid List view */}
      {isLoading ? (
        <div className="flex justify-center items-center py-24">
          <Loader2 className="animate-spin text-uber-black" size={32} />
        </div>
      ) : isError ? (
        <Card className="border-uber-red/30 bg-red-50/50 p-6">
          <p className="text-sm font-semibold text-uber-red">
            Error loading vehicles: {error.message || 'Server connection failed.'}
          </p>
        </Card>
      ) : !data || data.length === 0 ? (
        <Card className="py-16 text-center">
          <div className="max-w-md mx-auto flex flex-col items-center gap-4">
            <SlidersHorizontal size={40} className="text-gray-300" />
            <h3 className="text-lg font-bold text-uber-black uppercase">No Vehicles Found</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              No vehicles matched your search filter query. Try modifying your search criteria or register a new vehicle profile.
            </p>
            {(searchTerm || statusFilter || typeFilter) && (
              <Button variant="secondary" size="sm" onClick={clearFilters}>
                Clear Filter Setup
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-uber-gray-300 bg-gray-50 text-gray-400 uppercase tracking-wider font-extrabold select-none">
                  <th className="py-4 px-6">Reg Plate</th>
                  <th className="py-4 px-6">Model</th>
                  <th className="py-4 px-6">Classification</th>
                  <th className="py-4 px-6">Current Location</th>
                  <th className="py-4 px-6 text-right">Odometer</th>
                  <th className="py-4 px-6 text-right">Status</th>
                  <th className="py-4 px-6"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-uber-gray-300">
                {data.map((vehicle) => (
                  <tr
                    key={vehicle.id}
                    onClick={() => navigate(`/vehicles/${vehicle.id}`)}
                    className="hover:bg-uber-gray-100/40 cursor-pointer transition-colors duration-150 group"
                  >
                    <td className="py-4 px-6 font-bold text-uber-black uppercase select-all">
                      {vehicle.registration_number}
                    </td>
                    <td className="py-4 px-6 font-semibold text-gray-700">
                      {vehicle.model}
                    </td>
                    <td className="py-4 px-6 text-gray-600">
                      {vehicle.type}
                    </td>
                    <td className="py-4 px-6 text-gray-500 font-medium">
                      {vehicle.region}
                    </td>
                    <td className="py-4 px-6 text-right font-semibold text-gray-700">
                      {vehicle.odometer.toLocaleString()} km
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Badge status={vehicle.status}>{vehicle.status}</Badge>
                    </td>
                    <td className="py-4 px-6 text-right text-gray-400 group-hover:text-uber-black transition-colors">
                      <ChevronRight size={16} className="inline-block transform group-hover:translate-x-0.5 transition-transform" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Add Vehicle Modal Form */}
      {isManager && (
        <VehicleForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
        />
      )}
    </div>
  );
};

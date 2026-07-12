import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { expensesApi } from '../../api/expenses';
import { vehiclesApi } from '../../api/vehicles';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import { FuelForm } from './FuelForm';
import { ExpenseForm } from './ExpenseForm';
import { useAuthStore } from '../../store/authStore';
import {
  Fuel,
  DollarSign,
  Plus,
  Loader2,
  Calendar,
  FilterX,
  CreditCard
} from 'lucide-react';

export const FuelExpensesList = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isFuelOpen, setIsFuelOpen] = useState(false);
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);

  // Authorize Financial Analyst and Fleet Managers
  const isAuthorized = user?.role === 'Fleet Manager' || user?.role === 'Financial Analyst' || user?.role === 'Admin';

  // Query Refuel logs
  const { data: fuelLogs, isLoading: isFuelLoading } = useQuery({
    queryKey: ['fuel-logs', { vehicle_id: selectedVehicle }],
    queryFn: () => expensesApi.getFuelLogs({ vehicle_id: selectedVehicle }),
    select: (res) => res.data
  });

  // Query general Expenses
  const { data: expenses, isLoading: isExpensesLoading } = useQuery({
    queryKey: ['expenses', { vehicle_id: selectedVehicle }],
    queryFn: () => expensesApi.getExpenses({ vehicle_id: selectedVehicle }),
    select: (res) => res.data
  });

  // Query Vehicles dropdown
  const { data: vehicles } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => vehiclesApi.getVehicles(),
    select: (res) => res.data
  });

  const clearFilters = () => {
    setSelectedVehicle('');
    setSelectedCategory('');
    setSearchTerm('');
  };

  // Combine refuel logs and general expenses into a unified list
  const unifiedLedger = [];

  if (fuelLogs) {
    fuelLogs.forEach(log => {
      unifiedLedger.push({
        id: log.id,
        date: log.date,
        category: 'Fuel',
        cost: log.cost,
        vehicle_id: log.vehicle_id,
        vehicle_reg: log.vehicle_reg,
        description: `${log.liters} Liters refueled (${log.vehicle_model})`
      });
    });
  }

  if (expenses) {
    expenses.forEach(exp => {
      unifiedLedger.push({
        id: exp.id,
        date: exp.date,
        category: exp.category,
        cost: exp.cost,
        vehicle_id: exp.vehicle_id,
        vehicle_reg: exp.vehicle_reg,
        description: exp.description
      });
    });
  }

  // Sort and apply filters
  let filteredLedger = unifiedLedger;

  if (selectedCategory) {
    filteredLedger = filteredLedger.filter(item => item.category.toLowerCase() === selectedCategory.toLowerCase());
  }

  if (searchTerm) {
    const q = searchTerm.toLowerCase();
    filteredLedger = filteredLedger.filter(item => 
      item.description.toLowerCase().includes(q) ||
      item.vehicle_reg.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  }

  // Sort by date descending
  filteredLedger.sort((a, b) => new Date(b.date) - new Date(a.date));

  const isLoading = isFuelLoading || isExpensesLoading;

  // Helpers for category styling badges
  const getCategoryBadgeColor = (category) => {
    switch (category.toLowerCase()) {
      case 'fuel':
        return 'bg-green-50 text-uber-green border-uber-green/20';
      case 'tolls':
        return 'bg-blue-50 text-uber-blue border-uber-blue/20';
      case 'maintenance':
        return 'bg-amber-50 text-uber-amber border-uber-amber/20';
      case 'miscellaneous':
      default:
        return 'bg-gray-50 text-gray-500 border-gray-200';
    }
  };

  return (
    <div className="text-left animate-fade-in">
      
      {/* Title Header banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-xs uppercase font-extrabold tracking-widest text-gray-500">
            Accounting / Ledger
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight mt-1 text-uber-black uppercase">
            Fuel & Expenses
          </h2>
        </div>

        {isAuthorized && (
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFuelOpen(true)}
              className="flex items-center gap-2 border-gray-300"
            >
              <Fuel size={14} /> Log Fuel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsExpenseOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus size={16} /> Log Expense
            </Button>
          </div>
        )}
      </div>

      {/* Filter Ledger Cards */}
      <Card className="mb-8">
        <div className="flex flex-col lg:flex-row items-center gap-4">
          
          <div className="w-full lg:flex-1">
            <Input
              placeholder="Search description, vehicle, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="w-full lg:w-48">
            <Select
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
              options={[
                { value: '', label: 'All Fleet Vehicles' },
                ...(vehicles || []).map(v => ({ value: v.id, label: v.registration_number }))
              ]}
            />
          </div>

          <div className="w-full lg:w-48">
            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              options={[
                { value: '', label: 'All Categories' },
                { value: 'Fuel', label: 'Fuel Refuels' },
                { value: 'Tolls', label: 'Tolls & Transit' },
                { value: 'Maintenance', label: 'Maintenance' },
                { value: 'Miscellaneous', label: 'Miscellaneous' }
              ]}
            />
          </div>

          {(selectedVehicle || selectedCategory || searchTerm) && (
            <button
              onClick={clearFilters}
              className="text-xs uppercase font-extrabold tracking-wider text-uber-red hover:underline shrink-0 px-2 py-3 flex items-center gap-1.5"
            >
              <FilterX size={14} /> Clear
            </button>
          )}

        </div>
      </Card>

      {/* Ledger Table grid */}
      {isLoading ? (
        <div className="flex justify-center items-center py-24">
          <Loader2 className="animate-spin text-uber-black" size={32} />
        </div>
      ) : filteredLedger.length === 0 ? (
        <Card className="py-16 text-center">
          <div className="max-w-md mx-auto flex flex-col items-center gap-4">
            <CreditCard size={40} className="text-gray-300" />
            <h3 className="text-lg font-bold text-uber-black uppercase">No Ledger Entries</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              No expenses or refueling logs match your filter criteria. Use buttons above to log new transactions.
            </p>
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-uber-gray-300 bg-gray-50 text-gray-400 uppercase tracking-wider font-extrabold select-none">
                  <th className="py-4 px-6">Transaction Date</th>
                  <th className="py-4 px-6">Category</th>
                  <th className="py-4 px-6">Associated Vehicle</th>
                  <th className="py-4 px-6">Description / Details</th>
                  <th className="py-4 px-6 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-uber-gray-300">
                {filteredLedger.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-uber-gray-100/40 transition-colors duration-150"
                  >
                    <td className="py-4 px-6 text-gray-500 font-medium">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={14} className="text-gray-400" />
                        {item.date}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full border text-[10px] uppercase tracking-wide font-bold ${getCategoryBadgeColor(item.category)}`}>
                        {item.category}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      {item.vehicle_id ? (
                        <button
                          onClick={() => navigate(`/vehicles/${item.vehicle_id}`)}
                          className="font-bold text-uber-black uppercase hover:underline"
                        >
                          {item.vehicle_reg}
                        </button>
                      ) : (
                        <span className="text-gray-400 font-medium">N/A</span>
                      )}
                    </td>
                    <td className="py-4 px-6 font-semibold text-gray-700 max-w-sm truncate">
                      {item.description}
                    </td>
                    <td className="py-4 px-6 text-right font-extrabold text-uber-black">
                      ${item.cost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Log Fuel Modal form */}
      <FuelForm isOpen={isFuelOpen} onClose={() => setIsFuelOpen(false)} />

      {/* Log Expense Modal form */}
      <ExpenseForm isOpen={isExpenseOpen} onClose={() => setIsExpenseOpen(false)} />

    </div>
  );
};

import client from './client';
import { useAuthStore } from '../store/authStore';
import { mockDb } from '../utils/mockDb';

const isSandbox = () => useAuthStore.getState().token === 'mock-jwt-token-12345';

export const reportsApi = {
  getFuelEfficiency: async () => {
    if (isSandbox()) {
      await new Promise(r => setTimeout(r, 200));
      const vehicles = mockDb.getVehicles();
      const data = vehicles.map(v => ({
        name: v.registration_number,
        efficiency: v.fuel_efficiency || 6.0,
        model: v.model
      }));
      return { data };
    }
    return client.get('/reports/fuel-efficiency');
  },

  getUtilization: async () => {
    if (isSandbox()) {
      await new Promise(r => setTimeout(r, 200));
      // Return 7 days of historical utilization rates
      const data = [
        { date: '07/06', rate: 72 },
        { date: '07/07', rate: 75 },
        { date: '07/08', rate: 80 },
        { date: '07/09', rate: 78 },
        { date: '07/10', rate: 85 },
        { date: '07/11', rate: 88 },
        { date: '07/12', rate: 80 } // Current date 2026-07-12
      ];
      return { data };
    }
    return client.get('/reports/utilization');
  },

  getCost: async () => {
    if (isSandbox()) {
      await new Promise(r => setTimeout(r, 200));
      const vehicles = mockDb.getVehicles();
      
      // Calculate total fuel cost from all vehicles
      const fuelCost = vehicles.reduce((acc, v) => 
        acc + (v.fuel_logs || []).reduce((sum, log) => sum + (log.cost || 0), 0)
      , 0);

      // Calculate total maintenance cost from all vehicles
      const maintCost = vehicles.reduce((acc, v) => 
        acc + (v.maintenance_records || []).reduce((sum, rec) => sum + (rec.cost || 0), 0)
      , 0);

      // Fetch expenses from localStorage
      const rawExpenses = localStorage.getItem('to_expenses');
      const expensesList = rawExpenses ? JSON.parse(rawExpenses) : [];

      // Calculate other expenses (filter out duplicate maintenance records if they are already in vehicles,
      // but in our sandbox setup, let's just count them separately by category)
      const tollCost = expensesList.filter(e => e.category === 'Tolls').reduce((sum, e) => sum + e.cost, 0);
      const miscCost = expensesList.filter(e => e.category === 'Miscellaneous').reduce((sum, e) => sum + e.cost, 0);

      const data = [
        { name: 'Fuel Refuels', cost: fuelCost },
        { name: 'Maintenance', cost: maintCost },
        { name: 'Toll Fees', cost: tollCost },
        { name: 'Miscellaneous', cost: miscCost }
      ];
      
      return { data };
    }
    return client.get('/reports/cost');
  },

  getRoi: async () => {
    if (isSandbox()) {
      await new Promise(r => setTimeout(r, 200));
      // ROI per vehicle category: operational costs vs. completed dispatches revenue (mocked)
      const data = [
        { category: 'Heavy Hauler', cost: 1200, revenue: 3600 },
        { category: 'Box Body', cost: 650, revenue: 1950 },
        { category: 'Dry Van', cost: 800, revenue: 2600 },
        { category: 'Flatbed', cost: 950, revenue: 2850 }
      ];
      return { data };
    }
    return client.get('/reports/roi');
  }
};

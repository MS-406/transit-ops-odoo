import client from './client';
import { useAuthStore } from '../store/authStore';
import { mockDb } from '../utils/mockDb';
import { auditLogger } from '../utils/auditLogger';

const isSandbox = () => useAuthStore.getState().token === 'mock-jwt-token-12345';

const DEFAULT_EXPENSES = [
  { id: 'exp-1', category: 'Tolls', description: 'Nairobi Expressway toll gate', cost: 15.00, date: '2026-07-05', vehicle_id: 'v-1', vehicle_reg: 'KCB 123A' },
  { id: 'exp-2', category: 'Maintenance', description: 'Brake pads renewal Mercedes', cost: 350.00, date: '2026-07-11', vehicle_id: 'v-3', vehicle_reg: 'KCE 789C' },
  { id: 'exp-3', category: 'Miscellaneous', description: 'Hub cleaning supplies', cost: 45.50, date: '2026-07-09', vehicle_id: '', vehicle_reg: 'N/A' }
];

const getLocalExpenses = () => {
  if (!localStorage.getItem('to_expenses')) {
    localStorage.setItem('to_expenses', JSON.stringify(DEFAULT_EXPENSES));
  }
  return JSON.parse(localStorage.getItem('to_expenses'));
};

const saveLocalExpenses = (list) => {
  localStorage.setItem('to_expenses', JSON.stringify(list));
};

export const expensesApi = {
  getFuelLogs: async (params = {}) => {
    if (isSandbox()) {
      await new Promise(r => setTimeout(r, 200));
      const vehicles = mockDb.getVehicles();
      
      let logs = vehicles.flatMap(v => 
        (v.fuel_logs || []).map((log, idx) => ({
          id: `fuel-${v.id}-${idx}`,
          vehicle_id: v.id,
          vehicle_reg: v.registration_number,
          vehicle_model: v.model,
          liters: log.liters,
          cost: log.cost,
          date: log.date
        }))
      );

      if (params.vehicle_id) {
        logs = logs.filter(log => log.vehicle_id === params.vehicle_id);
      }

      logs.sort((a, b) => new Date(b.date) - new Date(a.date));
      return { data: logs };
    }
    return client.get('/fuel-logs', { params });
  },

  createFuelLog: async (data) => {
    if (isSandbox()) {
      await new Promise(r => setTimeout(r, 300));
      const vehicle = mockDb.getVehicleById(data.vehicle_id);
      if (!vehicle) throw new Error('Vehicle not found');

      const logItem = {
        date: data.date,
        liters: parseFloat(data.liters),
        cost: parseFloat(data.cost)
      };

      if (!vehicle.fuel_logs) {
        vehicle.fuel_logs = [];
      }
      vehicle.fuel_logs.push(logItem);
      mockDb.saveVehicle(vehicle);

      auditLogger.logAction('LOG_FUEL', `Logged ${data.liters} Liters refuel ($${data.cost}) for vehicle ${vehicle.registration_number}`);
      return { data: { id: `fuel-${vehicle.id}-${vehicle.fuel_logs.length - 1}`, ...data } };
    }
    return client.post('/fuel-logs', data);
  },

  getExpenses: async (params = {}) => {
    if (isSandbox()) {
      await new Promise(r => setTimeout(r, 200));
      let list = getLocalExpenses();

      if (params.vehicle_id) {
        list = list.filter(exp => exp.vehicle_id === params.vehicle_id);
      }

      list.sort((a, b) => new Date(b.date) - new Date(a.date));
      return { data: list };
    }
    return client.get('/expenses', { params });
  },

  createExpense: async (data) => {
    if (isSandbox()) {
      await new Promise(r => setTimeout(r, 300));
      const list = getLocalExpenses();
      const vehicles = mockDb.getVehicles();
      const vehicle = vehicles.find(v => v.id === data.vehicle_id);

      const newExpense = {
        id: `exp-${Math.random().toString(36).substr(2, 9)}`,
        category: data.category,
        description: data.description,
        cost: parseFloat(data.cost),
        date: data.date,
        vehicle_id: data.vehicle_id || '',
        vehicle_reg: vehicle ? vehicle.registration_number : 'N/A'
      };

      const updated = [...list, newExpense];
      saveLocalExpenses(updated);

      auditLogger.logAction('LOG_EXPENSE', `Logged ${newExpense.category} expense ($${newExpense.cost}) for vehicle ${newExpense.vehicle_reg}: ${newExpense.description}`);
      return { data: newExpense };
    }
    return client.post('/expenses', data);
  }
};

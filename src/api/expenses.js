import client from './client';
import { auditLogger } from '../utils/auditLogger';


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
    
    const queryParams = { ...params };
    if (!queryParams.vehicle_id) delete queryParams.vehicle_id;
    return client.get('/fuel-logs', { params: queryParams });
  },

  createFuelLog: async (data) => {
    
    const res = await client.post('/fuel-logs', data);
    auditLogger.logAction('LOG_FUEL', `Logged ${data.liters} Liters refuel ($${data.cost}) for vehicle ${res.data.vehicle_reg}`);
    return res;
  },

  getExpenses: async (params = {}) => {
    
    const queryParams = { ...params };
    if (!queryParams.vehicle_id) delete queryParams.vehicle_id;
    return client.get('/expenses', { params: queryParams });
  },

  createExpense: async (data) => {
    
    const res = await client.post('/expenses', data);
    auditLogger.logAction('LOG_EXPENSE', `Logged ${res.data.category} expense ($${res.data.cost}) for vehicle ${res.data.vehicle_reg}: ${res.data.description}`);
    return res;
  }
};

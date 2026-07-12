import client from './client';
import { auditLogger } from '../utils/auditLogger';


export const driversApi = {
  getDrivers: async (params = {}) => {
    
    return client.get('/drivers', { params });
  },

  getDriver: async (id) => {
    
    return client.get(`/drivers/${id}`);
  },

  createDriver: async (data) => {
    
    const res = await client.post('/drivers', data);
    auditLogger.logAction('CREATE_DRIVER', `Created driver ${res.data.name} (${res.data.license_class})`);
    return res;
  },

  updateDriver: async (id, data) => {
    
    const res = await client.patch(`/drivers/${id}`, data);
    auditLogger.logAction('UPDATE_DRIVER', `Updated driver ${res.data.name} (Status: ${res.data.status})`);
    return res;
  }
};

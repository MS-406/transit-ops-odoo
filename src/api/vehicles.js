import client from './client';
import { auditLogger } from '../utils/auditLogger';


export const vehiclesApi = {
  getVehicles: async (params = {}) => {
    
    
    return client.get('/vehicles', { params });
  },

  getVehicle: async (id) => {
    
    return client.get(`/vehicles/${id}`);
  },

  createVehicle: async (data) => {
    
    const res = await client.post('/vehicles', data);
    auditLogger.logAction('CREATE_VEHICLE', `Created vehicle ${res.data.registration_number} (${res.data.model})`);
    return res;
  },

  updateVehicle: async (id, data) => {
    
    const res = await client.patch(`/vehicles/${id}`, data);
    auditLogger.logAction('UPDATE_VEHICLE', `Updated vehicle ${res.data.registration_number} (${res.data.model})`);
    return res;
  },

  deleteVehicle: async (id) => {
    
    const res = await client.delete(`/vehicles/${id}`);
    auditLogger.logAction('DELETE_VEHICLE', `Deleted vehicle ${id}`);
    return res;
  }
};

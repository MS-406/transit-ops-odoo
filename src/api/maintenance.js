import client from './client';
import { auditLogger } from '../utils/auditLogger';


export const maintenanceApi = {
  getMaintenanceLogs: async (params = {}) => {
    
    
    // Clean empty params
    const queryParams = { ...params };
    if (!queryParams.vehicle_id) {
      delete queryParams.vehicle_id;
    }
    return client.get('/maintenance', { params: queryParams });
  },

  createMaintenanceLog: async (data) => {
    

    const res = await client.post('/maintenance', data);
    auditLogger.logAction('OPEN_MAINTENANCE', `Opened maintenance ticket for vehicle ${res.data.vehicle_reg}: ${res.data.description}`);
    return res;
  },

  closeMaintenanceLog: async (logId) => {
    

    const res = await client.patch(`/maintenance/${logId}/close`);
    auditLogger.logAction('CLOSE_MAINTENANCE', `Closed maintenance ticket for vehicle ${res.data.vehicle_reg}: ${res.data.description}`);
    return res;
  }
};

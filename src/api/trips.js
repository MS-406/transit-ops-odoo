import client from './client';
import { auditLogger } from '../utils/auditLogger';


export const tripsApi = {
  getTrips: async (params = {}) => {
    
    return client.get('/trips', { params });
  },

  createTrip: async (data) => {
    
    const res = await client.post('/trips', data);
    auditLogger.logAction('CREATE_TRIP', `Created Trip draft #${res.data.id} (Route: ${res.data.source} -> ${res.data.destination})`);
    return res;
  },

  dispatchTrip: async (id) => {
    
    const res = await client.patch(`/trips/${id}/dispatch`);
    auditLogger.logAction('DISPATCH_TRIP', `Dispatched Trip #${res.data.id} (Route: ${res.data.source} -> ${res.data.destination})`);
    return res;
  },

  cancelTrip: async (id) => {
    
    const res = await client.patch(`/trips/${id}/cancel`);
    auditLogger.logAction('CANCEL_TRIP', `Cancelled Trip #${id}`);
    return res;
  },

  completeTrip: async (id, data) => {
    // data shape: { final_odometer, fuel_consumed }
    
    const res = await client.patch(`/trips/${id}/complete`, data);
    auditLogger.logAction('COMPLETE_TRIP', `Completed Trip #${id}. Final Odometer: ${res.data.final_odometer} km, Fuel Consumed: ${res.data.fuel_consumed} L.`);
    return res;
  }
};

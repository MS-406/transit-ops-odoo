import client from './client';
import { useAuthStore } from '../store/authStore';
import { mockDb } from '../utils/mockDb';
import { auditLogger } from '../utils/auditLogger';

const isSandbox = () => useAuthStore.getState().token === 'mock-jwt-token-12345';

export const vehiclesApi = {
  getVehicles: async (params = {}) => {
    if (isSandbox()) {
      // Simulate network delay
      await new Promise(r => setTimeout(r, 300));
      
      let list = mockDb.getVehicles();
      const { status, type, search } = params;

      if (status) {
        list = list.filter(v => v.status.toLowerCase() === status.toLowerCase());
      }
      if (type) {
        list = list.filter(v => v.type.toLowerCase() === type.toLowerCase());
      }
      if (search) {
        const query = search.toLowerCase();
        list = list.filter(v => 
          v.registration_number.toLowerCase().includes(query) ||
          v.model.toLowerCase().includes(query) ||
          v.region.toLowerCase().includes(query)
        );
      }
      return { data: list };
    }
    
    return client.get('/vehicles', { params });
  },

  getVehicle: async (id) => {
    if (isSandbox()) {
      await new Promise(r => setTimeout(r, 200));
      const vehicle = mockDb.getVehicleById(id);
      if (!vehicle) throw new Error('Vehicle not found');
      return { data: vehicle };
    }
    return client.get(`/vehicles/${id}`);
  },

  createVehicle: async (data) => {
    if (isSandbox()) {
      await new Promise(r => setTimeout(r, 400));
      const list = mockDb.getVehicles();
      
      // Perform inline uniqueness validation
      const exists = list.some(
        v => v.registration_number.toLowerCase().trim() === data.registration_number.toLowerCase().trim()
      );
      if (exists) {
        // Mock a backend validation error
        const error = new Error('Validation Error');
        error.response = {
          data: {
            detail: 'Registration number already exists.'
          }
        };
        throw error;
      }
      
      const newVehicle = mockDb.saveVehicle(data);
      auditLogger.logAction('CREATE_VEHICLE', `Created vehicle ${newVehicle.registration_number} (${newVehicle.model})`);
      return { data: newVehicle };
    }
    const res = await client.post('/vehicles', data);
    auditLogger.logAction('CREATE_VEHICLE', `Created vehicle ${res.data.registration_number} (${res.data.model})`);
    return res;
  },

  updateVehicle: async (id, data) => {
    if (isSandbox()) {
      await new Promise(r => setTimeout(r, 300));
      const list = mockDb.getVehicles();
      
      // If reg number is changed, check uniqueness
      if (data.registration_number) {
        const exists = list.some(
          v => v.id !== id && v.registration_number.toLowerCase().trim() === data.registration_number.toLowerCase().trim()
        );
        if (exists) {
          const error = new Error('Validation Error');
          error.response = {
            data: {
              detail: 'Registration number already exists.'
            }
          };
          throw error;
        }
      }

      const updated = mockDb.saveVehicle({ id, ...data });
      auditLogger.logAction('UPDATE_VEHICLE', `Updated vehicle ${updated.registration_number} (${updated.model})`);
      return { data: updated };
    }
    const res = await client.patch(`/vehicles/${id}`, data);
    auditLogger.logAction('UPDATE_VEHICLE', `Updated vehicle ${res.data.registration_number} (${res.data.model})`);
    return res;
  },

  deleteVehicle: async (id) => {
    if (isSandbox()) {
      await new Promise(r => setTimeout(r, 200));
      const vehicle = mockDb.getVehicleById(id);
      mockDb.deleteVehicle(id);
      auditLogger.logAction('DELETE_VEHICLE', `Deleted vehicle ${vehicle?.registration_number || id}`);
      return { data: { success: true } };
    }
    const res = await client.delete(`/vehicles/${id}`);
    auditLogger.logAction('DELETE_VEHICLE', `Deleted vehicle ${id}`);
    return res;
  }
};

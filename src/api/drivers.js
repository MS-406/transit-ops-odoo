import client from './client';
import { useAuthStore } from '../store/authStore';
import { mockDb } from '../utils/mockDb';

const isSandbox = () => useAuthStore.getState().token === 'mock-jwt-token-12345';

export const driversApi = {
  getDrivers: async (params = {}) => {
    if (isSandbox()) {
      await new Promise(r => setTimeout(r, 300));
      let list = mockDb.getDrivers();
      const { status, search } = params;

      if (status) {
        list = list.filter(d => d.status.toLowerCase() === status.toLowerCase());
      }
      if (search) {
        const query = search.toLowerCase();
        list = list.filter(d => 
          d.name.toLowerCase().includes(query) ||
          d.license_class.toLowerCase().includes(query)
        );
      }
      return { data: list };
    }
    return client.get('/drivers', { params });
  },

  getDriver: async (id) => {
    if (isSandbox()) {
      await new Promise(r => setTimeout(r, 200));
      const driver = mockDb.getDriverById(id);
      if (!driver) throw new Error('Driver not found');
      return { data: driver };
    }
    return client.get(`/drivers/${id}`);
  },

  createDriver: async (data) => {
    if (isSandbox()) {
      await new Promise(r => setTimeout(r, 400));
      const newDriver = mockDb.saveDriver(data);
      return { data: newDriver };
    }
    return client.post('/drivers', data);
  },

  updateDriver: async (id, data) => {
    if (isSandbox()) {
      await new Promise(r => setTimeout(r, 300));
      const updated = mockDb.saveDriver({ id, ...data });
      return { data: updated };
    }
    return client.patch(`/drivers/${id}`, data);
  }
};

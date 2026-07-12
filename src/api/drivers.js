import client from './client';
import { useAuthStore } from '../store/authStore';
import { mockDb } from '../utils/mockDb';
import { auditLogger } from '../utils/auditLogger';

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
      auditLogger.logAction('CREATE_DRIVER', `Created driver ${newDriver.name} (${newDriver.license_class})`);
      return { data: newDriver };
    }
    const res = await client.post('/drivers', data);
    auditLogger.logAction('CREATE_DRIVER', `Created driver ${res.data.name} (${res.data.license_class})`);
    return res;
  },

  updateDriver: async (id, data) => {
    if (isSandbox()) {
      await new Promise(r => setTimeout(r, 300));
      const updated = mockDb.saveDriver({ id, ...data });
      auditLogger.logAction('UPDATE_DRIVER', `Updated driver ${updated.name} (Status: ${updated.status})`);
      return { data: updated };
    }
    const res = await client.patch(`/drivers/${id}`, data);
    auditLogger.logAction('UPDATE_DRIVER', `Updated driver ${res.data.name} (Status: ${res.data.status})`);
    return res;
  }
};

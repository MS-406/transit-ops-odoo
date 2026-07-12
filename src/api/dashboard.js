import client from './client';
import { useAuthStore } from '../store/authStore';
import { mockDb } from '../utils/mockDb';

const isSandbox = () => useAuthStore.getState().token === 'mock-jwt-token-12345';

export const dashboardApi = {
  getKpis: async (params = {}) => {
    if (isSandbox()) {
      await new Promise(r => setTimeout(r, 200));
      
      let vehicles = mockDb.getVehicles();
      let trips = mockDb.getTrips();
      let drivers = mockDb.getDrivers();

      const { vehicle_type, status, region } = params;

      // Apply filters if present
      if (vehicle_type) {
        vehicles = vehicles.filter(v => v.type.toLowerCase() === vehicle_type.toLowerCase());
      }
      if (status) {
        vehicles = vehicles.filter(v => v.status.toLowerCase() === status.toLowerCase());
      }
      if (region) {
        vehicles = vehicles.filter(v => v.region.toLowerCase() === region.toLowerCase());
      }

      // Calculations
      const totalVehicles = vehicles.length;
      const activeVehicles = vehicles.filter(v => v.status === 'On Trip').length;
      const availableVehicles = vehicles.filter(v => v.status === 'Available').length;
      const inMaintenance = vehicles.filter(v => v.status === 'In Shop').length;
      const retiredVehicles = vehicles.filter(v => v.status === 'Retired').length;
      
      const activeTrips = trips.filter(t => t.status === 'Dispatched').length;
      const pendingTrips = trips.filter(t => t.status === 'Draft').length;
      const driversOnDuty = drivers.filter(d => d.status === 'Available' || d.status === 'On Trip').length;

      // Utilization: Active vehicles divided by total operational vehicles (excluding retired)
      const operationalVehicles = vehicles.filter(v => v.status !== 'Retired').length;
      const utilizationRate = operationalVehicles > 0 
        ? Math.round((activeVehicles / operationalVehicles) * 100) 
        : 0;

      return {
        data: {
          totalVehicles,
          activeVehicles,
          availableVehicles,
          inMaintenance,
          retiredVehicles,
          activeTrips,
          pendingTrips,
          driversOnDuty,
          utilizationRate
        }
      };
    }

    return client.get('/dashboard/kpis', { params });
  }
};

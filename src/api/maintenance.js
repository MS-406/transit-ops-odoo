import client from './client';
import { useAuthStore } from '../store/authStore';
import { mockDb } from '../utils/mockDb';

const isSandbox = () => useAuthStore.getState().token === 'mock-jwt-token-12345';

export const maintenanceApi = {
  getMaintenanceLogs: async (params = {}) => {
    if (isSandbox()) {
      await new Promise(r => setTimeout(r, 200));
      const vehicles = mockDb.getVehicles();
      
      // Flatten all maintenance records from all vehicles
      let logs = vehicles.flatMap(v => 
        (v.maintenance_records || []).map(rec => ({
          ...rec,
          vehicle_id: v.id,
          vehicle_reg: v.registration_number,
          vehicle_model: v.model,
          vehicle_overall_status: v.status
        }))
      );

      if (params.vehicle_id) {
        logs = logs.filter(log => log.vehicle_id === params.vehicle_id);
      }

      // Return sorted by date descending
      logs.sort((a, b) => new Date(b.date) - new Date(a.date));

      return { data: logs };
    }
    
    return client.get('/maintenance', { params });
  },

  createMaintenanceLog: async (data) => {
    if (isSandbox()) {
      await new Promise(r => setTimeout(r, 300));
      const vehicle = mockDb.getVehicleById(data.vehicle_id);
      if (!vehicle) throw new Error('Vehicle not found');

      // Create log item
      const logId = `maint-${Math.random().toString(36).substr(2, 9)}`;
      const logItem = {
        id: logId,
        date: data.date || new Date().toISOString().split('T')[0],
        description: data.description,
        cost: parseFloat(data.cost),
        status: 'Open'
      };

      // Set vehicle status to "In Shop"
      vehicle.status = 'In Shop';
      if (!vehicle.maintenance_records) {
        vehicle.maintenance_records = [];
      }
      vehicle.maintenance_records.push(logItem);

      // Save vehicle update
      mockDb.saveVehicle(vehicle);

      return { data: logItem };
    }

    return client.post('/maintenance', data);
  },

  closeMaintenanceLog: async (logId) => {
    if (isSandbox()) {
      await new Promise(r => setTimeout(r, 300));
      const vehicles = mockDb.getVehicles();
      
      let targetVehicle = null;
      let targetRecord = null;

      // Scan vehicles to find the log
      for (const v of vehicles) {
        const rec = (v.maintenance_records || []).find(r => r.id === logId);
        if (rec) {
          targetVehicle = v;
          targetRecord = rec;
          break;
        }
      }

      if (!targetVehicle || !targetRecord) {
        throw new Error('Maintenance record not found');
      }

      // Close the maintenance log record
      targetRecord.status = 'Closed';

      // Safe state transitions: Only revert to Available if not Retired
      if (targetVehicle.status === 'In Shop') {
        // If it was Retired before or set to Retired, keep it Retired
        const isRetired = targetVehicle.maintenance_records.some(r => r.description.toLowerCase().includes('retire')) || targetVehicle.status === 'Retired';
        
        // Let's check vehicle's own state. Since we only transition 'In Shop' -> 'Available',
        // check if vehicle is set to Retired elsewhere (or if we explicitly set it to Retired)
        if (targetVehicle.status === 'Retired') {
          // Keep Retired
        } else {
          // Revert to Available
          targetVehicle.status = 'Available';
        }
      }

      mockDb.saveVehicle(targetVehicle);

      return { data: targetRecord };
    }

    return client.patch(`/maintenance/${logId}/close`);
  }
};

import client from './client';
import { useAuthStore } from '../store/authStore';
import { mockDb } from '../utils/mockDb';

const isSandbox = () => useAuthStore.getState().token === 'mock-jwt-token-12345';

export const tripsApi = {
  getTrips: async (params = {}) => {
    if (isSandbox()) {
      await new Promise(r => setTimeout(r, 300));
      let list = mockDb.getTrips();
      if (params.status) {
        list = list.filter(t => t.status.toLowerCase() === params.status.toLowerCase());
      }
      return { data: list };
    }
    return client.get('/trips', { params });
  },

  createTrip: async (data) => {
    if (isSandbox()) {
      await new Promise(r => setTimeout(r, 400));
      
      // Perform capacity server-side validation check
      const vehicles = mockDb.getVehicles();
      const vehicle = vehicles.find(v => v.id === data.vehicle_id);
      
      if (vehicle && data.cargo_weight > vehicle.capacity) {
        const error = new Error('Capacity Warning');
        error.response = {
          data: {
            detail: `Cargo weight (${data.cargo_weight} Tons) exceeds vehicle max capacity of ${vehicle.capacity} Tons.`
          }
        };
        throw error;
      }

      // Check if driver is available and valid
      const drivers = mockDb.getDrivers();
      const driver = drivers.find(d => d.id === data.driver_id);
      if (driver && driver.status !== 'Available') {
        const error = new Error('Driver Unavailable');
        error.response = {
          data: { detail: `Driver ${driver.name} is currently ${driver.status} and cannot be assigned.` }
        };
        throw error;
      }

      const newTrip = mockDb.saveTrip({
        ...data,
        status: 'Draft'
      });
      return { data: newTrip };
    }
    return client.post('/trips', data);
  },

  dispatchTrip: async (id) => {
    if (isSandbox()) {
      await new Promise(r => setTimeout(r, 300));
      const trip = mockDb.getTripById(id);
      if (!trip) throw new Error('Trip not found');

      // Update Trip status
      trip.status = 'Dispatched';
      mockDb.saveTrip(trip);

      // Update Vehicle status to On Trip
      const vehicle = mockDb.getVehicleById(trip.vehicle_id);
      if (vehicle) {
        vehicle.status = 'On Trip';
        mockDb.saveVehicle(vehicle);
      }

      // Update Driver status to On Trip
      const driver = mockDb.getDriverById(trip.driver_id);
      if (driver) {
        driver.status = 'On Trip';
        mockDb.saveDriver(driver);
      }

      return { data: trip };
    }
    return client.patch(`/trips/${id}/dispatch`);
  },

  cancelTrip: async (id) => {
    if (isSandbox()) {
      await new Promise(r => setTimeout(r, 300));
      const trip = mockDb.getTripById(id);
      if (!trip) throw new Error('Trip not found');

      trip.status = 'Cancelled';
      mockDb.saveTrip(trip);

      // Release Vehicle
      const vehicle = mockDb.getVehicleById(trip.vehicle_id);
      if (vehicle && vehicle.status === 'On Trip') {
        vehicle.status = 'Available';
        mockDb.saveVehicle(vehicle);
      }

      // Release Driver
      const driver = mockDb.getDriverById(trip.driver_id);
      if (driver && driver.status === 'On Trip') {
        driver.status = 'Available';
        mockDb.saveDriver(driver);
      }

      return { data: trip };
    }
    return client.patch(`/trips/${id}/cancel`);
  },

  completeTrip: async (id, data) => {
    // data shape: { final_odometer, fuel_consumed }
    if (isSandbox()) {
      await new Promise(r => setTimeout(r, 400));
      const trip = mockDb.getTripById(id);
      if (!trip) throw new Error('Trip not found');

      const vehicle = mockDb.getVehicleById(trip.vehicle_id);
      if (vehicle) {
        if (data.final_odometer < vehicle.odometer) {
          const error = new Error('Invalid Odometer');
          error.response = {
            data: {
              detail: `Final odometer reading (${data.final_odometer} km) cannot be less than previous odometer reading (${vehicle.odometer} km).`
            }
          };
          throw error;
        }

        // Update Vehicle Specs
        vehicle.odometer = data.final_odometer;
        vehicle.status = 'Available';
        
        // Log refuels if fuel consumed is provided
        if (data.fuel_consumed > 0) {
          vehicle.fuel_logs.push({
            date: new Date().toISOString().split('T')[0],
            liters: parseFloat(data.fuel_consumed),
            cost: parseFloat(data.fuel_consumed) * 1.5 // Mock: $1.5 per liter
          });
        }
        mockDb.saveVehicle(vehicle);
      }

      // Update Driver status
      const driver = mockDb.getDriverById(trip.driver_id);
      if (driver) {
        driver.status = 'Available';
        if (!driver.trip_history.includes(id)) {
          driver.trip_history.push(id);
        }
        mockDb.saveDriver(driver);
      }

      // Complete Trip info
      trip.status = 'Completed';
      trip.completed_at = new Date().toISOString();
      trip.final_odometer = data.final_odometer;
      trip.fuel_consumed = data.fuel_consumed;
      mockDb.saveTrip(trip);

      return { data: trip };
    }
    return client.patch(`/trips/${id}/complete`, data);
  }
};

import client from './client';


export const reportsApi = {
  getFuelEfficiency: async () => {
    
    return client.get('/reports/fuel-efficiency');
  },

  getUtilization: async () => {
    
    return client.get('/reports/utilization');
  },

  getCost: async () => {
    
    return client.get('/reports/cost');
  },

  getRoi: async () => {
    
    return client.get('/reports/roi');
  }
};

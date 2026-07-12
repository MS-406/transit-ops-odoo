import client from './client';


export const dashboardApi = {
  getKpis: async (params = {}) => {
    

    return client.get('/dashboard/kpis', { params });
  }
};

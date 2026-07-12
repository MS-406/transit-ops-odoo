import client from './client';

export const usersApi = {
  getUsers: async () => {
    return client.get('/users/');
  },
  createUser: async (userData) => {
    return client.post('/users/', userData);
  },
  deleteUser: async (userId) => {
    return client.delete(`/users/${userId}`);
  }
};

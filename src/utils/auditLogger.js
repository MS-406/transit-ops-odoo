import client from '../api/client';

export const auditLogger = {
  getLogs: async () => {
    try {
      const res = await client.get('/audit');
      return res.data;
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
      return [];
    }
  },

  logAction: async (action, details) => {
    try {
      await client.post('/audit', {
        action,
        details
      });
    } catch (err) {
      console.error('Failed to save audit log:', err);
    }
  }
};

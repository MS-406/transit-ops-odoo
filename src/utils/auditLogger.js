import { useAuthStore } from '../store/authStore';

const DEFAULT_AUDIT_LOGS = [
  { id: 'aud-1', timestamp: '2026-07-12T08:30:00Z', action: 'USER_LOGIN', details: 'Operator successfully logged in (Sandbox mode)', user: 'Vedant Mandalka' },
  { id: 'aud-2', timestamp: '2026-07-12T09:15:00Z', action: 'DISPATCH_TRIP', details: 'Trip #TR-872 dispatched to Mombasa Port', user: 'Vedant Mandalka' },
  { id: 'aud-3', timestamp: '2026-07-12T09:45:00Z', action: 'OPEN_MAINTENANCE', details: 'Vehicle KCB 123A sent to shop for oil service', user: 'Vedant Mandalka' }
];

export const auditLogger = {
  getLogs: () => {
    if (!localStorage.getItem('to_audit_logs')) {
      localStorage.setItem('to_audit_logs', JSON.stringify(DEFAULT_AUDIT_LOGS));
    }
    const logs = JSON.parse(localStorage.getItem('to_audit_logs'));
    // Sort descending by timestamp
    return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  },

  logAction: (action, details) => {
    const logs = auditLogger.getLogs();
    const user = useAuthStore.getState().user?.name || 'System';
    const newLog = {
      id: `aud-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      action,
      details,
      user
    };
    logs.push(newLog);
    localStorage.setItem('to_audit_logs', JSON.stringify(logs));
  }
};

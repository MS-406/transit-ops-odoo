import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: {
    name: 'Vedant Mandalka',
    email: 'admin@transitops.com',
    role: 'Fleet Manager', // Default role
  },
  isAuthenticated: true, // Auto-login in Phase 1 for easy review
  token: 'mock-jwt-token-12345',
  
  setRole: (role) => set((state) => ({
    user: state.user ? { ...state.user, role } : null
  })),
  
  login: (email, password, role = 'Fleet Manager') => {
    set({
      user: {
        name: email.split('@')[0],
        email,
        role,
      },
      isAuthenticated: true,
      token: 'mock-jwt-token-12345',
    });
  },
  
  logout: () => {
    set({
      user: null,
      isAuthenticated: false,
      token: null,
    });
  }
}));

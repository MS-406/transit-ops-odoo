import { create } from 'zustand';
import client from '../api/client';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isInitialized: false,
  isLoading: false,

  setToken: (token) => set({ token, isAuthenticated: !!token }),
  
  setRole: async (role) => {
    // For visual simulation, we update client-side role and store it in user
    set((state) => ({
      user: state.user ? { ...state.user, role } : null
    }));
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const response = await client.post('/auth/login', { email, password });
      
      // Expected response structure: { access_token }
      const { access_token } = response.data;
      
      set({ token: access_token, isAuthenticated: true });
      
      // Immediately fetch user profile details (role, name, email)
      await get().fetchMe();
      
      set({ isLoading: false });
      return { success: true };
    } catch (error) {
      set({ isLoading: false, token: null, isAuthenticated: false, user: null });
      const message = error.response?.data?.detail || 'Invalid email or password.';
      return { success: false, error: message };
    }
  },

  fetchMe: async () => {
    try {
      const response = await client.get('/auth/me');
      // Expected profile structure: { name, email, role }
      set({ user: response.data });
      return response.data;
    } catch (error) {
      set({ user: null });
      throw error;
    }
  },

  refreshSession: async () => {
    // Attempt silent refresh using the httpOnly cookie at application start
    try {
      const response = await client.post('/auth/refresh', {});
      const { access_token } = response.data;
      
      set({ token: access_token, isAuthenticated: true });
      
      // Fetch user profile info
      await get().fetchMe();
      
      set({ isInitialized: true });
      return true;
    } catch (error) {
      set({ token: null, isAuthenticated: false, user: null, isInitialized: true });
      return false;
    }
  },

  logout: async () => {
    try {
      // Optional: If there is a logout endpoint, call it
      // await client.post('/auth/logout', {});
    } catch (e) {
      // Ignore logout API failures
    } finally {
      set({
        user: null,
        token: null,
        isAuthenticated: false,
      });
    }
  }
}));

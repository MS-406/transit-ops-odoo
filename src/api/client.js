import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Crucial for receiving/sending httpOnly cookies (like refresh token)
});

// Request Interceptor: Attach JWT Access Token from Zustand store
client.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Silent Token Refresh & Auto Logout on 401
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Guard: Prevent loops on refresh request or login requests
    if (
      originalRequest.url.includes('/auth/login') ||
      originalRequest.url.includes('/auth/refresh')
    ) {
      return Promise.reject(error);
    }

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        // If refresh is already in progress, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return client(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;

      try {
        // Invoke standard refresh endpoint
        const response = await axios.post(
          `${client.defaults.baseURL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const { access_token } = response.data;
        
        // Update store with new token
        useAuthStore.getState().setToken(access_token);

        isRefreshing = false;
        processQueue(null, access_token);

        // Retry the original request
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return client(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        processQueue(refreshError, null);
        
        // Refresh token invalid/expired -> force logout & redirect to login page
        useAuthStore.getState().logout();
        window.location.href = '/login';
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default client;

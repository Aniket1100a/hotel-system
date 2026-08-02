import axios from 'axios';

// Try both VITE_API_BASE_URL and VITE_API_URL for flexibility.
// Fall back to the local Django server so the dashboard works out of the box.
const BASE_URL =
  (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api').trim();

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Simple interceptor to handle token refresh logic or unauthorized redirects
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    // If 401 Unauthorized and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken && BASE_URL) {
          // Use URL constructor or ensure trailing slash to avoid concatenation issues
          const refreshUrl = BASE_URL.endsWith('/') ? `${BASE_URL}auth/refresh/` : `${BASE_URL}/auth/refresh/`;
          const res = await axios.post(refreshUrl, {
            refresh: refreshToken,
          });
          if (res.data.access) {
            localStorage.setItem('access_token', res.data.access);
            originalRequest.headers.Authorization = `Bearer ${res.data.access}`;
            return api(originalRequest);
          }
        }
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

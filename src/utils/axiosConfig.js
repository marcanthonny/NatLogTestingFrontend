import axios from 'axios';
import { getApiUrl } from '../config/api';

const axiosInstance = axios.create({
  baseURL: getApiUrl(''),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Configure interceptors to add auth token to all requests
axiosInstance.interceptors.request.use(config => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

// Handle auth errors
axiosInstance.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Only redirect to login if not already on login page
      if (!window.location.pathname.includes('login')) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('isAuthenticated');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;

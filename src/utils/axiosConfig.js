import axios from 'axios';
import axiosRetry from 'axios-retry';
import { getApiUrl } from '../config/api';

const axiosInstance = axios.create({
  baseURL: getApiUrl(''),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Configure retry logic
axiosRetry(axiosInstance, {
  retries: 3,
  retryDelay: (retryCount) => {
    return retryCount * 1000; // Wait 1s, 2s, 3s between retries
  },
  retryCondition: (error) => {
    // Retry on network errors and 5xx server errors
    return axiosRetry.isNetworkOrIdempotentRequestError(error) || 
           (error.response && error.response.status >= 500);
  }
});

// Add request interceptor to add auth token
axiosInstance.interceptors.request.use(config => {
  // Skip auth in development
  if (process.env.NODE_ENV === 'development') {
    return config;
  }
  
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

// Handle token expiry and network errors
axiosInstance.interceptors.response.use(
  response => response,
  error => {
    if (!error.response) {
      // Network error handling
      console.error('Network error detected:', error.message);
      const customError = new Error('Network error - Please check your connection');
      customError.isNetworkError = true;
      return Promise.reject(customError);
    }
    
    if (error.response.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('isAuthenticated');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;

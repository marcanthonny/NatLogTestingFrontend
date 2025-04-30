import axios from 'axios';
import axiosRetry from 'axios-retry';
import API_BASE_URL from '../config/api';

const axiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api`, // This will add /api prefix to all requests
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

// Update request interceptor
axiosInstance.interceptors.request.use(config => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

// Update response interceptor to handle 401s
axiosInstance.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('isAuthenticated');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;

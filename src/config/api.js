const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://aplnatlog-backend.vercel.app';

export const getApiUrl = (endpoint) => {
  // Remove any leading slashes and ensure /api prefix
  const cleanEndpoint = endpoint.replace(/^\/+/, '');
  
  // Make sure we don't duplicate /api if it's already in the URL
  if (API_BASE_URL.endsWith('/api')) {
    return `${API_BASE_URL}/${cleanEndpoint}`;
  } else {
    return `${API_BASE_URL}/api/${cleanEndpoint}`;
  }
};

export default API_BASE_URL;

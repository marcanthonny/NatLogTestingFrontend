const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://aplnatlog-backend.vercel.app/api';

export const getApiUrl = (endpoint) => {
  // Remove any leading slashes and 'api/' from endpoint
  const cleanEndpoint = endpoint.replace(/^\//, '').replace(/^api\//, '');
  
  // Ensure clean joining of URL parts
  const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  
  return `${baseUrl}/${cleanEndpoint}`;
};

export default API_BASE_URL;

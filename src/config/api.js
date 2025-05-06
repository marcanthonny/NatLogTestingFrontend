const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://aplnatlog-backend.vercel.app';

export const getApiUrl = (endpoint) => {
  // Remove leading slashes and extra 'api/' from endpoint
  const cleanEndpoint = endpoint.replace(/^\/+/, '').replace(/^api\/+/, '');
  return `${API_BASE_URL}/api/${cleanEndpoint}`;
};

export default API_BASE_URL;

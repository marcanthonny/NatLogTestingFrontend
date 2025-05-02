const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export const getApiUrl = (endpoint) => {
  const cleanEndpoint = endpoint.replace(/^\/+/, '');
  return `${API_BASE_URL}/${cleanEndpoint.startsWith('api/') ? cleanEndpoint : `api/${cleanEndpoint}`}`;
};

export default API_BASE_URL;

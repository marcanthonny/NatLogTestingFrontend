const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://aplnatlog-backend.vercel.app';

export const getApiUrl = (endpoint) => {
  // Clean the endpoint of any leading/trailing slashes and api prefix
  const cleanEndpoint = endpoint.replace(/^\/?(api\/)?/, '').replace(/\/$/, '');
  return `${API_BASE_URL}/api/${cleanEndpoint}`;
};

export default API_BASE_URL;

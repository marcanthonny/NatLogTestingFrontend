const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://aplnatlog-backend.vercel.app';

export const getApiUrl = (endpoint) => {
  // Clean the endpoint and ensure no duplicate /api prefix
  const cleanEndpoint = endpoint.replace(/^\/?(api\/)?/, '');
  // Return URL without /api prefix - let axios add it
  return `${API_BASE_URL}/${cleanEndpoint}`;
};

export default API_BASE_URL;

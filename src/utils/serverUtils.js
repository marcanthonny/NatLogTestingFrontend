import axios from 'axios';
import { getApiUrl } from '../config/api';

/**
 * Checks if the server API is available
 * @returns {Promise<boolean>} True if server is available, false otherwise
 */
export const isServerAvailable = async () => {
  try {
    const response = await axios.head(getApiUrl('snapshots'), { 
      timeout: 5000,
      validateStatus: (status) => status === 200
    });
    return response.status === 200;
  } catch (error) {
    console.log('Server API check failed:', error.message);
    return false;
  }
};

/**
 * Gets the storage mode based on server availability
 * @returns {Promise<string>} 'server' or 'local' depending on availability
 */
export const getStorageMode = async () => {
  const serverAvailable = await isServerAvailable();
  return serverAvailable ? 'server' : 'local';
};

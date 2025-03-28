import axios from 'axios';

/**
 * Checks if the server API is available
 * @returns {Promise<boolean>} True if server is available, false otherwise
 */
export const isServerAvailable = async () => {
  try {
    // Make a simple HEAD request to check if server is responding
    await axios.head('/api/snapshots', { timeout: 2000 });
    return true;
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

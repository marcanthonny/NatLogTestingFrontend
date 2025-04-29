import axios from 'axios';

// API base URL from environment
const API_URL = process.env.REACT_APP_API_URL || 'https://aplnatlog-backend.vercel.app';

/**
 * Fetch all snapshots from database
 * @returns {Promise<Array>} Array of snapshots
 */
export const fetchAllSnapshots = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/snapshots`);
    if (!response.data) {
      throw new Error('No data received from server');
    }
    return response.data;
  } catch (error) {
    console.error('Error fetching snapshots:', error);
    throw new Error(error.response?.data?.error || 'Failed to fetch snapshots');
  }
};

/**
 * Fetch single snapshot by ID
 * @param {string} id Snapshot ID
 * @returns {Promise<Object>} Snapshot data
 */
export const fetchSnapshotById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/api/snapshots/${id}`);
    if (!response.data) {
      throw new Error('No data received from server');
    }
    return response.data;
  } catch (error) {
    console.error(`Error fetching snapshot ${id}:`, error);
    throw new Error(error.response?.data?.error || 'Failed to fetch snapshot');
  }
};

/**
 * Check database connection status
 * @returns {Promise<Object>} Connection status
 */
export const checkDatabaseStatus = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/snapshots/db-status`);
    return response.data;
  } catch (error) {
    console.error('Error checking database status:', error);
    return { connected: false, error: error.message };
  }
};

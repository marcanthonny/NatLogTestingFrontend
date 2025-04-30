import axios from 'axios';
import { getApiUrl } from '../config/api';

// Remove API_URL constant as we'll use getApiUrl helper

export const fetchAllSnapshots = async () => {
  try {
    const response = await axios.get(getApiUrl('snapshots'));
    if (!response.data) {
      throw new Error('No data received from server');
    }
    return response.data;
  } catch (error) {
    console.error('Error fetching snapshots:', error);
    throw new Error(error.response?.data?.error || 'Failed to fetch snapshots');
  }
};

export const fetchSnapshotById = async (id) => {
  try {
    const response = await axios.get(getApiUrl(`snapshots/${id}`));
    if (!response.data) {
      throw new Error('No data received from server');
    }
    return response.data;
  } catch (error) {
    console.error(`Error fetching snapshot ${id}:`, error);
    throw new Error(error.response?.data?.error || 'Failed to fetch snapshot');
  }
};

export const checkDatabaseStatus = async () => {
  try {
    const response = await axios.get(getApiUrl('snapshots/db-status'));
    return response.data;
  } catch (error) {
    console.error('Error checking database status:', error);
    return { connected: false, error: error.message };
  }
};

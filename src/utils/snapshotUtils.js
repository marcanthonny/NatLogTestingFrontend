/**
 * Utilities for managing snapshot data
 */

/**
 * Gets the location where snapshots are currently being stored
 * @returns {Promise<{location: string, path: string}>} Storage information
 */
export const getSnapshotStorageLocation = async () => {
  try {
    // Check if server is available
    const response = await fetch('/api/snapshots', { method: 'HEAD' });
    
    if (response.ok) {
      return {
        location: 'server',
        path: 'c:\\Users\\masamuel\\Documents\\excelAutomation\\backend\\snapshots\\'
      };
    }
  } catch (error) {
    console.log('Server unavailable, using localStorage');
  }
  
  return {
    location: 'browser',
    path: 'localStorage["weeklySnapshots"]'
  };
};

/**
 * Export all snapshots from localStorage as a downloadable JSON file
 */
export const exportLocalSnapshots = () => {
  try {
    const snapshots = localStorage.getItem('weeklySnapshots');
    if (!snapshots) {
      alert('No snapshots found in local storage');
      return;
    }
    
    // Create a blob and download link
    const blob = new Blob([snapshots], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `snapshots-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
    
  } catch (error) {
    console.error('Failed to export snapshots:', error);
    alert('Failed to export snapshots: ' + error.message);
  }
};

/**
 * Import snapshots from a JSON file into localStorage
 * @param {File} file - The JSON file containing snapshots
 * @returns {Promise<number>} Number of snapshots imported
 */
export const importLocalSnapshots = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const snapshots = JSON.parse(e.target.result);
        
        if (!Array.isArray(snapshots)) {
          reject(new Error('Invalid snapshot file format'));
          return;
        }
        
        localStorage.setItem('weeklySnapshots', JSON.stringify(snapshots));
        resolve(snapshots.length);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

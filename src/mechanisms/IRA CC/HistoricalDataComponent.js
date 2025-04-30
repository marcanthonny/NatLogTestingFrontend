import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import axiosInstance from '../../utils/axiosConfig';
import '../../interfaces/css/components/HistoricalDataComponent.css';
import { getSnapshotStorageLocation, exportLocalSnapshots, importLocalSnapshots } from '../../utils/snapshotUtils';
import { getApiUrl } from '../../config/api';
import { deleteSnapshot, fetchSnapshotById } from '../../utils/databaseUtils';

const VALID_BRANCHES = [
  '1982 - PT. APL JAYAPURA',
  '1981 - PT. APL KUPANG',
  '1980 - PT. APL DENPASAR',
  '1972 - PT. APL PONTIANAK',
  '1971 - PT. APL SAMARINDA',
  '1970 - PT. APL BANJARMASIN',
  '1962 - PT. APL PALU',
  '1961 - PT. APL MAKASSAR',
  '1957 - PT. APL BANDAR LAMPUNG',
  '1956 - PT. APL PALEMBANG',
  '1955 - PT. APL JAMBI',
  '1954 - PT. APL BATAM',
  '1953 - PT. APL PEKANBARU',
  '1952 - PT. APL PADANG',
  '1951 - PT. APL MEDAN',
  '1940 - PT. APL SURABAYA',
  '1932 - PT. APL YOGYAKARTA',
  '1930 - PT. APL SEMARANG',
  '1922 - PT. APL BANDUNG',
  '1921 - PT. APL TANGERANG',
  '1920 - PT. APL BOGOR',
  '1910 - PT. APL JAKARTA 1',
  '1960 - PT. APL MANADO'
];

function HistoricalDataComponent({ iraData, ccData, onSnapshotSelect }) {
  const [weeklySnapshots, setWeeklySnapshots] = useState([]);
  const [snapshotName, setSnapshotName] = useState('');
  const [selectedSnapshot, setSelectedSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Add state for custom date
  const [snapshotDate, setSnapshotDate] = useState(formatDateForInput(new Date()));
  // Add new state for storage location
  const [storageLocation, setStorageLocation] = useState({ location: 'checking...', path: '' });
  const fileInputRef = useRef(null);
  
  // Format date for date input field (YYYY-MM-DD)
  function formatDateForInput(date) {
    return new Date(date).toISOString().split('T')[0];
  }
  
  // Validate date is not in the future
  function isValidDate(dateString) {
    const selectedDate = new Date(dateString);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    
    return selectedDate <= today;
  }
  
  // Load historical data on component mount
  useEffect(() => {
    loadHistoricalData();
  }, []);
  
  // Get storage location on component mount
  useEffect(() => {
    async function checkStorageLocation() {
      const location = await getSnapshotStorageLocation();
      setStorageLocation(location);
    }
    
    checkStorageLocation();
  }, []);
  
  // Load weekly snapshots from server with minimal localStorage fallback
  const loadHistoricalData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Use full URL from config including /api prefix
      const response = await axiosInstance.get('/snapshots', {
        timeout: 5000,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      // Process response
      const processedSnapshots = response.data.map(snapshot => ({
        ...snapshot,
        iraPercentage: snapshot.iraStats?.percentage || 
          (snapshot.iraPercentage !== undefined ? snapshot.iraPercentage : 0),
        ccPercentage: snapshot.ccStats?.percentage || 
          (snapshot.ccPercentage !== undefined ? snapshot.ccPercentage : 0)
      }));

      setWeeklySnapshots(processedSnapshots);
      console.log('Loaded snapshots from server:', processedSnapshots.length);
      
      // Save backup
      localStorage.setItem('weeklySnapshots_backup', JSON.stringify(processedSnapshots));
    } catch (error) {
      console.error('Server request failed:', error);
      handleServerError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleServerError = (error) => {
    const errorMessage = error.response?.data?.message || error.message;
    console.log('Detailed error:', error);
    setError(`Failed to connect to server: ${errorMessage}. Using local backup if available.`);
    
    // Try loading from backup
    try {
      const backup = localStorage.getItem('weeklySnapshots_backup');
      if (backup) {
        const parsedBackup = JSON.parse(backup);
        setWeeklySnapshots(parsedBackup);
        setError('Server unavailable. Showing backup data which may not be current.');
      } else {
        setWeeklySnapshots([]);
        setError('Server unavailable and no backup data found.');
      }
    } catch (localError) {
      console.error('Backup loading failed:', localError);
      setError('Server unavailable and backup could not be accessed.');
    }
  };
  
  // Fetch full snapshot details
  const fetchSnapshotDetails = async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axiosInstance.get(`/api/snapshots/${id}`);
      if (!response.data) {
        throw new Error('Empty response received');
      }
      setSelectedSnapshot(response.data);
    } catch (error) {
      console.error('Error fetching snapshot details:', error);
      const errorMessage = error.response?.data?.details || error.message;
      setError(`Failed to fetch snapshot data (ID: ${id}). ${errorMessage}`);
      
      // Attempt to load from localStorage as fallback
      const localData = localStorage.getItem('weeklySnapshots');
      if (localData) {
        try {
          const snapshots = JSON.parse(localData);
          const localSnapshot = snapshots.find(s => s.id === id);
          if (localSnapshot) {
            console.log('Found snapshot in localStorage, using as fallback');
            setSelectedSnapshot(localSnapshot);
            setError(null);
          }
        } catch (e) {
          console.error('Error parsing localStorage data:', e);
        }
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Add helper to detect current week
  const detectCurrentWeek = (date) => {
    const weekSettings = JSON.parse(localStorage.getItem('weekTargetSettings'));
    if (!weekSettings) return null;
  
    const targetDate = new Date(date);
    
    for (const week of ['week1', 'week2', 'week3', 'week4']) {
      const weekData = weekSettings.ira[week] || weekSettings.cc[week];
      if (!weekData) continue;
      
      const startDate = new Date(weekData.startDate);
      const endDate = new Date(weekData.endDate);
      endDate.setHours(23, 59, 59);
  
      if (targetDate >= startDate && targetDate <= endDate) {
        return week.replace('week', '');
      }
    }
    return null;
  };
  
  const getCurrentWeekNumber = () => {
    try {
      const weekSettings = JSON.parse(localStorage.getItem('weekTargetSettings') || '{}');
      const today = new Date();
      
      for (const [week, settings] of Object.entries(weekSettings?.cc || {})) {
        const startDate = new Date(settings.startDate);
        const endDate = new Date(settings.endDate);
        if (today >= startDate && today <= endDate) {
          return parseInt(week.replace('week', ''));
        }
      }
    } catch (e) {
      console.error('Error determining current week:', e);
    }
    return null;
  };

  // Process and save current data as a weekly snapshot
  const saveCurrentSnapshot = async () => {
    if (!snapshotName.trim()) {
      alert('Please enter a name for this week\'s snapshot.');
      return;
    }
    
    if (!snapshotDate) {
      alert('Please select a valid date for the snapshot.');
      return;
    }
    
    if (!isValidDate(snapshotDate)) {
      alert('Cannot set a future date for snapshots.');
      return;
    }
    
    if (!iraData || !ccData) {
      alert('No data available to save.');
      return;
    }
    
    // Detect current week and create prefix
    const weekNumber = detectCurrentWeek(snapshotDate);
    const prefixedName = weekNumber ? 
      `W${weekNumber} ${snapshotName}` : 
      snapshotName;

    try {
      // Process IRA data with diagnostic logging
      console.log("Processing IRA data for snapshot...");
      const iraStats = processIraData(iraData);
      console.log("IRA stats calculated:", iraStats);
      
      // Process CC data
      console.log("Processing CC data for snapshot...");
      const ccStats = processCcData(ccData);
      console.log("CC stats calculated:", ccStats);
      
      // Create a snapshot with custom date
      const snapshot = {
        id: Date.now().toString(),
        name: prefixedName,
        date: new Date(snapshotDate + 'T12:00:00Z').toISOString(),
        weekNumber: weekNumber ? parseInt(weekNumber) : null,
        iraStats,
        ccStats
      };
      
      setLoading(true);
      setError(null);
      
      // Always save to server - this is now the primary storage
      try {
        console.log('Saving snapshot to server:', snapshot.name);
        
        const response = await axiosInstance.post('/snapshots', snapshot, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        console.log('Server response:', response.data);
        
        // Refresh the snapshots list
        await loadHistoricalData();
        
        // Reset form including date
        setSnapshotName('');
        setSnapshotDate(formatDateForInput(new Date()));
        
        // Confirmation
        alert(`Snapshot "${snapshotName}" has been saved successfully.`);
      } catch (error) {
        console.error('Error saving to server:', error);
        setError(`Failed to save snapshot: ${error.message}. Please check server connection.`);
      } finally {
        setLoading(false);
      }
    } catch (error) {
      console.error("Error processing data for snapshot:", error);
      setError(`Failed to process data: ${error.message}`);
    }
  };
  
  // Process IRA data into statistics - FIXED to properly detect percentage values
  const processIraData = (data) => {
    if (!data || !data.data || data.data.length === 0) {
      return { counted: 0, notCounted: 0, percentage: 0, branchPercentages: [] };
    }
    
    let counted = 0;
    let notCounted = 0;
    const branchGroups = {};
    
    // Initialize branch groups
    VALID_BRANCHES.forEach(branch => {
      branchGroups[branch] = { branch, counted: 0, total: 0 };
    });
    
    // Identify branch column - it might be named differently
    const branchColumnName = data.columns.find(col => 
      col === 'Lbl_Branch' || col === 'Branch' || col === 'Plant'
    ) || 'Lbl_Branch';
    
    console.log(`Using branch column for IRA data: ${branchColumnName}`);
    console.log(`First row of IRA data:`, data.data[0]);
    
    // Process data
    data.data.forEach(row => {
      let isCounted = false;
      
      // Check if %IRALine exists and convert any string/boolean values to numbers
      let iraLineValue = row['%IRALine'];
      
      if (iraLineValue === '1' || iraLineValue === 'true' || iraLineValue === true) {
        iraLineValue = 1;
        isCounted = true;
        counted++;
      } else if (iraLineValue === '0' || iraLineValue === 'false' || iraLineValue === false) {
        iraLineValue = 0;
      } else if (iraLineValue !== undefined && iraLineValue !== null) {
        // Try to convert to number if it's a string number
        const numValue = Number(iraLineValue);
        if (!isNaN(numValue)) {
          iraLineValue = numValue;
          if (numValue === 1) {
            isCounted = true;
            counted++;
          }
        }
      } else if (!isCounted && row['Count Status'] === 'Counted') {
        // Fallback to Count Status if %IRALine isn't available or is invalid
        isCounted = true;
        counted++;
      }
      
      if (!isCounted) {
        notCounted++;
      }
      
      // Process branch data - use the identified branch column
      if (row[branchColumnName] && VALID_BRANCHES.includes(row[branchColumnName])) {
        const branch = row[branchColumnName];
        branchGroups[branch].total++;
        
        if (isCounted) {
          branchGroups[branch].counted++;
        }
      }
    });
    
    // Calculate percentages
    const branchPercentages = [];
    Object.values(branchGroups).forEach(group => {
      if (group.total > 0) {
        branchPercentages.push({
          branch: group.branch,
          percentage: (group.counted / group.total) * 100
        });
      }
    });
    
    const total = counted + notCounted;
    const percentage = total > 0 ? (counted / total) * 100 : 0;
    
    console.log(`IRA stats: counted=${counted}, notCounted=${notCounted}, total=${total}, percentage=${percentage.toFixed(2)}%`);
    
    return {
      counted,
      notCounted,
      percentage,
      branchPercentages
    };
  };
  
  // Process CC data into statistics
  const processCcData = (data) => {
    if (!data || !data.data || data.data.length === 0) {
      return { counted: 0, notCounted: 0, percentage: 0, branchPercentages: [] };
    }
    
    let counted = 0;
    let notCounted = 0;
    const branchGroups = {};
    
    // Initialize branch groups
    VALID_BRANCHES.forEach(branch => {
      branchGroups[branch] = { branch, counted: 0, total: 0 };
    });
    
    // Identify branch column
    const branchColumn = data.columns.find(col => 
      col === 'Plant' || col === '!Branch' || col === 'Branch'
    );
    
    if (!branchColumn) {
      console.error('Could not find branch column in CC data');
      return { counted: 0, notCounted: 0, percentage: 0, branchPercentages: [] };
    }
    
    // Filter out LIVE_PICA
    const filteredData = data.data.filter(row => row.StorageType !== 'LIVE_PICA');
    
    // Process data
    filteredData.forEach(row => {
      if (row['%CountComp'] === 1 || row['Count Status'] === 'Counted') {
        counted++;
      } else {
        notCounted++;
      }
      
      // Process branch data
      const branch = row[branchColumn];
      if (branch && VALID_BRANCHES.includes(branch)) {
        branchGroups[branch].total++;
        
        if (row['%CountComp'] === 1 || row['Count Status'] === 'Counted') {
          branchGroups[branch].counted++;
        }
      }
    });
    
    // Calculate percentages
    const branchPercentages = [];
    Object.values(branchGroups).forEach(group => {
      if (group.total > 0) {
        branchPercentages.push({
          branch: group.branch,
          percentage: (group.counted / group.total) * 100
        });
      }
    });
    
    const total = counted + notCounted;
    const percentage = total > 0 ? (counted / total) * 100 : 0;
    
    return {
      counted,
      notCounted,
      percentage,
      branchPercentages
    };
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  // View snapshot details with localStorage fallback
  const handleViewSnapshot = async (snapshot) => {
    try {
      setLoading(true);
      const fullSnapshot = await fetchSnapshotById(snapshot.id);
      setSelectedSnapshot(fullSnapshot);
      if (onSnapshotSelect) {
        onSnapshotSelect(fullSnapshot);
      }
    } catch (error) {
      console.error('Error loading snapshot:', error);
      setError('Failed to load snapshot details: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const BRANCH_CODES = {
    'MEDAN': '1951',
    'JAKARTA 1': '1910',
    'SEMARANG': '1930',
    'MAKASSAR': '1961',
    'BANDAR LAMPUNG': '1957',
    'PALEMBANG': '1956',
    'TANGERANG': '1921',
    'PONTIANAK': '1972',
    'BANDUNG': '1922',
    'YOGYAKARTA': '1932',
    'JAYAPURA': '1982',
    'BANJARMASIN': '1970',
    'PALU': '1962',
    'BATAM': '1954',
    'PEKANBARU': '1953',
    'KUPANG': '1981',
    'JAMBI': '1955',
    'SURABAYA': '1940',
    'BOGOR': '1920',
    'PADANG': '1952',
    'SAMARINDA': '1971',
    'DENPASAR': '1980',
    'MANADO': '1960'
  };

  const getBranchWithCode = (branchName) => {
    const city = branchName.replace('PT. APL ', '');
    const code = BRANCH_CODES[city] || '';
    return code ? `${code} - ${branchName}` : branchName;
  };

  // Export snapshot to Excel
  const exportSnapshotToExcel = (snapshot) => {
    try {
      const wb = XLSX.utils.book_new();
      
      // Convert decimal points to commas for Excel
      const formatPercentage = (value) => `${value.toFixed(2).replace('.', ',')}%`;
      
      // Create summary worksheet with combined data
      const summaryData = [
        ['Snapshot Name:', snapshot.name],
        ['Date:', formatDate(snapshot.date)],
        [''],
        ['IRA Overall:', formatPercentage(snapshot.iraStats.percentage)],
        ['CC Overall:', formatPercentage(snapshot.ccStats.percentage)],
        [''],
        ['Branch', 'IRA %', 'CC %']
      ];
      
      // Create a map of branches for easier lookup
      const iraBranchMap = {};
      snapshot.iraStats.branchPercentages.forEach(branch => {
        iraBranchMap[branch.branch] = branch.percentage;
      });
      
      const ccBranchMap = {};
      snapshot.ccStats.branchPercentages.forEach(branch => {
        ccBranchMap[branch.branch] = branch.percentage;
      });
      
      // Add all branches sorted by CC percentage
      const sortedBranches = [...VALID_BRANCHES];
      sortedBranches.sort((a, b) => {
        const aPercentage = ccBranchMap[a] || 0;
        const bPercentage = ccBranchMap[b] || 0;
        return bPercentage - aPercentage;
      });
      
      sortedBranches.forEach(branch => {
        summaryData.push([
          getBranchWithCode(branch), // Add branch code here
          iraBranchMap[branch] ? formatPercentage(iraBranchMap[branch]) : 'N/A',
          ccBranchMap[branch] ? formatPercentage(ccBranchMap[branch]) : 'N/A'
        ]);
      });
      
      // Create worksheets
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      
      // Add worksheets to workbook
      XLSX.utils.book_append_sheet(wb, summarySheet, 'Snapshot Summary');
      
      // Create detailed IRA worksheet
      const iraDetailData = [
        ['IRA Summary'],
        ['Counted', snapshot.iraStats.counted],
        ['Not Counted', snapshot.iraStats.notCounted],
        ['Percentage', `${snapshot.iraStats.percentage.toFixed(2)}%`],
        [''],
        ['Branch', 'IRA %']
      ];
      
      // Update IRA details
      snapshot.iraStats.branchPercentages
        .sort((a, b) => b.percentage - a.percentage)
        .forEach(branch => {
          iraDetailData.push([
            branch.branch,
            formatPercentage(branch.percentage)
          ]);
        });
      
      const iraDetailSheet = XLSX.utils.aoa_to_sheet(iraDetailData);
      XLSX.utils.book_append_sheet(wb, iraDetailSheet, 'IRA Details');
      
      // Create detailed CC worksheet
      const ccDetailData = [
        ['Cycle Count Summary'],
        ['Counted', snapshot.ccStats.counted],
        ['Not Counted', snapshot.ccStats.notCounted],
        ['Percentage', `${snapshot.ccStats.percentage.toFixed(2)}%`],
        [''],
        ['Branch', 'CC %']
      ];
      
      // Update CC details
      snapshot.ccStats.branchPercentages
        .sort((a, b) => b.percentage - a.percentage)
        .forEach(branch => {
          ccDetailData.push([
            branch.branch,
            formatPercentage(branch.percentage)
          ]);
        });
      
      const ccDetailSheet = XLSX.utils.aoa_to_sheet(ccDetailData);
      XLSX.utils.book_append_sheet(wb, ccDetailSheet, 'CC Details');
      
      // Save the Excel file
      XLSX.writeFile(wb, `snapshot-${snapshot.name.replace(/\s+/g, '-')}.xlsx`);
    } catch (error) {
      console.error('Error exporting snapshot to Excel:', error);
      alert('Failed to export snapshot to Excel. Please try again.');
    }
  };
  
  // Get short branch name
  const getBranchShortName = (fullName) => {
    const parts = fullName.split(' - ');
    if (parts.length > 1) {
      return parts[1].replace('PT. APL ', '');
    }
    return fullName;
  };
  
  // Handle file selection for import
  const handleImportFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      setLoading(true);
      const count = await importLocalSnapshots(file);
      alert(`Successfully imported ${count} snapshots`);
      await loadHistoricalData();
    } catch (error) {
      setError(`Failed to import snapshots: ${error.message}`);
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Add function to view snapshot in dashboard/analyze
  const handleViewSnapshot = async (snapshot) => {
    try {
      setLoading(true);
      const fullSnapshot = await fetchSnapshotById(snapshot.id);
      setSelectedSnapshot(fullSnapshot);
      if (onSnapshotSelect) {
        onSnapshotSelect(fullSnapshot);
      }
    } catch (error) {
      console.error('Error loading snapshot:', error);
      setError('Failed to load snapshot details: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSnapshot = async (id) => {
    if (window.confirm('Are you sure you want to delete this snapshot?')) {
      try {
        setLoading(true);
        await deleteSnapshot(id);
        setWeeklySnapshots(prev => prev.filter(s => s.id !== id));
        if (selectedSnapshot?.id === id) {
          setSelectedSnapshot(null);
        }
        handleSuccess('Snapshot deleted successfully');
      } catch (error) {
        console.error('Error deleting snapshot:', error);
        setError('Failed to delete snapshot: ' + error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="historical-data-container">
      {error && (
        <div className="alert alert-danger mb-4">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </div>
      )}
      
      <div className="row">
        <div className="col-lg-12 mb-4">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Save Current Week's Data</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-5">
                  <div className="form-group mb-3">
                    <label htmlFor="snapshotName">Week Name/Identifier:</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      id="snapshotName" 
                      placeholder="e.g., Week 23 - Jun 5-11, 2023" 
                      value={snapshotName}
                      onChange={(e) => setSnapshotName(e.target.value)}
                    />
                    <small className="form-text text-muted">
                      Enter a descriptive name to identify this week's data.
                    </small>
                  </div>
                </div>
                
                <div className="col-md-3">
                  <div className="form-group mb-3">
                    <label htmlFor="snapshotDate">Snapshot Date:</label>
                    <input 
                      type="date" 
                      className="form-control" 
                      id="snapshotDate" 
                      value={snapshotDate}
                      onChange={(e) => setSnapshotDate(e.target.value)}
                      max={formatDateForInput(new Date())} // Prevent future dates
                    />
                    <small className="form-text text-muted">
                      Select the date for this snapshot.
                    </small>
                  </div>
                </div>
                
                <div className="col-md-4 d-flex align-items-end">
                  <button 
                    className="btn btn-primary w-100" 
                    onClick={saveCurrentSnapshot}
                    disabled={!snapshotName.trim() || !snapshotDate || !iraData || !ccData || loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-save me-2"></i>
                        Save Current Week's Data
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Add storage location info card */}
      <div className="row mb-4">
        <div className="col-lg-12">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="bi bi-database me-2"></i>
                Storage Information
              </h5>
              <button
                className="btn btn-sm btn-outline-info"
                onClick={loadHistoricalData}
              >
                <i className="bi bi-arrow-clockwise me-1"></i>
                Refresh Data
              </button>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-8">
                  <p className="mb-2">
                    <strong>Current Storage:</strong>{' '}
                    <span className="badge bg-success">Server Database</span>
                  </p>
                  <p className="mb-2">
                    <strong>Path:</strong> <code>Server Database</code>
                  </p>
                  <div className="alert alert-info">
                    <i className="bi bi-info-circle me-2"></i>
                    Snapshots are stored on the server for improved durability and sharing capabilities.
                    A local backup is maintained for emergency offline access only.
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="d-grid gap-2">
                    <button 
                      className="btn btn-outline-primary"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = '/api/snapshots/export';
                        link.download = `snapshots-backup-${new Date().toISOString().split('T')[0]}.json`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                    >
                      <i className="bi bi-download me-2"></i>
                      Export Snapshots
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="row">
        <div className="col-lg-5">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Saved Weekly Snapshots</h5>
              <button 
                className="btn btn-sm btn-outline-primary" 
                onClick={loadHistoricalData}
                disabled={loading}
              >
                <i className="bi bi-arrow-clockwise me-1"></i>
                Refresh
              </button>
            </div>
            <div className="card-body p-0">
              {loading && !weeklySnapshots.length ? (
                <div className="text-center p-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : weeklySnapshots.length === 0 ? (
                <div className="alert alert-info m-3">
                  <i className="bi bi-info-circle me-2"></i>
                  No weekly snapshots saved yet. Save your first week's data to begin tracking.
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {weeklySnapshots
                    .sort((a, b) => new Date(b.date) - new Date(a.date)) // Sort by date, newest first
                    .map(snapshot => (
                    <div 
                      key={snapshot.id} 
                      className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${selectedSnapshot && selectedSnapshot.id === snapshot.id ? 'active' : ''}`}
                      onClick={() => handleViewSnapshot(snapshot)}
                    >
                      <div>
                        <h6 className="mb-1">{snapshot.name}</h6>
                        <small>{formatDate(snapshot.date)}</small>
                      </div>
                      <div>
                        <span className="badge bg-primary rounded-pill me-2">
                          IRA: {(snapshot.iraPercentage || 0).toFixed(1)}%
                        </span>
                        <span className="badge bg-info rounded-pill me-2">
                          CC: {(snapshot.ccPercentage || 0).toFixed(1)}%
                        </span>
                        <div className="btn-group">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleViewSnapshot(snapshot)}
                            title="View in Dashboard/Analyze"
                          >
                            <i className="bi bi-eye"></i> View
                          </button>
                          {selectedSnapshot && selectedSnapshot.id === snapshot.id && (
                            <button
                              className="btn btn-sm btn-outline-success"
                              onClick={(e) => {
                                e.stopPropagation();
                                exportSnapshotToExcel(selectedSnapshot);
                              }}
                              title="Export to Excel"
                            >
                              <i className="bi bi-file-excel"></i>
                            </button>
                          )}
                          <button 
                            className="btn btn-sm btn-outline-danger" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSnapshot(snapshot.id);
                            }}
                            title="Delete snapshot"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="col-lg-7">
          {selectedSnapshot ? (
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0">{selectedSnapshot.name} Details</h5>
                <div>
                  <small className="me-3">{formatDate(selectedSnapshot.date)}</small>
                  <button
                    className="btn btn-sm btn-outline-success"
                    onClick={() => exportSnapshotToExcel(selectedSnapshot)}
                    title="Export to Excel"
                  >
                    <i className="bi bi-file-excel me-1"></i>
                    Export to Excel
                  </button>
                </div>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6">
                    <div className="card mb-3">
                      <div className="card-header bg-primary text-white">IRA Summary</div>
                      <div className="card-body">
                        <div className="d-flex justify-content-between mb-3">
                          <div>
                            <h6>Counted</h6>
                            <h4>{selectedSnapshot.iraStats.counted}</h4>
                          </div>
                          <div>
                            <h6>Not Counted</h6>
                            <h4>{selectedSnapshot.iraStats.notCounted}</h4>
                          </div>
                          <div>
                            <h6>Percentage</h6>
                            <h4>{selectedSnapshot.iraStats.percentage.toFixed(2)}%</h4>
                          </div>
                        </div>
                        <h6>Top Branches</h6>
                        <ul className="list-group">
                          {selectedSnapshot.iraStats.branchPercentages
                            .sort((a, b) => b.percentage - a.percentage)
                            .slice(0, 5)
                            .map((branch, index) => (
                              <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                                <span>{getBranchShortName(branch.branch)}</span>
                                <span className="badge bg-primary rounded-pill">
                                  {branch.percentage.toFixed(1)}%
                                </span>
                              </li>
                            ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <div className="card mb-3">
                      <div className="card-header bg-info text-white">CC Summary</div>
                      <div className="card-body">
                        <div className="d-flex justify-content-between mb-3">
                          <div>
                            <h6>Counted</h6>
                            <h4>{selectedSnapshot.ccStats.counted}</h4>
                          </div>
                          <div>
                            <h6>Not Counted</h6>
                            <h4>{selectedSnapshot.ccStats.notCounted}</h4>
                          </div>
                          <div>
                            <h6>Percentage</h6>
                            <h4>{selectedSnapshot.ccStats.percentage.toFixed(2)}%</h4>
                          </div>
                        </div>
                        <h6>Top Branches</h6>
                        <ul className="list-group">
                          {selectedSnapshot.ccStats.branchPercentages
                            .sort((a, b) => b.percentage - a.percentage)
                            .slice(0, 5)
                            .map((branch, index) => (
                              <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                                <span>{getBranchShortName(branch.branch)}</span>
                                <span className="badge bg-info rounded-pill">
                                  {branch.percentage.toFixed(1)}%
                                </span>
                              </li>
                            ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="row">
                  <div className="col-12">
                    <div className="card">
                      <div className="card-header">All Branch Data (Sorted by CC %)</div>
                      <div className="card-body">
                        <div className="table-responsive">
                          <table className="table table-sm table-striped">
                            <thead>
                              <tr>
                                <th>Branch</th>
                                <th className="text-end">IRA %</th>
                                <th className="text-end">CC %</th>
                              </tr>
                            </thead>
                            <tbody>
                              {/* Create a map of branches for easier lookup */}
                              {(() => {
                                const iraBranchMap = {};
                                selectedSnapshot.iraStats.branchPercentages.forEach(branch => {
                                  iraBranchMap[branch.branch] = branch.percentage;
                                });
                                
                                const ccBranchMap = {};
                                selectedSnapshot.ccStats.branchPercentages.forEach(branch => {
                                  ccBranchMap[branch.branch] = branch.percentage;
                                });
                                
                                // Sort branches by CC percentage (largest to smallest)
                                const sortedBranches = [...VALID_BRANCHES];
                                return sortedBranches
                                  .filter(branch => ccBranchMap[branch] !== undefined || iraBranchMap[branch] !== undefined)
                                  .sort((a, b) => {
                                    const aPercentage = ccBranchMap[a] || 0;
                                    const bPercentage = ccBranchMap[b] || 0;
                                    return bPercentage - aPercentage;
                                  })
                                  .map((branch, index) => (
                                    <tr key={index}>
                                      <td>{getBranchShortName(branch)}</td>
                                      <td className="text-end">{iraBranchMap[branch] ? iraBranchMap[branch].toFixed(2) : 'N/A'}%</td>
                                      <td className="text-end">{ccBranchMap[branch] ? ccBranchMap[branch].toFixed(2) : 'N/A'}%</td>
                                    </tr>
                                  ));
                              })()}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="card-body text-center p-5">
                <i className="bi bi-arrow-left-circle display-1 text-muted"></i>
                <h5 className="mt-3">Select a Weekly Snapshot</h5>
                <p className="text-muted">
                  Click on any weekly snapshot from the list to view its details.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default HistoricalDataComponent;

import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import axios from 'axios';

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

const getBranchShortName = (fullName) => {
  const parts = fullName.split(' - ');
  if (parts.length > 1) {
    return parts[1].replace('PT. APL ', '');
  }
  return fullName;
};

export const useIraCcDashboardLogic = ({ iraData, ccData, snapshotInfo }) => {
  const [iraStats, setIraStats] = useState({
    counted: 0,
    notCounted: 0,
    percentage: 0,
    branchPercentages: []
  });
  const [ccStats, setCcStats] = useState({
    counted: 0,
    notCounted: 0,
    percentage: 0,
    branchPercentages: []
  });
  const [currentWeek, setCurrentWeek] = useState(null);
  const [weekSettings, setWeekSettings] = useState(null); // Define weekSettings state
  const [availablePeriods, setAvailablePeriods] = useState([]); // Define availablePeriods state
  const [selectedPeriod, setSelectedPeriod] = useState(''); // Define selectedPeriod state
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null); // Define success state
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);  // Add this state for logging

  // Add logging function
  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, message, type }]);
    console.log(`[${timestamp}] ${type.toUpperCase()}: ${message}`);
  };

  useEffect(() => {
    const savedSettings = localStorage.getItem('weekTargetSettings');
    if (savedSettings) {
      try {
        setWeekSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error('Error parsing saved week settings:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (!weekSettings) return;
    
    const today = new Date();
    const ccWeeks = weekSettings.cc;
    const iraWeeks = weekSettings.ira;
    
    const isInRange = (startDate, endDate) => {
      if (!startDate || !endDate) return false;
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      return today >= start && today <= end;
    };
    
    const currentWeeks = {
      cc: null,
      ira: null
    };
    
    ['week1', 'week2', 'week3', 'week4'].forEach(week => {
      if (isInRange(ccWeeks[week].startDate, ccWeeks[week].endDate)) {
        currentWeeks.cc = {
          week,
          target: ccWeeks[week].target,
          startDate: ccWeeks[week].startDate,
          endDate: ccWeeks[week].endDate
        };
      }
      
      if (isInRange(iraWeeks[week].startDate, iraWeeks[week].endDate)) {
        currentWeeks.ira = {
          week,
          target: iraWeeks[week].target,
          startDate: iraWeeks[week].startDate,
          endDate: iraWeeks[week].endDate
        };
      }
    });
    
    setCurrentWeek(currentWeeks);
  }, [weekSettings]);

  const normalizeColumnName = (name) => {
    // Remove special characters and convert to lowercase for comparison
    return String(name)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
  };

const hasNumericColumns = (columns) => {
  return columns.every(col => !isNaN(col) || col.trim() === '');
};

const normalizeColumns = (data) => {
  if (!data || !data.data || data.data.length === 0) return data;

  // Check if we need to normalize
  const currentColumns = data.columns || Object.keys(data.data[0]);
  
  // If columns are already valid, return original data
  const hasValidColumns = currentColumns.some(col => 
    branchColumnVariants.includes(col) || 
    ['%IRALine', '%CountComp', 'Count Status'].includes(col)
  );
  
  if (!hasNumericColumns(currentColumns) || hasValidColumns) {
    return data;
  }

  // Use first row as headers
  const firstRow = data.data[0];
  const newData = data.data.slice(1).map(row => {
    const newRow = {};
    currentColumns.forEach((col, index) => {
      newRow[firstRow[col]] = row[col];
    });
    return newRow;
  });

  return {
    ...data,
    columns: Object.keys(newData[0]),
    data: newData
  };
};

const branchColumnVariants = [
  'Branch', '!Branch', 'Plant', 'Lbl_Branch',
  'branch', 'plant', 'lblbranch', 'branchname',
  'plantname', 'branch_name', 'plant_name'
];

  const findBranchColumn = (columns, addLog) => {
    const branchColumnVariants = [
      'Branch', '!Branch', 'Plant', 'Lbl_Branch',
      'branch', 'plant', 'lblbranch', 'branchname',
      'plantname', 'branch_name', 'plant_name'
    ];

    // Log available columns for debugging
    addLog(`Available columns: ${columns.join(', ')}`, 'info');

    // First try exact match
    const exactMatch = columns.find(col => 
      branchColumnVariants.includes(col)
    );

    if (exactMatch) {
      addLog(`Found exact branch column match: ${exactMatch}`, 'success');
      return exactMatch;
    }

    // Try normalized match
    const normalizedColumns = columns.map(col => ({
      original: col,
      normalized: normalizeColumnName(col)
    }));

    const normalizedVariants = branchColumnVariants.map(v => normalizeColumnName(v));

    const normalizedMatch = normalizedColumns.find(col =>
      normalizedVariants.includes(col.normalized)
    );

    if (normalizedMatch) {
      addLog(`Found normalized branch column match: ${normalizedMatch.original}`, 'success');
      return normalizedMatch.original;
    }

    // Log failure to find branch column
    addLog('No branch column found in any known format', 'warning');
    return null;
  };

const normalizeDataWithFirstRow = (data) => {
  if (!data || !data.data || data.data.length < 2) return data;

  const currentColumns = data.columns;
  // Check if columns are numeric or empty strings
  const needsNormalization = currentColumns.every(col => 
    !isNaN(col) || col.trim() === ''
  );

  if (!needsNormalization) {
    return data;
  }

  // Use first row as headers
  const firstRow = data.data[0];
  const newColumns = currentColumns.map(col => firstRow[col] || col);
  const newData = data.data.slice(1).map(row => {
    const newRow = {};
    currentColumns.forEach((col, index) => {
      newRow[newColumns[index]] = row[col];
    });
    return newRow;
  });

  return {
    ...data,
    columns: newColumns,
    data: newData
  };
};

const processIraDataCore = (data) => {
  addLog('Starting IRA data processing...', 'info');
  
  // Normalize columns if needed
  const normalizedData = normalizeColumns(data);
  addLog('Column normalization complete', 'info');
  
  if (data?.iraStats || (data.percentage !== undefined && data.branchPercentages !== undefined)) {
    addLog('Using pre-processed IRA data from snapshot', 'info');
    return data.iraStats || data;
  }

  if (!data || !data.data || data.data.length === 0) {
    addLog('No IRA data to process', 'error');
    return { counted: 0, notCounted: 0, percentage: 0, branchPercentages: [] };
  }

  addLog(`Processing ${data.data.length} rows of IRA data`, 'info');
  
  // Enhanced branch column detection
  const branchColumn = findBranchColumn(data.columns, addLog);
  
  if (!branchColumn) {
    addLog('WARNING: Could not find branch column. Data processing may be incomplete.', 'warning');
    // Continue processing but log the issue
  } else {
    addLog(`Using branch column for IRA: ${branchColumn}`, 'info');
  }

  // Initialize branch groups
  const branchGroups = {};
  VALID_BRANCHES.forEach(branch => {
    branchGroups[branch] = { branch, counted: 0, total: 0 };
  });

  // Process each row
  let countedItems = 0;
  let totalItems = 0;

  data.data.forEach((row, index) => {
    if (!row) return;

    let isIraLine = false;
    const iraValue = row['%IRALine'];
    const countStatus = row['Count Status'];
    const branch = branchColumn ? row[branchColumn] : null;

    // Enhanced IRA line detection
    if (iraValue === 1 || iraValue === '1' || iraValue === true || 
        iraValue === 'true' || countStatus === 'Counted') {
      isIraLine = true;
      countedItems++;
    }

    totalItems++;

    if (branch) {
      // Log first few branch values for debugging
      if (index < 5) {
        addLog(`Sample branch value [${index}]: ${branch}`, 'info');
      }

      // Normalize branch value before comparison
      const normalizedBranch = VALID_BRANCHES.find(valid => 
        valid.includes(branch) || branch.includes(valid.split(' - ')[1])
      );

      if (normalizedBranch) {
        branchGroups[normalizedBranch].total++;
        if (isIraLine) {
          branchGroups[normalizedBranch].counted++;
        }
      }
    }
  });

  const percentage = totalItems > 0 ? (countedItems / totalItems) * 100 : 0;
  
  // Calculate branch percentages
  const branchPercentages = Object.values(branchGroups)
    .filter(group => group.total > 0)
    .map(group => ({
      branch: group.branch,
      percentage: (group.counted / group.total) * 100
    }));

  addLog(`Processing complete - Counted: ${countedItems}, Total: ${totalItems}, Overall: ${percentage.toFixed(2)}%`, 'success');

  return {
    counted: countedItems,
    notCounted: totalItems - countedItems,
    percentage,
    branchPercentages
  };
};

const processCcDataCore = (data) => {
  addLog('Starting CC data processing...', 'info');
  
  // Normalize columns if needed
  const normalizedData = normalizeColumns(data);
  addLog('Column normalization complete', 'info');
  
  if (data?.ccStats || (data.percentage !== undefined && data.branchPercentages !== undefined)) {
    addLog('Using pre-processed CC data from snapshot', 'info');
    return data.ccStats || data;
  }

  if (!data || !data.data || data.data.length === 0) {
    addLog('No CC data to process', 'error');
    return { counted: 0, notCounted: 0, percentage: 0, branchPercentages: [] };
  }

  addLog(`Processing ${data.data.length} rows of CC data`, 'info');
  
  const branchGroups = {};
  VALID_BRANCHES.forEach(branch => {
    branchGroups[branch] = { branch, counted: 0, total: 0 };
  });

  const branchColumn = findBranchColumn(data.columns, addLog);
  
  if (!branchColumn) {
    addLog('WARNING: Could not find branch column in CC data. Data processing may be incomplete.', 'warning');
  } else {
    addLog(`Using branch column for CC: ${branchColumn}`, 'info');
  }

  let counted = 0;
  let notCounted = 0;

  // Enhanced CC counting logic
  data.data.forEach(row => {
    if (!row) return;
    
    const countStatus = row['Count Status'];
    const countComp = row['%CountComp'];
    const branch = branchColumn ? row[branchColumn] : null;

    const isCounted = 
      countStatus === 'Counted' || 
      countComp === 1 || 
      countComp === '1' || 
      countComp === true;

    if (isCounted) {
      counted++;
      if (branch && VALID_BRANCHES.includes(branch)) {
        branchGroups[branch].counted++;
      }
    } else {
      notCounted++;
    }

    if (branch && VALID_BRANCHES.includes(branch)) {
      branchGroups[branch].total++;
    }
  });

  const totalItems = counted + notCounted;
  const percentage = totalItems > 0 ? (counted / totalItems) * 100 : 0;

  // Calculate branch percentages
  const branchPercentages = Object.values(branchGroups)
    .filter(group => group.total > 0)
    .map(group => ({
      branch: group.branch,
      percentage: (group.counted / group.total) * 100
    }));

  addLog(`CC Stats - Counted: ${counted}, Not Counted: ${notCounted}, Total: ${totalItems}, Percentage: ${percentage.toFixed(2)}%`, 'success');

  return {
    counted,
    notCounted,
    percentage,
    branchPercentages
  };
};

const processIraData = (data) => {
  addLog('Starting IRA data processing...', 'info');
  
  // First normalize the data structure if needed
  const normalizedData = normalizeDataWithFirstRow(data);
  addLog('Normalized data structure using first row as headers if needed', 'info');

  // Continue with existing processing logic
  const processedData = processIraDataCore(normalizedData);
  return processedData;
};

const processCcData = (data) => {
  addLog('Starting CC data processing...', 'info');
  
  // First normalize the data structure if needed
  const normalizedData = normalizeDataWithFirstRow(data);
  addLog('Normalized data structure using first row as headers if needed', 'info');

  // Continue with existing processing logic
  const processedData = processCcDataCore(normalizedData);
  return processedData;
};

  useEffect(() => {
    if (iraData && ccData) {
      addLog('Processing new uploads...', 'info');
      
      try {
        // Process IRA data
        addLog('Starting IRA data processing...', 'info');
        const iraStats = processIraData(iraData);
        setIraStats(iraStats);
        addLog('IRA data processed successfully', 'success');
        
        // Process CC data
        addLog('Starting CC data processing...', 'info');
        const ccStats = processCcData(ccData);
        setCcStats(ccStats);
        addLog('CC data processed successfully', 'success');
      } catch (error) {
        addLog(`Error processing data: ${error.message}`, 'error');
        setError(`Failed to process data: ${error.message}`);
      }
    } else if (snapshotInfo) {
      addLog('Loading data from snapshot...', 'info');
      setIraStats(snapshotInfo.iraStats || {});
      setCcStats(snapshotInfo.ccStats || {});
      addLog('Snapshot data loaded successfully', 'success');
    }
  }, [iraData, ccData, snapshotInfo]);

  const exportAsExcel = () => {
    try {
      const wb = XLSX.utils.book_new();
      const combinedData = [
        ['No.', 'Branch', 'IRA %', 'IRA Status', 'CC %', 'CC Status']
      ];

      const branchesWithData = VALID_BRANCHES.map((branch, index) => {
        const iraBranch = iraStats.branchPercentages.find(b => b.branch === branch);
        const ccBranch = ccStats.branchPercentages.find(b => b.branch === branch);

        return {
          no: index + 1,
          branch,
          ira: iraBranch ? iraBranch.percentage : 0,
          cc: ccBranch ? ccBranch.percentage : 0
        };
      })
      .sort((a, b) => b.cc - a.cc);

      branchesWithData.forEach(branch => {
        const iraStatus = currentWeek?.ira 
          ? (branch.ira >= currentWeek.ira.target ? 'On Target' : 'Below Target')
          : '';
        const ccStatus = currentWeek?.cc 
          ? (branch.cc >= currentWeek.cc.target ? 'On Target' : 'Below Target')
          : '';

        combinedData.push([
          branch.no,
          branch.branch,
          `${branch.ira.toFixed(2)}%`,
          iraStatus,
          `${branch.cc.toFixed(2)}%`,
          ccStatus
        ]);
      });

      const ws = XLSX.utils.aoa_to_sheet(combinedData);
      XLSX.utils.book_append_sheet(wb, ws, 'Combined Report');
      XLSX.writeFile(wb, 'ira-cc-dashboard.xlsx');
    } catch (error) {
      console.error('Error exporting dashboard as Excel:', error);
      alert('Failed to export as Excel. Please try again.');
    }
  };

  const createEmailDraft = async () => {
    try {
      if (!snapshotInfo && (!iraData || !ccData)) {
        setError('No data available to create email draft');
        return;
      }
  
      setLoading(true);
  
      if (snapshotInfo) {
        const response = await axios.post('/api/snapshots/email-draft', {
          snapshotId: snapshotInfo.id
        });
        
        if (response.data.emailUrl) {
          window.open(response.data.emailUrl, '_blank');
        } else {
          throw new Error('No email URL received from server');
        }
      } else {
        const snapshot = {
          id: Date.now().toString(),
          name: `Snapshot ${new Date().toLocaleDateString()}`,
          date: new Date().toISOString(),
          iraStats: iraStats,
          ccStats: ccStats
        };
  
        const saveResponse = await axios.post('/api/snapshots', snapshot);
        
        const emailResponse = await axios.post('/api/snapshots/email-draft', {
          snapshotId: saveResponse.data.id
        });
  
        if (emailResponse.data.emailUrl) {
          window.open(emailResponse.data.emailUrl, '_blank');
        } else {
          throw new Error('No email URL received from server');
        }
      }
  
      setSuccess('Email draft created successfully');
    } catch (error) {
      console.error('Error creating email draft:', error);
      setError('Failed to create email draft: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (settings) => {
    try {
      setLoading(true);
      setError(null);
      
      // Validate settings
      if (!settings || (!settings.ira && !settings.cc)) {
        throw new Error('Invalid settings format');
      }
      
      // Save to localStorage
      localStorage.setItem('weekTargetSettings', JSON.stringify(settings));
      
      // Update state
      setWeekSettings(settings);
      
      setSuccess('Week settings saved successfully');
      return true;
    } catch (error) {
      console.error('Error saving week settings:', error);
      setError('Failed to save week settings: ' + error.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    iraStats,
    ccStats,
    currentWeek,
    error,
    loading,
    exportAsExcel,
    createEmailDraft,
    getBranchShortName,
    VALID_BRANCHES,
    handleSaveSettings,  // Add this to the return object
    logs,
    addLog,
  };
};

import { useState, useEffect } from 'react';
import PropTypes from 'prop-types'; // Add this import
import * as XLSX from 'xlsx';
import axios from 'axios';
import { useLanguage } from '../../context/LanguageContext';

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

export const useIraCcDashboardLogic = ({ iraData, ccData, snapshotInfo, onError }) => { // Add onError param
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
  
  // Early returns for pre-processed data
  if (data?.ccStats || (data.percentage !== undefined && data.branchPercentages !== undefined)) {
    addLog('Using pre-processed CC data from snapshot', 'info');
    return data.ccStats || data;
  }

  if (!data || !data.data || data.data.length === 0) {
    addLog('No CC data to process', 'error');
    return { counted: 0, notCounted: 0, percentage: 0, branchPercentages: [] };
  }

  const branchGroups = {};
  VALID_BRANCHES.forEach(branch => {
    branchGroups[branch] = { branch, counted: 0, total: 0 };
  });

  let counted = 0;
  let notCounted = 0;

  // First pass: set %CountComp based on Count Status
  data.data = data.data.map(row => {
    const updatedRow = { ...row };
    if (updatedRow['Count Status'] === 'Counted' && updatedRow['%CountComp'] !== 1) {
      updatedRow['%CountComp'] = 1;
    }
    return updatedRow;
  });

  // Second pass: calculate statistics using %CountComp
  data.data.forEach(row => {
    if (!row) return;
    
    const branch = row.Branch || row['!Branch'] || row.Plant;
    const countComp = Number(row['%CountComp']);
    
    // Use only %CountComp for counting
    if (countComp === 1) {
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
  if (snapshotInfo) {
    // Parse snapshot JSON data
    addLog('Loading data from snapshot...', 'info');
    try {
      let parsedIraStats, parsedCcStats;

      if (typeof snapshotInfo.iraStats === 'string') {
        parsedIraStats = JSON.parse(snapshotInfo.iraStats);
      } else {
        parsedIraStats = snapshotInfo.iraStats;
      }

      if (typeof snapshotInfo.ccStats === 'string') {
        parsedCcStats = JSON.parse(snapshotInfo.ccStats);
      } else {
        parsedCcStats = snapshotInfo.ccStats;
      }

      // Ensure branchPercentages is an array
      if (!Array.isArray(parsedIraStats.branchPercentages)) {
        parsedIraStats.branchPercentages = Object.entries(parsedIraStats.branchPercentages)
          .map(([branch, percentage]) => ({ branch, percentage }));
      }

      if (!Array.isArray(parsedCcStats.branchPercentages)) {
        parsedCcStats.branchPercentages = Object.entries(parsedCcStats.branchPercentages)
          .map(([branch, percentage]) => ({ branch, percentage }));
      }

      setIraStats(parsedIraStats);
      setCcStats(parsedCcStats);
      addLog('Snapshot data loaded and parsed successfully', 'success');
    } catch (error) {
      addLog('Error parsing snapshot data: ' + error.message, 'error');
      setError('Failed to parse snapshot data');
    }
  } else if (iraData && ccData) {
    // ...existing code for handling uploaded data...
  }
}, [snapshotInfo, iraData, ccData]);

// Update data processing functions to handle JSON string data
const processSnapshotData = (snapshotData) => {
  if (typeof snapshotData === 'string') {
    try {
      return JSON.parse(snapshotData);
    } catch (error) {
      console.error('Error parsing snapshot data:', error);
      addLog('Error parsing snapshot JSON data', 'error');
      return null;
    }
  }
  return snapshotData;
};

// Add this helper function
const normalizeSnapshotData = (snapshot) => {
  if (!snapshot) return null;

  return {
    ...snapshot,
    iraStats: processSnapshotData(snapshot.iraStats),
    ccStats: processSnapshotData(snapshot.ccStats),
    date: new Date(snapshot.date).toISOString(),
  };
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

const exportAsExcel = async () => {
  try {
    const workbook = XLSX.utils.book_new();
    
    // Create the main performance worksheet
    const performanceData = [
      ['Branch', 'IRA %', 'IRA Status', 'CC %', 'CC Status']
    ];
    
    // Get branch data and sort by CC percentage (descending)
    const branchData = VALID_BRANCHES.map((branch) => {
      const iraBranch = iraStats.branchPercentages.find(b => b.branch === branch);
      const ccBranch = ccStats.branchPercentages.find(b => b.branch === branch);
      
      return {
        branch: branch,
        branchName: `PT. APL ${getBranchShortName(branch)}`,
        iraPercentage: iraBranch?.percentage || 0,
        ccPercentage: ccBranch?.percentage || 0,
        iraStatus: iraBranch?.percentage >= currentWeek?.ira?.target ? 'On Target' : 'Below Target',
        ccStatus: ccBranch?.percentage >= currentWeek?.cc?.target ? 'On Target' : 'Below Target'
      };
    }).sort((a, b) => b.ccPercentage - a.ccPercentage); // Sort by CC percentage

    // Add sorted data to performance sheet
    branchData.forEach(item => {
      performanceData.push([
        item.branchName,
        item.iraPercentage.toFixed(2),
        item.iraStatus,
        item.ccPercentage.toFixed(2), 
        item.ccStatus
      ]);
    });

    // Create main performance worksheet
    const performanceWS = XLSX.utils.aoa_to_sheet(performanceData);
    
    // If we have snapshot data, create a historical data worksheet
    if (snapshotInfo) {
      const historicalData = [
        ['Snapshot Overview'],
        ['Name', snapshotInfo.name],
        ['Date', new Date(snapshotInfo.date).toLocaleDateString()],
        [''],
        ['Overall Statistics'],
        ['', 'IRA', 'CC'],
        ['Total Items', `${snapshotInfo.iraStats.counted + snapshotInfo.iraStats.notCounted}`, `${snapshotInfo.ccStats.counted + snapshotInfo.ccStats.notCounted}`],
        ['Counted', snapshotInfo.iraStats.counted, snapshotInfo.ccStats.counted],
        ['Not Counted', snapshotInfo.iraStats.notCounted, snapshotInfo.ccStats.notCounted],
        ['Overall %', `${snapshotInfo.iraStats.percentage.toFixed(2)}%`, `${snapshotInfo.ccStats.percentage.toFixed(2)}%`],
        [''],
        ['Branch Percentages'],
        ['Branch', 'IRA %', 'CC %']
      ];

      // Combine and sort branch percentages
      const branches = new Set([
        ...snapshotInfo.iraStats.branchPercentages.map(b => b.branch),
        ...snapshotInfo.ccStats.branchPercentages.map(b => b.branch)
      ]);

      [...branches].sort().forEach(branch => {
        const iraData = snapshotInfo.iraStats.branchPercentages.find(b => b.branch === branch);
        const ccData = snapshotInfo.ccStats.branchPercentages.find(b => b.branch === branch);
        
        historicalData.push([
          getBranchShortName(branch),
          iraData ? iraData.percentage.toFixed(2) : 'N/A',
          ccData ? ccData.percentage.toFixed(2) : 'N/A'
        ]);
      });

      // Create historical worksheet with formatting
      const historicalWS = XLSX.utils.aoa_to_sheet(historicalData);
      
      // Set column widths
      historicalWS['!cols'] = [
        { wch: 25 }, // Branch names
        { wch: 12 }, // IRA %
        { wch: 12 }  // CC %
      ];

      // Add to workbook
      XLSX.utils.book_append_sheet(workbook, historicalWS, 'Historical Data');
    }

    // ...existing column width and styling code for performanceWS...

    // Add performance sheet last so it shows first when opened
    XLSX.utils.book_append_sheet(workbook, performanceWS, 'Branch Performance');

    // Save file with modified name if from snapshot
    const fileName = snapshotInfo 
      ? `IRA_CC_Report_${snapshotInfo.name}_${new Date(snapshotInfo.date).toISOString().split('T')[0]}.xlsx`
      : `IRA_CC_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    XLSX.writeFile(workbook, fileName);
    return fileName;

  } catch (error) {
    console.error('Error exporting to Excel:', error);
    onError('Failed to export Excel file');
  }
};

const formatWeekMonth = (date, weekNum) => {
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 
                 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  // Format weekNum to remove 'week' prefix and make it look cleaner
  const cleanWeekNum = weekNum.replace(/^week/i, '').trim();
  return `Week ${cleanWeekNum} ${month} ${year}`;
};

const formatFullDate = (date) => {
  const day = date.getDate();
  const month = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 
                'Agustus', 'September', 'Oktober', 'November', 'Desember'][date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

const createEmailDraft = async () => {
  try {
    const templates = await import('../../config/emailTemplates.json');
    const template = templates.default.iracc_report;

    const today = new Date();
    const weekNumber = currentWeek?.cc?.week?.replace(/^week/i, '').trim() || '1';
    const weekFormatted = formatWeekMonth(today, weekNumber);
    const dateFormatted = formatFullDate(today);
    const timeFormatted = today.toLocaleTimeString('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
    const monthYear = today.toLocaleString('id-ID', { month: 'long', year: 'numeric' });
    const targetPercentage = currentWeek?.cc?.target || 99;

    // Sort branches by CC percentage descending
    const sortedBranches = [...VALID_BRANCHES].sort((a, b) => {
      const ccA = ccStats.branchPercentages.find(bp => bp.branch === a)?.percentage || 0;
      const ccB = ccStats.branchPercentages.find(bp => bp.branch === b)?.percentage || 0;
      return ccB - ccA;
    });

    // Generate branch performance table rows
    const branchRows = sortedBranches.map((branch) => {
      const iraBranch = iraStats.branchPercentages.find(b => b.branch === branch);
      const ccBranch = ccStats.branchPercentages.find(b => b.branch === branch);
      const iraPercentage = iraBranch?.percentage?.toFixed(2) || '0.00';
      const ccPercentage = ccBranch?.percentage?.toFixed(2) || '0.00';
      const iraStatus = Number(iraPercentage) >= (currentWeek?.ira?.target || 99) ? 'On Target' : 'Below Target';
      const ccStatus = Number(ccPercentage) >= (currentWeek?.cc?.target || 99) ? 'On Target' : 'Below Target';
      const iraColor = iraStatus === 'On Target' ? '#008000' : '#FF0000';
      const ccColor = ccStatus === 'On Target' ? '#008000' : '#FF0000';

      return template.tableRow
        .replace('{branch}', getBranchShortName(branch))
        .replace('{iraPercentage}', iraPercentage)
        .replace('{iraStatus}', iraStatus)
        .replace('{iraColor}', iraColor)
        .replace('{ccPercentage}', ccPercentage)
        .replace('{ccStatus}', ccStatus)
        .replace('{ccColor}', ccColor);
    }).join('');

    // Create email subject and body
    const emailSubject = template.subject
      .replace('{weekFormatted}', weekFormatted)
      .replace('{dateFormatted}', dateFormatted);

    const emailBody = template.greeting + '\n\n' +
      template.body
        .replace(/{weekFormatted}/g, weekFormatted)
        .replace(/{dateFormatted}/g, dateFormatted)
        .replace('{timeFormatted}', timeFormatted)
        .replace('{targetPercentage}', targetPercentage)
        .replace('{monthYear}', monthYear) +
      '\n\n' + template.summary.replace('{weekFormatted}', weekFormatted) +
      '\n\n' + template.table.replace('{branchRows}', branchRows) +
      template.overall
        .replace('{iraPercentage}', iraStats.percentage.toFixed(2))
        .replace('{ccPercentage}', ccStats.percentage.toFixed(2)) +
      template.note +
      template.closing;

    // Remove HTML entities and create proper line breaks
    const cleanedBody = emailBody
      .replace(/(<br\s*\/?>)/gi, '\n')  // Convert <br> tags to newlines
      .replace(/<\/?[^>]+(>|$)/g, '')   // Remove all other HTML tags
      .replace(/&nbsp;/g, ' ')          // Convert &nbsp; to spaces
      .replace(/&amp;/g, '&')           // Convert &amp; to &
      .replace(/&lt;/g, '<')            // Convert &lt; to <
      .replace(/&gt;/g, '>')            // Convert &gt; to >
      .trim();                          // Remove extra whitespace

    // Create a more reliable mailto link
    const mailtoLink = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(cleanedBody)}`;

    // Try opening with mailto first
    window.location.href = mailtoLink;

    // Fallback to Outlook Web if mailto doesn't work
    setTimeout(() => {
      const outlookLink = `https://outlook.office.com/mail/0/deeplink/compose?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(cleanedBody)}`;
      window.open(outlookLink, '_blank');
    }, 1000);

    return true;
  } catch (error) {
    console.error('Error creating email draft:', error);
    onError('Failed to create email draft');
    return false;
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
      onError('Failed to save week settings: ' + error.message); // Use passed onError
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
    onError // Add this to return object
  };
};

function IraCcDashboard({ iraData, ccData, snapshotInfo, onError }) { // Add onError prop
  const { translate } = useLanguage();
  const {
    iraStats,
    ccStats,
    currentWeek,
    error,
    loading,
    exportAsExcel,
    createEmailDraft,
    getBranchShortName,
    VALID_BRANCHES,
    handleSaveSettings,
    logs,
    addLog,
  } = useIraCcDashboardLogic({ iraData, ccData, snapshotInfo, onError }); // Pass onError here
  
  return (
    <div className="dashboard-container">
      {error && (
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {translate('common.error')}: {error}
        </div>
      )}

      <div className="row">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h5>{translate('dashboard.iraStats')}</h5>
            </div>
            {/* ...rest of the IRA stats... */}
          </div>
        </div>
        {/* ...rest of the dashboard... */}
      </div>
    </div>
  );
}

// Add prop types if using prop-types
IraCcDashboard.propTypes = {
  iraData: PropTypes.object,
  ccData: PropTypes.object,
  snapshotInfo: PropTypes.object,
  onError: PropTypes.func.isRequired
};

export default IraCcDashboard;

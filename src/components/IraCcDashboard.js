import React, { useState, useEffect, useRef } from 'react';
import WeekTargetSettings from './WeekTargetSettings';
import * as XLSX from 'xlsx';
import axios from 'axios';
import './css/IraCcDashboard.css';
import { WEEKLY_CONFIG, getWeekForDate } from '../config/weeklyConfig';
import { Table } from 'react-bootstrap';  // Add this import
import { Line, Bar } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';

// Register ChartJS components
Chart.register(...registerables);

// List of valid branches
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

// Get short branch name helper function
const getBranchShortName = (fullName) => {
  const parts = fullName.split(' - ');
  if (parts.length > 1) {
    return parts[1].replace('PT. APL ', '');
  }
  return fullName;
};

function IraCcDashboard({ iraData, ccData, snapshotInfo }) {
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
  
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [availablePeriods, setAvailablePeriods] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [weekSettings, setWeekSettings] = useState(null);
  const [currentWeek, setCurrentWeek] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null); // Add this line
  
  const dashboardRef = useRef(null);
  
  // Load week settings from localStorage on component mount
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
  
  // Determine current week based on today's date
  useEffect(() => {
    if (!weekSettings) return;
    
    const today = new Date();
    const ccWeeks = weekSettings.cc;
    const iraWeeks = weekSettings.ira;
    
    // Helper to check if today is in a date range
    const isInRange = (startDate, endDate) => {
      if (!startDate || !endDate) return false;
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Include the end date fully
      return today >= start && today <= end;
    };
    
    // Check which week we're in for both CC and IRA
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
  
  // Save updated settings to localStorage
  const handleSaveSettings = (newSettings) => {
    setWeekSettings(newSettings);
    localStorage.setItem('weekTargetSettings', JSON.stringify(newSettings));
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  // Get target values either from snapshot or current config
  const meetsCcTarget = (percentage) => {
    if (snapshotInfo) {
      const snapshotDate = new Date(snapshotInfo.date);
      const weekInfo = getWeekForDate(snapshotDate);
      if (weekInfo) {
        const weekTarget = WEEKLY_CONFIG[weekInfo.week]?.ccTarget || 95;
        return percentage >= weekTarget;
      }
    }
    return percentage >= 95;
  };

  const meetsIraTarget = (percentage) => {
    if (snapshotInfo) {
      const snapshotDate = new Date(snapshotInfo.date);
      const weekInfo = getWeekForDate(snapshotDate);
      if (weekInfo) {
        const weekTarget = WEEKLY_CONFIG[weekInfo.week]?.iraTarget || 95;
        return percentage >= weekTarget;
      }
    }
    return percentage >= 95;
  };
  
  // Process IRA data with improved percentage calculation mechanism
  useEffect(() => {
    // Handle data from file upload
    if (iraData && ccData) {
      setIraStats(processIraData(iraData));
      setCcStats(processCcData(ccData));
    }
    // Handle data from snapshot
    else if (snapshotInfo) {
      setIraStats(snapshotInfo.iraStats);
      setCcStats(snapshotInfo.ccStats);
    }
  }, [iraData, ccData, snapshotInfo]);

  // Update process functions to handle both direct data and snapshot data
  const processIraData = (data) => {
    // If data is already processed (from snapshot)
    if (data.percentage !== undefined && data.branchPercentages !== undefined) {
      return data;
    }

    // Process raw file data
    if (!data || !data.data || data.data.length === 0) return;

    console.log("Processing IRA data for dashboard");
    console.log("IRA data type:", typeof data);
    console.log("IRA data columns:", data.columns);
    console.log("Sample row:", data.data[0]);

    // Extract periods from data if it's PowerBI data
    if (data.isPowerBi) {
      const periods = [...new Set(data.data.map(row => row.Period).filter(Boolean))];
      setAvailablePeriods(periods);

      if (periods.length > 0 && !selectedPeriod) {
        // Auto-select the latest period
        setSelectedPeriod(periods[periods.length - 1]);
      }
    }

    // Filter data based on period if applicable
    const filteredData = data.isPowerBi && selectedPeriod 
      ? data.data.filter(row => row.Period === selectedPeriod)
      : data.data;

    // Use %IRALine as the source of truth for counted status
    let countedItems = 0;
    let totalItems = 0;

    // Branch column detection - use known column name patterns
    const branchColumn = data.columns.find(col => 
      col === 'Lbl_Branch' || col === 'Branch' || col === 'Plant'
    ) || 'Lbl_Branch'; // Default to Lbl_Branch if not found

    console.log(`Using branch column for IRA data: ${branchColumn}`);

    // Group by branch for branch-specific calculations
    const branchGroups = {};

    // Initialize groups for all known branches
    VALID_BRANCHES.forEach(branch => {
      branchGroups[branch] = {
        branch,
        countedItems: 0,
        totalItems: 0
      };
    });

    // Calculate total IRA percentage and branch percentages
    filteredData.forEach(row => {
      // Check if %IRALine is defined and convert to proper number if needed
      let iraLineValue = row['%IRALine'];

      // Convert string/boolean values to numbers
      if (iraLineValue === '1' || iraLineValue === 'true' || iraLineValue === true) {
        iraLineValue = 1;
      } else if (iraLineValue === '0' || iraLineValue === 'false' || iraLineValue === false) {
        iraLineValue = 0;
      } else if (iraLineValue === undefined || iraLineValue === null) {
        // If %IRALine is missing, use Count Status as fallback
        iraLineValue = row['Count Status'] === 'Counted' ? 1 : 0;
      } else {
        // Try to convert to number if it's a string
        iraLineValue = Number(iraLineValue);
        // Default to 0 if conversion results in NaN
        if (isNaN(iraLineValue)) iraLineValue = 0;
      }

      // Always increment total items
      totalItems++;

      // Increment counted if IRALine value is 1
      if (iraLineValue === 1) {
        countedItems++;
      }

      // Process branch data if branch column exists
      const branch = row[branchColumn];
      if (branch && VALID_BRANCHES.includes(branch)) {
        if (!branchGroups[branch]) {
          branchGroups[branch] = {
            branch,
            countedItems: 0,
            totalItems: 0
          };
        }

        branchGroups[branch].totalItems++;

        if (iraLineValue === 1) {
          branchGroups[branch].countedItems++;
        }
      }
    });

    console.log(`IRA statistics: Counted=${countedItems}, Total=${totalItems}`);

    // Calculate branch percentages
    const branchPercentages = [];

    Object.values(branchGroups).forEach(group => {
      if (group.totalItems > 0) {
        const percentage = (group.countedItems / group.totalItems) * 100;
        branchPercentages.push({
          branch: group.branch,
          percentage: percentage
        });
      }
    });

    // Calculate overall percentage
    const percentage = totalItems > 0 ? (countedItems / totalItems) * 100 : 0;

    return {
      counted: countedItems,
      notCounted: totalItems - countedItems,
      percentage: percentage,
      branchPercentages: branchPercentages
    };
  };

  const processCcData = (data) => {
    // If data is already processed (from snapshot)
    if (data.percentage !== undefined && data.branchPercentages !== undefined) {
      return data;
    }

    // Process raw file data
    if (!data || !data.data || data.data.length === 0) return;

    console.log("Processing CC data for dashboard");

    // Identify the branch/plant column
    const branchColumnName = data.columns.find(col => 
      col === 'Plant' || col === '!Branch' || col === 'Branch'
    ) || 'Plant'; // Default to Plant if not found

    console.log("Using branch column for CC data:", branchColumnName);

    // Filter to exclude LIVE_PICA StorageType
    const filteredData = data.data.filter(row => row.StorageType !== 'LIVE_PICA');

    // Count statistics - improved to ensure CC percentages are calculated
    let counted = 0;
    let notCounted = 0;

    // Group by branch for branch-specific calculations
    const branchGroups = {};

    // Initialize groups for all known branches
    VALID_BRANCHES.forEach(branch => {
      branchGroups[branch] = {
        branch,
        countedItems: 0,
        totalItems: 0
      };
    });

    // Calculate total CC percentage and branch percentages
    filteredData.forEach(row => {
      // Check if %CountComp is defined and convert to proper number if needed
      let countCompValue = row['%CountComp'];

      // Convert string/boolean values to numbers
      if (countCompValue === '1' || countCompValue === 'true' || countCompValue === true) {
        countCompValue = 1;
      } else if (countCompValue === '0' || countCompValue === 'false' || countCompValue === false) {
        countCompValue = 0;
      } else if (countCompValue === undefined || countCompValue === null) {
        // If %CountComp is missing, use Count Status as fallback
        countCompValue = row['Count Status'] === 'Counted' ? 1 : 0;
      } else {
        // Try to convert to number if it's a string
        countCompValue = Number(countCompValue);
        // Default to 0 if conversion results in NaN
        if (isNaN(countCompValue)) countCompValue = 0;
      }

      // Always increment total count
      notCounted++;

      // Decrement notCounted and increment counted if CountComp value is 1
      if (countCompValue === 1) {
        counted++;
        notCounted--;
      }

      // Process branch data if branch column exists
      const branch = row[branchColumnName];
      if (branch && VALID_BRANCHES.includes(branch)) {
        if (!branchGroups[branch]) {
          branchGroups[branch] = {
            branch,
            countedItems: 0,
            totalItems: 0
          };
        }

        branchGroups[branch].totalItems++;

        if (countCompValue === 1) {
          branchGroups[branch].countedItems++;
        }
      }
    });

    console.log(`CC statistics: Counted=${counted}, NotCounted=${notCounted}`);

    // Calculate branch percentages
    const branchPercentages = [];

    Object.values(branchGroups).forEach(group => {
      if (group.totalItems > 0) {
        const percentage = (group.countedItems / group.totalItems) * 100;
        branchPercentages.push({
          branch: group.branch,
          percentage: percentage
        });
      }
    });

    // Calculate overall percentage
    const total = counted + notCounted;
    const percentage = total > 0 ? (counted / total) * 100 : 0;

    return {
      counted,
      notCounted,
      percentage,
      branchPercentages
    };
  };

  // Export dashboard data as Excel - Updated with combined approach
  const exportAsExcel = () => {
    try {
      const wb = XLSX.utils.book_new();
      const combinedData = [
        ['No.', 'Branch', 'IRA %', 'IRA Status', 'CC %', 'CC Status'] // Headers
      ];

      // Merge all branches with their IRA and CC percentages
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
      // Sort by CC percentage descending (like the image)
      .sort((a, b) => b.cc - a.cc);

      // Populate rows
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

      // Create worksheet
      const ws = XLSX.utils.aoa_to_sheet(combinedData);
      XLSX.utils.book_append_sheet(wb, ws, 'Combined Report');
      XLSX.writeFile(wb, 'ira-cc-dashboard.xlsx');
    } catch (error) {
      console.error('Error exporting dashboard as Excel:', error);
      alert('Failed to export as Excel. Please try again.');
    }
  };

  // Function to create email draft
  const createEmailDraft = async () => {
    try {
      if (!snapshotInfo && (!iraData || !ccData)) {
        setError('No data available to create email draft');
        return;
      }
  
      setLoading(true);
  
      // If using snapshot data, send the snapshot ID
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
        // If using current data, create a new snapshot first
        const snapshot = {
          id: Date.now().toString(),
          name: `Snapshot ${new Date().toLocaleDateString()}`,
          date: new Date().toISOString(),
          iraStats: iraStats,
          ccStats: ccStats
        };
  
        // Save the snapshot
        const saveResponse = await axios.post('/api/snapshots', snapshot);
        
        // Create email draft with the new snapshot
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

  // Update the isOnTarget function to use weekly targets
  const isOnTarget = (value, type, snapshotDate) => {
    const currentWeek = getWeekForDate(snapshotDate || new Date().toISOString());
    
    if (!currentWeek) return false;
    
    // Get target based on type and week configuration
    const target = type === 'ira' ? currentWeek.period.iraTarget : currentWeek.period.ccTarget;
    return value >= target;
  };

  // Update the getStatusIndicator to pass the date
  const getStatusIndicator = (value, type) => {
    const onTarget = isOnTarget(value, type, snapshotInfo?.date);
    const weekConfig = getWeekForDate(snapshotInfo?.date || new Date().toISOString());
    const target = type === 'ira' ? weekConfig.period.iraTarget : weekConfig.period.ccTarget;
    
    return (
      <div className="status-container">
        <span className={`status-indicator ${onTarget ? 'on-target' : 'below-target'}`}>
          <i className={`bi ${onTarget ? 'bi-check-circle' : 'bi-exclamation-circle'}`}></i>
          {onTarget ? 'On Target' : 'Below Target'}
        </span>
        <small className="target-value">Target: {target}%</small>
      </div>
    );
  };

  // Create branch maps for the table
  const createBranchMaps = () => {
    const iraBranchMap = {};
    const ccBranchMap = {};
    
    if (iraData?.ccStats?.branchPercentages) {
      iraData.ccStats.branchPercentages.forEach(branch => {
        iraBranchMap[branch.branch] = branch.percentage;
      });
    }
    
    if (ccData?.ccStats?.branchPercentages) {
      ccData.ccStats.branchPercentages.forEach(branch => {
        ccBranchMap[branch.branch] = branch.percentage;
      });
    }
    
    return { iraBranchMap, ccBranchMap };
  };

  // Sort branches by CC percentage
  const getSortedBranches = (ccBranchMap) => {
    return [...VALID_BRANCHES].sort((a, b) => {
      const aPercentage = ccBranchMap[a] || 0;
      const bPercentage = ccBranchMap[b] || 0;
      return bPercentage - aPercentage;
    });
  };

  // Update renderBranchTable function
  const renderBranchTable = () => {
    const { iraBranchMap, ccBranchMap } = createBranchMaps();
    const sortedBranches = getSortedBranches(ccBranchMap);
    const weekConfig = getWeekForDate(snapshotInfo?.date || new Date().toISOString());
    const iraTarget = weekConfig?.period.iraTarget || 95;
    const ccTarget = weekConfig?.period.ccTarget || 95;
  
    return (
      <div className="table-responsive">
        <Table striped hover>
          <thead>
            <tr>
              <th>Branch</th>
              <th className="text-end">IRA % (Target: {iraTarget}%)</th>
              <th className="text-end">CC % (Target: {ccTarget}%)</th>
            </tr>
          </thead>
          <tbody>
            {sortedBranches.map((branch, index) => (
              <tr key={index}>
                <td>{getBranchShortName(branch)}</td>
                <td className="text-end">
                  {iraBranchMap[branch] ? (
                    <>
                      {iraBranchMap[branch].toFixed(2)}%
                      {isOnTarget(iraBranchMap[branch], 'ira', snapshotInfo?.date) ? 
                        <i className="bi bi-check-circle text-success ms-2"></i> : 
                        <i className="bi bi-exclamation-circle text-danger ms-2"></i>}
                    </>
                  ) : 'N/A'}
                </td>
                <td className="text-end">
                  {ccBranchMap[branch] ? (
                    <>
                      {ccBranchMap[branch].toFixed(2)}%
                      {isOnTarget(ccBranchMap[branch], 'cc', snapshotInfo?.date) ? 
                        <i className="bi bi-check-circle text-success ms-2"></i> : 
                        <i className="bi bi-exclamation-circle text-danger ms-2"></i>}
                    </>
                  ) : 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    );
  };

  return (
    <div className="cms-dashboard-container">
      {error && (
        <div className="alert alert-danger mb-4">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </div>
      )}
      {/* Export and Settings buttons */}
      <div className="d-flex justify-content-between mb-3">
        <div className="export-buttons">
          <div className="btn-group">
            <button 
              className="btn btn-outline-success" 
              onClick={exportAsExcel}
              title="Export as Excel spreadsheet"
            >
              <i className="bi bi-file-earmark-excel me-1"></i> Excel
            </button>
          </div>
        </div>
        
        <button 
          className="btn btn-outline-primary" 
          onClick={() => setShowSettings(true)}
        >
          <i className="bi bi-gear me-2"></i>
          Configure Week Targets
        </button>
        <button 
          className="btn btn-outline-secondary btn-sm" 
          onClick={createEmailDraft}
          disabled={loading}
        >
          <i className="bi bi-envelope me-1"></i>
          Create Email Draft
        </button>
      </div>
      
      {/* Dashboard content with ref for export */}
      <div ref={dashboardRef}>
        {/* Current week info */}
        {currentWeek && (
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">Current Week Status</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <div className="card">
                    <div className="card-header bg-primary">
                      <h6 className="mb-0">IRA Week</h6>
                    </div>
                    <div className="card-body">
                      {currentWeek.ira ? (
                        <>
                          <p><strong>{currentWeek.ira.week.replace('week', 'Week ')}</strong> ({formatDate(currentWeek.ira.startDate)} - {formatDate(currentWeek.ira.endDate)})</p>
                          <p>Target: <span className="fw-bold">{currentWeek.ira.target}%</span></p>
                          <div className="progress">
                            <div 
                              className={`progress-bar ${iraStats.percentage >= currentWeek.ira.target ? 'bg-success' : 'bg-danger'}`} 
                              role="progressbar" 
                              style={{width: `${Math.min(iraStats.percentage, 100)}%`}}
                              aria-valuenow={iraStats.percentage} 
                              aria-valuemin="0" 
                              aria-valuemax="100"
                            >
                              {iraStats.percentage.toFixed(1)}%
                            </div>
                          </div>
                        </>
                      ) : (
                        <p className="text-muted">No IRA week is currently active</p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="col-md-6">
                  <div className="card">
                    <div className="card-header bg-info">
                      <h6 className="mb-0">CC Week</h6>
                    </div>
                    <div className="card-body">
                      {currentWeek.cc ? (
                        <>
                          <p><strong>{currentWeek.cc.week.replace('week', 'Week ')}</strong> ({formatDate(currentWeek.cc.startDate)} - {formatDate(currentWeek.cc.endDate)})</p>
                          <p>Target: <span className="fw-bold">{currentWeek.cc.target}%</span></p>
                          <div className="progress">
                            <div 
                              className={`progress-bar ${ccStats.percentage >= currentWeek.cc.target ? 'bg-success' : 'bg-warning'}`}
                              role="progressbar" 
                              style={{width: `${Math.min(ccStats.percentage, 100)}%`}}
                              aria-valuenow={ccStats.percentage} 
                              aria-valuemin="0" 
                              aria-valuemax="100"
                            >
                              {ccStats.percentage.toFixed(1)}%
                            </div>
                          </div>
                        </>
                      ) : (
                        <p className="text-muted">No CC week is currently active</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Period selector for PowerBI data */}
        {availablePeriods.length > 0 && (
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">Select Period</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <select 
                    className="form-select" 
                    value={selectedPeriod} 
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                  >
                    {availablePeriods.map(period => (
                      <option key={period} value={period}>{period}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="row">
          {/* IRA Summary */}
          <div className="col-md-6 mb-4">
            <div className="card">
              <div className="card-header bg-primary">
                <h5 className="mb-0">IRA Summary</h5>
              </div>
              <div className="card-body">
                <div className="row mb-4">
                  <div className="col-md-4">
                    <div className="card bg-light">
                      <div className="card-body text-center">
                        <h5 className="card-title">Counted</h5>
                        <h3 className="text-success">{iraStats.counted}</h3>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card bg-light">
                      <div className="card-body text-center">
                        <h5 className="card-title">Not Counted</h5>
                        <h3 className="text-danger">{iraStats.notCounted}</h3>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card bg-light">
                      <div className="card-body text-center">
                        <h5 className="card-title">Percentage</h5>
                        <h3 className={
                          currentWeek && currentWeek.ira
                            ? iraStats.percentage >= currentWeek.ira.target ? "text-success" : "text-danger"
                            : iraStats.percentage > 80 ? "text-success" : "text-warning"
                        }>
                          {iraStats.percentage.toFixed(2)}%
                        </h3>
                      </div>
                    </div>
                  </div>
                </div>
                
                <h6 className="mb-3">Branch Percentages</h6>
                <div className="table-responsive">
                  <table className="table table-striped table-sm table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>Branch</th>
                        <th className="text-end">IRA %</th>
                        {currentWeek && currentWeek.ira && (
                          <th className="text-center">Status</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {iraStats.branchPercentages
                        .sort((a, b) => b.percentage - a.percentage) // Sort from highest to lowest
                        .map((branch, index) => (
                          <tr key={index}>
                            <td>{branch.branch}</td>
                            <td className="text-end">
                              <span className={
                                currentWeek && currentWeek.ira
                                  ? meetsIraTarget(branch.percentage) ? "text-success" : "text-danger"
                                  : branch.percentage > 80 ? "text-success" : "text-warning"
                              }>
                                {branch.percentage.toFixed(2)}%
                              </span>
                            </td>
                            {currentWeek && currentWeek.ira && (
                              <td className="text-center">
                                {meetsIraTarget(branch.percentage) ? (
                                  <span className="badge bg-success">On Target</span>
                                ) : (
                                  <span className="badge bg-danger">Below Target</span>
                                )}
                              </td>
                            )}
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
          
          {/* CC Summary */}
          <div className="col-md-6 mb-4">
            <div className="card">
              <div className="card-header bg-info">
                <h5 className="mb-0">Cycle Count Summary</h5>
              </div>
              <div className="card-body">
                <div className="row mb-4">
                  <div className="col-md-4">
                    <div className="card bg-light">
                      <div className="card-body text-center">
                        <h5 className="card-title">Counted</h5>
                        <h3 className="text-success">{ccStats.counted}</h3>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card bg-light">
                      <div className="card-body text-center">
                        <h5 className="card-title">Not Counted</h5>
                        <h3 className="text-danger">{ccStats.notCounted}</h3>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card bg-light">
                      <div className="card-body text-center">
                        <h5 className="card-title">Percentage</h5>
                        <h3 className={
                          currentWeek && currentWeek.cc
                            ? ccStats.percentage >= currentWeek.cc.target ? "text-success" : "text-danger"
                            : ccStats.percentage > 80 ? "text-success" : "text-warning"
                        }>
                          {ccStats.percentage.toFixed(2)}%
                        </h3>
                      </div>
                    </div>
                  </div>
                </div>
                
                <h6 className="mb-3">Branch Percentages</h6>
                <div className="table-responsive">
                  <table className="table table-striped table-sm table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>Branch</th>
                        <th className="text-end">CC %</th>
                        {currentWeek && currentWeek.cc && (
                          <th className="text-center">Status</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {ccStats.branchPercentages
                        .sort((a, b) => b.percentage - a.percentage) // Sort from highest to lowest
                        .map((branch, index) => (
                          <tr key={index}>
                            <td>{branch.branch}</td>
                            <td className="text-end">
                              <span className={
                                currentWeek && currentWeek.cc
                                  ? meetsCcTarget(branch.percentage) ? "text-success" : "text-danger"
                                  : branch.percentage > 80 ? "text-success" : "text-warning"
                              }>
                                {branch.percentage.toFixed(2)}%
                              </span>
                            </td>
                            {currentWeek && currentWeek.cc && (
                              <td className="text-center">
                                {meetsCcTarget(branch.percentage) ? (
                                  <span className="badge bg-success">On Target</span>
                                ) : (
                                  <span className="badge bg-danger">Below Target</span>
                                )}
                              </td>
                            )}
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Settings Modal */}
      <WeekTargetSettings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onSave={handleSaveSettings}
        initialSettings={weekSettings}
      />
    </div>
  );
}

export default IraCcDashboard;

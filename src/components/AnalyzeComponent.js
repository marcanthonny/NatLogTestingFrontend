import React, { useState, useEffect } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import './css/AnalyzeComponent.css';
import axios from 'axios';

// Register ChartJS components
Chart.register(...registerables);

// Valid branches list (same as in other components)
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

function AnalyzeComponent({ iraData, ccData }) {
  const [historicalData, setHistoricalData] = useState([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState('week');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [previousWeekData, setPreviousWeekData] = useState(null);
  // Add error state variable that was missing
  const [error, setError] = useState(null);
  
  // Load historical data on mount - UPDATED to ensure proper date sorting
  useEffect(() => {
    loadHistoricalData();
    // Check if we need to auto-save today's data
    autoSaveData();
    loadPreviousWeekData();
  }, [iraData, ccData]);
  
  // Load saved historical data from localStorage - UPDATED with better date sorting
  const loadHistoricalData = () => {
    setLoading(true);
    try {
      const savedData = localStorage.getItem('ccGrowthData');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        
        // Sort data by date (newest first for display, oldest first for storage)
        const sortedData = parsedData.sort((a, b) => new Date(a.date) - new Date(b.date));
        setHistoricalData(sortedData);
        
        // Get last updated date
        if (sortedData.length > 0) {
          const lastEntry = sortedData[sortedData.length - 1];
          setLastUpdated(new Date(lastEntry.date));
        }
      }
    } catch (error) {
      console.error('Error loading historical data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Auto-save today's data if not already saved
  const autoSaveData = () => {
    if (!ccData || !ccData.data || ccData.data.length === 0) return;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to beginning of day for comparison
    
    // Check if we already saved data today
    if (lastUpdated) {
      const lastDate = new Date(lastUpdated);
      lastDate.setHours(0, 0, 0, 0); // Set to beginning of day for comparison
      
      // Skip if we already saved today
      if (today.getTime() === lastDate.getTime()) {
        return;
      }
    }
    
    // Calculate today's metrics
    const todayMetrics = calculateCurrentMetrics();
    
    // Save to historical data
    saveCurrentMetrics(todayMetrics);
  };
  
  // Calculate current metrics from ccData
  const calculateCurrentMetrics = () => {
    // Identify the branch column
    const branchColumn = ccData.columns.find(col => 
      col === 'Plant' || col === '!Branch' || col === 'Branch'
    );
    
    if (!branchColumn) return null;
    
    // Group data by branch and calculate percentages
    const branchGroups = {};
    const filteredData = ccData.data.filter(row => row.StorageType !== 'LIVE_PICA');
    
    // Initialize branch groups with zero counts
    VALID_BRANCHES.forEach(branch => {
      branchGroups[branch] = {
        branch,
        counted: 0,
        total: 0
      };
    });
    
    // Count data by branch
    filteredData.forEach(row => {
      const branchValue = row[branchColumn];
      if (!branchValue || !VALID_BRANCHES.includes(branchValue)) return;
      
      if (!branchGroups[branchValue]) {
        branchGroups[branchValue] = {
          branch: branchValue,
          counted: 0,
          total: 0
        };
      }
      
      // Check if counted
      if (row['%CountComp'] === 1 || row['Count Status'] === 'Counted') {
        branchGroups[branchValue].counted++;
      }
      
      branchGroups[branchValue].total++;
    });
    
    // Calculate percentages for each branch
    const branchPercentages = {};
    let totalPercentage = 0;
    let branchCount = 0;
    
    Object.values(branchGroups).forEach(group => {
      const percentage = group.total > 0 ? (group.counted / group.total) * 100 : 0;
      branchPercentages[group.branch] = percentage;
      
      if (group.total > 0) {
        totalPercentage += percentage;
        branchCount++;
      }
    });
    
    // Calculate average across all branches
    const averagePercentage = branchCount > 0 ? totalPercentage / branchCount : 0;
    
    return {
      date: new Date().toISOString(),
      average: averagePercentage,
      branches: branchPercentages
    };
  };
  
  // Save current metrics to historical data
  const saveCurrentMetrics = (metrics) => {
    if (!metrics) return;
    
    const updatedData = [...historicalData, metrics];
    
    // Keep only last 365 days to avoid storage bloat
    if (updatedData.length > 365) {
      updatedData.shift(); // Remove oldest entry
    }
    
    // Save to state and localStorage
    setHistoricalData(updatedData);
    localStorage.setItem('ccGrowthData', JSON.stringify(updatedData));
    setLastUpdated(new Date());
  };
  
  // Handle manual save button click
  const handleManualSave = () => {
    const metrics = calculateCurrentMetrics();
    if (metrics) {
      saveCurrentMetrics(metrics);
      alert('Today\'s data has been saved successfully!');
    }
  };
  
  // Format data for overall growth chart
  const getOverallChartData = () => {
    // Filter data based on selected timeframe
    const filteredData = filterDataByTimeframe(historicalData);
    
    return {
      labels: filteredData.map(entry => formatDate(entry.date)),
      datasets: [{
        label: 'Average CC %',
        data: filteredData.map(entry => entry.average.toFixed(2)),
        borderColor: 'rgba(0, 123, 255, 1)',
        backgroundColor: 'rgba(0, 123, 255, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4
      }]
    };
  };
  
  // Format data for branch-specific growth chart
  const getBranchChartData = () => {
    // Only show individual branch data if a specific branch is selected
    if (selectedBranch === 'all') {
      // Show top 5 branches by latest percentage
      const latestData = historicalData.length > 0 ? 
        historicalData[historicalData.length - 1] : { branches: {} };
      
      // Sort branches by latest percentage
      const topBranches = VALID_BRANCHES
        .filter(branch => latestData.branches[branch] > 0)
        .sort((a, b) => latestData.branches[b] - latestData.branches[a])
        .slice(0, 5);
      
      const filteredData = filterDataByTimeframe(historicalData);
      
      return {
        labels: filteredData.map(entry => formatDate(entry.date)),
        datasets: topBranches.map((branch, index) => {
          const colors = [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)'
          ];
          
          return {
            label: getBranchShortName(branch),
            data: filteredData.map(entry => 
              entry.branches[branch] ? entry.branches[branch].toFixed(2) : 0
            ),
            borderColor: colors[index % colors.length],
            backgroundColor: 'transparent',
            borderWidth: 2
          };
        })
      };
    } else {
      // Show single selected branch with growth trend
      const filteredData = filterDataByTimeframe(historicalData);
      
      return {
        labels: filteredData.map(entry => formatDate(entry.date)),
        datasets: [{
          label: getBranchShortName(selectedBranch),
          data: filteredData.map(entry => 
            entry.branches[selectedBranch] ? entry.branches[selectedBranch].toFixed(2) : 0
          ),
          borderColor: 'rgba(54, 162, 235, 1)',
          backgroundColor: 'rgba(54, 162, 235, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        }]
      };
    }
  };
  
  // Filter data by selected timeframe
  const filterDataByTimeframe = (data) => {
    if (!data || data.length === 0) return [];
    
    const now = new Date();
    const cutoffDate = new Date();
    
    switch (selectedTimeframe) {
      case 'week':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        cutoffDate.setDate(now.getDate() - 7);
    }
    
    return data.filter(entry => new Date(entry.date) >= cutoffDate);
  };
  
  // Get short name for branch to display in charts
  const getBranchShortName = (branchName) => {
    const parts = branchName.split(' - ');
    if (parts.length > 1) {
      const location = parts[1].replace('PT. APL ', '');
      return location;
    }
    return branchName;
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Percentage (%)'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Date'
        }
      }
    },
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.raw}%`;
          }
        }
      }
    }
  };
  
  // Get current branch list for dropdown
  const getBranchOptions = () => {
    return [
      <option key="all" value="all">All Branches (Top 5)</option>,
      ...VALID_BRANCHES.map(branch => (
        <option key={branch} value={branch}>{getBranchShortName(branch)}</option>
      ))
    ];
  };
  
  // Calculate growth indicators
  const getGrowthIndicators = () => {
    if (historicalData.length < 2) return { average: 0, branches: {} };
    
    const latest = historicalData[historicalData.length - 1];
    let previous;
    
    // Find previous data point based on timeframe
    switch (selectedTimeframe) {
      case 'week':
        previous = historicalData
          .filter(d => new Date(d.date).getTime() <= new Date(latest.date).getTime() - 7 * 24 * 60 * 60 * 1000)[0];
        break;
      case 'month':
        const prevMonth = new Date(latest.date);
        prevMonth.setMonth(prevMonth.getMonth() - 1);
        previous = historicalData
          .filter(d => new Date(d.date).getTime() <= prevMonth.getTime())[0];
        break;
      default:
        previous = historicalData[0];
    }
    
    if (!previous) return { average: 0, branches: {} };
    
    // Calculate growth for average
    const averageGrowth = latest.average - previous.average;
    
    // Calculate growth for each branch
    const branchGrowth = {};
    VALID_BRANCHES.forEach(branch => {
      const latestValue = latest.branches[branch] || 0;
      const prevValue = previous.branches[branch] || 0;
      branchGrowth[branch] = latestValue - prevValue;
    });
    
    return { average: averageGrowth, branches: branchGrowth };
  };
  
  // Growth indicators based on historical data
  const growthIndicators = getGrowthIndicators();
  
  // Load previous week's data from localStorage - UPDATED with proper date sorting
  const loadPreviousWeekData = () => {
    try {
      const weeklySnapshots = localStorage.getItem('weeklySnapshots');
      if (weeklySnapshots) {
        const parsedData = JSON.parse(weeklySnapshots);
        // Get the most recent snapshot if any, sorted by date
        if (parsedData.length > 0) {
          // Make sure to sort by actual date objects for accurate comparison
          const sortedData = parsedData.sort((a, b) => new Date(b.date) - new Date(a.date));
          console.log('Sorted snapshots for comparison:', 
            sortedData.map(s => `${s.name} (${new Date(s.date).toLocaleDateString()})`));
          setPreviousWeekData(sortedData[0]);
        }
      }
    } catch (error) {
      console.error('Error loading previous week data:', error);
    }
  };
  
  // Calculate week-over-week growth for CC percentage - UPDATED with clearer terminology
  const calculateCcGrowth = () => {
    if (!previousWeekData || !ccData || !ccData.data || ccData.data.length === 0) {
      return null;
    }
    
    // Calculate current CC percentage
    const currentMetrics = calculateCurrentMetrics();
    if (!currentMetrics) return null;
    
    // Calculate growth (current - previous)
    const growth = currentMetrics.average - previousWeekData.ccStats.percentage;
    
    return {
      previousWeek: previousWeekData.ccStats.percentage,
      currentWeek: currentMetrics.average,
      growth: growth,
      percentage: previousWeekData.ccStats.percentage > 0 
        ? (growth / previousWeekData.ccStats.percentage) * 100 
        : 0,
      snapshotDate: previousWeekData.date,
      snapshotName: previousWeekData.name
    };
  };
  
  // Get growth data for display
  const ccGrowth = calculateCcGrowth();

  // Updated to load snapshots from server instead of localStorage
  useEffect(() => {
    loadSnapshotsForComparison();
  }, []);

  // Load the two most recent snapshots for comparison
  const loadSnapshotsForComparison = async () => {
    setLoading(true);
    try {
      // Get all snapshots from server
      const response = await axios.get('/api/snapshots');
      
      if (response.data && response.data.length >= 2) {
        // Sort snapshots by date, newest first
        const sortedSnapshots = response.data.sort((a, b) => new Date(b.date) - new Date(a.date));
        console.log('Sorted snapshots for comparison:', 
          sortedSnapshots.map(s => `${s.name} (${new Date(s.date).toLocaleDateString()})`));
        
        // Get the two most recent snapshots
        const mostRecentSnapshot = sortedSnapshots[0];
        const previousSnapshot = sortedSnapshots[1];
        
        // Fetch full details for both snapshots
        const mostRecentDetails = await axios.get(`/api/snapshots/${mostRecentSnapshot.id}`);
        const previousDetails = await axios.get(`/api/snapshots/${previousSnapshot.id}`);
        
        // Set the snapshots for comparison
        setCurrentSnapshot(mostRecentDetails.data);
        setPreviousSnapshot(previousDetails.data);
      } else {
        console.log('Not enough snapshots for comparison');
        setError('At least two snapshots are needed for comparison.');
      }
    } catch (error) {
      console.error('Error loading snapshots for comparison:', error);
      setError('Failed to load snapshots for comparison.');
    } finally {
      setLoading(false);
    }
  };

  // Replace existing useEffect and loadPreviousWeekData with new state and function
  const [currentSnapshot, setCurrentSnapshot] = useState(null);
  const [previousSnapshot, setPreviousSnapshot] = useState(null);

  // Calculate week-over-week growth based on snapshots
  const calculateSnapshotGrowth = () => {
    if (!currentSnapshot || !previousSnapshot) {
      return null;
    }
    
    // Calculate growth between the two snapshots
    const currentPercentage = currentSnapshot.ccStats.percentage;
    const previousPercentage = previousSnapshot.ccStats.percentage;
    const growth = currentPercentage - previousPercentage;
    
    return {
      previousWeek: previousPercentage,
      currentWeek: currentPercentage,
      growth: growth,
      percentage: previousPercentage > 0 
        ? (growth / previousPercentage) * 100 
        : 0,
      previousSnapshot: previousSnapshot,
      currentSnapshot: currentSnapshot
    };
  };

  // Replace ccGrowth with snapshotGrowth
  const snapshotGrowth = calculateSnapshotGrowth();
  
  return (
    <div className="analyze-container">
      <div className="row mb-4">
        <div className="col-lg-12">
          <div className="card shadow-sm">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Cycle Count Growth Analysis</h5>
              <div>
                {lastUpdated && (
                  <span className="text-muted me-3">
                    Last updated: {formatDate(lastUpdated)}
                  </span>
                )}
                <button 
                  className="btn btn-primary btn-sm" 
                  onClick={handleManualSave}
                  disabled={loading}
                >
                  <i className="bi bi-save me-1"></i>
                  Save Today's Data
                </button>
              </div>
            </div>
            <div className="card-body">
              {/* Add week-over-week growth card - UPDATED with clearer labels */}
              {snapshotGrowth && (
                <div className="alert alert-info mb-4 d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="mb-0">Snapshots Comparison:</h6>
                    <div className={`mt-1 ${snapshotGrowth.growth >= 0 ? 'text-success' : 'text-danger'}`}>
                      <strong>
                        {snapshotGrowth.growth >= 0 ? '+' : ''}{snapshotGrowth.growth.toFixed(2)}% 
                      </strong>
                      <span className="ms-2">
                        ({snapshotGrowth.growth >= 0 ? '+' : ''}{snapshotGrowth.percentage.toFixed(2)}% change)
                      </span>
                    </div>
                    <small className="text-muted">
                      Comparing most recent snapshots: 
                      <span className="fw-bold ms-1">{previousSnapshot.name}</span> 
                      <i className="bi bi-arrow-right mx-1"></i> 
                      <span className="fw-bold">{currentSnapshot.name}</span>
                    </small>
                  </div>
                  <div className="text-center">
                    <small className="text-muted d-block mb-1">{formatDate(previousSnapshot.date)}</small>
                    <span className="badge bg-secondary">{snapshotGrowth.previousWeek.toFixed(2)}%</span>
                    <i className="bi bi-arrow-right mx-2"></i>
                    <span className="badge bg-primary">{snapshotGrowth.currentWeek.toFixed(2)}%</span>
                    <small className="text-muted d-block mt-1">{formatDate(currentSnapshot.date)}</small>
                  </div>
                </div>
              )}
              
              {/* Existing timeframe and branch selectors */}
              <div className="row mb-3">
                <div className="col-md-6">
                  <div className="d-flex align-items-center">
                    <label className="me-2">Timeframe:</label>
                    <select 
                      className="form-select form-select-sm" 
                      value={selectedTimeframe}
                      onChange={(e) => setSelectedTimeframe(e.target.value)}
                    >
                      <option value="week">Last 7 Days</option>
                      <option value="month">Last 30 Days</option>
                      <option value="quarter">Last 90 Days</option>
                      <option value="year">Last 365 Days</option>
                    </select>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex align-items-center justify-content-end">
                    <label className="me-2">Branch:</label>
                    <select 
                      className="form-select form-select-sm" 
                      value={selectedBranch}
                      onChange={(e) => setSelectedBranch(e.target.value)}
                    >
                      {getBranchOptions()}
                    </select>
                  </div>
                </div>
              </div>
              
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2">Loading dashboard data...</p>
                </div>
              ) : historicalData.length === 0 ? (
                <div className="alert alert-info">
                  <i className="bi bi-info-circle me-2"></i>
                  No historical data available yet. Click "Save Today's Data" to start tracking progress.
                </div>
              ) : (
                <>
                  {/* Overall growth indicators */}
                  <div className="row mb-4">
                    <div className="col-md-4">
                      <div className="card bg-light">
                        <div className="card-body">
                          <h6 className="card-title">Average Cycle Count</h6>
                          <h3 className="mb-0">
                            {historicalData.length > 0 ? 
                              historicalData[historicalData.length - 1].average.toFixed(2) : 0}%
                          </h3>
                          <div className={`small ${growthIndicators.average >= 0 ? 'text-success' : 'text-danger'}`}>
                            <i className={`bi ${growthIndicators.average >= 0 ? 'bi-arrow-up' : 'bi-arrow-down'}`}></i>
                            {Math.abs(growthIndicators.average).toFixed(2)}% since previous period
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="card bg-light">
                        <div className="card-body">
                          <h6 className="card-title">Top Performing Branch</h6>
                          {historicalData.length > 0 && (
                            <>
                              <h3 className="mb-0">
                                {VALID_BRANCHES
                                  .filter(b => historicalData[historicalData.length - 1].branches[b] > 0)
                                  .sort((a, b) => {
                                    return historicalData[historicalData.length - 1].branches[b] - 
                                           historicalData[historicalData.length - 1].branches[a];
                                  })[0] ? 
                                    getBranchShortName(VALID_BRANCHES
                                      .filter(b => historicalData[historicalData.length - 1].branches[b] > 0)
                                      .sort((a, b) => {
                                        return historicalData[historicalData.length - 1].branches[b] - 
                                               historicalData[historicalData.length - 1].branches[a];
                                      })[0]) : 'N/A'}
                              </h3>
                              <div className="small text-muted">
                                {VALID_BRANCHES
                                  .filter(b => historicalData[historicalData.length - 1].branches[b] > 0)
                                  .sort((a, b) => {
                                    return historicalData[historicalData.length - 1].branches[b] - 
                                           historicalData[historicalData.length - 1].branches[a];
                                  })[0] ? 
                                    historicalData[historicalData.length - 1].branches[VALID_BRANCHES
                                      .filter(b => historicalData[historicalData.length - 1].branches[b] > 0)
                                      .sort((a, b) => {
                                        return historicalData[historicalData.length - 1].branches[b] - 
                                               historicalData[historicalData.length - 1].branches[a];
                                      })[0]].toFixed(2) + '%' : 'N/A'}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="card bg-light">
                        <div className="card-body">
                          <h6 className="card-title">Most Improved</h6>
                          {historicalData.length > 1 && (
                            <>
                              <h3 className="mb-0">
                                {Object.keys(growthIndicators.branches)
                                  .filter(b => growthIndicators.branches[b] > 0)
                                  .sort((a, b) => growthIndicators.branches[b] - growthIndicators.branches[a])[0] ?
                                    getBranchShortName(Object.keys(growthIndicators.branches)
                                      .filter(b => growthIndicators.branches[b] > 0)
                                      .sort((a, b) => growthIndicators.branches[b] - growthIndicators.branches[a])[0]) : 'N/A'}
                              </h3>
                              <div className="small text-success">
                                {Object.keys(growthIndicators.branches)
                                  .filter(b => growthIndicators.branches[b] > 0)
                                  .sort((a, b) => growthIndicators.branches[b] - growthIndicators.branches[a])[0] ?
                                    '+' + growthIndicators.branches[Object.keys(growthIndicators.branches)
                                      .filter(b => growthIndicators.branches[b] > 0)
                                      .sort((a, b) => growthIndicators.branches[b] - growthIndicators.branches[a])[0]].toFixed(2) + '% growth' : 'N/A'}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                
                  {/* Overall growth chart */}
                  <div className="row mb-4">
                    <div className="col-lg-12">
                      <div className="card">
                        <div className="card-header">
                          <h6 className="mb-0">Overall Cycle Count Percentage Trend</h6>
                        </div>
                        <div className="card-body">
                          <div className="chart-container" style={{ height: '300px' }}>
                            <Line 
                              data={getOverallChartData()} 
                              options={chartOptions} 
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Branch-specific growth chart */}
                  <div className="row">
                    <div className="col-lg-12">
                      <div className="card">
                        <div className="card-header">
                          <h6 className="mb-0">
                            {selectedBranch === 'all' ? 
                              'Top 5 Branches Cycle Count Percentage' : 
                              `${getBranchShortName(selectedBranch)} Cycle Count Trend`}
                          </h6>
                        </div>
                        <div className="card-body">
                          <div className="chart-container" style={{ height: '300px' }}>
                            {selectedBranch === 'all' ? (
                              <Line 
                                data={getBranchChartData()} 
                                options={chartOptions} 
                              />
                            ) : (
                              <Bar
                                data={getBranchChartData()}
                                options={chartOptions}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnalyzeComponent;

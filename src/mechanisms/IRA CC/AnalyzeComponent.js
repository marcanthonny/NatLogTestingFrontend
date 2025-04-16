import React, { useState, useEffect } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import '../../interfaces/css/components/AnalyzeComponent.css';
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

export const useAnalyzeComponentLogic = ({ iraData, ccData, snapshotInfo }) => {
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
  
  // Modify useAnalyzeComponentLogic to handle JSON snapshot data
  useEffect(() => {
    if (snapshotInfo && snapshotInfo.ccStats) {
      // If viewing a snapshot, use its data
      const historyEntry = {
        date: snapshotInfo.date,
        average: snapshotInfo.ccStats.percentage,
        branches: {}
      };

      // Convert branch percentages array to object format for charts
      snapshotInfo.ccStats.branchPercentages.forEach(branch => {
        historyEntry.branches[branch.branch] = branch.percentage;
      });

      setHistoricalData([historyEntry]);
    } else if (ccData) {
      // ...existing code for handling uploaded data...
    }
  }, [snapshotInfo, ccData]);
  
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
    if (!historicalData || historicalData.length === 0) return { labels: [], datasets: [] };

    // For single snapshot view, show bar chart instead of line
    if (historicalData.length === 1) {
      return {
        labels: ['Current'],
        datasets: [{
          label: 'CC %',
          data: [historicalData[0].average.toFixed(2)],
          backgroundColor: 'rgba(0, 123, 255, 0.5)',
          borderColor: 'rgba(0, 123, 255, 1)',
          borderWidth: 2
        }]
      };
    }

    // ...existing code for multiple snapshots...
  };
  
  // Format data for branch-specific growth chart
  const getBranchChartData = () => {
    if (!historicalData || historicalData.length === 0) return { labels: [], datasets: [] };

    // For single snapshot, show branch comparison
    if (historicalData.length === 1) {
      const snapshot = historicalData[0];
      const branchData = Object.entries(snapshot.branches)
        .sort(([,a], [,b]) => b - a) // Sort by percentage
        .slice(0, selectedBranch === 'all' ? 5 : 1); // Show top 5 or selected branch

      return {
        labels: branchData.map(([branch]) => getBranchShortName(branch)),
        datasets: [{
          label: 'CC %',
          data: branchData.map(([,value]) => value.toFixed(2)),
          backgroundColor: 'rgba(0, 123, 255, 0.5)',
          borderColor: 'rgba(0, 123, 255, 1)',
          borderWidth: 2
        }]
      };
    }

    // ...existing code for multiple snapshots...
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

  return {
    loading,
    error,
    historicalData,
    selectedTimeframe,
    setSelectedTimeframe,
    selectedBranch,
    setSelectedBranch,
    getBranchOptions,
    getOverallChartData,
    getBranchChartData,
    chartOptions,
    growthIndicators,
    snapshotGrowth,
    currentSnapshot,
    previousSnapshot,
    handleManualSave,
    lastUpdated,
    getBranchShortName,
    formatDate
  };
};

const AnalyzeComponent = ({ iraData, ccData, snapshotInfo }) => {
  const logic = useAnalyzeComponentLogic({ iraData, ccData, snapshotInfo });
  
  return (
    <div className="analyze-container">
      {/* Content will come from interfaces/IraCcComponents/AnalyzeComponent.jsx */}
    </div>
  );
};

export default AnalyzeComponent;
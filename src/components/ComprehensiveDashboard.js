import React, { useState, useEffect } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import axios from 'axios';
import './css/ComprehensiveDashboard.css';
import { WEEKLY_CONFIG, getWeekForDate } from '../config/weeklyConfig';

// Register ChartJS components
Chart.register(...registerables);
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

function ComprehensiveDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [weeklySnapshots, setWeeklySnapshots] = useState([]);
  const [detailedSnapshots, setDetailedSnapshots] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [comparePeriod, setComparePeriod] = useState('all');
  const [viewMode, setViewMode] = useState('growth'); // 'growth', 'absolute', 'comparison'

  // Load weekly snapshots on component mount
  useEffect(() => {
    loadWeeklySnapshots();
  }, []);

  // Load weekly snapshots from server
  const loadWeeklySnapshots = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/snapshots');
      // Sort snapshots by date (oldest to newest)
      const sortedSnapshots = response.data.sort((a, b) => new Date(a.date) - new Date(b.date));
      setWeeklySnapshots(sortedSnapshots);
      // Fetch detailed data for each snapshot
      await loadDetailedSnapshots(sortedSnapshots);
    } catch (error) {
      console.error('Error loading weekly snapshots:', error);
      setError('Failed to load snapshots. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Load detailed data for each snapshot
  const loadDetailedSnapshots = async (snapshots) => {
    const detailedData = [];
    try {
      // Get the 12 most recent snapshots if there are more than 12
      const recentSnapshots = snapshots.length > 12 ? snapshots.slice(-12) : snapshots;
      for (const snapshot of recentSnapshots) {
        const response = await axios.get(`/api/snapshots/${snapshot.id}`);
        detailedData.push(response.data);
      }
      setDetailedSnapshots(detailedData);
    } catch (error) {
      console.error('Error loading detailed snapshots:', error);
      setError('Failed to load snapshot details. Some data may be incomplete.');
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Get short branch name
  const getBranchShortName = (fullName) => {
    const parts = fullName.split(' - ');
    if (parts.length > 1) {
      return parts[1].replace('PT. APL ', '');
    }
    return fullName;
  };

  // Get data for overall CC % growth chart across all weeks
  const getOverallCcGrowthData = () => {
    if (detailedSnapshots.length < 2) {
      return {
        labels: [],
        datasets: []
      };
    }

    // Calculate week-over-week growth for CC %
    const growthData = [];
    for (let i = 1; i < detailedSnapshots.length; i++) {
      const prevWeek = detailedSnapshots[i - 1];
      const currWeek = detailedSnapshots[i];
      const growth = currWeek.ccStats.percentage - prevWeek.ccStats.percentage;
      growthData.push({
        week: currWeek.name,
        date: currWeek.date,
        growth
      });
    }

    return {
      labels: growthData.map(data => data.week),
      datasets: [
        {
          label: 'CC % Week-over-Week Change',
          data: growthData.map(data => data.growth.toFixed(2)),
          borderColor: 'rgba(54, 162, 235, 1)',
          backgroundColor: growthData.map(data => 
            data.growth >= 0 ? 'rgba(75, 192, 192, 0.6)' : 'rgba(255, 99, 132, 0.6)'
          ),
          borderWidth: 1,
          type: 'bar',
        }
      ]
    };
  };

  // Get data for branch-specific CC % chart
  const getBranchCcData = () => {
    if (detailedSnapshots.length === 0) {
      return {
        labels: [],
        datasets: []
      };
    }

    // Determine which branches to show
    const branchesToShow = selectedBranch === 'all' 
      ? VALID_BRANCHES  // Show all branches instead of just top 5
      : [selectedBranch];

    // Filter snapshots based on compare period
    const filteredSnapshots = comparePeriod === 'all' 
      ? detailedSnapshots 
      : detailedSnapshots.slice(-parseInt(comparePeriod));

    // Generate datasets for each branch
    const datasets = branchesToShow.map((branch, index) => {
      const colors = [
        'rgba(255, 99, 132, 1)',    // Red
        'rgba(54, 162, 235, 1)',    // Blue
        'rgba(255, 206, 86, 1)',    // Yellow
        'rgba(75, 192, 192, 1)',    // Teal
        'rgba(153, 102, 255, 1)',   // Purple
        'rgba(255, 159, 64, 1)',    // Orange
        'rgba(199, 199, 199, 1)',   // Gray
        'rgba(83, 102, 255, 1)',    // Indigo
        'rgba(255, 99, 255, 1)',    // Pink
        'rgba(99, 255, 132, 1)',    // Light Green
        'rgba(255, 127, 80, 1)',    // Coral
        'rgba(100, 149, 237, 1)',   // Cornflower Blue
        'rgba(189, 183, 107, 1)',   // Dark Khaki
        'rgba(143, 188, 143, 1)',   // Dark Sea Green
        'rgba(255, 105, 180, 1)',   // Hot Pink
        'rgba(147, 112, 219, 1)',   // Medium Purple
        'rgba(60, 179, 113, 1)',    // Medium Sea Green
        'rgba(238, 130, 238, 1)',   // Violet
        'rgba(106, 90, 205, 1)',    // Slate Blue
        'rgba(218, 165, 32, 1)',    // Golden Rod
        'rgba(72, 209, 204, 1)',    // Medium Turquoise
        'rgba(199, 21, 133, 1)',    // Medium Violet Red
        'rgba(205, 92, 92, 1)',     // Indian Red
        'rgba(0, 139, 139, 1)'      // Dark Cyan
      ];

      // Get CC percentage for each week
      const data = filteredSnapshots.map(snapshot => {
        const branchData = snapshot.ccStats.branchPercentages.find(b => b.branch === branch);
        return branchData ? branchData.percentage.toFixed(2) : '0';
      });

      // For growth view mode, calculate week-over-week growth
      let growthData = [];
      if (viewMode === 'growth' && data.length > 1) {
        for (let i = 1; i < data.length; i++) {
          const prevValue = parseFloat(data[i - 1]);
          const currValue = parseFloat(data[i]);
          growthData.push((currValue - prevValue).toFixed(2));
        }
        growthData.unshift(null);
      }

      return {
        label: getBranchShortName(branch),
        data: viewMode === 'growth' && data.length > 1 ? growthData : data,
        borderColor: colors[index % colors.length],
        backgroundColor: `rgba(${colors[index % colors.length].slice(5, -2)}, 0.1)`,
        borderWidth: 2,
        fill: false,
        tension: 0.4,
        hidden: index >= 10 // Initially show only first 10 branches
      };
    });

    return {
      labels: filteredSnapshots.map(snapshot => snapshot.name),
      datasets
    };
  };

  // Get data for week-to-week comparison
  const getWeekComparisonData = () => {
    if (detailedSnapshots.length < 2) {
      return {
        labels: [],
        datasets: []
      };
    }

    try {
      // Get current week's data (most recent snapshot)
      const currentWeek = detailedSnapshots[detailedSnapshots.length - 1];

      // Calculate the offset based on comparePeriod
      const periodInDays = {
        '4': 28,   // 4 weeks
        '8': 56,   // 8 weeks
        '12': 84,  // 12 weeks
        'all': 7   // Default to 1 week if 'all' is selected
      };

      // Get previous week's data based on comparePeriod
      const dayOffset = periodInDays[comparePeriod] || 7;
      const targetDate = new Date(currentWeek.date);
      targetDate.setDate(targetDate.getDate() - dayOffset);

      // Find the closest snapshot before the target date
      const lastWeek = detailedSnapshots
        .filter(snapshot => new Date(snapshot.date) <= targetDate)
        .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

      if (!lastWeek?.ccStats?.branchPercentages || !currentWeek?.ccStats?.branchPercentages) {
        console.error('Missing CC stats:', { lastWeek, currentWeek });
        return {
          labels: [],
          datasets: []
        };
      }

      // Get branches and sort by current week percentage
      const branches = VALID_BRANCHES.filter(branch => {
        const lastWeekData = lastWeek.ccStats.branchPercentages.find(b => b.branch === branch);
        const currentWeekData = currentWeek.ccStats.branchPercentages.find(b => b.branch === branch);
        return lastWeekData && currentWeekData;
      }).sort((a, b) => {
        const aData = currentWeek.ccStats.branchPercentages.find(b => b.branch === a)?.percentage || 0;
        const bData = currentWeek.ccStats.branchPercentages.find(b => b.branch === b)?.percentage || 0;
        return bData - aData;
      });

      const topBranches = branches.slice(0, 10);

      return {
        labels: topBranches.map(branch => getBranchShortName(branch)),
        datasets: [
          {
            label: `Previous Period (${formatDate(lastWeek.date)})`,
            data: topBranches.map(branch => {
              const branchData = lastWeek.ccStats.branchPercentages.find(b => b.branch === branch);
              return branchData ? parseFloat(branchData.percentage).toFixed(2) : '0';
            }),
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
            borderWidth: 0
          },
          {
            label: `Current Week (${formatDate(currentWeek.date)})`,
            data: topBranches.map(branch => {
              const branchData = currentWeek.ccStats.branchPercentages.find(b => b.branch === branch);
              return branchData ? parseFloat(branchData.percentage).toFixed(2) : '0';
            }),
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
            borderWidth: 0
          }
        ]
      };
    } catch (error) {
      console.error('Error generating week comparison data:', error);
      return {
        labels: [],
        datasets: []
      };
    }
  };

  // Calculate growth indicators - UPDATED to handle branch selection
  const getGrowthIndicators = () => {
    if (detailedSnapshots.length < 2) {
      return { weekly: 0, overall: 0 };
    }

    // Get the two most recent snapshots
    const currentWeek = detailedSnapshots[detailedSnapshots.length - 1];

    // Find the previous week's snapshot based on compare period
    const periodInDays = {
      '4': 28,
      '8': 56,
      '12': 84,
      'all': null
    };
    const targetDate = new Date(currentWeek.date);
    targetDate.setDate(targetDate.getDate() - (periodInDays[comparePeriod] || 7));
    
    // Find the closest snapshot before the target date
    const lastWeek = detailedSnapshots
      .filter(snapshot => new Date(snapshot.date) <= targetDate)
      .sort((a, b) => new Date(b.date) - new Date(a.date))[0] || detailedSnapshots[0];
    
    let weeklyGrowth, overallGrowth;
    
    if (selectedBranch === 'all') {
      // Use overall CC percentage
      weeklyGrowth = currentWeek.ccStats.percentage - lastWeek.ccStats.percentage;
      overallGrowth = currentWeek.ccStats.percentage - detailedSnapshots[0].ccStats.percentage;
    } else {
      // Find branch-specific percentages
      const currentBranchData = currentWeek.ccStats.branchPercentages
        .find(b => b.branch === selectedBranch);
      const lastWeekBranchData = lastWeek.ccStats.branchPercentages
        .find(b => b.branch === selectedBranch);
      const firstWeekBranchData = detailedSnapshots[0].ccStats.branchPercentages
        .find(b => b.branch === selectedBranch);
      weeklyGrowth = (currentBranchData?.percentage || 0) - (lastWeekBranchData?.percentage || 0);
      overallGrowth = (currentBranchData?.percentage || 0) - (firstWeekBranchData?.percentage || 0);
    }

    return {
      weekly: weeklyGrowth, 
      overall: overallGrowth,
      lastWeekSnapshot: lastWeek,
      currentWeekSnapshot: currentWeek
    };
  };

  // Get metric card values - NEW helper function
  const getMetricValues = () => {
    const growthIndicators = getGrowthIndicators();
    if (!growthIndicators.lastWeekSnapshot || !growthIndicators.currentWeekSnapshot) {
      return { lastWeek: 0, currentWeek: 0 };
    }

    const lastWeek = growthIndicators.lastWeekSnapshot;
    const currentWeek = growthIndicators.currentWeekSnapshot;

    if (selectedBranch === 'all') {
      return {
        lastWeek: lastWeek.ccStats.percentage,
        currentWeek: currentWeek.ccStats.percentage
      };
    }
    
    // Get branch-specific percentages
    const lastWeekBranch = lastWeek.ccStats.branchPercentages
      .find(b => b.branch === selectedBranch);
    const currentWeekBranch = currentWeek.ccStats.branchPercentages
      .find(b => b.branch === selectedBranch);

    return {
      lastWeek: lastWeekBranch?.percentage || 0,
      currentWeek: currentWeekBranch?.percentage || 0
    };
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: {
          stepSize: 10,
          callback: function(value) {
            return value + '%';
          }
        },
        title: {
          display: true,
          text: viewMode === 'growth' ? 'Growth (%)' : 'Percentage (%)'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Weeks'
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

  // Bar chart options
  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: {
          stepSize: 10,
          callback: function(value) {
            return value + '%';
          }
        },
        title: {
          display: true,
          text: 'Percentage (%)'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Branches'
        }
      }
    },
    plugins: {
      legend: {
        position: 'top',
      }
    }
  };

  // Growth indicators from calculations
  const growthIndicators = getGrowthIndicators();

  const exportToExcel = async (snapshotId) => {
    try {
      const response = await axios.get(`/api/snapshots/export/${snapshotId}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `snapshot-${snapshotId}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting to Excel:', error);
    }
  };
  
  const createEmailDraft = async (snapshotId, templatePath) => {
    try {
      const response = await axios.post('/api/snapshots/email-draft', {
        snapshotId,
        templatePath
      });
      console.log('Email draft created:', response.data);
    } catch (error) {
      console.error('Error creating email draft:', error);
    }
  };

  return (
    <div className="comprehensive-dashboard">
      {error && (
        <div className="alert alert-danger mb-4">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </div>
      )}
      
      <div className="row mb-4">
        <div className="col-lg-12">
          <div className="card shadow-sm">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Weekly Cycle Count Comparison</h5>
              <div>
                <button 
                  className="btn btn-outline-primary btn-sm me-2" 
                  onClick={() => exportToExcel(detailedSnapshots[detailedSnapshots.length - 1].id)}
                  disabled={loading}
                >
                  <i className="bi bi-file-earmark-excel me-1"></i>
                  Export to Excel
                </button>
                <button 
                  className="btn btn-outline-secondary btn-sm" 
                  onClick={() => createEmailDraft(detailedSnapshots[detailedSnapshots.length - 1].id, '/path/to/template.json')}
                  disabled={loading}
                >
                  <i className="bi bi-envelope me-1"></i>
                  Create Email Draft
                </button>
                <button 
                  className="btn btn-outline-primary btn-sm" 
                  onClick={loadWeeklySnapshots}
                  disabled={loading}
                >
                  <i className="bi bi-arrow-clockwise me-1"></i>
                  Refresh Data
                </button>
              </div>
            </div>

            <div className="card-body">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2">Loading dashboard data...</p>
                </div>
              ) : detailedSnapshots.length < 2 ? (
                <div className="alert alert-info">
                  <i className="bi bi-info-circle me-2"></i>
                  At least two weekly snapshots are needed for comparison. 
                  Please save more weekly data in the Historical Data section.
                </div>
              ) : (
                <>
                  {/* Growth metrics cards */}
                  <div className="row mb-4">
                    <div className="col-md-4">
                      <div className="card metric-card">
                        <div className="card-body">
                          <h6 className="text-muted">Last Week's CC %</h6>
                          <h3 className="mt-2 mb-0">
                            {getMetricValues().lastWeek.toFixed(2)}%
                          </h3>
                          <small className="text-muted">
                            {growthIndicators.lastWeekSnapshot?.name || 'N/A'}
                          </small>
                        </div>
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="card metric-card">
                        <div className="card-body">
                          <h6 className="text-muted">Current Week's CC %</h6>
                          <h3 className="mt-2 mb-0">
                            {getMetricValues().currentWeek.toFixed(2)}%
                          </h3>
                          <small className="text-muted">
                            {growthIndicators.currentWeekSnapshot?.name || 'N/A'}
                          </small>
                        </div>
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="card metric-card">
                        <div className="card-body">
                          <h6 className="text-muted">Week-over-Week Growth</h6>
                          <h3 className={`mt-2 mb-0 ${growthIndicators.weekly >= 0 ? 'text-success' : 'text-danger'}`}>
                            {growthIndicators.weekly > 0 ? '+' : ''}{growthIndicators.weekly.toFixed(2)}%
                          </h3>
                          <small className={growthIndicators.weekly >= 0 ? 'text-success' : 'text-danger'}>
                            <i className={`bi ${growthIndicators.weekly >= 0 ? 'bi-arrow-up' : 'bi-arrow-down'}`}></i>
                            {growthIndicators.weekly >= 0 ? 'Improved' : 'Declined'} since last week
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Controls for data view */}
                  <div className="row mb-4">
                    <div className="col-md-6">
                      <div className="d-flex align-items-center">
                        <label className="me-2">View Mode:</label>
                        <div className="btn-group">
                          <button 
                            className={`btn btn-sm ${viewMode === 'absolute' ? 'btn-primary' : 'btn-outline-primary'}`} 
                            onClick={() => setViewMode('absolute')}
                          >
                            Absolute Values
                          </button>
                          <button 
                            className={`btn btn-sm ${viewMode === 'growth' ? 'btn-primary' : 'btn-outline-primary'}`} 
                            onClick={() => setViewMode('growth')}
                          >
                            Growth Trends
                          </button>
                          <button 
                            className={`btn btn-sm ${viewMode === 'comparison' ? 'btn-primary' : 'btn-outline-primary'}`} 
                            onClick={() => setViewMode('comparison')}
                          >
                            Week Comparison
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="col-md-3">
                      <div className="d-flex align-items-center">
                        <label className="me-2">Period:</label>
                        <select 
                          className="form-select form-select-sm" 
                          value={comparePeriod}
                          onChange={(e) => setComparePeriod(e.target.value)}
                        >
                          <option value="all">All Weeks</option>
                          <option value="4">Last 4 Weeks</option>
                          <option value="8">Last 8 Weeks</option>
                          <option value="12">Last 12 Weeks</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="col-md-3">
                      <div className="d-flex align-items-center">
                        <label className="me-2">Branch:</label>
                        <select 
                          className="form-select form-select-sm" 
                          value={selectedBranch}
                          onChange={(e) => setSelectedBranch(e.target.value)}
                          disabled={viewMode === 'comparison'}
                        >
                          <option value="all">All Branches</option>
                          {VALID_BRANCHES.map((branch, index) => (
                            <option key={index} value={branch}>{getBranchShortName(branch)}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  {/* Main chart */}
                  <div className="row">
                    <div className="col-lg-12">
                      <div className="card">
                        <div className="card-header">
                          <h6 className="mb-0">
                            {viewMode === 'growth' && 'Week-over-Week Growth in CC %'}
                            {viewMode === 'absolute' && 'CC % Trend Over Time'}
                            {viewMode === 'comparison' && 'Last Week vs. Current Week Comparison'}
                          </h6>
                        </div>
                        <div className="card-body">
                          <div className="chart-container" style={{ height: '400px' }}>
                            {viewMode === 'growth' && detailedSnapshots.length > 1 && (
                              <Bar
                                data={getOverallCcGrowthData()}
                                options={chartOptions}
                              />
                            )}
                            {viewMode === 'absolute' && (
                              <Line
                                data={getBranchCcData()}
                                options={chartOptions}
                              />
                            )}
                            {viewMode === 'comparison' && (
                              <Bar
                                data={getWeekComparisonData()}
                                options={barChartOptions}
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

export default ComprehensiveDashboard;
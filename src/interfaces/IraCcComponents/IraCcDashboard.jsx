import React, { useEffect, useState } from 'react';
import { useIraCcDashboardLogic } from '../../mechanisms/IRA CC/IraCcDashboard';
import WeekTargetConfiguration from '../../mechanisms/IRA CC/WeekTargetConfiguration';
import '../css/components/IraCcDashboard.css';

const getWeekTargets = (snapshotInfo) => {
  const weekSettings = JSON.parse(localStorage.getItem('weekTargetSettings'));
  if (!weekSettings || !snapshotInfo?.weekNumber) return null;

  const weekKey = `week${snapshotInfo.weekNumber}`;
  return {
    ira: weekSettings.ira[weekKey],
    cc: weekSettings.cc[weekKey]
  };
};

function IraCcDashboard({ iraData, ccData, snapshotInfo }) {
  // Add this helper function
  const getDefaultCcTarget = (weekNumber) => {
    const defaultTargets = {
      1: 25,
      2: 50,
      3: 75,
      4: 99
    };
    return defaultTargets[weekNumber] || 99;
  };

  const [error, setError] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [availablePeriods, setAvailablePeriods] = React.useState([]);
  const [selectedPeriod, setSelectedPeriod] = React.useState('');
  const [showSettings, setShowSettings] = React.useState(false);
  const [weekSettings, setWeekSettings] = React.useState({});
  const [showConfig, setShowConfig] = React.useState(false);
  const [currentWeek, setCurrentWeek] = React.useState(null);
  const dashboardRef = React.useRef(null);
  const [dataSource, setDataSource] = useState('current');
  const [iraStats, setIraStats] = useState({ counted: 0, notCounted: 0, percentage: 0, branchPercentages: [] });
  const [ccStats, setCcStats] = useState({ counted: 0, notCounted: 0, percentage: 0, branchPercentages: [] });

  const formatDate = (date) => new Date(date).toLocaleDateString();
  const meetsIraTarget = (percentage) => {
    if (percentage === undefined || currentWeek?.ira?.target === undefined) return false;
    return percentage >= (currentWeek?.ira?.target || 0);
  };
  const meetsCcTarget = (percentage) => {
    if (percentage === undefined || currentWeek?.cc?.target === undefined) return false;
    return percentage >= (currentWeek?.cc?.target || 0);
  };
  const {
    exportAsExcel,
    createEmailDraft,
    VALID_BRANCHES,
    handleSaveSettings,
    logs,
    addLog,
  } = useIraCcDashboardLogic({ iraData, ccData, snapshotInfo });

  const handleConfigurationUpdate = (newConfig) => {
    handleSaveSettings(newConfig);
  };

  const getWeekFromName = (name) => {
    if (!name) return null;
    const match = name.match(/^W(\d)/);
    return match ? parseInt(match[1]) : null;
  };

  const getTargets = (weekNumber) => {
    // Default targets
    const defaultTargets = {
      ira: {
        target: 99,
        startDate: null,
        endDate: null
      },
      cc: {
        target: weekNumber ? {
          1: 25,
          2: 50,
          3: 75,
          4: 99
        }[weekNumber] : 99,
        startDate: null,
        endDate: null
      }
    };

    // If we have saved configurations, use them
    const weekSettings = localStorage.getItem('weekTargetSettings');
    if (weekSettings) {
      try {
        const settings = JSON.parse(weekSettings);
        const weekKey = `week${weekNumber}`;
        return {
          ira: settings.ira[weekKey] || defaultTargets.ira,
          cc: settings.cc[weekKey] || defaultTargets.cc
        };
      } catch (e) {
        console.error('Error parsing week settings:', e);
      }
    }

    return defaultTargets;
  };

  // Add helper function to parse week number from snapshot name
  const getWeekFromSnapshotName = (name) => {
    if (!name) return null;
    const match = name.match(/W(\d)/);
    return match ? parseInt(match[1]) : null;
  };

  // Modify getCurrentWeekSettings function
  const getCurrentWeekSettings = (source) => {
    if (source === 'snapshot' && snapshotInfo) {
      // Get week number from snapshot name
      const weekNumber = getWeekFromSnapshotName(snapshotInfo.name);
      if (!weekNumber) return null;

      return {
        ira: {
          week: `Week ${weekNumber}`,
          target: 99, // IRA target is always 99%
          startDate: null,
          endDate: null
        },
        cc: {
          week: `Week ${weekNumber}`,
          target: getDefaultCcTarget(weekNumber),
          startDate: null,
          endDate: null
        }
      };
    } else {
      // Use week from current configuration
      const today = new Date();
      const weekSettings = JSON.parse(localStorage.getItem('weekTargetSettings') || '{}');
      
      const isInWeekRange = (week) => {
        if (!week?.startDate || !week?.endDate) return false;
        const start = new Date(week.startDate);
        const end = new Date(week.endDate);
        end.setHours(23, 59, 59, 999);
        return today >= start && today <= end;
      };

      let currentIraWeek = null;
      let currentCcWeek = null;

      Object.entries(weekSettings.ira || {}).forEach(([week, settings]) => {
        if (isInWeekRange(settings)) {
          currentIraWeek = {
            week: week.replace('week', 'Week '),
            target: settings.target,
            startDate: settings.startDate,
            endDate: settings.endDate
          };
        }
      });

      Object.entries(weekSettings.cc || {}).forEach(([week, settings]) => {
        if (isInWeekRange(settings)) {
          currentCcWeek = {
            week: week.replace('week', 'Week '),
            target: settings.target,
            startDate: settings.startDate,
            endDate: settings.endDate
          };
        }
      });

      return {
        ira: currentIraWeek,
        cc: currentCcWeek
      };
    }
  };

  useEffect(() => {
    let weekNumber;
    
    if (snapshotInfo) {
      // For historical snapshots, get week from name
      weekNumber = getWeekFromName(snapshotInfo.name);
    } else if (iraData || ccData) {
      // For uploaded data, use current week from configuration
      const weekSettings = JSON.parse(localStorage.getItem('weekTargetSettings') || '{}');
      const today = new Date();
      
      for (const [week, settings] of Object.entries(weekSettings?.cc || {})) {
        const startDate = new Date(settings.startDate);
        const endDate = new Date(settings.endDate);
        if (today >= startDate && today <= endDate) {
          weekNumber = parseInt(week.replace('week', ''));
          break;
        }
      }
    }

    if (weekNumber) {
      const targets = getTargets(weekNumber);
      setCurrentWeek({
        ira: {
          week: `Week ${weekNumber}`,
          target: targets.ira.target,
          startDate: targets.ira.startDate,
          endDate: targets.ira.endDate
        },
        cc: {
          week: `Week ${weekNumber}`,
          target: targets.cc.target,
          startDate: targets.cc.startDate,
          endDate: targets.cc.endDate
        }
      });
    }
  }, [iraData, ccData, snapshotInfo]);

  // Update useEffect to handle week changes based on data source
  useEffect(() => {
    const weekSettings = getCurrentWeekSettings(dataSource);
    setCurrentWeek(weekSettings);
  }, [dataSource, snapshotInfo]);

  // Switch data source and update state
  const handleDataSourceChange = (source) => {
    setDataSource(source);
    if (source === 'snapshot' && snapshotInfo) {
      // Use snapshot data with default values if stats are missing
      setIraStats(snapshotInfo.iraStats || { counted: 0, notCounted: 0, percentage: 0, branchPercentages: [] });
      setCcStats(snapshotInfo.ccStats || { counted: 0, notCounted: 0, percentage: 0, branchPercentages: [] });
    } else {
      // Use current uploaded data
      if (iraData) {
        addLog('Processing current IRA data...', 'info');
        const processedIraStats = processIraData(iraData) || { counted: 0, notCounted: 0, percentage: 0, branchPercentages: [] };
        setIraStats(processedIraStats);
        addLog('Current IRA data processed', 'success');
      }
      if (ccData) {
        addLog('Processing current CC data...', 'info');
        const processedCcStats = processCcData(ccData) || { counted: 0, notCounted: 0, percentage: 0, branchPercentages: [] };
        setCcStats(processedCcStats);
        addLog('Current CC data processed', 'success');
      }
    }
  };

  // Also ensure these get processed on initial load
  useEffect(() => {
    // Set initial data source
    if (snapshotInfo) {
      setDataSource('snapshot');
      setIraStats(snapshotInfo.iraStats || {});
      setCcStats(snapshotInfo.ccStats || {});
    } else if (iraData || ccData) {
      setDataSource('current');
      if (iraData) {
        addLog('Processing uploaded IRA data...', 'info');
        const processedIraStats = processIraData(iraData);
        setIraStats(processedIraStats);
        addLog('Uploaded IRA data processed', 'success');
      }
      if (ccData) {
        addLog('Processing uploaded CC data...', 'info');
        const processedCcStats = processCcData(ccData);
        setCcStats(processedCcStats);
        addLog('Uploaded CC data processed', 'success');
      }
    }
  }, [iraData, ccData, snapshotInfo]); // Add dependencies

  // Add data processing functions
  const processIraData = (data) => {
    if (!data || !data.data) return { counted: 0, notCounted: 0, percentage: 0, branchPercentages: [] };
    let counted = 0;
    let notCounted = 0;
    const branchGroups = {};

    VALID_BRANCHES.forEach(branch => {
      branchGroups[branch] = { counted: 0, total: 0 };
    });

    data.data.forEach(row => {
      const branch = row.Branch || row['!Branch'] || row.Plant;
      const isIraLine = row['%IRALine'] === 1 || row['Count Status'] === 'Counted';

      if (isIraLine) {
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

    const total = counted + notCounted;
    const percentage = total > 0 ? (counted / total) * 100 : 0;

    const branchPercentages = VALID_BRANCHES
      .filter(branch => branchGroups[branch].total > 0)
      .map(branch => ({
        branch,
        percentage: (branchGroups[branch].counted / branchGroups[branch].total) * 100
      }));

    const stats = { counted, notCounted, percentage, branchPercentages };
    setIraStats(stats); // Keep the state update
    return stats; // Important: Return the stats object
  };

  const processCcData = (data) => {
    if (!data || !data.data) return { counted: 0, notCounted: 0, percentage: 0, branchPercentages: [] };
    let counted = 0;
    let notCounted = 0;
    const branchGroups = {};

    VALID_BRANCHES.forEach(branch => {
      branchGroups[branch] = { counted: 0, total: 0 };
    });

    data.data.forEach(row => {
      const branch = row.Branch || row['!Branch'] || row.Plant;
      const isCounted = row['%CountComp'] === 1 || row['Count Status'] === 'Counted';

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

    const total = counted + notCounted;
    const percentage = total > 0 ? (counted / total) * 100 : 0;

    const branchPercentages = VALID_BRANCHES
      .filter(branch => branchGroups[branch].total > 0)
      .map(branch => ({
        branch,
        percentage: (branchGroups[branch].counted / branchGroups[branch].total) * 100
      }));

    const stats = { counted, notCounted, percentage, branchPercentages };
    setCcStats(stats); // Keep the state update
    return stats; // Important: Return the stats object
  };

  return (
    <div className="cms-dashboard-container">
      {/* Add data source selector */}
      {snapshotInfo && (iraData || ccData) && (
        <div className="card mb-3">
          <div className="card-body py-2">
            <div className="d-flex align-items-center justify-content-between">
              <div className="btn-group">
                <button
                  className={`btn btn-sm ${dataSource === 'current' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => handleDataSourceChange('current')}
                >
                  <i className="bi bi-file-earmark-excel me-1"></i>
                  Uploaded Data
                </button>
                <button
                  className={`btn btn-sm ${dataSource === 'snapshot' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => handleDataSourceChange('snapshot')}
                >
                  <i className="bi bi-clock-history me-1"></i>
                  Snapshot: {snapshotInfo.name}
                </button>
              </div>
              
              <small className="text-muted">
                {dataSource === 'snapshot' ? 
                  `Viewing snapshot from ${formatDate(snapshotInfo.date)}` : 
                  'Viewing current uploaded data'}
              </small>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="alert alert-danger mb-4">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </div>
      )}
      {/* Export and Settings buttons */}
      <div className="mb-3">
        <div className="btn-group">
          <button 
            className="btn btn-outline-success" 
            onClick={exportAsExcel}
            title="Export as Excel spreadsheet"
          >
            <i className="bi bi-file-earmark-excel me-1"></i> Excel
          </button>
          <button 
            className="btn btn-outline-primary"
            onClick={() => setShowConfig(true)}
          >
            <i className="bi bi-gear me-1"></i> Configure Targets
          </button>
          <button 
            className="btn btn-outline-secondary"
            onClick={createEmailDraft}
            disabled={loading}
          >
            <i className="bi bi-envelope me-1"></i> Create Email Draft
          </button>
        </div>
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
      
      {/* Replace WeekTargetSettings with WeekTargetConfiguration */}
      <WeekTargetConfiguration
        show={showConfig}
        onHide={() => setShowConfig(false)}
        onUpdate={handleConfigurationUpdate}
      />

      {/* Add log display section */}
      <div className="card mt-4">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Processing Logs</h5>
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={() => addLog('Logs cleared', 'info')}
          >
            <i className="bi bi-trash me-2"></i>
            Clear Logs
          </button>
        </div>
        <div className="card-body">
          <div className="log-container" style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {logs.length === 0 ? (
              <p className="text-muted">No processing logs yet.</p>
            ) : (
              <div className="logs">
                {logs.map((log, index) => (
                  <div 
                    key={index} 
                    className={`log-entry ${log.type}`}
                    style={{ 
                      padding: '4px 8px',
                      borderLeft: `3px solid ${
                        log.type === 'error' ? '#dc3545' :
                        log.type === 'warning' ? '#ffc107' :
                        log.type === 'success' ? '#198754' :
                        '#0dcaf0'
                      }`
                    }}
                  >
                    <small className="text-muted me-2">[{log.timestamp}]</small>
                    <span>{log.message}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default IraCcDashboard;

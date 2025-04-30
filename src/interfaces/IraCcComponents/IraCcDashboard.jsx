import React, { useEffect, useState, useRef } from 'react';
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
  const [activeTable, setActiveTable] = useState('ira');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [availablePeriods, setAvailablePeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(null);
  const [dataSource, setDataSource] = useState('current');
  const [iraStats, setIraStats] = useState({ counted: 0, notCounted: 0, percentage: 0, branchPercentages: [] });
  const [ccStats, setCcStats] = useState({ counted: 0, notCounted: 0, percentage: 0, branchPercentages: [] });
  const dashboardRef = useRef(null);

  const {
    exportAsExcel,
    createEmailDraft,
    VALID_BRANCHES,
    handleSaveSettings,
    logs,
    addLog,
  } = useIraCcDashboardLogic({ iraData, ccData });

  const getDefaultCcTarget = (weekNumber) => {
    const defaultTargets = { 1: 25, 2: 50, 3: 75, 4: 99 };
    return defaultTargets[weekNumber] || 99;
  };

  const formatDate = (date) => date ? new Date(date).toLocaleDateString() : '';
  
  const meetsIraTarget = (percentage) => {
    if (percentage === undefined || currentWeek?.ira?.target === undefined) return false;
    return percentage >= (currentWeek?.ira?.target || 0);
  };

  const meetsCcTarget = (percentage) => {
    if (percentage === undefined || currentWeek?.cc?.target === undefined) return false;
    return percentage >= (currentWeek?.cc?.target || 0);
  };

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
      try {
        const weekSettings = JSON.parse(localStorage.getItem('weekTargetSettings') || '{}');
        const today = new Date(); // Add today variable here
        
        // Add safety checks
        if (!weekSettings || (!weekSettings.ira && !weekSettings.cc)) {
          return {
            ira: { week: 'Week 1', target: 99, startDate: null, endDate: null },
            cc: { week: 'Week 1', target: 25, startDate: null, endDate: null }
          };
        }
        
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
      } catch (error) {
        console.error('Error parsing week settings:', error);
        return {
          ira: { week: 'Week 1', target: 99, startDate: null, endDate: null },
          cc: { week: 'Week 1', target: 25, startDate: null, endDate: null }
        };
      }
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
    <div className="dashboard-container">
      {/* Data source selector */}
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

      {/* Mobile data selector */}
      <div className="d-block d-md-none data-selector-mobile">
        <select 
          value={activeTable}
          onChange={(e) => setActiveTable(e.target.value)}
          className="form-select mb-3"
        >
          <option value="ira">Inventory Record Accuracy Data</option>
          <option value="cc">Cycle Count Data</option>
        </select>
      </div>

      {/* Main content area */}
      <div ref={dashboardRef}>
        {/* Control buttons */}
        <div className="mb-3">
          <div className="btn-group">
            <button className="btn btn-outline-success" onClick={exportAsExcel}>
              <i className="bi bi-file-earmark-excel me-1"></i> Export Excel
            </button>
            <button className="btn btn-outline-primary" onClick={() => setShowConfig(true)}>
              <i className="bi bi-gear me-1"></i> Configure
            </button>
            <button className="btn btn-outline-secondary" onClick={createEmailDraft}>
              <i className="bi bi-envelope me-1"></i> Email Draft
            </button>
          </div>
        </div>

        {/* Current Week Status Card - Desktop Only */}
        <div className="d-none d-md-block">
          {currentWeek && currentWeek.ira && currentWeek.cc && (
            <div className="card mb-4">
              <div className="card-header text-white">
                <h5 className="mb-0">Active Week Status</h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6">
                    <div className="alert alert-primary mb-0">
                      <h6 className="mb-2">Inventory Record Accuracy Week</h6>
                      <strong>{currentWeek.ira.week}</strong>
                      <div className="mt-1">
                        <small>Target: {currentWeek.ira.target}%</small>
                        {currentWeek.ira.startDate && (
                          <small className="d-block">
                            {formatDate(currentWeek.ira.startDate)} - {formatDate(currentWeek.ira.endDate)}
                          </small>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="alert alert-info mb-0">
                      <h6 className="mb-2">Cycle Count Week</h6>
                      <strong>{currentWeek.cc.week}</strong>
                      <div className="mt-1">
                        <small>Target: {currentWeek.cc.target}%</small>
                        {currentWeek.cc.startDate && (
                          <small className="d-block">
                            {formatDate(currentWeek.cc.startDate)} - {formatDate(currentWeek.cc.endDate)}
                          </small>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Desktop view - both tables */}
        <div className="weekDesktop d-none d-md-block">
          <div className="row">
            {/* IRA Summary Card */}
            <div className="col-md-6 mb-4">
              <div className="card">
                <div className="card-header bg-primary text-white">
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Inventory Record Accuracy Summary</h5>
                    {currentWeek?.ira && (
                      <div className="text-end">
                        <small className="d-block">{currentWeek.ira.week}</small>
                        <small className="d-block">Target: {currentWeek.ira.target}%</small>
                      </div>
                    )}
                  </div>
                </div>
                <div className="card-body">
                  {/* IRA stats content */}
                  <div className="row mb-3">
                    <div className="col-4 text-center">
                      <h6>Hit</h6>
                      <h3 className="text-success">{iraStats.counted}</h3>
                    </div>
                    <div className="col-4 text-center">
                      <h6>Missed</h6>
                      <h3 className="text-danger">{iraStats.notCounted}</h3>
                    </div>
                    <div className="col-4 text-center">
                      <h6>Percentage</h6>
                      <h3 className={iraStats.percentage >= 99 ? "text-success" : "text-danger"}>
                        {iraStats.percentage.toFixed(2)}%
                      </h3>
                    </div>
                  </div>
                  {/* Add IRA branch percentages table */}
                  <h6 className="mb-3">Branch Percentages</h6>
                  <div className="table-responsive">
                    <table className="table table-sm table-hover">
                      <thead>
                        <tr>
                          <th className="text-start">Branch</th>
                          <th className="text-end">Percentage %</th>
                          <th className="text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {iraStats.branchPercentages
                          .sort((a, b) => b.percentage - a.percentage)
                          .map((branch, index) => (
                            <tr key={index}>
                              <td className="text-start">{branch.branch}</td>
                              <td className="text-end">
                                <span className={meetsIraTarget(branch.percentage) ? "text-success" : "text-danger"}>
                                  {branch.percentage.toFixed(2)}%
                                </span>
                              </td>
                              <td className="text-center">
                                {meetsIraTarget(branch.percentage) ? (
                                  <span className="badge bg-success">On Target</span>
                                ) : (
                                  <span className="badge bg-danger">Below Target</span>
                                )}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* CC Summary Card */}
            <div className="col-md-6 mb-4">
              <div className="card">
                <div className="card-header bg-info text-white">
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Cycle Count Summary</h5>
                    {currentWeek?.cc && (
                      <div className="text-end">
                        <small className="d-block">{currentWeek.cc.week}</small>
                        <small className="d-block">Target: {currentWeek.cc.target}%</small>
                      </div>
                    )}
                  </div>
                </div>
                <div className="card-body">
                  {/* CC stats content */}
                  <div className="row mb-3">
                    <div className="col-4 text-center">
                      <h6>Counted</h6>
                      <h3 className="text-success">{ccStats.counted}</h3>
                    </div>
                    <div className="col-4 text-center">
                      <h6>Not Counted</h6>
                      <h3 className="text-danger">{ccStats.notCounted}</h3>
                    </div>
                    <div className="col-4 text-center">
                      <h6>Percentage</h6>
                      <h3 className={ccStats.percentage >= currentWeek?.cc?.target ? "text-success" : "text-warning"}>
                        {ccStats.percentage.toFixed(2)}%
                      </h3>
                    </div>
                  </div>
                  {/* Add CC branch percentages table */}
                  <h6 className="mb-3">Branch Percentages</h6>
                  <div className="table-responsive">
                    <table className="table table-sm table-hover">
                      <thead>
                        <tr>
                          <th className="text-start">Branch</th>
                          <th className="text-end">Percentage %</th>
                          <th className="text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ccStats.branchPercentages
                          .sort((a, b) => b.percentage - a.percentage)
                          .map((branch, index) => (
                            <tr key={index}>
                              <td className="text-start">{branch.branch}</td>
                              <td className="text-end">
                                <span className={meetsCcTarget(branch.percentage) ? "text-success" : "text-danger"}>
                                  {branch.percentage.toFixed(2)}%
                                </span>
                              </td>
                              <td className="text-center">
                                {meetsCcTarget(branch.percentage) ? (
                                  <span className="badge bg-success">On Target</span>
                                ) : (
                                  <span className="badge bg-danger">Below Target</span>
                                )}
                              </td>
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

        {/* Mobile view - single table with conditional week display */}
        <div className="d-block d-md-none">
          {currentWeek && currentWeek.ira && currentWeek.cc && (
            <div className="card mb-4">
              <div className="card-header text-white">
                <h5 className="mb-0">Active Week Status</h5>
              </div>
              <div className="card-body p-0">
                {activeTable === 'ira' && currentWeek.ira && (
                  <div className="alert alert-primary m-3 mb-3">
                    <h6 className="mb-2">IRA Week</h6>
                    <strong>{currentWeek.ira.week}</strong>
                    <div className="mt-1">
                      <small>Target: {currentWeek.ira.target}%</small>
                      {currentWeek.ira.startDate && (
                        <small className="d-block">
                          {formatDate(currentWeek.ira.startDate)} - {formatDate(currentWeek.ira.endDate)}
                        </small>
                      )}
                    </div>
                  </div>
                )}
                
                {activeTable === 'cc' && currentWeek.cc && (
                  <div className="alert alert-info m-3 mb-3">
                    <h6 className="mb-2">CC Week</h6>
                    <strong>{currentWeek.cc.week}</strong>
                    <div className="mt-1">
                      <small>Target: {currentWeek.cc.target}%</small>
                      {currentWeek.cc.startDate && (
                        <small className="d-block">
                          {formatDate(currentWeek.cc.startDate)} - {formatDate(currentWeek.cc.endDate)}
                        </small>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Rest of mobile view content */}
          <div className={`data-table-section ${activeTable === 'ira' ? 'd-block' : 'd-none'}`}>
            {/* Mobile IRA Summary Card */}
            <div className="card mb-4">
              <div className="card-header bg-primary text-white">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">IRA Summary</h5>
                  {currentWeek?.ira && (
                    <div className="text-end">
                      <small className="d-block">{currentWeek.ira.week}</small>
                      <small className="d-block">Target: {currentWeek.ira.target}%</small>
                    </div>
                  )}
                </div>
              </div>
              <div className="card-body">
                {/* IRA stats content */}
                <div className="row mb-3">
                  <div className="col-4 text-center">
                    <h6>Counted</h6>
                    <h3 className="text-success">{iraStats.counted}</h3>
                  </div>
                  <div className="col-4 text-center">
                    <h6>Not Counted</h6>
                    <h3 className="text-danger">{iraStats.notCounted}</h3>
                  </div>
                  <div className="col-4 text-center">
                    <h6>Percentage</h6>
                    <h3 className={iraStats.percentage >= 99 ? "text-success" : "text-danger"}>
                      {iraStats.percentage.toFixed(2)}%
                    </h3>
                  </div>
                </div>
                {/* IRA branch percentages table */}
                <h6 className="mb-3">Branch Percentages</h6>
                <div className="table-responsive">
                  <table className="table table-sm table-hover">
                    <thead>
                      <tr>
                        <th className="text-start">Branch</th>
                        <th className="text-end">IRA %</th>
                        <th className="text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {iraStats.branchPercentages
                        .sort((a, b) => b.percentage - a.percentage)
                        .map((branch, index) => (
                          <tr key={index}>
                            <td className="text-start">{branch.branch}</td>
                            <td className="text-end">
                              <span className={meetsIraTarget(branch.percentage) ? "text-success" : "text-danger"}>
                                {branch.percentage.toFixed(2)}%
                              </span>
                            </td>
                            <td className="text-center">
                              {meetsIraTarget(branch.percentage) ? (
                                <span className="badge bg-success">On Target</span>
                              ) : (
                                <span className="badge bg-danger">Below Target</span>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <div className={`data-table-section ${activeTable === 'cc' ? 'd-block' : 'd-none'}`}>
            {/* Mobile CC Summary Card */}
            <div className="card mb-4">
              <div className="card-header bg-info text-white">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">CC Summary</h5>
                  {currentWeek?.cc && (
                    <div className="text-end">
                      <small className="d-block">{currentWeek.cc.week}</small>
                      <small className="d-block">Target: {currentWeek.cc.target}%</small>
                    </div>
                  )}
                </div>
              </div>
              <div className="card-body">
                {/* CC stats content */}
                <div className="row mb-3">
                  <div className="col-4 text-center">
                    <h6>Counted</h6>
                    <h3 className="text-success">{ccStats.counted}</h3>
                  </div>
                  <div className="col-4 text-center">
                    <h6>Not Counted</h6>
                    <h3 className="text-danger">{ccStats.notCounted}</h3>
                  </div>
                  <div className="col-4 text-center">
                    <h6>Percentage</h6>
                    <h3 className={ccStats.percentage >= currentWeek?.cc?.target ? "text-success" : "text-warning"}>
                      {ccStats.percentage.toFixed(2)}%
                    </h3>
                  </div>
                </div>
                {/* CC branch percentages table */}
                <h6 className="mb-3">Branch Percentages</h6>
                <div className="table-responsive">
                  <table className="table table-sm table-hover">
                    <thead>
                      <tr>
                        <th className="text-start">Branch</th>
                        <th className="text-end">CC %</th>
                        <th className="text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ccStats.branchPercentages
                        .sort((a, b) => b.percentage - a.percentage)
                        .map((branch, index) => (
                          <tr key={index}>
                            <td className="text-start">{branch.branch}</td>
                            <td className="text-end">
                              <span className={meetsCcTarget(branch.percentage) ? "text-success" : "text-danger"}>
                                {branch.percentage.toFixed(2)}%
                              </span>
                            </td>
                            <td className="text-center">
                              {meetsCcTarget(branch.percentage) ? (
                                <span className="badge bg-success">On Target</span>
                              ) : (
                                <span className="badge bg-danger">Below Target</span>
                              )}
                            </td>
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

      {/* Configuration modal */}
      <WeekTargetConfiguration
        show={showConfig}
        onHide={() => setShowConfig(false)}
        onUpdate={handleConfigurationUpdate}
      />
    </div>
  );
}

export default IraCcDashboard;

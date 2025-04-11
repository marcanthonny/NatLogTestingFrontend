import React from 'react';
import { Line, Bar } from 'react-chartjs-2';
import { useAnalyzeComponentLogic } from '../../mechanisms/IRA CC/AnalyzeComponent';
import '../css/components/AnalyzeComponent.css';

function AnalyzeComponent({ iraData, ccData, snapshotInfo }) {
  const {
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
  } = useAnalyzeComponentLogic({ iraData, ccData, snapshotInfo });

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

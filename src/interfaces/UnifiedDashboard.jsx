// NOTE: You should create and import './UnifiedDashboard.css' for custom styles.
import React, { useState } from 'react';
import EnhancedFileUpload from './IraCcComponents/EnhancedFileUpload';
import IraCcDashboard from './IraCcComponents/IraCcDashboard';
import HistoricalDataComponent from '../mechanisms/IRA CC/HistoricalDataComponent';
// import './UnifiedDashboard.css'; // Uncomment after creating your CSS

function UnifiedDashboard() {
  const [iraData, setIraData] = useState(null);
  const [ccData, setCcData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedSnapshot, setSelectedSnapshot] = useState(null);

  // Handle upload success for IRA and CC
  const handleIraUploadSuccess = (data) => {
    setIraData(data);
    setSelectedSnapshot(null); // Clear snapshot selection on new upload
  };

  const handleCcUploadSuccess = (data) => {
    setCcData(data);
    setSelectedSnapshot(null);
  };

  // Handle snapshot selection from HistoricalDataComponent
  const handleSnapshotSelect = (snapshot) => {
    setSelectedSnapshot(snapshot);
    setIraData(null);
    setCcData(null);
  };

  // Error and loading handlers
  const handleError = (msg) => setError(msg);
  const handleLoading = (isLoading) => setLoading(isLoading);
  const handleSuccess = (msg) => setSuccess(msg);

  return (
    <div className="unified-dashboard">
      <div className="unified-dashboard-main">
        {/* Left: Upload & History */}
        <div className="unified-dashboard-left">
          <EnhancedFileUpload
            onIraUploadSuccess={handleIraUploadSuccess}
            onCcUploadSuccess={handleCcUploadSuccess}
            onLoading={handleLoading}
            onError={handleError}
            onSuccess={handleSuccess}
            hasIraPowerBi={false}
            hasCcPowerBi={false}
          />
          <div className="unified-dashboard-history">
            <HistoricalDataComponent
              iraData={iraData}
              ccData={ccData}
              onSnapshotSelect={handleSnapshotSelect}
            />
          </div>
        </div>
        {/* Right: Dashboard */}
        <div className="unified-dashboard-right">
          <div className="dashboard-view">
            {(iraData && ccData) || selectedSnapshot ? (
              <IraCcDashboard
                iraData={iraData}
                ccData={ccData}
                snapshotInfo={selectedSnapshot}
                onError={handleError}
              />
            ) : (
              <div className="dashboard-placeholder">
                <div>
                  <span className="dashboard-placeholder-icon" />
                  <h5>No Data Selected</h5>
                  <p className="dashboard-placeholder-text">
                    Upload IRA & CC files or select a historical snapshot to view the dashboard.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Global error/success display */}
      <div className="unified-dashboard-messages">
        {error && (
          <div className="dashboard-error">
            <span className="dashboard-error-icon" />
            {error}
          </div>
        )}
        {success && (
          <div className="dashboard-success">
            <span className="dashboard-success-icon" />
            {success}
          </div>
        )}
      </div>
    </div>
  );
}

export default UnifiedDashboard;

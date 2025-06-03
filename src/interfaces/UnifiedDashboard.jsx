// NOTE: You should create and import './UnifiedDashboard.css' for custom styles.
import React, { useState } from 'react';
import EnhancedFileUpload from './IraCcComponents/EnhancedFileUpload';
import IraCcDashboard from './IraCcComponents/IraCcDashboard';
import HistoricalDataComponent from '../mechanisms/IRA CC/HistoricalDataComponent';
import './css/UnifiedDashboard.css'; // Uncommented the import

function UnifiedDashboard() {
  const [iraData, setIraData] = useState(null);
  const [ccData, setCcData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedSnapshot, setSelectedSnapshot] = useState(null);

  const handleIraUploadSuccess = (data) => {
    setIraData(data);
    setSelectedSnapshot(null);
  };

  const handleCcUploadSuccess = (data) => {
    setCcData(data);
    setSelectedSnapshot(null);
  };

  const handleSnapshotSelect = (snapshot) => {
    setSelectedSnapshot(snapshot);
    setIraData(null);
    setCcData(null);
  };

  const handleError = (msg) => setError(msg);
  const handleLoading = (isLoading) => setLoading(isLoading);
  const handleSuccess = (msg) => setSuccess(msg);

  return (
    <div className="unified-dashboard">
      <div className="two-column-layout">
        {/* Left Column */}
        <div className="left-column">
          {/* Container for side-by-side upload and data view - Data View removed */}
          <div className="upload-and-data-container">
          <div className="upload-section">
            <EnhancedFileUpload
              onIraUploadSuccess={handleIraUploadSuccess}
              onCcUploadSuccess={handleCcUploadSuccess}
              onLoading={handleLoading}
              onError={handleError}
              onSuccess={handleSuccess}
              hasIraPowerBi={false}
              hasCcPowerBi={false}
            />
          </div>
            {/* Data View Section was here */}
        </div>

          {/* Dashboard Section - moved from right column */}
          <div className="dashboard-section">
            <IraCcDashboard
              iraData={iraData}
              ccData={ccData}
              snapshotInfo={selectedSnapshot}
              onError={handleError}
            />
          </div>

        </div>

        {/* Right Column - now only contains History */}
        <div className="right-column">
          <div className="history-section">
            <HistoricalDataComponent
              iraData={iraData}
              ccData={ccData}
              onSnapshotSelect={handleSnapshotSelect}
            />
          </div>
        </div>
      </div>

      {/* Global error/success display */}
      <div className="unified-dashboard-messages">
        {error && (
          <div className="dashboard-error">
            {error}
          </div>
        )}
        {success && (
          <div className="dashboard-success">
            {success}
          </div>
        )}
      </div>
    </div>
  );
}

export default UnifiedDashboard;

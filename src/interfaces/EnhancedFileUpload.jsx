import React from 'react';
import { useFileUpload } from '../mechanisms/fileUploadUtils';
import '../components/css/EnhancedFileUpload.css';

function EnhancedFileUpload({ onIraUploadSuccess, onCcUploadSuccess, onLoading, onError, onSuccess }) {
  const { 
    handleUpload, 
    handleDrop, 
    handleFileSelect,
    // ...other methods from hook
  } = useFileUpload({ onIraUploadSuccess, onCcUploadSuccess, onLoading, onError, onSuccess });

  return (
    <div className="enhanced-file-upload">
      {/* IRA Upload Section */}
      <div className="upload-section">
        <h5>Upload IRA Data</h5>
        <input type="file" onChange={(e) => handleFileSelect(e, 'ira')} />
        <button onClick={() => handleUpload('ira')}>Upload IRA</button>
      </div>

      {/* CC Upload Section */}
      <div className="upload-section">
        <h5>Upload CC Data</h5>
        <input type="file" onChange={(e) => handleFileSelect(e, 'cc')} />
        <button onClick={() => handleUpload('cc')}>Upload CC</button>
      </div>
    </div>
  );
}

export default EnhancedFileUpload;

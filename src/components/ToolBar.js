import React, { useState } from 'react';
import axios from 'axios';
import UndoRedo from './UndoRedo';

function ToolBar({ excelData, canUndo, canRedo, onUndo, onRedo, onError }) {
  const [exporting, setExporting] = useState(false);
  
  const handleExport = async (format) => {
    if (!excelData) return;
    
    try {
      setExporting(true);
      console.log(`Starting ${format} export process with ${excelData.data.length} rows`);
      
      // Remove the row limitation check
      
      const exportData = {
        format,
        columns: excelData.columns,
        data: excelData.data,
        filename: excelData.filename || 'export'
      };
      
      // Try using XMLHttpRequest which has better handling for binary downloads
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/export', true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.responseType = 'blob';
      
      xhr.onload = function() {
        if (this.status === 200) {
          console.log(`Received successful response, size: ${this.response.size} bytes`);
          const blob = new Blob([this.response], { 
            type: format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
          });
          
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${(exportData.filename || 'export').split('.')[0]}.${format}`;
          document.body.appendChild(a);
          a.click();
          
          setTimeout(() => {
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            setExporting(false);
          }, 100);
        } else {
          console.error('Export failed with status:', this.status);
          onError(`Export failed with status: ${this.status}`);
          setExporting(false);
        }
      };
      
      xhr.onerror = function() {
        console.error('Export request failed');
        onError('Export request failed. Check if the server is running.');
        setExporting(false);
      };
      
      xhr.send(JSON.stringify(exportData));
      
    } catch (error) {
      console.error('Error in export process:', error);
      onError(`Export failed: ${error.message}. Please try again.`);
      setExporting(false);
    }
  };

  return (
    <div className="d-flex justify-content-between align-items-center">
      <UndoRedo 
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={onUndo}
        onRedo={onRedo}
      />
      
      <div className="dropdown">
        <button 
          className="btn btn-sm btn-success dropdown-toggle" 
          type="button"
          id="exportDropdown" 
          data-bs-toggle="dropdown" 
          aria-expanded="false"
          disabled={exporting}
          style={{backgroundColor: "#005e32", borderColor: "#005e32"}}
        >
          <i className="bi bi-download"></i> {exporting ? 'Exporting...' : 'Save As'}
        </button>
        <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="exportDropdown">
          <li>
            <button 
              className="dropdown-item" 
              onClick={() => handleExport('xlsx')}
              disabled={exporting}
            >
              <i className="bi bi-file-earmark-excel me-2"></i> Excel (.xlsx)
            </button>
          </li>
          <li>
            <button 
              className="dropdown-item" 
              onClick={() => handleExport('csv')}
              disabled={exporting}
            >
              <i className="bi bi-filetype-csv me-2"></i> CSV (.csv)
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default ToolBar;

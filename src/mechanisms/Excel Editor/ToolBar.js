import React, { useState } from 'react';
import axios from 'axios';
import UndoRedo from '../../interfaces/generals/UndoRedo';

function ToolBar({ excelData, canUndo, canRedo, onUndo, onRedo, onError }) {
  const [exporting, setExporting] = useState(false);
  
  const handleExport = async (format) => {
    if (!excelData) return;
    
    try {
      setExporting(true);
      
      // Create a workbook
      const XLSX = await import('xlsx');
      const wb = XLSX.utils.book_new();
      
      // Convert data to worksheet
      const ws = XLSX.utils.json_to_sheet(excelData.data);
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      
      // Write and trigger download
      let filename = `export.${format}`;
      if (format === 'xlsx') {
        XLSX.writeFile(wb, filename);
      } else if (format === 'csv') {
        const csv = XLSX.utils.sheet_to_csv(ws);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      setExporting(false);
    } catch (error) {
      console.error('Export error:', error);
      onError('Failed to export file: ' + error.message);
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
              onClick={() => handleExport('xlsb')}
              disabled={exporting}
            >
              <i className="bi bi-file-earmark-excel me-2"></i> Excel Binary (.xlsb)
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

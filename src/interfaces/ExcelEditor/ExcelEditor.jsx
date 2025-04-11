import React, { useState, useEffect } from 'react';
import ExcelUploader from './ExcelUploader';
import ExcelTable from '../../mechanisms/Excel Editor/ExcelTable';
import FormulaBuilder from '../../mechanisms/Excel Editor/FormulaBuilder';
import ColumnFormatter from '../../mechanisms/Excel Editor/ColumnFormatter';
import FilterPanel from '../../mechanisms/Excel Editor/FilterPanel';
import ToolBar from '../../mechanisms/Excel Editor/ToolBar';
import './css/ExcelEditor.css';

function ExcelEditor({ initialData, onDataChange }) {
  // Restructure incoming data to ensure proper format
  const processInitialData = (data) => {
    if (!data) return null;
    return {
      columns: data.headers || data.columns || Object.keys(data.rows?.[0] || {}),
      data: data.rows || data.data || [],
    };
  };

  const [excelData, setExcelData] = useState(() => processInitialData(initialData));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  // History for undo/redo
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Optional: On mount, if no excelData from props, try to load from localStorage
  useEffect(() => {
    if (!excelData && !initialData) {
      const stored = localStorage.getItem('excelData');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const processed = processInitialData(parsed);
          setExcelData(processed);
          setHistory([processed]);
          setHistoryIndex(0);
        } catch (err) {
          console.error('Failed to parse stored Excel data:', err);
          setError('Failed to load saved data');
        }
      }
    }
  }, [excelData, initialData]);

  // Save updated excelData to localStorage so it persists between sessions
  useEffect(() => {
    if (excelData) {
      try {
        const dataToSave = {
          headers: excelData.columns,
          rows: excelData.data
        };
        localStorage.setItem('excelData', JSON.stringify(dataToSave));
        // Notify parent of changes so state can persist between tabs
        if (onDataChange) onDataChange(dataToSave);
      } catch (err) {
        console.error('Error saving excelData to localStorage:', err);
        // Optionally notify the user of the error here.
        setError('Failed to save changes');
      }
    }
  }, [excelData, onDataChange]);

  const handleUploadSuccess = (data) => {
    const processed = processInitialData(data);
    setExcelData(processed);
    setHistory([processed]);
    setHistoryIndex(0);
    setSuccess('File uploaded successfully');
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setExcelData(history[historyIndex - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setExcelData(history[historyIndex + 1]);
    }
  };

  const handleDataChange = (newData) => {
    const processed = processInitialData(newData);
    // Remove any "future" history states
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(processed);
    
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setExcelData(processed);
  };

  return (
    <div className="excel-editor">
      {!excelData ? (
        <ExcelUploader
          onUploadSuccess={handleUploadSuccess}
          onError={setError}
          onLoading={setLoading}
        />
      ) : (
        <div className="editor-container">
          <ToolBar
            excelData={excelData}
            canUndo={historyIndex > 0}
            canRedo={historyIndex < history.length - 1}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onError={setError}
          />
          
          <FilterPanel
            columns={excelData.columns}
            data={excelData.data}
            onFilterApplied={handleDataChange}
            onError={setError}
            onSuccess={setSuccess}
          />
          
          <FormulaBuilder
            columns={excelData.columns}
            data={excelData.data}
            onFormulaApplied={handleDataChange}
            onError={setError}
            onSuccess={setSuccess}
          />
          
          <ColumnFormatter
            columns={excelData.columns}
            data={excelData.data}
            onFormatApplied={handleDataChange}
            onError={setError}
            onSuccess={setSuccess}
          />
          
          <ExcelTable
            columns={excelData.columns}
            data={excelData.data}
            onDeleteColumn={(col) => {
              const newData = {
                columns: excelData.columns.filter(c => c !== col),
                data: excelData.data.map(row => {
                  const {[col]: removed, ...rest} = row;
                  return rest;
                })
              };
              handleDataChange(newData);
            }}
            onDeleteRow={(index) => {
              const newData = {
                columns: excelData.columns,
                data: excelData.data.filter((_, i) => i !== index)
              };
              handleDataChange(newData);
            }}
          />
        </div>
      )}
      
      {error && (
        <div className="alert alert-danger mt-3">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </div>
      )}
      
      {success && (
        <div className="alert alert-success mt-3">
          <i className="bi bi-check-circle me-2"></i>
          {success}
        </div>
      )}
    </div>
  );
}

export default ExcelEditor;

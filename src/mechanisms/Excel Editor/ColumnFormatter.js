import React, { useState } from 'react';
import axios from 'axios';

function ColumnFormatter({ columns, data, onFormatApplied, onError, onSuccess }) {
  const [selectedColumn, setSelectedColumn] = useState('');
  const [targetFormat, setTargetFormat] = useState('number');
  const [processing, setProcessing] = useState(false);

  const formatOptions = [
    { value: 'number', label: 'Number' },
    { value: 'string', label: 'Text' },
    { value: 'date', label: 'Date' }
  ];

  const handleApplyFormat = async () => {
    if (!selectedColumn) {
      onError('Please select a column to format');
      return;
    }

    const formatData = {
      column: selectedColumn,
      targetFormat,
      data,
      // Include original column order to ensure it's preserved
      columns: columns
    };

    try {
      setProcessing(true);
      const response = await axios.post('/api/change-format', formatData);
      onFormatApplied(response.data);
      
      // Show success message if available
      if (response.data.message) {
        // Use the onSuccess function instead of onError
        onSuccess(response.data.message);
      }
      
    } catch (error) {
      console.error('Error applying format:', error);
      onError(error.response?.data?.error || 'Error applying format');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="card mb-4">
      <div className="card-header bg-info text-white d-flex justify-content-between align-items-center" 
           style={{backgroundColor: "#00385e !important"}}>
        <h5 className="mb-0">Column Format Converter</h5>
        <button 
          className="btn btn-sm btn-light" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#formatConverter"
          aria-expanded="false">
          <i className="bi bi-chevron-down"></i>
        </button>
      </div>
      <div className="collapse show" id="formatConverter">
        <div className="card-body">
          <div className="row">
            <div className="col-md-5 mb-3">
              <label className="form-label">Column to Format</label>
              <select 
                className="form-select" 
                value={selectedColumn} 
                onChange={(e) => setSelectedColumn(e.target.value)}
                required
              >
                <option value="">Select a column</option>
                {columns.map((column) => (
                  <option key={column} value={column}>{column}</option>
                ))}
              </select>
            </div>
            
            <div className="col-md-5 mb-3">
              <label className="form-label">Convert to Format</label>
              <select 
                className="form-select" 
                value={targetFormat} 
                onChange={(e) => setTargetFormat(e.target.value)}
              >
                {formatOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              
              <div className="form-text mt-1">
                {targetFormat === 'number' && 'Converts text to numbers. Non-numeric values will become blank.'}
                {targetFormat === 'string' && 'Converts all values to plain text.'}
                {targetFormat === 'date' && 'Attempts to recognize and convert date formats. Invalid dates will become blank.'}
              </div>
            </div>
            
            <div className="col-md-2 mb-3 d-flex align-items-end">
              <button 
                className="btn btn-info w-100" 
                onClick={handleApplyFormat}
                disabled={processing || !selectedColumn}
                style={{backgroundColor: "#00385e", borderColor: "#00385e"}}
              >
                {processing ? 'Converting...' : 'Convert'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ColumnFormatter;

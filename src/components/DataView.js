import React, { useState, useEffect } from 'react';
import './css/DataView.css';

function DataView({ iraData, ccData }) {
  const [selectedDataType, setSelectedDataType] = useState('ira');
  const [filterColumn, setFilterColumn] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 50;
  
  // Handle table type change
  const handleDataTypeChange = (e) => {
    setSelectedDataType(e.target.value);
    setSelectedRows([]);
    setSelectedColumns([]);
    setCurrentPage(1);
  };
  
  // Check if we have data to display
  const hasIraData = iraData && iraData.data && iraData.data.length > 0;
  const hasCcData = ccData && ccData.data && ccData.data.length > 0;
  
  // Get column names for table headers
  const getColumnNames = () => {
    if (selectedDataType === 'ira' && hasIraData) {
      return iraData.columns || Object.keys(iraData.data[0]);
    } else if (selectedDataType === 'cc' && hasCcData) {
      return ccData.columns || Object.keys(ccData.data[0]);
    }
    return [];
  };
  
  // Get data rows for the selected table type
  const getDataRows = () => {
    if (selectedDataType === 'ira' && hasIraData) {
      return iraData.data;
    } else if (selectedDataType === 'cc' && hasCcData) {
      return ccData.data;
    }
    return [];
  };

  // Filter data rows based on filter value and column
  const filteredDataRows = getDataRows().filter(row => {
    if (!filterColumn || !filterValue) return true;
    
    const cellValue = row[filterColumn];
    if (cellValue === undefined || cellValue === null) return false;
    
    return String(cellValue).toLowerCase().includes(filterValue.toLowerCase());
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredDataRows.length / rowsPerPage);
  const currentRows = filteredDataRows.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // Handle row selection
  const handleRowSelect = (index, e) => {
    // If ctrl/cmd key is pressed, toggle this row's selection
    if (e.ctrlKey || e.metaKey) {
      setSelectedRows(prevSelectedRows => {
        if (prevSelectedRows.includes(index)) {
          return prevSelectedRows.filter(i => i !== index);
        } else {
          return [...prevSelectedRows, index];
        }
      });
    } 
    // If shift key is pressed, select a range
    else if (e.shiftKey && selectedRows.length > 0) {
      const lastSelected = selectedRows[selectedRows.length - 1];
      const start = Math.min(lastSelected, index);
      const end = Math.max(lastSelected, index);
      const rangeIndices = Array.from(
        { length: end - start + 1 },
        (_, i) => start + i
      );
      setSelectedRows([...new Set([...selectedRows, ...rangeIndices])]);
    }
    // Normal click: clear selection and select only this row
    else {
      setSelectedRows([index]);
    }
  };

  // Enhanced column selection with range support
  const handleColumnSelect = (column, index, e) => {
    if (e.ctrlKey || e.metaKey) {
      // Toggle selection with Ctrl/Cmd
      setSelectedColumns(prev => {
        if (prev.includes(column)) {
          return prev.filter(c => c !== column);
        } else {
          return [...prev, column];
        }
      });
    } 
    else if (e.shiftKey && selectedColumns.length > 0) {
      // Range selection with Shift
      const allColumns = getColumnNames();
      const lastSelectedColumn = selectedColumns[selectedColumns.length - 1];
      const lastSelectedIndex = allColumns.indexOf(lastSelectedColumn);
      
      const startIdx = Math.min(lastSelectedIndex, index);
      const endIdx = Math.max(lastSelectedIndex, index);
      
      const columnsToAdd = allColumns.slice(startIdx, endIdx + 1);
      setSelectedColumns([...new Set([...selectedColumns, ...columnsToAdd])]);
    }
    else {
      // Single click - replace selection
      setSelectedColumns([column]);
    }
  };

  // Select all columns
  const handleSelectAllColumns = () => {
    if (selectedColumns.length === getColumnNames().length) {
      setSelectedColumns([]);
    } else {
      setSelectedColumns([...getColumnNames()]);
    }
  };

  // Clear all selections
  const clearSelections = () => {
    setSelectedRows([]);
    setSelectedColumns([]);
  };

  // Handle select all rows
  const handleSelectAllRows = () => {
    if (selectedRows.length === filteredDataRows.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(filteredDataRows.map((_, index) => index));
    }
  };

  // Handle delete selected rows - fixed implementation
  const handleDeleteSelectedRows = () => {
    if (selectedRows.length === 0) return;
    
    // Confirm deletion
    if (!window.confirm(`Are you sure you want to delete ${selectedRows.length} selected row(s)?`)) {
      return;
    }
    
    // Sort indices in descending order to avoid index shifting problems
    const rowIndices = [...selectedRows].sort((a, b) => b - a);
    const newData = [...getDataRows()];
    
    // Delete rows from the end to the beginning
    rowIndices.forEach(rowIndex => {
      newData.splice(rowIndex, 1);
    });
    
    // Update the data
    if (selectedDataType === 'ira' && iraData) {
      iraData.data = newData;
    } else if (selectedDataType === 'cc' && ccData) {
      ccData.data = newData;
    }
    
    setSelectedRows([]);
    
    // Show success message
    alert(`${rowIndices.length} row(s) deleted successfully.`);
  };

  // Handle delete selected columns - fixed implementation
  const handleDeleteSelectedColumns = () => {
    if (selectedColumns.length === 0) return;
    
    // Confirm deletion
    if (!window.confirm(`Are you sure you want to delete ${selectedColumns.length} selected column(s)?`)) {
      return;
    }
    
    const columnsToDelete = [...selectedColumns];
    const newData = getDataRows().map(row => {
      const newRow = {...row};
      columnsToDelete.forEach(col => {
        delete newRow[col];
      });
      return newRow;
    });
    
    // Update the data and columns
    if (selectedDataType === 'ira' && iraData) {
      iraData.data = newData;
      if (iraData.columns) {
        iraData.columns = iraData.columns.filter(col => !columnsToDelete.includes(col));
      }
    } else if (selectedDataType === 'cc' && ccData) {
      ccData.data = newData;
      if (ccData.columns) {
        ccData.columns = ccData.columns.filter(col => !columnsToDelete.includes(col));
      }
    }
    
    setSelectedColumns([]);
    
    // Show success message
    alert(`${columnsToDelete.length} column(s) deleted successfully.`);
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    setSelectedRows([]);
  };

  // Show selection summary
  const getSelectionSummary = () => {
    const rowsText = selectedRows.length === 1 
      ? '1 row' 
      : `${selectedRows.length} rows`;
      
    const columnsText = selectedColumns.length === 1
      ? '1 column'
      : `${selectedColumns.length} columns`;
      
    if (selectedRows.length > 0 && selectedColumns.length > 0) {
      return `Selected: ${rowsText} and ${columnsText}`;
    } else if (selectedRows.length > 0) {
      return `Selected: ${rowsText}`;
    } else if (selectedColumns.length > 0) {
      return `Selected: ${columnsText}`;
    }
    return '';
  };
  
  return (
    <div className="data-view-container">
      <div className="card">
        <div className="card-header">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Data View</h5>
            <div className="data-type-selector">
              <div className="input-group">
                <label className="input-group-text" htmlFor="dataTypeSelect">
                  <i className="bi bi-table me-1"></i> View Data
                </label>
                <select 
                  className="form-select" 
                  id="dataTypeSelect" 
                  value={selectedDataType} 
                  onChange={handleDataTypeChange}
                >
                  <option value="ira">IRA Data</option>
                  <option value="cc">Cycle Count Data</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        
        <div className="card-body">
          <div className="row mb-3">
            {/* Left column: Filter controls */}
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text">Filter by</span>
                <select 
                  className="form-select" 
                  value={filterColumn} 
                  onChange={(e) => setFilterColumn(e.target.value)}
                >
                  <option value="">Select column...</option>
                  {getColumnNames().map((col, idx) => (
                    <option key={idx} value={col}>{col}</option>
                  ))}
                </select>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Filter value..." 
                  value={filterValue} 
                  onChange={(e) => setFilterValue(e.target.value)} 
                  disabled={!filterColumn}
                />
                <button 
                  className="btn btn-outline-secondary" 
                  onClick={() => {
                    setFilterColumn('');
                    setFilterValue('');
                  }}
                >
                  Clear
                </button>
              </div>
            </div>
            
            {/* Right column: Selection status */}
            <div className="col-md-6">
              {getSelectionSummary() ? (
                <div className="selection-summary">
                  <span className="badge bg-primary me-2">
                    {getSelectionSummary()}
                  </span>
                  <button 
                    className="btn btn-sm btn-outline-secondary" 
                    onClick={clearSelections}
                  >
                    <i className="bi bi-x-circle me-1"></i>
                    Clear Selection
                  </button>
                </div>
              ) : (
                <span className="text-muted">No rows or columns selected</span>
              )}
            </div>
          </div>
          
          {/* Action buttons - consolidated in one place */}
          <div className="action-buttons mb-3">
            <div className="btn-group">
              <button 
                className="btn btn-outline-danger" 
                onClick={handleDeleteSelectedRows}
                disabled={selectedRows.length === 0}
              >
                <i className="bi bi-trash me-1"></i> Delete Selected Rows ({selectedRows.length})
              </button>
              <button 
                className="btn btn-outline-danger" 
                onClick={handleDeleteSelectedColumns}
                disabled={selectedColumns.length === 0}
              >
                <i className="bi bi-trash me-1"></i> Delete Selected Columns ({selectedColumns.length})
              </button>
            </div>
          </div>
          
          {/* Alert messages when no data */}
          {selectedDataType === 'ira' && !hasIraData && (
            <div className="alert alert-info">
              <i className="bi bi-info-circle me-2"></i>
              No IRA data available. Please upload IRA data first.
            </div>
          )}
          
          {selectedDataType === 'cc' && !hasCcData && (
            <div className="alert alert-info">
              <i className="bi bi-info-circle me-2"></i>
              No Cycle Count data available. Please upload CC data first.
            </div>
          )}
          
          {/* Data table */}
          {((selectedDataType === 'ira' && hasIraData) || 
            (selectedDataType === 'cc' && hasCcData)) && (
            <>
              <div className="table-container">
                <table className="table table-striped table-hover excel-like-table">
                  <thead className="table-light">
                    <tr>
                      <th className="select-col">
                        <div className="d-flex align-items-center justify-content-center">
                          <input 
                            type="checkbox" 
                            checked={selectedRows.length === filteredDataRows.length && filteredDataRows.length > 0} 
                            onChange={handleSelectAllRows} 
                            title="Select all rows"
                          />
                        </div>
                      </th>
                      {getColumnNames().map((column, index) => (
                        <th 
                          key={index} 
                          className={selectedColumns.includes(column) ? 'selected-column' : ''}
                          onClick={(e) => handleColumnSelect(column, index, e)}
                          title={`${column} (Ctrl+click to select multiple columns, Shift+click for range)`}
                        >
                          <div className="d-flex align-items-center">
                            <input 
                              type="checkbox"
                              className="me-2 column-checkbox"
                              checked={selectedColumns.includes(column)}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleColumnSelect(column, index, { ctrlKey: true });
                              }}
                            />
                            <span>{column}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {currentRows.map((row, rowIndex) => {
                      const actualIndex = (currentPage - 1) * rowsPerPage + rowIndex;
                      return (
                        <tr 
                          key={rowIndex} 
                          className={selectedRows.includes(actualIndex) ? 'selected-row' : ''}
                          onClick={(e) => handleRowSelect(actualIndex, e)}
                          title="Ctrl+click to select multiple rows, Shift+click for range"
                        >
                          <td className="select-col">
                            <input 
                              type="checkbox" 
                              checked={selectedRows.includes(actualIndex)} 
                              onChange={(e) => {
                                e.stopPropagation();
                                handleRowSelect(actualIndex, { ctrlKey: true });
                              }} 
                            />
                          </td>
                          {getColumnNames().map((column, colIndex) => (
                            <td 
                              key={colIndex}
                              className={selectedColumns.includes(column) ? 'selected-column' : ''}
                            >
                              {row[column] !== undefined && row[column] !== null
                                ? String(row[column])
                                : ''}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination controls */}
              <div className="pagination-container">
                <span>
                  Showing {Math.min(filteredDataRows.length, 1)} - {Math.min(currentPage * rowsPerPage, filteredDataRows.length)} of {filteredDataRows.length} rows
                </span>
                <div className="pagination">
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                  >
                    <i className="bi bi-chevron-double-left"></i>
                  </button>
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <i className="bi bi-chevron-left"></i>
                  </button>
                  
                  <span className="page-info">
                    Page {currentPage} of {totalPages || 1}
                  </span>
                  
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || totalPages === 0}
                  >
                    <i className="bi bi-chevron-right"></i>
                  </button>
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages || totalPages === 0}
                  >
                    <i className="bi bi-chevron-double-right"></i>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default DataView;

import React, { useState, useEffect, useRef } from 'react';
import './css/ExcelTable.css';

function ExcelTable({ columns, data, onDeleteColumn, onDeleteRow }) {
  const [page, setPage] = useState(1);
  const rowsPerPage = 100;
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [selectAllRows, setSelectAllRows] = useState(false);
  const [selectAllColumns, setSelectAllColumns] = useState(false);
  
  // Drag selection state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartRow, setDragStartRow] = useState(null);
  const [dragStartColumn, setDragStartColumn] = useState(null);
  const [selectionType, setSelectionType] = useState(null); // 'row' or 'column'
  const tableRef = useRef(null);
  
  // Reset selections when data changes
  useEffect(() => {
    setSelectedRows([]);
    setSelectedColumns([]);
    setSelectAllRows(false);
    setSelectAllColumns(false);
  }, [data, columns]);
  
  // Add event listener to handle mouseup outside the component
  useEffect(() => {
    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        setDragStartRow(null);
        setDragStartColumn(null);
        setSelectionType(null);
      }
    };
    
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);
  
  // Get current page data
  const indexOfLastRow = page * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = data.slice(indexOfFirstRow, indexOfLastRow);
  
  // Calculate total pages
  const totalPages = Math.ceil(data.length / rowsPerPage);
  
  // Change page
  const paginate = (pageNumber) => setPage(pageNumber);
  
  // Next and previous page functions
  const nextPage = () => setPage(prev => Math.min(prev + 1, totalPages));
  const prevPage = () => setPage(prev => Math.max(prev - 1, 1));

  // Handle row selection (with mouse down)
  const handleRowMouseDown = (rowIndex) => {
    const actualIndex = indexOfFirstRow + rowIndex;
    setIsDragging(true);
    setDragStartRow(actualIndex);
    setSelectionType('row');
    
    // Toggle selection state of current row
    setSelectedRows(prev => {
      if (prev.includes(actualIndex)) {
        return prev.filter(i => i !== actualIndex);
      } else {
        return [...prev, actualIndex];
      }
    });
  };
  
  // Handle row mouse over during drag
  const handleRowMouseOver = (rowIndex) => {
    if (isDragging && selectionType === 'row') {
      const actualIndex = indexOfFirstRow + rowIndex;
      
      setSelectedRows(prev => {
        // If row is already in the desired state, do nothing
        if (prev.includes(actualIndex) === prev.includes(dragStartRow)) {
          return prev;
        }
        
        // Otherwise add or remove it based on the initial row's state
        if (prev.includes(dragStartRow)) {
          return [...prev, actualIndex];
        } else {
          return prev.filter(i => i !== actualIndex);
        }
      });
    }
  };

  // Handle column selection (with mouse down)
  const handleColumnMouseDown = (column) => {
    setIsDragging(true);
    setDragStartColumn(column);
    setSelectionType('column');
    
    // Toggle selection state of current column
    setSelectedColumns(prev => {
      if (prev.includes(column)) {
        return prev.filter(c => c !== column);
      } else {
        return [...prev, column];
      }
    });
  };
  
  // Handle column mouse over during drag
  const handleColumnMouseOver = (column) => {
    if (isDragging && selectionType === 'column') {
      setSelectedColumns(prev => {
        // If column is already in the desired state, do nothing
        if (prev.includes(column) === prev.includes(dragStartColumn)) {
          return prev;
        }
        
        // Otherwise add or remove it based on the initial column's state
        if (prev.includes(dragStartColumn)) {
          return [...prev, column];
        } else {
          return prev.filter(c => c !== column);
        }
      });
    }
  };

  // Handle "select all rows" on current page
  const handleSelectAllRows = () => {
    if (selectAllRows) {
      // If already selected, deselect all
      setSelectedRows(prev => prev.filter(i => i < indexOfFirstRow || i >= indexOfLastRow));
      setSelectAllRows(false);
    } else {
      // Otherwise, select all rows on current page
      const currentPageIndices = Array.from(
        { length: currentRows.length }, 
        (_, i) => indexOfFirstRow + i
      );
      
      // Combine with already selected rows from other pages
      const otherPagesSelected = selectedRows.filter(
        i => i < indexOfFirstRow || i >= indexOfLastRow
      );
      
      setSelectedRows([...otherPagesSelected, ...currentPageIndices]);
      setSelectAllRows(true);
    }
  };

  // Handle "select all columns"
  const handleSelectAllColumns = () => {
    if (selectAllColumns) {
      setSelectedColumns([]);
      setSelectAllColumns(false);
    } else {
      setSelectedColumns([...columns]);
      setSelectAllColumns(true);
    }
  };

  // Confirmation handlers for batch deletion
  const confirmDeleteMultipleColumns = () => {
    if (selectedColumns.length > 0) {
      setShowDeleteConfirm({ type: 'columns', targets: selectedColumns });
    }
  };

  const confirmDeleteMultipleRows = () => {
    if (selectedRows.length > 0) {
      setShowDeleteConfirm({ type: 'rows', targets: selectedRows });
    }
  };
  
  const handleDeleteConfirm = () => {
    if (showDeleteConfirm) {
      if (showDeleteConfirm.type === 'columns') {
        // Delete multiple columns
        showDeleteConfirm.targets.forEach(column => {
          onDeleteColumn(column);
        });
        setSelectedColumns([]);
      } else if (showDeleteConfirm.type === 'rows') {
        // Delete multiple rows - sort in descending order to avoid index shifting problems
        [...showDeleteConfirm.targets].sort((a, b) => b - a).forEach(rowIndex => {
          onDeleteRow(rowIndex);
        });
        setSelectedRows([]);
      }
      setShowDeleteConfirm(null);
    }
  };

  // Check if a row is selected
  const isRowSelected = (rowIndex) => {
    return selectedRows.includes(indexOfFirstRow + rowIndex);
  };

  // Check if a column is selected
  const isColumnSelected = (column) => {
    return selectedColumns.includes(column);
  };
  
  return (
    <div className="card mb-4 excel-data-panel">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Data Table</h5>
        <div>
          {selectedRows.length > 0 && (
            <button 
              className="btn btn-danger btn-sm me-2"
              onClick={confirmDeleteMultipleRows}
            >
              <i className="bi bi-trash"></i> Delete {selectedRows.length} Selected {selectedRows.length === 1 ? 'Row' : 'Rows'}
            </button>
          )}
          
          {selectedColumns.length > 0 && (
            <button 
              className="btn btn-danger btn-sm"
              onClick={confirmDeleteMultipleColumns}
            >
              <i className="bi bi-trash"></i> Delete {selectedColumns.length} Selected {selectedColumns.length === 1 ? 'Column' : 'Columns'}
            </button>
          )}
        </div>
      </div>
      <div className="card-body">
        <div className="excel-table" ref={tableRef}>
          <table className="table table-striped table-hover">
            <thead className="table-light">
              <tr>
                <th>
                  <div className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={selectAllRows}
                      onChange={handleSelectAllRows}
                    />
                  </div>
                </th>
                {columns.map((column, index) => (
                  <th 
                    key={index} 
                    className={isColumnSelected(column) ? 'table-primary' : ''}
                    onMouseDown={(e) => {
                      if (e.target === e.currentTarget || e.target.tagName === 'SPAN' || e.target.type === 'checkbox') {
                        handleColumnMouseDown(column);
                      }
                    }}
                    onMouseOver={() => handleColumnMouseOver(column)}
                  >
                    <div className="d-flex align-items-center">
                      <div className="form-check me-2">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={isColumnSelected(column)}
                          readOnly // Using mouseDown/mouseOver events instead
                        />
                      </div>
                      <span>{column}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentRows.map((row, rowIndex) => (
                <tr 
                  key={rowIndex}
                  className={isRowSelected(rowIndex) ? 'table-primary' : ''}
                  onMouseDown={(e) => {
                    if (e.target === e.currentTarget || e.target.tagName === 'TD' || e.target.type === 'checkbox') {
                      handleRowMouseDown(rowIndex);
                    }
                  }}
                  onMouseOver={() => handleRowMouseOver(rowIndex)}
                >
                  <td>
                    <div className="d-flex align-items-center">
                      <div className="form-check me-2">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={isRowSelected(rowIndex)}
                          readOnly // Using mouseDown/mouseOver events instead
                        />
                      </div>
                      <span>{indexOfFirstRow + rowIndex + 1}</span>
                    </div>
                  </td>
                  {columns.map((column, colIndex) => (
                    <td key={`${rowIndex}-${colIndex}`}>{row[column]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="d-flex justify-content-between align-items-center mt-3">
            <div>
              Showing rows {indexOfFirstRow + 1}-{Math.min(indexOfLastRow, data.length)} of {data.length}
            </div>
            <nav>
              <ul className="pagination">
                <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={prevPage}>Previous</button>
                </li>
                
                {Array.from({ length: totalPages }, (_, i) => {
                  // Show limited page numbers to prevent overflow
                  if (
                    i === 0 || // First page
                    i === totalPages - 1 || // Last page
                    (i >= page - 2 && i <= page + 1) // Pages around current
                  ) {
                    return (
                      <li key={i} className={`page-item ${page === i + 1 ? 'active' : ''}`}>
                        <button className="page-link" onClick={() => paginate(i + 1)}>
                          {i + 1}
                        </button>
                      </li>
                    );
                  } else if (
                    i === page - 3 ||
                    i === page + 2
                  ) {
                    // Add ellipsis
                    return (
                      <li key={i} className="page-item disabled">
                        <button className="page-link">...</button>
                      </li>
                    );
                  }
                  return null;
                }).filter(Boolean)}
                
                <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={nextPage}>Next</button>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </div>
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal fade show" style={{display: 'block', backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Deletion</h5>
                <button type="button" className="btn-close" onClick={() => setShowDeleteConfirm(null)}></button>
              </div>
              <div className="modal-body">
                {showDeleteConfirm.type === 'columns' && (
                  <div>
                    <p>Are you sure you want to delete the following columns?</p>
                    <ul>
                      {showDeleteConfirm.targets.map((col, i) => (
                        <li key={i}>{col}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {showDeleteConfirm.type === 'rows' && (
                  <div>
                    <p>Are you sure you want to delete the following rows?</p>
                    <p>{showDeleteConfirm.targets.length > 10 
                      ? `${showDeleteConfirm.targets.length} selected rows` 
                      : showDeleteConfirm.targets.map(r => '#' + (r + 1)).join(', ')}
                    </p>
                  </div>
                )}
                <p className="text-danger">This action cannot be undone directly, but you can use the Undo button in the toolbar.</p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowDeleteConfirm(null)}>Cancel</button>
                <button type="button" className="btn btn-danger" onClick={handleDeleteConfirm}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExcelTable;

import React, { useState } from 'react';
import axios from 'axios';
import '../../interfaces/css/components/FilterPanel.css';

function FilterPanel({ columns, data, onFilterApplied, onError, onSuccess }) {
  const [filters, setFilters] = useState([]);
  const [currentFilter, setCurrentFilter] = useState({
    column: '',
    operator: 'equals',
    value: ''
  });
  const [isFiltering, setIsFiltering] = useState(false);

  // Available operators with labels
  const operators = [
    { value: 'equals', label: 'Equals' },
    { value: 'notEquals', label: 'Not Equal To' },
    { value: 'contains', label: 'Contains' },
    { value: 'notContains', label: 'Does Not Contain' },
    { value: 'greaterThan', label: 'Greater Than' },
    { value: 'lessThan', label: 'Less Than' },
    { value: 'greaterOrEqual', label: 'Greater Than or Equal' },
    { value: 'lessOrEqual', label: 'Less Than or Equal' },
    { value: 'startsWith', label: 'Starts With' },
    { value: 'endsWith', label: 'Ends With' },
    { value: 'empty', label: 'Is Empty' },
    { value: 'notEmpty', label: 'Is Not Empty' }
  ];

  // Update current filter
  const handleFilterChange = (field, value) => {
    setCurrentFilter(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Add current filter to filters list
  const handleAddFilter = () => {
    // Validate filter
    if (!currentFilter.column) {
      onError('Please select a column for the filter');
      return;
    }

    // Skip value validation for operators that don't need a value (empty/notEmpty)
    if (!['empty', 'notEmpty'].includes(currentFilter.operator) && !currentFilter.value) {
      onError('Please enter a value for the filter');
      return;
    }

    // Add new filter to the list
    setFilters([...filters, { ...currentFilter }]);
    
    // Reset current filter for next entry
    setCurrentFilter({
      column: '',
      operator: 'equals',
      value: ''
    });
  };

  // Remove filter
  const handleRemoveFilter = (index) => {
    const updatedFilters = filters.filter((_, i) => i !== index);
    setFilters(updatedFilters);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFilters([]);
  };

  // Apply all filters
  const handleApplyFilters = async () => {
    if (filters.length === 0) {
      onError('Please add at least one filter');
      return;
    }

    setIsFiltering(true);

    try {
      const response = await axios.post('/api/filter-data', {
        filters,
        data
      });

      onFilterApplied(response.data);
      
      // Show how many records were filtered as a success message instead of an error
      onSuccess(`Filtered ${response.data.filteredCount} of ${response.data.totalCount} records`);
    } catch (error) {
      console.error('Error applying filters:', error);
      onError(error.response?.data?.error || 'Error applying filters');
    } finally {
      setIsFiltering(false);
    }
  };

  return (
    <div className="card mb-4 filter-panel">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Data Filters</h5>
        <button 
          className="btn btn-sm btn-light" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#dataFilters"
          aria-expanded="false">
          <i className="bi bi-chevron-down"></i>
        </button>
      </div>
      <div className="collapse show" id="dataFilters">
        <div className="card-body">
          {/* Filter Builder */}
          <div className="row align-items-end mb-3">
            <div className="col-md-3">
              <label className="form-label">Column</label>
              <select
                className="form-select"
                value={currentFilter.column}
                onChange={(e) => handleFilterChange('column', e.target.value)}
              >
                <option value="">Select column</option>
                {columns.map((column) => (
                  <option key={column} value={column}>{column}</option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Operator</label>
              <select
                className="form-select"
                value={currentFilter.operator}
                onChange={(e) => handleFilterChange('operator', e.target.value)}
              >
                {operators.map((op) => (
                  <option key={op.value} value={op.value}>{op.label}</option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Value</label>
              <input
                type="text"
                className="form-control"
                value={currentFilter.value}
                onChange={(e) => handleFilterChange('value', e.target.value)}
                placeholder="Filter value"
                disabled={['empty', 'notEmpty'].includes(currentFilter.operator)}
              />
            </div>
            <div className="col-md-2">
              <button
                className="btn btn-outline-filter w-100"
                onClick={handleAddFilter}
              >
                <i className="bi bi-plus-circle"></i> Add
              </button>
            </div>
          </div>
          
          {/* Active Filters */}
          {filters.length > 0 && (
            <div className="mb-3">
              <h6 className="mb-2">Active Filters:</h6>
              <div className="d-flex flex-wrap">
                {filters.map((filter, index) => {
                  const operatorLabel = operators.find(op => op.value === filter.operator)?.label;
                  
                  return (
                    <div key={index} className="filter-badge">
                      <span className="filter-text">
                        <span className="filter-column">{filter.column}</span>
                        <span className="filter-operator">{operatorLabel}</span>
                        {!['empty', 'notEmpty'].includes(filter.operator) && (
                          <span className="filter-value">"{filter.value}"</span>
                        )}
                      </span>
                      <button
                        className="btn-remove-filter"
                        onClick={() => handleRemoveFilter(index)}
                      >
                        <i className="bi bi-x-circle"></i>
                      </button>
                    </div>
                  );
                })}
                
                <button
                  className="btn btn-sm btn-outline-filter ms-2"
                  onClick={handleClearFilters}
                >
                  Clear All
                </button>
              </div>
            </div>
          )}
          
          {/* Apply Filters Button */}
          <div className="d-flex justify-content-end mt-3">
            <button
              className="btn btn-apply-filters"
              onClick={handleApplyFilters}
              disabled={filters.length === 0 || isFiltering}
            >
              {isFiltering ? 'Filtering...' : 'Apply Filters'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FilterPanel;

import React, { useState } from 'react';
import axios from 'axios';
import '../../interfaces/css/components/FormulaBuilder.css';

function FormulaBuilder({ columns, data, onFormulaApplied, onError, onSuccess }) {
  const [sourceColumn, setSourceColumn] = useState('');
  const [conditionType, setConditionType] = useState('equals');
  const [conditionValue, setConditionValue] = useState('');
  const [trueValue, setTrueValue] = useState('');
  const [falseValue, setFalseValue] = useState('');
  const [targetColumn, setTargetColumn] = useState('');
  const [isNewColumn, setIsNewColumn] = useState(true);
  const [applying, setApplying] = useState(false);

  const conditionOptions = [
    { value: 'equals', label: '= (Equal to)' },
    { value: 'notEquals', label: '≠ (Not equal to)' },
    { value: 'greaterThan', label: '> (Greater than)' },
    { value: 'lessThan', label: '< (Less than)' },
    { value: 'greaterOrEqual', label: '≥ (Greater than or equal)' },
    { value: 'lessOrEqual', label: '≤ (Less than or equal)' },
    { value: 'contains', label: 'Contains' },
    { value: 'startsWith', label: 'Starts with' },
    { value: 'endsWith', label: 'Ends with' }
  ];

  const handleApplyFormula = async () => {
    if (!sourceColumn) {
      onError('Please select a source column');
      return;
    }

    if (!conditionValue && conditionValue !== 0) {
      onError('Please enter a condition value');
      return;
    }

    if (!targetColumn) {
      onError('Please enter a target column name');
      return;
    }

    const formulaData = {
      sourceColumn,
      conditionType,
      conditionValue,
      trueValue,
      falseValue,
      targetColumn,
      data
    };

    try {
      setApplying(true);
      const response = await axios.post('/api/excel-editor/apply-formula', formulaData);
      onFormulaApplied(response.data);
      
      // Add success message
      if (onSuccess) {
        onSuccess(`Formula successfully applied to create/modify column "${targetColumn}"`);
      }
      
      setApplying(false);
    } catch (error) {
      console.error('Error applying formula:', error);
      onError(error.response?.data?.error || 'Error applying formula');
      setApplying(false);
    }
  };

  return (
    <div className="card mb-4">
      <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center" 
           style={{backgroundColor: "#005e32 !important"}}>
        <h5 className="mb-0">If-Else Formula Builder</h5>
        <button 
          className="btn btn-sm btn-light" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#formulaBuilder"
          aria-expanded="false">
          <i className="bi bi-chevron-down"></i>
        </button>
      </div>
      <div className="collapse show" id="formulaBuilder">
        <div className="card-body">
          <div className="row">
            {/* Source column selection */}
            <div className="col-md-4 mb-3">
              <label className="form-label">Source Column</label>
              <select 
                className="form-select" 
                value={sourceColumn} 
                onChange={(e) => setSourceColumn(e.target.value)}
                required
              >
                <option value="">Select column</option>
                {columns.map((column) => (
                  <option key={column} value={column}>{column}</option>
                ))}
              </select>
            </div>
            
            {/* Condition type */}
            <div className="col-md-4 mb-3">
              <label className="form-label">Condition</label>
              <select 
                className="form-select" 
                value={conditionType} 
                onChange={(e) => setConditionType(e.target.value)}
              >
                {conditionOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            
            {/* Condition value */}
            <div className="col-md-4 mb-3">
              <label className="form-label">Value</label>
              <input 
                type="text" 
                className="form-control" 
                value={conditionValue} 
                onChange={(e) => setConditionValue(e.target.value)}
                placeholder="Enter condition value"
                required
              />
            </div>
          </div>
          
          <div className="row">
            {/* True value */}
            <div className="col-md-6 mb-3">
              <label className="form-label">If True Result</label>
              <input 
                type="text" 
                className="form-control" 
                value={trueValue} 
                onChange={(e) => setTrueValue(e.target.value)}
                placeholder="Value if condition is true"
              />
            </div>
            
            {/* False value */}
            <div className="col-md-6 mb-3">
              <label className="form-label">If False Result</label>
              <input 
                type="text" 
                className="form-control" 
                value={falseValue} 
                onChange={(e) => setFalseValue(e.target.value)}
                placeholder="Value if condition is false"
              />
            </div>
          </div>
          
          <div className="row">
            {/* Target column */}
            <div className="col-md-6 mb-3">
              <label className="form-label">Target Column</label>
              {isNewColumn ? (
                <input 
                  type="text" 
                  className="form-control" 
                  value={targetColumn} 
                  onChange={(e) => setTargetColumn(e.target.value)}
                  placeholder="New column name"
                  required
                />
              ) : (
                <select 
                  className="form-select" 
                  value={targetColumn} 
                  onChange={(e) => setTargetColumn(e.target.value)}
                  required
                >
                  <option value="">Select column</option>
                  {columns.map((column) => (
                    <option key={column} value={column}>{column}</option>
                  ))}
                </select>
              )}
            </div>
            
            <div className="col-md-6 mb-3">
              <label className="form-label">Target Type</label>
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  id="newColumn"
                  checked={isNewColumn}
                  onChange={() => setIsNewColumn(true)}
                />
                <label className="form-check-label" htmlFor="newColumn">
                  Create new column
                </label>
              </div>
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  id="existingColumn"
                  checked={!isNewColumn}
                  onChange={() => setIsNewColumn(false)}
                />
                <label className="form-check-label" htmlFor="existingColumn">
                  Modify existing column
                </label>
              </div>
            </div>
          </div>
          
          <div className="mt-3">
            <button 
              className="btn btn-primary" 
              onClick={handleApplyFormula}
              disabled={applying}
              style={{backgroundColor: "#005e32", borderColor: "#005e32"}}
            >
              {applying ? 'Applying...' : 'Apply Formula'}
            </button>
          </div>
          
          <div className="mt-3">
            <p className="text-muted">
              <strong>Formula Preview:</strong> IF({sourceColumn || 'column'} {conditionType === 'equals' ? '=' : 
                conditionType === 'notEquals' ? '≠' : 
                conditionType === 'greaterThan' ? '>' : 
                conditionType === 'lessThan' ? '<' : 
                conditionType === 'greaterOrEqual' ? '≥' : 
                conditionType === 'lessOrEqual' ? '≤' : 
                conditionType === 'contains' ? 'contains' : 
                conditionType === 'startsWith' ? 'starts with' : 
                conditionType === 'endsWith' ? 'ends with' : ''} "{conditionValue}", "{trueValue || 'true value'}", "{falseValue || 'false value'}")
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FormulaBuilder;

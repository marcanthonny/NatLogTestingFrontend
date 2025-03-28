import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';

function WeekTargetSettings({ 
  isOpen, 
  onClose, 
  onSave, 
  initialSettings 
}) {
  // Default settings
  const defaultSettings = {
    cc: {
      week1: { startDate: null, endDate: null, target: 25 },
      week2: { startDate: null, endDate: null, target: 50 },
      week3: { startDate: null, endDate: null, target: 75 },
      week4: { startDate: null, endDate: null, target: 99 }
    },
    ira: {
      week1: { startDate: null, endDate: null, target: 99 },
      week2: { startDate: null, endDate: null, target: 99 },
      week3: { startDate: null, endDate: null, target: 99 },
      week4: { startDate: null, endDate: null, target: 99 }
    }
  };

  // Initialize state with defaults or saved settings
  const [settings, setSettings] = useState(initialSettings || defaultSettings);
  const [dataType, setDataType] = useState('cc'); // 'cc' or 'ira'

  // Reset settings to initial value when modal is opened
  useEffect(() => {
    if (isOpen) {
      setSettings(initialSettings || defaultSettings);
    }
  }, [isOpen, initialSettings]);

  // Handle date change
  const handleDateChange = (week, dateType, date) => {
    setSettings(prev => ({
      ...prev,
      [dataType]: {
        ...prev[dataType],
        [week]: {
          ...prev[dataType][week],
          [dateType]: date
        }
      }
    }));
  };

  // Handle target percentage change
  const handleTargetChange = (week, target) => {
    setSettings(prev => ({
      ...prev,
      [dataType]: {
        ...prev[dataType],
        [week]: {
          ...prev[dataType][week],
          target: parseInt(target, 10) || 0
        }
      }
    }));
  };

  // Format date for display
  const formatDate = (date) => {
    if (!date) return '';
    return format(new Date(date), 'yyyy-MM-dd');
  };

  // Handle save
  const handleSave = () => {
    onSave(settings);
    onClose();
  };

  // Auto-generate dates (a quick way to set 4 consecutive weeks)
  const generateWeeks = () => {
    // Start from today
    const today = new Date();
    const startDate = new Date(today);
    
    // Go to Monday of current week
    startDate.setDate(today.getDate() - today.getDay() + 1);
    
    const newSettings = { ...settings };
    
    // Generate 4 weeks (each 7 days)
    for (let i = 1; i <= 4; i++) {
      const weekStart = new Date(startDate);
      weekStart.setDate(startDate.getDate() + (i-1) * 7);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      newSettings[dataType][`week${i}`].startDate = weekStart.toISOString().split('T')[0];
      newSettings[dataType][`week${i}`].endDate = weekEnd.toISOString().split('T')[0];
    }
    
    setSettings(newSettings);
  };

  if (!isOpen) return null;

  return (
    <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Week Targets Settings</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <ul className="nav nav-tabs mb-3">
              <li className="nav-item">
                <button 
                  className={`nav-link ${dataType === 'cc' ? 'active' : ''}`}
                  onClick={() => setDataType('cc')}
                >
                  Cycle Count Targets
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link ${dataType === 'ira' ? 'active' : ''}`}
                  onClick={() => setDataType('ira')}
                >
                  IRA Targets
                </button>
              </li>
            </ul>

            <div className="mb-3 d-flex justify-content-end">
              <button 
                className="btn btn-outline-secondary btn-sm" 
                onClick={generateWeeks}
              >
                Auto-generate weeks (from this Monday)
              </button>
            </div>

            <div className="table-responsive">
              <table className="table table-bordered">
                <thead>
                  <tr>
                    <th>Week</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Target %</th>
                  </tr>
                </thead>
                <tbody>
                  {['week1', 'week2', 'week3', 'week4'].map((week, index) => (
                    <tr key={week}>
                      <td>Week {index + 1}</td>
                      <td>
                        <input
                          type="date"
                          className="form-control"
                          value={settings[dataType][week].startDate || ''}
                          onChange={(e) => handleDateChange(week, 'startDate', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="date"
                          className="form-control"
                          value={settings[dataType][week].endDate || ''}
                          onChange={(e) => handleDateChange(week, 'endDate', e.target.value)}
                        />
                      </td>
                      <td>
                        <div className="input-group">
                          <input
                            type="number"
                            className="form-control"
                            min="0"
                            max="100"
                            value={settings[dataType][week].target}
                            onChange={(e) => handleTargetChange(week, e.target.value)}
                          />
                          <span className="input-group-text">%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {dataType === 'cc' && (
              <div className="alert alert-info mt-3">
                <strong>Recommended CC targets:</strong> Week 1: 25%, Week 2: 50%, Week 3: 75%, Week 4: 99%
              </div>
            )}
            {dataType === 'ira' && (
              <div className="alert alert-info mt-3">
                <strong>Recommended IRA targets:</strong> All weeks: 99%
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={handleSave}>
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WeekTargetSettings;

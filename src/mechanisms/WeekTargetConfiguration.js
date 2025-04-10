import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Nav, Tab } from 'react-bootstrap';
import { WEEKLY_CONFIG, updateWeeklyTargets } from '../config/weeklyConfig';

function WeekTargetConfiguration({ show, onHide, onUpdate }) {
  const [targets, setTargets] = useState(WEEKLY_CONFIG);
  const [activeTab, setActiveTab] = useState('ira');

  useEffect(() => {
    const savedTargets = localStorage.getItem('weeklyTargets');
    if (savedTargets) {
      setTargets(JSON.parse(savedTargets));
    }
  }, []);

  const handleSave = () => {
    updateWeeklyTargets(targets);
    onUpdate(targets);
    onHide();
  };

  const handleChange = (week, field, value) => {
    setTargets(prev => ({
      ...prev,
      [week]: {
        ...prev[week],
        [field]: field.includes('Target') ? parseFloat(value) || 0 : value
      }
    }));
  };

  const renderDateInputs = (week, config) => (
    <div className="input-group mb-2">
      <Form.Control
        type="date"
        value={config.start}
        onChange={(e) => handleChange(week, 'start', e.target.value)}
        size="sm"
      />
      <span className="input-group-text">to</span>
      <Form.Control
        type="date"
        value={config.end}
        onChange={(e) => handleChange(week, 'end', e.target.value)}
        size="sm"
      />
    </div>
  );
}

export default WeekTargetConfiguration;

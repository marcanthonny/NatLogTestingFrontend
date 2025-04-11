import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Nav, Tab } from 'react-bootstrap';
import { format } from 'date-fns';

function WeekTargetConfiguration({ show, onHide, onUpdate }) {
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

  const [settings, setSettings] = useState(defaultSettings);
  const [activeTab, setActiveTab] = useState('cc');

  useEffect(() => {
    if (show) {
      const savedSettings = localStorage.getItem('weekTargetSettings');
      if (savedSettings) {
        try {
          setSettings(JSON.parse(savedSettings));
        } catch (e) {
          console.error('Error parsing saved settings:', e);
        }
      }
    }
  }, [show]);

  const handleSave = () => {
    localStorage.setItem('weekTargetSettings', JSON.stringify(settings));
    onUpdate(settings);
    onHide();
  };

  const handleChange = (type, week, field, value) => {
    setSettings(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [week]: {
          ...prev[type][week],
          [field]: field === 'target' ? parseFloat(value) || 0 : value
        }
      }
    }));
  };

  const generateWeeks = (type) => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - today.getDay() + 1);
    
    const newSettings = { ...settings };
    
    for (let i = 1; i <= 4; i++) {
      const weekStart = new Date(startDate);
      weekStart.setDate(startDate.getDate() + (i-1) * 7);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      newSettings[type][`week${i}`].startDate = weekStart.toISOString().split('T')[0];
      newSettings[type][`week${i}`].endDate = weekEnd.toISOString().split('T')[0];
    }
    
    setSettings(newSettings);
  };

  const renderWeekInputs = (type, week, index) => (
    <Form.Group key={week} className="mb-4">
      <h6>Week {index + 1}</h6>
      <div className="d-flex gap-2 align-items-center mb-2">
        <Form.Control
          type="date"
          value={settings[type][week].startDate || ''}
          onChange={(e) => handleChange(type, week, 'startDate', e.target.value)}
        />
        <span>to</span>
        <Form.Control
          type="date"
          value={settings[type][week].endDate || ''}
          onChange={(e) => handleChange(type, week, 'endDate', e.target.value)}
        />
      </div>
      <Form.Group className="d-flex align-items-center">
        <Form.Label className="me-2 mb-0">Target:</Form.Label>
        <Form.Control
          type="number"
          min="0"
          max="100"
          value={settings[type][week].target}
          onChange={(e) => handleChange(type, week, 'target', e.target.value)}
          style={{ width: '100px' }}
        />
        <span className="ms-2">%</span>
      </Form.Group>
    </Form.Group>
  );

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Weekly Target Configuration</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
          <Nav variant="tabs" className="mb-3">
            <Nav.Item>
              <Nav.Link eventKey="cc">Cycle Count Targets</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="ira">IRA Targets</Nav.Link>
            </Nav.Item>
          </Nav>

          <div className="d-flex justify-content-end mb-3">
            <Button 
              variant="outline-secondary" 
              size="sm"
              onClick={() => generateWeeks(activeTab)}
            >
              Auto-generate weeks (from this Monday)
            </Button>
          </div>

          <Tab.Content>
            <Tab.Pane eventKey="cc">
              {['week1', 'week2', 'week3', 'week4'].map((week, index) => 
                renderWeekInputs('cc', week, index)
              )}
              <div className="alert alert-info">
                <strong>Recommended CC targets:</strong> Week 1: 25%, Week 2: 50%, Week 3: 75%, Week 4: 99%
              </div>
            </Tab.Pane>
            <Tab.Pane eventKey="ira">
              {['week1', 'week2', 'week3', 'week4'].map((week, index) => 
                renderWeekInputs('ira', week, index)
              )}
              <div className="alert alert-info">
                <strong>Recommended IRA targets:</strong> All weeks: 99%
              </div>
            </Tab.Pane>
          </Tab.Content>
        </Tab.Container>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Cancel</Button>
        <Button variant="primary" onClick={handleSave}>Save Changes</Button>
      </Modal.Footer>
    </Modal>
  );
}

export default WeekTargetConfiguration;

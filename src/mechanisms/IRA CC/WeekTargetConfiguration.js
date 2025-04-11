import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Nav, Tab } from 'react-bootstrap';

function WeekTargetConfiguration({ show, onHide, onUpdate }) {
  const [targets, setTargets] = useState({
    ira: {
      week1: { startDate: '', endDate: '', target: 99 },
      week2: { startDate: '', endDate: '', target: 99 },
      week3: { startDate: '', endDate: '', target: 99 },
      week4: { startDate: '', endDate: '', target: 99 }
    },
    cc: {
      week1: { startDate: '', endDate: '', target: 25 },
      week2: { startDate: '', endDate: '', target: 50 },
      week3: { startDate: '', endDate: '', target: 75 },
      week4: { startDate: '', endDate: '', target: 99 }
    }
  });
  const [activeTab, setActiveTab] = useState('ira');

  useEffect(() => {
    const savedTargets = localStorage.getItem('weekTargetSettings');
    if (savedTargets) {
      try {
        setTargets(JSON.parse(savedTargets));
      } catch (e) {
        console.error('Error parsing saved targets:', e);
      }
    }
  }, [show]);

  const handleSave = () => {
    onUpdate(targets);
    onHide();
  };

  const handleChange = (type, week, field, value) => {
    setTargets(prev => ({
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

  const renderWeekInputs = (type, week) => (
    <div className="mb-4" key={week}>
      <h6>Week {week.replace('week', '')}</h6>
      <Form.Group className="mb-2">
        <Form.Label>Date Range</Form.Label>
        <div className="d-flex gap-2 align-items-center">
          <Form.Control
            type="date"
            value={targets[type][week].startDate}
            onChange={(e) => handleChange(type, week, 'startDate', e.target.value)}
          />
          <span>to</span>
          <Form.Control
            type="date"
            value={targets[type][week].endDate}
            onChange={(e) => handleChange(type, week, 'endDate', e.target.value)}
          />
        </div>
      </Form.Group>
      <Form.Group>
        <Form.Label>Target Percentage</Form.Label>
        <Form.Control
          type="number"
          min="0"
          max="100"
          step="0.1"
          value={targets[type][week].target}
          onChange={(e) => handleChange(type, week, 'target', e.target.value)}
        />
      </Form.Group>
    </div>
  );

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Configure Weekly Targets</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
          <Nav variant="tabs" className="mb-3">
            <Nav.Item>
              <Nav.Link eventKey="ira">IRA Targets</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="cc">CC Targets</Nav.Link>
            </Nav.Item>
          </Nav>
          <Tab.Content>
            <Tab.Pane eventKey="ira">
              {Object.keys(targets.ira).map(week => renderWeekInputs('ira', week))}
            </Tab.Pane>
            <Tab.Pane eventKey="cc">
              {Object.keys(targets.cc).map(week => renderWeekInputs('cc', week))}
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

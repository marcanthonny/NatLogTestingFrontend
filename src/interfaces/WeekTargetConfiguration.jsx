import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Nav, Tab } from 'react-bootstrap';
import { loadWeeklyTargets, updateWeeklyTargets } from '../mechanisms/weeklyTargets';

function WeekTargetConfiguration({ show, onHide, onUpdate }) {
  const [targets, setTargets] = useState({});
  const [activeTab, setActiveTab] = useState('ira');

  useEffect(() => {
    const savedTargets = loadWeeklyTargets();
    if (savedTargets) {
      setTargets(savedTargets);
    }
  }, []);

  return (
      <Modal show={show} onHide={onHide}>
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
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Week</th>
                      <th>Date Range</th>
                      <th>Target %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(targets).map(([week, config]) => (
                      <tr key={week}>
                        <td>{week}</td>
                        <td style={{width: '45%'}}>{renderDateInputs(week, config)}</td>
                        <td>
                          <Form.Control
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={config.iraTarget}
                            onChange={(e) => handleChange(week, 'iraTarget', e.target.value)}
                            size="sm"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Tab.Pane>
              
              <Tab.Pane eventKey="cc">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Week</th>
                      <th>Date Range</th>
                      <th>Target %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(targets).map(([week, config]) => (
                      <tr key={week}>
                        <td>{week}</td>
                        <td style={{width: '45%'}}>{renderDateInputs(week, config)}</td>
                        <td>
                          <Form.Control
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={config.ccTarget}
                            onChange={(e) => handleChange(week, 'ccTarget', e.target.value)}
                            size="sm"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Tab.Pane>
            </Tab.Content>
          </Tab.Container>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" size="sm" onClick={onHide}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={handleSave}>Save Changes</Button>
        </Modal.Footer>
      </Modal>
    );
  }

export default WeekTargetConfiguration;

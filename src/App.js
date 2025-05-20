import React, { useState, useEffect, useRef } from 'react';
// Third-party imports
import axiosInstance from './utils/axiosConfig'; 

// Translation context should be imported before components that use it
import { useLanguage } from './mechanisms/General/LanguageContext'; // <-- FIXED import path

// Import styles before components
import './interfaces/css/App.css';
import './interfaces/css/Dashboard.css';

// Import utilities and helpers
import { getAuthToken, setAuthToken } from './utils/authUtils';

// Then import components
import Login from './interfaces/Auth/Login';
import TopNav from './interfaces/generals/TopNav';
import EnhancedFileUpload from './interfaces/IraCcComponents/EnhancedFileUpload';
import ExcelEditor from './interfaces/ExcelEditor/ExcelEditor';
import DataView from './mechanisms/IRA CC/DataView';
import IraCcDashboard from './interfaces/IraCcComponents/IraCcDashboard';
import HistoricalDataComponent from './mechanisms/IRA CC/HistoricalDataComponent';
import ComprehensiveDashboard from './mechanisms/IRA CC/ComprehensiveDashboard';
import UnifiedDashboard from './interfaces/UnifiedDashboard';
import UserSettings from './interfaces/Auth/UserSettings';
import Sidebar from './interfaces/generals/Sidebar';

import { handleLogin, handleLogout } from './mechanisms/Handlers/AuthHandlers';
import { createDataHandlers } from './mechanisms/Handlers/DataHandlers';
import { createExcelHandlers } from './mechanisms/Handlers/ExcelHandlers';
import { createUIHandlers } from './mechanisms/Handlers/UIHandlers';
import { createHistoryHandlers } from './mechanisms/Handlers/HistoryHandlers';
import { createAuthHandlers } from './mechanisms/Handlers/AuthHandlers';

import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';

function App() {
  const { translate } = useLanguage();
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  // Move auth states to top
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('isAuthenticated') === 'true';
  });
  const [authToken, setAuthToken] = useState(localStorage.getItem('authToken'));

  // IRA CC states
  const [iraData, setIraData] = useState(null);
  const [ccData, setCcData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Track PowerBI data usage
  const [iraPowerBiUsed, setIraPowerBiUsed] = useState(false);
  const [ccPowerBiUsed, setCcPowerBiUsed] = useState(false);
  
  // History for undo/redo functionality
  const [iraHistory, setIraHistory] = useState([]);
  const [ccHistory, setCcHistory] = useState([]);
  const [iraHistoryIndex, setIraHistoryIndex] = useState(-1);
  const [ccHistoryIndex, setCcHistoryIndex] = useState(-1);
  const ignoreNextHistoryUpdate = useRef(false);

  // Add new state for selected historical snapshot
  const [selectedSnapshot, setSelectedSnapshot] = useState(null);

  // Add new state for language
  const [language, setLanguage] = useState('en');

  // Maintain excelData at App level
  const [excelData, setExcelData] = useState(() => {
    // Try to load from localStorage on initial mount
    const stored = localStorage.getItem('excelData');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse stored Excel data:', e);
      }
    }
    return null;
  });

  // Separate Excel Editor state
  const [excelEditorData, setExcelEditorData] = useState(() => {
    const stored = localStorage.getItem('excelEditorData');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse stored Excel Editor data:', e);
      }
    }
    return null;
  });

  // Initialize handlers after all states are declared
  const uiHandlers = createUIHandlers(setLoading, setError, setSuccess);
  
  const { loginHandler, logoutHandler } = createAuthHandlers(
    setAuthToken, 
    setIsAuthenticated
  );
  
  const dataHandlers = createDataHandlers(
    setIraData, setCcData, setLoading, setError, setSuccess,
    setIraPowerBiUsed, setCcPowerBiUsed
  );
  
  const excelHandlers = createExcelHandlers(setExcelData, setExcelEditorData);
  
  const historyHandlers = createHistoryHandlers(
    iraData, ccData, iraHistory, ccHistory,
    setIraData, setCcData, setIraHistory, setCcHistory,
    iraHistoryIndex, ccHistoryIndex,
    setIraHistoryIndex, setCcHistoryIndex,
    ignoreNextHistoryUpdate
  );

  // Add data to history when it changes
  useEffect(() => {
    if (iraData && !ignoreNextHistoryUpdate.current) {
      // Remove any future states if we're in the middle of history
      const newHistory = iraHistory.slice(0, iraHistoryIndex + 1);
      
      // Add current state to history
      setIraHistory([...newHistory, {
        columns: [...iraData.columns],
        data: JSON.parse(JSON.stringify(iraData.data))
      }]);
      
      setIraHistoryIndex(newHistory.length);
    }
  }, [iraData]);

  useEffect(() => {
    if (ccData && !ignoreNextHistoryUpdate.current) {
      // Remove any future states if we're in the middle of history
      const newHistory = ccHistory.slice(0, ccHistoryIndex + 1);
      
      // Add current state to history
      setCcHistory([...newHistory, {
        columns: [...ccData.columns],
        data: JSON.parse(JSON.stringify(ccData.data))
      }]);
      
      setCcHistoryIndex(newHistory.length);
    }
    
    ignoreNextHistoryUpdate.current = false;
  }, [ccData]);

  // When data is loaded, switch to the data tab
  useEffect(() => {
    if (iraData || ccData) {
      // setActiveTab('data'); // REMOVE this line
    }
  }, [iraData, ccData]);

  // Add effect to handle page reloads
  useEffect(() => {
    // Reset to upload tab when page is loaded/reloaded
    // setActiveTab('upload'); // REMOVE this line
    // Clear any stored data
    clearExcelData();
  }, []); // Empty dependency array means this runs once on mount

  useEffect(() => {
    // Check for token on app load
    const token = getAuthToken();
    if (token) {
      setAuthToken(token);
      setIsAuthenticated(true);
    }
  }, []);

  // Add language toggle function
  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'id' : 'en');
  };

  // Router-aware TopNav
  function TopNavWithRouter(props) {
    const navigate = useNavigate();
    const location = useLocation();
    // Map routes to tab names for highlighting
    const routeTabMap = {
      '/ira-cc': 'unified',
      '/analysis': 'comprehensive',
      '/excel-editor': 'excelEditor'
    };
    const activeTab = routeTabMap[location.pathname] || '';

    const handleLogout = () => {
      logoutHandler();
      navigate('/login');
    };

    return (
      <TopNav
        activeTab={activeTab}
        setActiveTab={(tab) => {
          // Map tab to route
          if (tab === 'unified') navigate('/ira-cc');
          else if (tab === 'comprehensive') navigate('/analysis');
          else if (tab === 'excelEditor') navigate('/excel-editor');
        }}
        onLogout={handleLogout}
        {...props}
      />
    );
  }

  // Main content with routes
  function MainContent() {
    return (
      <Routes>
        <Route path="/" element={<Navigate to="/ira-cc" replace />} />
        <Route path="/settings" element={<UserSettings />} />
        <Route path="/ira-cc" element={<UnifiedDashboard />} />
        <Route path="/analysis" element={<ComprehensiveDashboard />} />
        <Route path="/excel-editor" element={<ExcelEditor initialData={excelEditorData} onDataChange={excelHandlers.handleExcelEditorDataChange} />} />
        {/* Add more routes as needed */}
        <Route path="*" element={<div className="alert alert-danger">Page not found</div>} />
      </Routes>
    );
  }

  // Add a cleanup function for when you intentionally want to clear the Excel data
  const clearExcelData = () => {
    setExcelData(null);
    localStorage.removeItem('excelData');
  };

  // Clear Excel Editor data
  const clearExcelEditorData = () => {
    setExcelEditorData(null);
    localStorage.removeItem('excelEditorData');
  };

  useEffect(() => {
    // Update axios token when it changes
    if (authToken) {
      localStorage.setItem('authToken', authToken);
    } else {
      localStorage.removeItem('authToken');
    }
  }, [authToken]);

  const handleDeleteColumn = (columnToDelete) => {
    dataHandlers.handleDeleteColumn(columnToDelete, iraData, ccData);
  };

  const handleDeleteRow = (rowIndex) => {
    dataHandlers.handleDeleteRow(rowIndex, iraData, ccData);
  };

  // Modify return statement to check authentication
  return (
    <Router>
      {!isAuthenticated ? (
        <Login onLogin={loginHandler} />
      ) : (
        <div className="app-layout">
          <TopNav
            hasData={!!(iraData || ccData)}
            hasIraData={!!iraData}
            hasCcData={!!ccData}
            onLogout={logoutHandler}
          />
          <Sidebar expanded={sidebarExpanded} onToggle={() => setSidebarExpanded(!sidebarExpanded)} />
          <div className={`main-content-wrapper ${sidebarExpanded ? 'sidebar-expanded' : ''}`}>
            <div className="main-content">
              {success && (
                <div className="alert alert-success mt-3">
                  <i className="bi bi-check-circle me-2"></i>
                  {success}
                </div>
              )}
              {error && (
                <div className="alert alert-danger mt-3">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  Error: {error}
                </div>
              )}
              <MainContent />
            </div>
          </div>
        </div>
      )}
    </Router>
  );
}

export default App;
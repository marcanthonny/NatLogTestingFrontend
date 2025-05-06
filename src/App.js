import React, { useState, useEffect, useRef } from 'react';
// Third-party imports
import axiosInstance from './utils/axiosConfig'; 

// Translation context should be imported before components that use it
import { useLanguage } from './mechanisms/General/LanguageContext';

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

import { handleLogin, handleLogout } from './mechanisms/Handlers/AuthHandlers';
import { createDataHandlers } from './mechanisms/Handlers/DataHandlers';
import { createExcelHandlers } from './mechanisms/Handlers/ExcelHandlers';
import { createUIHandlers } from './mechanisms/Handlers/UIHandlers';
import { createHistoryHandlers } from './mechanisms/Handlers/HistoryHandlers';
import { createAuthHandlers } from './mechanisms/Handlers/AuthHandlers';

function App() {
  const { translate } = useLanguage();

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
  const [activeTab, setActiveTab] = useState('upload');
  
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
    setIsAuthenticated, 
    setActiveTab
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
      setActiveTab('data');
    }
  }, [iraData, ccData]);

  // Add effect to handle page reloads
  useEffect(() => {
    // Reset to upload tab when page is loaded/reloaded
    setActiveTab('upload');
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

  // Add Excel Editor to the available tabs
  const tabs = [
    { id: 'upload', label: translate('sidebar.upload'), icon: 'bi-cloud-upload' },
    { id: 'data', label: translate('sidebar.dataView'), icon: 'bi-table' },
    { id: 'dashboard', label: translate('sidebar.dashboard'), icon: 'bi-graph-up' },
    { id: 'historical', label: translate('sidebar.historicalData'), icon: 'bi-clock-history' },
    { id: 'excelEditor', label: 'Excel Editor', icon: 'bi-file-earmark-spreadsheet' }
  ];

  // Render content based on the active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'upload':
        return (
          <EnhancedFileUpload 
            onIraUploadSuccess={dataHandlers.handleIraData}
            onCcUploadSuccess={dataHandlers.handleCcData}
            onLoading={uiHandlers.handleLoading}
            onError={uiHandlers.handleError}
            onSuccess={uiHandlers.handleSuccess}
            hasIraPowerBi={iraPowerBiUsed}
            hasCcPowerBi={ccPowerBiUsed}
          />
        );
      case 'data':
        return <DataView iraData={iraData} ccData={ccData} />;
      case 'dashboard':
        return <IraCcDashboard 
          iraData={iraData || selectedSnapshot?.iraData} 
          ccData={ccData || selectedSnapshot?.ccData}
          isHistoricalView={!iraData && !ccData}
          snapshotInfo={selectedSnapshot}
          onError={uiHandlers.handleError}
        />;
      case 'historical':
        return <HistoricalDataComponent 
          iraData={iraData} 
          ccData={ccData}
          onSnapshotSelect={(snapshot) => {
            setSelectedSnapshot(snapshot);
            setActiveTab('dashboard'); // Automatically switch to dashboard
          }}
        />;
      case 'comprehensive':
        return <ComprehensiveDashboard />;
      case 'excelEditor':
        return (
          <ExcelEditor 
            key="excelEditor"
            initialData={excelEditorData} 
            onDataChange={excelHandlers.handleExcelEditorDataChange}
          />
        );
      default:
        return null;
    }
  };

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
    <>
      {!isAuthenticated ? (
        <Login onLogin={loginHandler} />
      ) : (
        <div className="app-layout">
          <TopNav 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            hasData={!!(iraData || ccData)}
            hasIraData={!!iraData}
            hasCcData={!!ccData}
            onLogout={logoutHandler}  // Add this line to pass the logout handler
          />

          <div className="main-content-wrapper">
            <div className="main-content">
              {/* Display success message */}
              {success && (
                <div className="alert alert-success mt-3">
                  <i className="bi bi-check-circle me-2"></i>
                  {success}
                </div>
              )}
              
              {/* Display error message */}
              {error && (
                <div className="alert alert-danger mt-3">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  Error: {error}
                </div>
              )}
              
              {renderContent()}
            </div>
          </div>
          
          {/* Hidden buttons for export functionality */}
          <button 
            id="exportDropdown" 
            className="d-none"
            onClick={() => {
              const toolbarExport = document.querySelector('.dropdown-item[onClick*="xlsx"]');
              if (toolbarExport) toolbarExport.click();
            }}
          ></button>
          
          <button 
            id="exportDropdownCSV" 
            className="d-none"
            onClick={() => {
              const toolbarExport = document.querySelector('.dropdown-item[onClick*="csv"]');
              if (toolbarExport) toolbarExport.click();
            }}
          ></button>
        </div>
      )}
    </>
  );
}

export default App;
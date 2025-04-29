import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from './mechanisms/General/LanguageContext';
import './interfaces/css/App.css';
import './interfaces/css/Dashboard.css';
// Fix imports to use correct paths and exports
import EnhancedFileUpload from './interfaces/IraCcComponents/EnhancedFileUpload';
import ExcelTable from './mechanisms/Excel Editor/ExcelTable';
import FormulaBuilder from './mechanisms/Excel Editor/FormulaBuilder';
import ColumnFormatter from './mechanisms/Excel Editor/ColumnFormatter';
import FilterPanel from './mechanisms/Excel Editor/FilterPanel';
import ToolBar from './mechanisms/Excel Editor/ToolBar';
import TopNav from './interfaces/generals/TopNav.jsx';
import UndoRedo from './interfaces/generals/UndoRedo';
import IraCcDashboard from './interfaces/IraCcComponents/IraCcDashboard';
import DataView from './mechanisms/IRA CC/DataView';
import AnalyzeComponent from './mechanisms/IRA CC/AnalyzeComponent';
import HistoricalDataComponent from './mechanisms/IRA CC/HistoricalDataComponent';
import ComprehensiveDashboard from './mechanisms/IRA CC/ComprehensiveDashboard';
import ExcelEditor from './interfaces/ExcelEditor/ExcelEditor';
import Login from './interfaces/Auth/Login.jsx';
import { getAuthToken, setAuthToken } from './utils/authUtils';
import axiosInstance from './utils/axiosConfig';

function App() {
  const { translate } = useLanguage();

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

  const handleIraData = (data) => {
    // Ensure data is properly structured
    const processedData = {
      columns: data.columns || Object.keys(data.data?.[0] || {}),
      data: data.data || [],
      isPowerBi: data.isPowerBi,
      fileName: data.fileName
    };

    setIraData(processedData);
    
    if (processedData.isPowerBi) {
      setIraPowerBiUsed(true);
    }
    
    setLoading(false);
    setError(null);
    setSuccess('IRA data processed successfully');
  };

  const handleCcData = (data) => {
    // Ensure data is properly structured
    const processedData = {
      columns: data.columns || Object.keys(data.data?.[0] || {}),
      data: data.data || [],
      isPowerBi: data.isPowerBi,
      fileName: data.fileName
    };

    setCcData(processedData);
    
    if (processedData.isPowerBi) {
      setCcPowerBiUsed(true);
    }
    
    setLoading(false);
    setError(null);
    setSuccess('CC data processed successfully');
  };

  const handleLoading = (isLoading) => {
    setLoading(isLoading);
  };

  const handleError = (errorMsg) => {
    setError(errorMsg);
    setSuccess(null); // Clear any success messages
    setLoading(false);
    
    // Auto-clear error after 5 seconds
    setTimeout(() => setError(null), 5000);
  };
  
  const handleSuccess = (successMsg) => {
    setSuccess(successMsg);
    setError(null); // Clear any error messages
    
    // Auto-clear success message after 5 seconds
    setTimeout(() => setSuccess(null), 5000);
  };

  const handleFormulaApplied = (result) => {
    if (iraData) {
      setIraData({
        ...iraData,
        columns: result.columns,
        data: result.data
      });
    }
    if (ccData) {
      setCcData({
        ...ccData,
        columns: result.columns,
        data: result.data
      });
    }
  };

  const handleFormatApplied = (result) => {
    if (iraData) {
      setIraData({
        ...iraData,
        columns: result.columns,
        data: result.data
      });
    }
    if (ccData) {
      setCcData({
        ...ccData,
        columns: result.columns,
        data: result.data
      });
    }
  };
  
  const handleFilterApplied = (result) => {
    if (iraData) {
      setIraData({
        ...iraData,
        columns: result.columns,
        data: result.data
      });
    }
    if (ccData) {
      setCcData({
        ...ccData,
        columns: result.columns,
        data: result.data
      });
    }
  };
  
  const handleUndo = () => {
    if (iraHistoryIndex > 0) {
      ignoreNextHistoryUpdate.current = true;
      const previousState = iraHistory[iraHistoryIndex - 1];
      setIraData({
        ...iraData,
        columns: previousState.columns,
        data: previousState.data
      });
      setIraHistoryIndex(iraHistoryIndex - 1);
    }
    if (ccHistoryIndex > 0) {
      ignoreNextHistoryUpdate.current = true;
      const previousState = ccHistory[ccHistoryIndex - 1];
      setCcData({
        ...ccData,
        columns: previousState.columns,
        data: previousState.data
      });
      setCcHistoryIndex(ccHistoryIndex - 1);
    }
  };
  
  const handleRedo = () => {
    if (iraHistoryIndex < iraHistory.length - 1) {
      ignoreNextHistoryUpdate.current = true;
      const nextState = iraHistory[iraHistoryIndex + 1];
      setIraData({
        ...iraData,
        columns: nextState.columns,
        data: nextState.data
      });
      setIraHistoryIndex(iraHistoryIndex + 1);
    }
    if (ccHistoryIndex < ccHistory.length - 1) {
      ignoreNextHistoryUpdate.current = true;
      const nextState = ccHistory[ccHistoryIndex + 1];
      setCcData({
        ...ccData,
        columns: nextState.columns,
        data: nextState.data
      });
      setCcHistoryIndex(ccHistoryIndex + 1);
    }
  };
  
  const handleDeleteColumn = (columnToDelete) => {
    if (iraData) {
      const newColumns = iraData.columns.filter(column => column !== columnToDelete);
      const newData = iraData.data.map(row => {
        const newRow = { ...row };
        delete newRow[columnToDelete];
        return newRow;
      });
      
      setIraData({
        ...iraData,
        columns: newColumns,
        data: newData
      });
    }
    if (ccData) {
      const newColumns = ccData.columns.filter(column => column !== columnToDelete);
      const newData = ccData.data.map(row => {
        const newRow = { ...row };
        delete newRow[columnToDelete];
        return newRow;
      });
      
      setCcData({
        ...ccData,
        columns: newColumns,
        data: newData
      });
    }
  };
  
  const handleDeleteRow = (rowIndex) => {
    if (iraData) {
      const newData = [...iraData.data];
      newData.splice(rowIndex, 1);
      
      setIraData({
        ...iraData,
        data: newData
      });
    }
    if (ccData) {
      const newData = [...ccData.data];
      newData.splice(rowIndex, 1);
      
      setCcData({
        ...ccData,
        data: newData
      });
    }
  };

  // Add language toggle function
  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'id' : 'en');
  };

  // When uploading or editing the file, update excelData here
  const handleExcelDataChange = async (newData) => {
    try {
      await axiosInstance.post('/excel/save', newData);
      setExcelData(newData);
      // Also save to localStorage
      try {
        localStorage.setItem('excelData', JSON.stringify(newData));
      } catch (e) {
        console.error('Failed to save Excel data:', e);
      }
    } catch (error) {
      console.error('Failed to save Excel data:', error);
    }
  };

  // Add separate handler for Excel Editor data changes
  const handleExcelEditorDataChange = async (newData) => {
    try {
      await axiosInstance.post('/excelEditor/save', newData);
      setExcelEditorData(newData);
      try {
        localStorage.setItem('excelEditorData', JSON.stringify(newData));
      } catch (e) {
        console.error('Failed to save Excel Editor data:', e);
      }
    } catch (error) {
      console.error('Failed to save Excel Editor data:', error);
    }
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
            onIraUploadSuccess={handleIraData} 
            onCcUploadSuccess={handleCcData} 
            onLoading={handleLoading} 
            onError={handleError} 
            onSuccess={handleSuccess} 
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
          onError={handleError} // Add this line
        />;
      case 'analyze':
        return <AnalyzeComponent 
          iraData={iraData || selectedSnapshot?.iraData} 
          ccData={ccData || selectedSnapshot?.ccData}
          isHistoricalView={!iraData && !ccData}
          snapshotInfo={selectedSnapshot}
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
            onDataChange={handleExcelEditorDataChange}
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

  // Add isAuthenticated state at the top with other states
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('isAuthenticated') === 'true';
  });

  // Add auth state
  const [authToken, setAuthToken] = useState(localStorage.getItem('authToken'));

  useEffect(() => {
    // Update axios token when it changes
    if (authToken) {
      localStorage.setItem('authToken', authToken);
    } else {
      localStorage.removeItem('authToken');
    }
  }, [authToken]);

  // Keep only the final enhanced versions:
  const handleLogout = () => {
    setAuthToken(null);
    setIsAuthenticated(false);
    localStorage.removeItem('isAuthenticated');
    setActiveTab('upload');
  };

  const handleLogin = async (token) => {
    if (token) {
      localStorage.setItem('authToken', token);
      localStorage.setItem('isAuthenticated', 'true');
      setAuthToken(token);
      setIsAuthenticated(true);
      setActiveTab('upload');
    }
  };

  // Modify return statement to check authentication
  return (
    <>
      {!isAuthenticated ? (
        <Login onLogin={handleLogin} />
      ) : (
        <div className="app-layout">
          <TopNav 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            hasData={!!(iraData || ccData)}
            hasIraData={!!iraData}
            hasCcData={!!ccData}
            onLogout={handleLogout}  // Add this line to pass the logout handler
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
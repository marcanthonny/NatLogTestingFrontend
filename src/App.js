import React, { useState, useEffect, useRef } from 'react';
import './components/css/App.css';
import './components/css/Dashboard.css';
import EnhancedFileUpload from './components/EnhancedFileUpload';
import ExcelTable from './components/ExcelTable';
import FormulaBuilder from './components/FormulaBuilder';
import ColumnFormatter from './components/ColumnFormatter';
import FilterPanel from './components/FilterPanel';
import ToolBar from './components/ToolBar';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import UndoRedo from './components/UndoRedo';
import IraCcDashboard from './components/IraCcDashboard';
import DataView from './components/DataView';
import AnalyzeComponent from './components/AnalyzeComponent';
import HistoricalDataComponent from './components/HistoricalDataComponent';
import ComprehensiveDashboard from './components/ComprehensiveDashboard';
import { LanguageProvider } from './context/LanguageContext';

function App() {
  // Separate states for IRA and CC data
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

  const handleIraData = (data) => {
    setIraData(data);
    setIraHistory([]);
    setIraHistoryIndex(-1);
    
    // Check if this is PowerBI data and set flag accordingly
    if (data.isPowerBi) {
      setIraPowerBiUsed(true);
    }
    
    setLoading(false);
    setError(null);
    setSuccess(null);
  };

  const handleCcData = (data) => {
    setCcData(data);
    setCcHistory([]);
    setCcHistoryIndex(-1);
    
    // Check if this is PowerBI data and set flag accordingly
    if (data.isPowerBi) {
      setCcPowerBiUsed(true);
    }
    
    setLoading(false);
    setError(null);
    setSuccess(null);
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
      default:
        return null;
    }
  };

  return (
    <LanguageProvider value={{ language, toggleLanguage }}>
      <div className="app-layout">
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          hasData={!!(iraData || ccData)}
          hasIraData={!!iraData}
          hasCcData={!!ccData}
        />
        
        <div className="main-content-wrapper">
          <Header 
            activeTab={activeTab} 
            excelData={iraData || ccData}
            onLanguageToggle={toggleLanguage}
            language={language}
          />
          
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
    </LanguageProvider>
  );
}

export default App;
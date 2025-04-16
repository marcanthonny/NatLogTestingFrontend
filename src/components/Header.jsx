import React from 'react';
import { useLanguage } from '../mechanisms/General/LanguageContext';
import '../interfaces/css/Header.css';

export const Header = ({ activeTab, excelData }) => {
  const { language, toggleLanguage } = useLanguage();

  // Get page title based on active tab
  const getPageTitle = () => {
    switch (activeTab) {
      case 'upload':
        return 'File Upload';
      case 'data':
        return 'Data View';
      case 'dashboard':
        return 'IRA & CC Dashboard';
      case 'analyze':
        return 'Data Analysis';
      case 'historical':
        return 'Historical Data';
      case 'comprehensive':
        return 'Weekly Comparison';
      default:
        return 'Excel Automation';
    }
  };
  
  // Safely get column names from data
  const getColumnSummary = () => {
    if (!excelData || !excelData.columns || !excelData.data) {
      return 'No data loaded';
    }
    
    const columnCount = excelData.columns.length;
    const rowCount = excelData.data.length;
    
    return `${columnCount} columns | ${rowCount} rows`;
  };
  
  return (
    <header className="app-header">
      <div className="container-fluid">
        <div className="row align-items-center">
          <div className="col">
            <h1>{getPageTitle()}</h1>
            {excelData && (
              <div className="data-info">
                <span className="badge bg-light text-dark">
                  <i className="bi bi-table me-1"></i>
                  {getColumnSummary()}
                </span>
              </div>
            )}
          </div>
          <div className="col-auto d-flex align-items-center">
            <button 
              className="btn btn-outline-secondary me-3"
              onClick={toggleLanguage}
            >
              {language === 'en' ? '🇮🇩 Bahasa' : '🇬🇧 English'}
            </button>
            <div className="date-time">
              <span>{new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

// Can also use default export if preferred
export default Header;

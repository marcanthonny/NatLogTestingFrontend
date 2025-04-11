import React, { useState, useEffect } from 'react';
import '../interfaces/css/Sidebar.css';

function Sidebar({ activeTab, setActiveTab, hasData, hasIraData, hasCcData }) {
  const [isMenuExpanded, setIsMenuExpanded] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleMenu = (e) => {
    e.preventDefault();
    setIsMenuExpanded(!isMenuExpanded);
  };

  const toggleMobileMenu = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobileOpen && !event.target.closest('.cms-sidebar') && !event.target.closest('.mobile-menu-toggle')) {
        setIsMobileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileOpen]);

  // Close mobile menu when changing tabs on mobile
  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    if (window.innerWidth <= 768) {
      setIsMobileOpen(false);
    }
  };

  return (
    <>
      <button className="mobile-menu-toggle d-md-none" onClick={toggleMobileMenu}>
        <i className={`bi ${isMobileOpen ? 'bi-x' : 'bi-list'}`}></i>
      </button>

      <div className={`mobile-menu-overlay ${isMobileOpen ? 'active' : ''}`} onClick={toggleMobileMenu}></div>

      <div className={`cms-sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
        <div className="logo">
          <h3>WikiTools</h3>
          <p>#National Logistics</p>
        </div>
        <ul className="nav flex-column">
          {/* Excel Editor - outside IRA CC Tools */}
          <li className="nav-item">
            <a 
              className={`nav-link ${activeTab === 'excelEditor' ? 'active' : ''}`}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handleTabChange('excelEditor');
              }}
            >
              <i className="bi bi-file-earmark-excel"></i>
              Excel Editor
            </a>
          </li>
          
          <li className="nav-item">
            <a 
              className="nav-link parent-menu"
              href="#"
              onClick={toggleMenu}
            >
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <i className="bi bi-tools me-2"></i>
                  IRA CC Tools
                </div>
                <i className={`bi bi-chevron-${isMenuExpanded ? 'down' : 'right'}`}></i>
              </div>
            </a>
            
            {isMenuExpanded && (
              <ul className="nav flex-column submenu">
                <li className="nav-item">
                  <a 
                    className={`nav-link ${activeTab === 'upload' ? 'active' : ''}`}
                    href="#"
                    onClick={(e) => { e.preventDefault(); handleTabChange('upload'); }}
                  >
                    <i className="bi bi-cloud-upload"></i> Upload
                  </a>
                </li>
                
                <li className="nav-item">
                  <a 
                    className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}
                    href="#ira-cc-dashboard"
                    onClick={(e) => { 
                      e.preventDefault();
                      handleTabChange('dashboard');
                      window.history.pushState({}, "", "#ira-cc-dashboard");
                    }}
                  >
                    <i className="bi bi-speedometer2"></i> IRA CC Dashboard
                  </a>
                </li>
                
                <li className="nav-item">
                  <a 
                    className={`nav-link ${activeTab === 'data' ? 'active' : ''} ${!hasIraData && !hasCcData ? 'disabled-link' : ''}`}
                    href="#"
                    onClick={(e) => { 
                      e.preventDefault(); 
                      if (hasIraData || hasCcData) {
                        handleTabChange('data');
                      }
                    }}
                  >
                    <i className="bi bi-table"></i> Data View
                    {!hasIraData && !hasCcData && <small className="ms-2 text-muted">(Needs data)</small>}
                  </a>
                </li>
                
                <li className="nav-item">
                  <a 
                    className={`nav-link ${activeTab === 'analyze' ? 'active' : ''}`}
                    href="#"
                    onClick={(e) => { 
                      e.preventDefault(); 
                      handleTabChange('analyze');
                    }}
                  >
                    <i className="bi bi-bar-chart"></i> Analyze
                  </a>
                </li>
                
                <li className="nav-item">
                  <a 
                    className={`nav-link ${activeTab === 'historical' ? 'active' : ''}`}
                    href="#"
                    onClick={(e) => { 
                      e.preventDefault(); 
                      handleTabChange('historical');
                    }}
                  >
                    <i className="bi bi-archive"></i> Historical Data
                  </a>
                </li>
                
                <li className="nav-item">
                  <a 
                    className={`nav-link ${activeTab === 'comprehensive' ? 'active' : ''}`}
                    href="#"
                    onClick={(e) => { 
                      e.preventDefault(); 
                      handleTabChange('comprehensive');
                    }}
                  >
                    <i className="bi bi-graph-up-arrow"></i> Weekly Comparison
                  </a>
                </li>
              </ul>
            )}
          </li>
          
          {/* Add other top-level menu items here in the future */}
        </ul>
      </div>
    </>
  );
}

export default Sidebar;

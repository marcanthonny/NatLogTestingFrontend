import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../mechanisms/General/LanguageContext';
import '../css/TopNav.css';

function TopNav({ activeTab, setActiveTab, hasData, hasIraData, hasCcData, onLogout }) {
  const { translate } = useLanguage(); // Add this line to extract translate function
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeGroup, setActiveGroup] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Add resize listener
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setActiveGroup(null);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleGroup = (group) => {
    if (isMobile) {
      setActiveGroup(activeGroup === group ? null : group);
    }
  };

  const handleNavClick = (tab, e) => {
    e.preventDefault();
    if (tab === 'data' && !hasIraData && !hasCcData) {
      return; // Don't navigate if no data available
    }
    setActiveTab(tab);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    setActiveGroup(null);
  };

  // Add scroll handling
  useEffect(() => {
    const handleScroll = () => {
      // Add any scroll-based behavior here if needed
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Add body scroll lock when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  // Add helper function to check if group is active
  const isGroupActive = (group) => {
    switch (group) {
      case 'ira':
        return activeGroup === 'ira' || ['upload', 'dashboard', 'data', 'historical', 'comprehensive'].includes(activeTab);
      case '5s':
        return activeGroup === '5s' || ['5s'].includes(activeTab);
      default:
        return false;
    }
  };

  const handleLogoutClick = (e) => {
    e.preventDefault();
    if (onLogout) {
      // Clear any sensitive data from localStorage
      localStorage.removeItem('authToken');
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('weekTargetSettings');
      
      // Call the provided onLogout handler
      onLogout();
    }
  };

  return (
    <nav className="top-nav">
      <div className="nav-brand">
        {/* Replace img with more robust implementation */}
        <div className="logo-container">
          <img 
            src="https://natlogportal.vercel.app/apl-icon-32x32.png"
            alt="APL Logo"
            onError={(e) => {
              e.target.onerror = null;
              e.target.style.display = 'none';
              e.target.nextElementSibling.style.display = 'block';
            }}
          />
          <span 
            className="logo-fallback" 
            style={{ display: 'none', fontSize: '1.5rem', fontWeight: 'bold' }}
          >
            APL
          </span>
        </div>
      </div>

      <button 
        className={`nav-toggle ${isMenuOpen ? 'active' : ''}`}
        onClick={toggleMenu}
        aria-label="Toggle navigation"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      <div className="container-fluid">
        <div className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
          <a 
            href="#"
            className={`nav-link ${activeTab === 'excelEditor' ? 'active' : ''}`}
            onClick={(e) => handleNavClick('excelEditor', e)}
          >
            {translate('sidebar.excelEditor')}
          </a>

          <div className={`nav-group ${isGroupActive('ira') ? 'active' : ''}`}>
            <a href="#" className="nav-link" onClick={() => toggleGroup('ira')}>
              IRA CC Tools
            </a>
            <div className="nav-group-menu">
              <a 
                href="#"
                className={`nav-link ${activeTab === 'upload' ? 'active' : ''}`}
                onClick={(e) => handleNavClick('upload', e)}
              >
                Upload
              </a>
              <a 
                href="#"
                className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={(e) => handleNavClick('dashboard', e)}
              >
                IRA CC Dashboard
              </a>
              <a 
                href="#"
                className={`nav-link ${activeTab === 'data' ? 'active' : ''} ${!hasIraData && !hasCcData ? 'disabled-link' : ''}`}
                onClick={(e) => handleNavClick('data', e)}
              >
                Data View
                {!hasIraData && !hasCcData && <small className="ms-2 text-muted">(Needs data)</small>}
              </a>
              <a 
                href="#"
                className={`nav-link ${activeTab === 'historical' ? 'active' : ''}`}
                onClick={(e) => handleNavClick('historical', e)}
              >
                Historical Dashboard
              </a>
              <a 
                href="#"
                className={`nav-link ${activeTab === 'comprehensive' ? 'active' : ''}`}
                onClick={(e) => handleNavClick('comprehensive', e)}
              >
                <i className="bi bi-graph-up-arrow"></i> Analysis
              </a>
              {/* ...existing IRA CC menu items... */}
            </div>
          </div>

          <div className={`nav-group ${isGroupActive('5s') ? 'active' : ''}`}>
            <a href="#" className="nav-link" onClick={() => toggleGroup('5s')}>
              5S Scoring Tools
            </a>
            <div className="nav-group-menu">
              {/* ...existing 5S menu items... */}
            </div>
          </div>
          <div className={`nav-group ${isGroupActive('BatchCorr') ? 'active' : ''}`}>
            <a href="#" className="nav-link" onClick={() => toggleGroup('BatchCorr')}>
              Batch Correction
            </a>
            <div className="nav-group-menu">
            <a 
                href="#"
                className={`nav-link ${activeTab === 'formSummary' ? 'active' : ''}`}
                onClick={(e) => handleNavClick('upload', e)}
              >
                 Form Summary
              </a>
              <a 
                href="#"
                className={`nav-link ${activeTab === 'formEditor' ? 'active' : ''}`}
                onClick={(e) => handleNavClick('dashboard', e)}
              >
                Form Editor
              </a>
            </div>
          </div>

          {/* Update logout button to use handleLogoutClick */}
          <a href="#" className="logout-button" onClick={handleLogoutClick}>
            <i className="bi bi-box-arrow-right"></i>
            Logout
          </a>
        </div>
      </div>
    </nav>
  );
}

export default TopNav;

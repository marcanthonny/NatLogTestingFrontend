import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../mechanisms/General/LanguageContext';
import '../css/TopNav.css';

function TopNav({ activeTab, setActiveTab, hasData, hasIraData, hasCcData, onLogout }) {
  const { translate } = useLanguage(); // Add this line to extract translate function
  const location = useLocation();
  const navigate = useNavigate();
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
        // Only highlight if unified or comprehensive is active
        return activeGroup === 'ira' || ['unified', 'comprehensive'].includes(activeTab);
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
      onLogout();
    }
  };

  return (
    <nav className="top-nav">
      <div className="container-fluid">
        <div className="nav-brand">
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
            <span className="logo-fallback" style={{ display: 'none' }}>APL</span>
          </div>
        </div>

        <button 
          className={`nav-toggle d-md-none ${isMenuOpen ? 'active' : ''}`}
          onClick={toggleMenu}
          aria-label="Toggle navigation"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* Change this div to be visible on mobile */}
        <div className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
          <Link
            to="/excel-editor"
            className={`nav-link ${location.pathname === '/excel-editor' ? 'active' : ''}`}
            onClick={() => setIsMenuOpen(false)}
          >
            {translate('sidebar.excelEditor')}
          </Link>

          <Link
            to="/ira-cc"
            className={`nav-link ${location.pathname === '/ira-cc' ? 'active' : ''}`}
            onClick={() => setIsMenuOpen(false)}
          >
            IRA CC Tools
          </Link>

          <Link
            to="/analysis"
            className={`nav-link ${location.pathname === '/analysis' ? 'active' : ''}`}
            onClick={() => setIsMenuOpen(false)}
          >
            Analysis
          </Link>

          <Link
            to="/5s-scoring"
            className={`nav-link ${location.pathname === '/5s-scoring' ? 'active' : ''}`}
            onClick={() => setIsMenuOpen(false)}
          >
            5S Scoring Tools
          </Link>

          <Link
            to="https://batch-corr-form.vercel.app/"
            className={`nav-link`}
            onClick={() => setIsMenuOpen(false)}
          >
            Wrong Picking
          </Link>
        </div>

        {/* Always visible user controls */}
        <div className="user-controls ms-auto">
          <Link
            to="/user-settings"
            className="user-menu-button"
            onClick={(e) => {
              e.preventDefault();
              navigate('/user-settings');
              setIsMenuOpen(false);
            }}
          >
            <i className="bi bi-person-circle"></i>
            {localStorage.getItem('username') || ' User'}
          </Link>
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

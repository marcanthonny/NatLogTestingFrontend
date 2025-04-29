import React, { useState } from 'react';
import { useLanguage } from '../../mechanisms/General/LanguageContext';
import '../css/TopNav.css';

function TopNav({ activeTab, setActiveTab, hasData, hasIraData, hasCcData }) {
  const { translate } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeGroup, setActiveGroup] = useState(null);

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

  const toggleGroup = (group) => {
    setActiveGroup(activeGroup === group ? null : group);
  };

  return (
    <nav className={`top-nav`}>
      <button className={`nav-toggle ${isMenuOpen ? 'active' : ''}`} onClick={toggleMenu}>
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
            <i className="bi bi-file-earmark-excel"></i>
            {translate('sidebar.excelEditor')}
          </a>

          <div className={`nav-group ${activeGroup === 'ira' ? 'active' : ''}`}>
            <a href="#" className="nav-link" onClick={() => toggleGroup('ira')}>
              <i className="bi bi-tools me-2"></i>
              IRA CC Tools
            </a>
            <div className="nav-group-menu">
              <a 
                href="#"
                className={`nav-link ${activeTab === 'upload' ? 'active' : ''}`}
                onClick={(e) => handleNavClick('upload', e)}
              >
                <i className="bi bi-cloud-upload"></i> Upload
              </a>
              <a 
                href="#"
                className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={(e) => handleNavClick('dashboard', e)}
              >
                <i className="bi bi-speedometer2"></i> IRA CC Dashboard
              </a>
              <a 
                href="#"
                className={`nav-link ${activeTab === 'data' ? 'active' : ''} ${!hasIraData && !hasCcData ? 'disabled-link' : ''}`}
                onClick={(e) => handleNavClick('data', e)}
              >
                <i className="bi bi-table"></i> Data View
                {!hasIraData && !hasCcData && <small className="ms-2 text-muted">(Needs data)</small>}
              </a>
              <a 
                href="#"
                className={`nav-link ${activeTab === 'historical' ? 'active' : ''}`}
                onClick={(e) => handleNavClick('historical', e)}
              >
                <i className="bi bi-archive"></i> Historical Dashboard
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

          <div className={`nav-group ${activeGroup === '5s' ? 'active' : ''}`}>
            <a href="#" className="nav-link" onClick={() => toggleGroup('5s')}>
              <i className="bi bi-clipboard-check me-2"></i>
              5S Scoring Tools
            </a>
            <div className="nav-group-menu">
              {/* ...existing 5S menu items... */}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default TopNav;

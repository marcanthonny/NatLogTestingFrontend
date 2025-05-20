import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => {
  const [isExpanded, setIsExpanded] = useState(true);
  const location = useLocation();

  const menuItems = [
    {
      title: 'Excel Editor',
      path: '/excel-editor',
      icon: 'bi-file-earmark-spreadsheet'
    },
    {
      title: 'IRA CC Tools',
      path: '/ira-cc',
      icon: 'bi-graph-up'
    },
    {
      title: 'Analysis',
      path: '/analysis',
      icon: 'bi-bar-chart'
    },
    {
      title: '5S Scoring',
      path: '/5s-scoring',
      icon: 'bi-clipboard-check'
    },
    {
      title: 'Form Summary',
      path: '/form-summary',
      icon: 'bi-file-text'
    },
    {
      title: 'Form Editor',
      path: '/form-editor',
      icon: 'bi-pencil-square'
    }
  ];

  return (
    <div className={`sidebar d-none d-md-block ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <button 
        className="toggle-button"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <i className={`bi ${isExpanded ? 'bi-chevron-left' : 'bi-chevron-right'}`}></i>
      </button>
      
      <div className="menu-items">
        {menuItems.map((item, index) => (
          <Link
            key={index}
            to={item.path}
            className={`menu-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            <i className={`bi ${item.icon}`}></i>
            {isExpanded && <span>{item.title}</span>}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;

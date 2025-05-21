import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => {
  const [isExpanded, setIsExpanded] = useState(true);
  const location = useLocation();

  const menuItems = [
    {
      title: 'Beranda',
      path: '/main',
      icon: 'bi-house-fill'
    },
    {
      title: 'Editor Excel',
      path: '/excel-editor',
      icon: 'bi-file-earmark-spreadsheet'
    },
    {
      title: 'Performa Inventory',
      path: '/ira-cc',
      icon: 'bi-graph-up'
    },
    {
      title: 'Analisa',
      path: '/analysis',
      icon: 'bi-bar-chart'
    },
    {
      title: 'Skor 5S',
      path: '/5s-scoring',
      icon: 'bi-clipboard-check'
    },
    {
      title: 'Wrong Picking',
      path: '/wrong-picking',
      icon: 'bi-file-text'
    },
    {
      title: 'Innovation Award',
      path: '/ia',
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

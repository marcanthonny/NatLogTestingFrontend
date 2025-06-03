import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Sidebar.css';

const Sidebar = () => {
  const [isExpanded, setIsExpanded] = useState(true);
  const location = useLocation();
  const { currentUser } = useAuth();

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
      title: 'Admin Wrong Picking',
      path: `/api/auth/cross-login?token=${localStorage.getItem('authToken')}`,
      icon: 'bi-file-text',
      isAdminOnly: true
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
            to={item.isAdminOnly && currentUser?.role !== 'admin' ? '#' : item.path}
            className={`menu-item ${location.pathname === item.path ? 'active' : ''} ${item.isAdminOnly && currentUser?.role !== 'admin' ? 'disabled' : ''}`}
            title={item.isAdminOnly && currentUser?.role !== 'admin' ? 'You are not an admin to access this page' : item.title}
            onClick={(e) => {
              if (item.isAdminOnly && currentUser?.role !== 'admin') {
                e.preventDefault();
              } else if (item.isAdminOnly) {
                // For admin users, navigate via window.location to trigger external redirect
                window.location.href = item.path;
                e.preventDefault(); // Prevent react-router-dom navigation
              }
              setIsExpanded(false);
            }}
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

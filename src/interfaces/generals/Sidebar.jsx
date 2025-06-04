import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Sidebar.css';

const Sidebar = () => {
  const [isExpanded, setIsExpanded] = useState(true);
  const location = useLocation();
  const { currentUser, refreshUser } = useAuth();

  useEffect(() => {
    refreshUser();
  }, []);

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
      title: 'Wrong Picking (Admin)',
      path: 'https://batch-corr-form.vercel.app/admin',
      icon: 'bi-file-text',
      isAdminOnly: true
    },
    {
      title: 'Innovation Award',
      path: '/ia',
      icon: 'bi-pencil-square'
    }
  ];

  // Get user role from localStorage
  const storedUser = localStorage.getItem('user');
  const userRole = storedUser ? JSON.parse(storedUser).role : null;
  const isAdmin = userRole === 'admin';

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
            className={`menu-item ${location.pathname === item.path ? 'active' : ''} ${item.isAdminOnly && !isAdmin ? 'disabled' : ''}`}
            title={item.isAdminOnly && !isAdmin ? 'You are not an admin to access this page' : item.title}
            onClick={(e) => {
              if (item.isAdminOnly && !isAdmin) {
                e.preventDefault();
              } else if (item.isAdminOnly && isAdmin) {
                // Get the auth token and redirect with crossToken parameter
                const token = localStorage.getItem('authToken');
                window.location.href = `${item.path}?crossToken=${token}`;
                e.preventDefault();
              }
            }}
          >
            <i className={`bi ${item.icon}`}></i>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {isExpanded && <span>{item.title}</span>}
              {!isAdmin && item.isAdminOnly && (
                <span className="admin-warning">You are not an admin</span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;

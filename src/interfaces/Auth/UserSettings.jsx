import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from '../../utils/axiosConfig';
import './UserSettings.css';

const UserSettings = () => {
  const { user, loading: contextLoading, updateUser, logout } = useAuth();  // Keep useAuth
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    username: user?.username || '',  // Initialize with user data if available
    email: user?.email || '',
    role: user?.role || '',  // Add role field
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [validations, setValidations] = useState({
    hasLength: false,
    hasSpecial: false,
    hasNumber: false,
    hasCapital: false,
    passwordsMatch: false
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  // Update this useEffect to fetch immediately
  useEffect(() => {
    const fetchUserData = async () => {
      if (!localStorage.getItem('authToken')) {
        navigate('/login');
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get('/auth/me');
        
        if (response.data) {
          setFormData(prev => ({
            ...prev,
            username: response.data.username || user?.username || '',
            email: response.data.email || user?.email || '',
            role: response.data.role || user?.role || '' // Add role
          }));
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        if (error.response?.status === 401) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('isAuthenticated');
          navigate('/login');
        }
      } finally {
        setLoading(false);  // Always set loading to false when done
      }
    };

    fetchUserData();
  }, [user, navigate]);  // Add proper dependencies

  const validatePassword = (password) => {
    const validations = {
      hasLength: password.length >= 8,
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      hasNumber: /\d/.test(password),
      hasCapital: /[A-Z]/.test(password),
    };
    
    setValidations(prev => ({
      ...validations,
      passwordsMatch: password === formData.confirmPassword
    }));

    return Object.values(validations).every(Boolean);
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'newPassword') {
      validatePassword(value);
    } else if (name === 'confirmPassword') {
      setValidations(prev => ({
        ...prev,
        passwordsMatch: value === formData.newPassword
      }));
    }
  };

  const updateUserSettings = async (settings) => {
    try {
      const updateData = {
        username: settings.username,
        email: settings.email
      };

      if (settings.newPassword) {
        if (!settings.currentPassword) {
          throw new Error('Current password is required to change password');
        }
        updateData.currentPassword = settings.currentPassword;
        updateData.newPassword = settings.newPassword;
      }

      const response = await axios.put('/auth/settings', updateData);
      const updatedUser = response.data.user;
      
      // Use updateUser from context instead of setUser
      if (updateUser) {
        updateUser(updatedUser);
      } else {
        console.warn('updateUser function not found in auth context');
      }
      
      return { success: true };
    } catch (error) {
      console.error('Settings update failed:', error);
      const errorMessage = error.response?.data?.message || 
                         error.response?.data?.error || 
                         error.message ||
                         'Failed to update user settings';
      return { 
        success: false, 
        error: errorMessage
      };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const result = await updateUserSettings(formData);
      if (result.success) {
        setSuccess('Settings updated successfully');
        
        // If password was changed, show message and perform proper logout
        if (formData.newPassword) {
          setSuccess('Password updated successfully. You will be logged out in 5 seconds.');
          setTimeout(() => {
            logout(); // Use the logout function from auth context
            navigate('/login');
          }, 5000);
        } else {
          setTimeout(() => navigate('/'), 2000);
        }
      } else {
        setError(result.error || 'Failed to update settings');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update settings');
    }
  };

  // Update loading check to combine both loading states
  if (loading && contextLoading) {
    return (
      <div className="user-settings-container d-flex align-items-center justify-content-center min-vh-100">
        <div className="text-center">
          <div className="spinner-border mb-2" 
            style={{ 
              width: '1.2rem', 
              height: '1.2rem', 
              color: '#2F4F4F',
              borderWidth: '0.15em'
            }} 
            role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <div>We're Loading Your Profile</div>
        </div>
      </div>
    );
  }

  // Change this check to prevent redirect if we're still loading
  if (!user && !loading && !contextLoading) {
    navigate('/login');
    return null;
  }

  return (
    <div className="user-settings-container">
      <div className="settings-card">
        <h2>PROFILE SETTINGS</h2>
        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label>Role</label>
            <input
              type="text"
              value={formData.role}
              className="form-control"
              disabled
            />
          </div>

          <div className="form-group">
            <label>Current Password (Required to Change your Password)</label>
            <input
              type="password"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={(e) => setFormData({...formData, currentPassword: e.target.value})}
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label>New Password (Leave blank if you don't want to change your password)</label>
            <input
              type="password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handlePasswordChange}
              className="form-control"
            />
            <div className="password-requirements">
              <div className={validations.hasLength ? 'requirement-met' : ''}>
                <i className={`bi bi-${validations.hasLength ? 'check-circle' : 'circle'}`}></i>
                At least 8 characters
              </div>
              <div className={validations.hasSpecial ? 'requirement-met' : ''}>
                <i className={`bi bi-${validations.hasSpecial ? 'check-circle' : 'circle'}`}></i>
                Contains special characters
              </div>
              <div className={validations.hasNumber ? 'requirement-met' : ''}>
                <i className={`bi bi-${validations.hasNumber ? 'check-circle' : 'circle'}`}></i>
                Contains a number
              </div>
              <div className={validations.hasCapital ? 'requirement-met' : ''}>
                <i className={`bi bi-${validations.hasCapital ? 'check-circle' : 'circle'}`}></i>
                Contains a capital letter
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Confirm New Password (Leave blank if you don't want to change your password)</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handlePasswordChange}
              className="form-control"
            />
            <div className={`password-match ${validations.passwordsMatch ? 'requirement-met' : ''}`}>
              <i className={`bi bi-${validations.passwordsMatch ? 'check-circle' : 'circle'}`}></i>
              Passwords match
            </div>
          </div>

          <button type="submit" className="btn btn-primary">
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
};

export default UserSettings;

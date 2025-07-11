import React, { useState } from 'react';
import axiosInstance from '../../utils/axiosConfig';
import { getApiUrl } from '../../config/api';
import '../../interfaces/css/components/Login.css';
import aplLogo from '../../images/apl-logo.png';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent form submission reload
    setError('');
    setLoading(true);

    try {
      const response = await axiosInstance.post('/auth/login', {
        username: username.trim().toLowerCase(),
        password
      });
      
      if (response.data?.token) {
        // Store token in localStorage before calling onLogin
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('user', JSON.stringify(response.data.user));
        onLogin(response.data.token, response.data.user.role);
        window.location.href = '/main'; // Redirect to main page after successful login
      } else {
        setError('Invalid response from server');
        setLoading(false);
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error.response?.data?.error || 'Invalid credentials');
      setLoading(false);
    }
  };

  const handleImageError = (e) => {
    e.target.style.display = 'none';
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="text-center">
          <img 
            src={aplLogo} 
            alt="APL Logo" 
            className="login-logo"
            onError={handleImageError}
          />
        </div>
        <title>Login to Continue</title>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              className="form-control"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              required
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
              disabled={loading}
            />
          </div>
          {error && <div className="alert alert-danger">{error}</div>}
          <button 
            type="submit" 
            className="btn btn-primary w-100"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;

import React, { useState } from 'react';
import '../../interfaces/css/components/Login.css';
import aplLogo from '../../images/apl-logo.png';
import axiosInstance from '../../utils/axiosConfig';
import { getApiUrl } from '../../config/api';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axiosInstance.post(getApiUrl('/auth/login'), {
        username: username.trim().toLowerCase(), // Normalize username
        password
      });
      
      if (response.data?.token) {
        onLogin(response.data.token);
      } else {
        setError('Invalid response from server');
      }
    } catch (error) {
      if (error.response?.status === 401) {
        setError('Invalid username or password');
      } else {
        setError(error.response?.data?.error || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="text-center">
          <img 
            src={aplLogo} 
            alt="APL Logo" 
            className="login-logo"
          />
        </div>
        <h3>Login to Continue</h3>
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

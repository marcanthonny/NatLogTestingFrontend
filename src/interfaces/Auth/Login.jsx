import React, { useState } from 'react';
import '../../interfaces/css/components/Login.css';
import aplLogo from '../../images/apl-logo.png';
import axios from 'axios';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Use direct axios call for login to avoid auth header
      const response = await axios.post('https://aplnatlog-backend.vercel.app/api/auth/login', {
        username,
        password
      });
      
      if (response.data && response.data.token) {
        // Store token
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('isAuthenticated', 'true');
        // Set auth header for future requests
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        onLogin(response.data.token);
      }
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      setError(error.response?.data?.error || 'Login failed');
      setTimeout(() => setError(''), 3000);
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
            width="auto"
            height="auto"
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
            />
          </div>
          {error && <div className="alert alert-danger">{error}</div>}
          <button type="submit" className="btn btn-primary w-100">
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;

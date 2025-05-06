export const createAuthHandlers = (setAuthToken, setIsAuthenticated, setActiveTab) => ({
  loginHandler: (token, role) => {
    if (token) {
      localStorage.setItem('authToken', token);
      localStorage.setItem('isAuthenticated', 'true');
      setAuthToken(token);
      setIsAuthenticated(true);
      setActiveTab('upload');
    }
  },

  logoutHandler: () => {
    setAuthToken(null);
    setIsAuthenticated(false);
    localStorage.removeItem('authToken');
    localStorage.removeItem('isAuthenticated');
    setActiveTab('upload');
  }
});

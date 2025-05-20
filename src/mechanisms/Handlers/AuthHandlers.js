export const createAuthHandlers = (setAuthToken, setIsAuthenticated) => ({
  loginHandler: (token, role) => {
    if (token) {
      localStorage.setItem('authToken', token);
      localStorage.setItem('isAuthenticated', 'true');
      setAuthToken(token);
      setIsAuthenticated(true);
    }
  },

  logoutHandler: () => {
    setAuthToken(null);
    setIsAuthenticated(false);
    localStorage.removeItem('authToken');
    localStorage.removeItem('isAuthenticated');
  }
});

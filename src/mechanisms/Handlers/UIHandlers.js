export const createUIHandlers = (setLoading, setError, setSuccess) => ({
  handleLoading: (isLoading) => {
    setLoading(isLoading);
  },

  handleError: (errorMsg) => {
    setError(errorMsg);
    setSuccess(null);
    setLoading(false);
    setTimeout(() => setError(null), 5000);
  },

  handleSuccess: (successMsg) => {
    setSuccess(successMsg);
    setError(null);
    setTimeout(() => setSuccess(null), 5000);
  }
});

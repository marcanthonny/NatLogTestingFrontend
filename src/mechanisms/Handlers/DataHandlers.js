export const createDataHandlers = (
  setIraData,
  setCcData,
  setLoading,
  setError,
  setSuccess,
  setIraPowerBiUsed,
  setCcPowerBiUsed
) => ({
  handleIraData: (data) => {
    const processedData = {
      columns: data.columns || Object.keys(data.data?.[0] || {}),
      data: data.data || [],
      isPowerBi: data.isPowerBi,
      fileName: data.fileName
    };
    setIraData(processedData);
    if (processedData.isPowerBi) {
      setIraPowerBiUsed(true);
    }
    setLoading(false);
    setError(null);
    setSuccess('IRA data processed successfully');
  },

  handleCcData: (data) => {
    const processedData = {
      columns: data.columns || Object.keys(data.data?.[0] || {}),
      data: data.data || [],
      isPowerBi: data.isPowerBi,
      fileName: data.fileName
    };
    setCcData(processedData);
    if (processedData.isPowerBi) {
      setCcPowerBiUsed(true);
    }
    setLoading(false);
    setError(null);
    setSuccess('CC data processed successfully');
  },

  handleDeleteColumn: (columnToDelete, currentIraData, currentCcData) => {
    if (currentIraData) {
      const newColumns = currentIraData.columns.filter(column => column !== columnToDelete);
      const newData = currentIraData.data.map(row => {
        const newRow = { ...row };
        delete newRow[columnToDelete];
        return newRow;
      });
      setIraData({
        ...currentIraData,
        columns: newColumns,
        data: newData
      });
    }
    if (currentCcData) {
      const newColumns = currentCcData.columns.filter(column => column !== columnToDelete);
      const newData = currentCcData.data.map(row => {
        const newRow = { ...row };
        delete newRow[columnToDelete];
        return newRow;
      });
      setCcData({
        ...currentCcData,
        columns: newColumns,
        data: newData
      });
    }
  },

  handleDeleteRow: (rowIndex, currentIraData, currentCcData) => {
    const updateData = (data, setData) => {
      if (!data) return;
      const newData = [...data.data];
      newData.splice(rowIndex, 1);
      setData({ ...data, data: newData });
    };
    updateData(currentIraData, setIraData);
    updateData(currentCcData, setCcData);
  }
});

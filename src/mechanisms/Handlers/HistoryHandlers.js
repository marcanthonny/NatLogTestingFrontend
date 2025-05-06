export const createHistoryHandlers = (
  iraData, ccData, iraHistory, ccHistory,
  setIraData, setCcData, setIraHistory, setCcHistory,
  iraHistoryIndex, ccHistoryIndex,
  setIraHistoryIndex, setCcHistoryIndex,
  ignoreNextHistoryUpdate
) => ({
  handleUndo: () => {
    if (iraHistoryIndex > 0) {
      ignoreNextHistoryUpdate.current = true;
      const previousState = iraHistory[iraHistoryIndex - 1];
      setIraData({
        ...iraData,
        columns: previousState.columns,
        data: previousState.data
      });
      setIraHistoryIndex(iraHistoryIndex - 1);
    }
    if (ccHistoryIndex > 0) {
      ignoreNextHistoryUpdate.current = true;
      const previousState = ccHistory[ccHistoryIndex - 1];
      setCcData({
        ...ccData,
        columns: previousState.columns,
        data: previousState.data
      });
      setCcHistoryIndex(ccHistoryIndex - 1);
    }
  },

  handleRedo: () => {
    if (iraHistoryIndex < iraHistory.length - 1) {
      ignoreNextHistoryUpdate.current = true;
      const nextState = iraHistory[iraHistoryIndex + 1];
      setIraData({
        ...iraData,
        columns: nextState.columns,
        data: nextState.data
      });
      setIraHistoryIndex(iraHistoryIndex + 1);
    }
    if (ccHistoryIndex < ccHistory.length - 1) {
      ignoreNextHistoryUpdate.current = true;
      const nextState = ccHistory[ccHistoryIndex + 1];
      setCcData({
        ...ccData,
        columns: nextState.columns,
        data: nextState.data
      });
      setCcHistoryIndex(ccHistoryIndex + 1);
    }
  }
});

import axiosInstance from '../../utils/axiosConfig';

export const createExcelHandlers = (setExcelData, setExcelEditorData) => ({
  handleExcelDataChange: async (newData) => {
    try {
      await axiosInstance.post('/excel/save', newData);
      setExcelData(newData);
      localStorage.setItem('excelData', JSON.stringify(newData));
    } catch (error) {
      console.error('Failed to save Excel data:', error);
    }
  },

  handleExcelEditorDataChange: async (newData) => {
    try {
      await axiosInstance.post('/excelEditor/save', newData);
      setExcelEditorData(newData);
      localStorage.setItem('excelEditorData', JSON.stringify(newData));
    } catch (error) {
      console.error('Failed to save Excel Editor data:', error);
    }
  },

  clearExcelData: () => {
    setExcelData(null);
    localStorage.removeItem('excelData');
  },

  clearExcelEditorData: () => {
    setExcelEditorData(null);
    localStorage.removeItem('excelEditorData');
  }
});

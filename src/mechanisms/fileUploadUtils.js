import { useState } from 'react';

export const useFileUpload = ({ onIraUploadSuccess, onCcUploadSuccess, onLoading, onError, onSuccess }) => {
  const [uploadProgress, setUploadProgress] = useState({ ira: 0, cc: 0 });

  const handleFileSelect = (event, category) => {
    const file = event.target.files[0];
    if (file) {
      processFileLocally(file, category);
    }
  };

  const handleUpload = (category) => {
    console.log(`Uploading ${category} data...`);
    // Simulate upload logic
    setTimeout(() => {
      if (category === 'ira') {
        onIraUploadSuccess({ message: 'IRA data uploaded successfully' });
      } else if (category === 'cc') {
        onCcUploadSuccess({ message: 'CC data uploaded successfully' });
      }
      onSuccess(`${category.toUpperCase()} data uploaded successfully`);
    }, 1000);
  };

  const processFileLocally = (file, category) => {
    console.log(`Processing ${category} file locally: ${file.name}`);
    onLoading(true);
    setTimeout(() => {
      setUploadProgress((prev) => ({ ...prev, [category]: 100 }));
      onLoading(false);
    }, 2000);
  };

  return {
    handleUpload,
    handleFileSelect,
    uploadProgress,
  };
};

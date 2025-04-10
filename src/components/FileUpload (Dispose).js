/*import React, { useState } from 'react';
import axios from 'axios';

function FileUpload({ onUploadSuccess, onLoading, onError }) {
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!selectedFile) {
      onError('Please select a file first');
      return;
    }
    
    const formData = new FormData();
    formData.append('file', selectedFile);
    
    try {
      onLoading(true);
      
      const response = await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      onUploadSuccess(response.data);
    } catch (error) {
      console.error('Error uploading file:', error);
      onError(error.response?.data?.error || 'Error uploading file');
    }
  };

  return (
    <div className="card file-upload-container">
      <div className="card-body">
        <h5 className="card-title">Upload Excel File</h5>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <input 
              type="file" 
              className="form-control" 
              onChange={handleFileChange}
              accept=".xlsx,.xls,.csv,.xlsb" 
              required
            />
            <div className="form-text">
              Accepted formats: .xlsx, .xls, .csv, .xlsb
            </div>
          </div>
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={!selectedFile}
          >
            Upload and View
          </button>
        </form>
      </div>
    </div>
  );
}

export default FileUpload;*/

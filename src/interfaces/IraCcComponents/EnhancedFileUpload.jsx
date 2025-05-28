import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import '../css/components/EnhancedFileUpload.css';
import { useLanguage } from '../../mechanisms/General/LanguageContext';

function EnhancedFileUpload({ onIraUploadSuccess, onCcUploadSuccess, onLoading, onError, onSuccess, hasIraPowerBi, hasCcPowerBi }) {
  const [dragging, setDragging] = useState(false);
  const [selectedIraFile, setSelectedIraFile] = useState(null);
  const [selectedCcFile, setSelectedCcFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState({ ira: 0, cc: 0 });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [usePowerBi, setUsePowerBi] = useState({ ira: hasIraPowerBi, cc: hasCcPowerBi });
  const [logs, setLogs] = useState([]);
  const [processing, setProcessing] = useState({ ira: false, cc: false });
  
  const iraFileInputRef = useRef(null);
  const ccFileInputRef = useRef(null);
  const logContainerRef = useRef(null);
  const workerRef = useRef(null);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const newLog = { timestamp, message, type };
    setLogs(prevLogs => [...prevLogs, newLog]);
    
    setTimeout(() => {
      if (logContainerRef.current) {
        logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
      }
    }, 100);
  };

  // Initialize Web Worker for file processing
  useEffect(() => {
    if (window.Worker) {
      try {
        workerRef.current = new Worker('/worker.js');
        addLog('Worker initialized successfully', 'success');
        
        workerRef.current.onmessage = (e) => {
          // ...existing worker message handling...
        };
        
        workerRef.current.onerror = (error) => {
          // ...existing worker error handling...
        };
      } catch (error) {
        addLog(`Failed to initialize worker: ${error.message}`, 'error');
        console.error('Error creating worker:', error);
      }
    } else {
      addLog('Web Workers not supported in this browser. Falling back to main thread processing.', 'warning');
    }
    
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  const handleFileSelect = (files) => {
    // Handle multiple files
    for (const file of files) {
      const isIraFile = file.name.toLowerCase().includes('ira');
      const isCcFile = file.name.toLowerCase().includes('cc');
      
      if (isIraFile) {
        setSelectedIraFile(file);
        addLog(`IRA file selected: ${file.name}`, 'info');
      } else if (isCcFile) {
        setSelectedCcFile(file);
        addLog(`CC file selected: ${file.name}`, 'info');
      } else {
        addLog(`Unable to determine file type for: ${file.name}`, 'warning');
      }
    }
  };

  const handleUpload = async (category) => {
    const categoryStr = String(category);
    const file = categoryStr === 'ira' ? selectedIraFile : selectedCcFile;
    
    if (!file) {
      onError(`No ${categoryStr.toUpperCase()} file selected for upload`);
      addLog(`Error: No ${categoryStr.toUpperCase()} file selected`, 'error');
      return;
    }
    
    setProcessing(prev => ({
      ...prev,
      [categoryStr]: true
    }));
    
    addLog(`Starting ${categoryStr.toUpperCase()} file upload: ${file.name}`, 'info');
    onLoading(true);
    
    setUploadProgress(prev => ({ ...prev, [categoryStr]: 0 }));
    
    try {
      await processFileLocally(file, categoryStr);
    } catch (error) {
      // ...existing error handling...
    }
  };

  const processFileLocally = async (file, category) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Get headers and data properly structured
        const headers = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0];
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: headers });

        // Pre-process the data to set %CountComp based on Count Status
        const processedRows = rows.map(row => {
          const updatedRow = { ...row };
          if (category === 'cc' && updatedRow['Count Status'] === 'Counted') {
            updatedRow['%CountComp'] = 1;
          }
          return updatedRow;
        });
        
        const processedData = {
          columns: headers,
          data: processedRows,
          fileType: file.type,
          fileName: file.name,
          isPowerBi: usePowerBi[category]
        };

        // Simulate upload progress
        for (let i = 0; i <= 100; i++) {
          setUploadProgress(prev => ({ ...prev, [category]: i }));
          await new Promise(resolve => setTimeout(resolve, 20));
        }
        
        addLog(`${category.toUpperCase()} file processed successfully`, 'success');
        onSuccess(`${category.toUpperCase()} file uploaded successfully`);

        if (category === 'ira') {
          onIraUploadSuccess(processedData);
        } else {
          onCcUploadSuccess(processedData);
        }
        
        setProcessing(prev => ({
          ...prev,
          [category]: false
        }));
        onLoading(false);
      } catch (error) {
        addLog(`Error processing ${category.toUpperCase()} file: ${error.message}`, 'error');
        onError(`Error processing ${category.toUpperCase()} file: ${error.message}`);
        setProcessing(prev => ({
          ...prev,
          [category]: false
        }));
        onLoading(false);
      }
    };
    reader.onerror = (error) => {
      addLog(`Error reading ${category.toUpperCase()} file: ${error.message}`, 'error');
      onError(`Error reading ${category.toUpperCase()} file: ${error.message}`);
      setProcessing(prev => ({
        ...prev,
        [category]: false
      }));
      onLoading(false);
    };
    reader.readAsArrayBuffer(file);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="upload-container">
          <div className="upload-controls-container">
            <div 
              className={`file-drop-area ${dragging ? 'dragging' : ''}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                handleFileSelect([...e.dataTransfer.files]);
              }}
              onClick={() => document.getElementById('fileInput').click()}
            >
              {selectedIraFile || selectedCcFile ? (
                <div className="selected-files">
                  {selectedIraFile && (
                    <div className="selected-file">
                      <i className="file-icon bi bi-file-earmark-excel"></i>
                      <span className="file-name">{selectedIraFile.name}</span>
                      <button 
                        className="remove-file btn btn-sm btn-outline-danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedIraFile(null);
                        }}
                      >
                        <i className="bi bi-x"></i>
                      </button>
                    </div>
                  )}
                  {selectedCcFile && (
                    <div className="selected-file">
                      <i className="file-icon bi bi-file-earmark-excel"></i>
                      <span className="file-name">{selectedCcFile.name}</span>
                      <button 
                        className="remove-file btn btn-sm btn-outline-danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCcFile(null);
                        }}
                      >
                        <i className="bi bi-x"></i>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="drop-message">
                  <i className="upload-icon bi bi-cloud-upload"></i>
                  <p className="upload-text">Drag & drop your IRA and CC Excel files here<br/>or click to browse</p>
                  <small className="upload-hint text-muted">Files should contain "IRA" or "CC" in their names</small>
                </div>
              )}
              <input 
                id="fileInput"
                type="file"
                className="file-input"
                multiple
                accept=".xlsx,.xls,.csv,.xlsb"
                onChange={(e) => handleFileSelect([...e.target.files])}
              />
            </div>
          </div>

          <div className="upload-button-container">
            <button
              type="button"
              className="btn btn-dark px-4"
              disabled={(!selectedIraFile && !selectedCcFile) || processing.ira || processing.cc}
              onClick={() => {
                if (selectedIraFile) handleUpload('ira');
                if (selectedCcFile) handleUpload('cc');
              }}
            >
              {(processing.ira || processing.cc) ? (
                <>
                  <span className="spinner-border spinner-border-sm"></span>
                  <span className="ms-2">Processing...</span>
                </>
              ) : (
                <>
                  <i className="bi bi-upload"></i>
                  <span className="ms-2">Upload Files</span>
                </>
              )}
            </button>
          </div>

          {/* Progress bars */}
          {uploadProgress.ira > 0 && (
            <div className="progress-wrapper">
              <div className="progress">
                <div 
                  className="progress-bar progress-bar-striped progress-bar-animated"
                  style={{width: `${uploadProgress.ira}%`}}
                  role="progressbar"
                  aria-valuenow={uploadProgress.ira} 
                  aria-valuemin="0" 
                  aria-valuemax="100"
                >
                  IRA: {uploadProgress.ira}%
                </div>
              </div>
            </div>
          )}
          
          {uploadProgress.cc > 0 && (
            <div className="progress-wrapper">
              <div className="progress">
                <div 
                  className="progress-bar progress-bar-striped progress-bar-animated"
                  style={{width: `${uploadProgress.cc}%`}}
                  role="progressbar"
                  aria-valuenow={uploadProgress.cc} 
                  aria-valuemin="0" 
                  aria-valuemax="100"
                >
                  CC: {uploadProgress.cc}%
                </div>
              </div>
            </div>
          )}
    </div>
  );
}

export default EnhancedFileUpload;
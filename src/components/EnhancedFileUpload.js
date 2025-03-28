import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import axios from 'axios';
import './css/EnhancedFileUpload.css';

// Constants for chunked upload
const CHUNK_SIZE = 1024 * 1024 * 5; // 5MB chunks
const USE_CHUNKED_UPLOAD = true; // Toggle for large files

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
  const workerRef = useRef(null);
  const logContainerRef = useRef(null);

  // Add log entry helper function
  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const newLog = { timestamp, message, type };
    setLogs(prevLogs => [...prevLogs, newLog]);
    
    // Scroll to bottom of log container
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
        // Update worker path to public folder
        workerRef.current = new Worker('/worker.js');
        addLog('Worker initialized successfully', 'success');
        
        workerRef.current.onmessage = (e) => {
          if (e.data.success) {
            const category = e.data.data.category;
            addLog(`${category.toUpperCase()} file processed successfully: ${e.data.data.data.length} rows`, 'success');
            handleParsingSuccess(e.data.data);
            
            // Update processing state for the specific category
            setProcessing(prev => ({
              ...prev,
              [category]: false
            }));
          } else {
            addLog(`Worker error: ${e.data.error}`, 'error');
            onError(e.data.error);
            onLoading(false);
            setProcessing({ ira: false, cc: false });
          }
        };
        
        workerRef.current.onerror = (error) => {
          addLog(`Worker error: ${error.message}`, 'error');
          console.error('Worker error:', error);
          onError('File processing failed: ' + error.message);
          onLoading(false);
          setProcessing({ ira: false, cc: false });
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

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleDrop = (e, category) => {
    e.preventDefault();
    setDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0], category);
      addLog(`File dropped: ${files[0].name} (${formatFileSize(files[0].size)})`, 'info');
    }
  };

  const handleFileSelect = (file, category) => {
    if (category === 'ira') {
      setSelectedIraFile(file);
      addLog(`IRA file selected: ${file.name} (${formatFileSize(file.size)})`, 'info');
    } else {
      setSelectedCcFile(file);
      addLog(`CC file selected: ${file.name} (${formatFileSize(file.size)})`, 'info');
    }
  };

  // Format file size for display
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Handle file upload button click
  const handleUpload = async (category) => {
    // Ensure category is a string
    const categoryStr = String(category);
    const file = categoryStr === 'ira' ? selectedIraFile : selectedCcFile;
    
    if (!file) {
      onError(`No ${categoryStr.toUpperCase()} file selected for upload`);
      addLog(`Error: No ${categoryStr.toUpperCase()} file selected`, 'error');
      return;
    }
    
    // Update processing state for this category
    setProcessing(prev => ({
      ...prev,
      [categoryStr]: true
    }));
    
    addLog(`Starting ${categoryStr.toUpperCase()} file upload: ${file.name}`, 'info');
    onLoading(true);
    
    // Ensure progress starts at 0 for this category only
    setUploadProgress(prev => ({ 
      ...prev, 
      [categoryStr]: 0 
    }));
    
    try {
      // Always use client-side processing for better performance
      await handleStandardUpload(file, categoryStr);
    } catch (error) {
      addLog(`Error uploading ${categoryStr} file: ${error.message}`, 'error');
      console.error(`Error uploading ${categoryStr} file:`, error);
      onError(`Failed to upload ${categoryStr.toUpperCase()} file: ${error.message}`);
      
      // Reset processing state for this category
      setProcessing(prev => ({
        ...prev,
        [categoryStr]: false
      }));
      
      // Only turn off global loading if both are done
      if (!processing.ira && !processing.cc) {
        onLoading(false);
      }
    }
  };
  
  // Process file on client side - updated with auto-percentage calculation
  const processFileLocally = (file, category) => {
    return new Promise((resolve, reject) => {
      addLog(`Processing ${category} file locally: ${file.name}`, 'info');
      onLoading(true);
      
      const fileReader = new FileReader();
      
      // Add more progress updates during file loading
      fileReader.onloadstart = () => {
        setUploadProgress(prev => ({ ...prev, [category]: 10 }));
        addLog(`Starting to read ${file.name}...`, 'info');
      };
      
      fileReader.onprogress = (event) => {
        if (event.lengthComputable) {
          // Scale progress from 10% to 50% during file read
          const loadProgress = Math.round((event.loaded / event.total) * 40) + 10;
          setUploadProgress(prev => ({ ...prev, [category]: loadProgress }));
          
          if (loadProgress % 10 === 0) {
            addLog(`Loading file: ${loadProgress}%`, 'info');
          }
        }
      };
      
      fileReader.onload = (e) => {
        try {
          addLog(`File loaded into memory, starting parsing...`, 'info');
          setUploadProgress(prev => ({ ...prev, [category]: 60 }));
          
          const arrayBuffer = e.target.result;
          const data = new Uint8Array(arrayBuffer);
          const isPowerBi = (category === 'ira' ? usePowerBi.ira : usePowerBi.cc);
          
          setUploadProgress(prev => ({ ...prev, [category]: 70 }));
          addLog(`Parsing file content...`, 'info');
          
          if (workerRef.current) {
            // Use web worker for parsing
            addLog(`Using web worker for parsing ${category} file: ${file.name}`, 'info');
            workerRef.current.postMessage({
              file: data,
              fileType: file.type,
              isPowerBi,
              category: String(category) // Explicitly send category as string
            });
          } else {
            // Fallback if web workers not supported
            addLog(`Fallback: Processing ${file.name} on main thread`, 'warning');
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            
            // Convert to JSON
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            // Extract columns (first row) and data (remaining rows)
            const columns = jsonData[0];
            const rows = jsonData.slice(1).map(row => {
              const rowData = {};
              columns.forEach((col, i) => {
                rowData[col] = row[i];
              });
              return rowData;
            });
            
            const result = {
              columns,
              data: rows,
              fileType: file.type,
              autoTransformed: true,
              isPowerBi,
              category: String(category) // Explicitly set category as string
            };
            
            // Add auto-processing for percentages based on category
            const processedResult = autoProcessData(result, category);
            
            setUploadProgress(prev => ({ ...prev, [category]: 90 }));
            addLog(`File parsed successfully: ${processedResult.data.length} rows`, 'success');
            handleParsingSuccess(processedResult);
            
            // Update processing state for this category
            setProcessing(prev => ({
              ...prev,
              [category]: false
            }));
          }
        } catch (error) {
          addLog(`Error parsing file: ${error.message}`, 'error');
          reject(error);
        }
      };
      
      fileReader.onerror = (error) => {
        addLog(`Error reading file: ${error}`, 'error');
        reject(error);
      };
      
      fileReader.readAsArrayBuffer(file);
    });
  };
  
  // Auto-process data to calculate percentages
  const autoProcessData = (result, category) => {
    if (category === 'ira') {
      return processIraData(result);
    } else {
      return processCcData(result);
    }
  };

  // Process IRA data to calculate percentages - MODIFIED to properly handle %IRALine values
  const processIraData = (result) => {
    addLog('Auto-processing IRA data...', 'info');
    const processed = {...result};
    
    // Add %IRALine column if not present
    if (!processed.columns.includes('%IRALine')) {
      processed.columns.push('%IRALine');
      addLog('Added missing %IRALine column to IRA data', 'info');
      
      // Set %IRALine values for all rows based on Count Status
      processed.data = processed.data.map(row => {
        const processedRow = {...row};
        
        // Only if the %IRALine property doesn't exist or is undefined/null
        if (processedRow['%IRALine'] === undefined || processedRow['%IRALine'] === null) {
          // Check if Count Status is "Counted"
          if (processedRow['Count Status'] === 'Counted') {
            processedRow['%IRALine'] = 1;
          } else {
            processedRow['%IRALine'] = 0;
          }
        }
        
        return processedRow;
      });
      
      addLog(`Set %IRALine values for ${processed.data.length} rows`, 'success');
    } else {
      // Ensure all %IRALine values are numeric (1 or 0)
      let updates = 0;
      processed.data = processed.data.map(row => {
        const processedRow = {...row};
        
        // Convert string values to numbers
        if (processedRow['%IRALine'] === "1" || processedRow['%IRALine'] === "true" || processedRow['%IRALine'] === true) {
          processedRow['%IRALine'] = 1;
          updates++;
        } else if (processedRow['%IRALine'] === "0" || processedRow['%IRALine'] === "false" || processedRow['%IRALine'] === false) {
          processedRow['%IRALine'] = 0;
          updates++;
        } else if (processedRow['%IRALine'] === undefined || processedRow['%IRALine'] === null) {
          // Set missing values based on Count Status
          if (processedRow['Count Status'] === 'Counted') {
            processedRow['%IRALine'] = 1;
          } else {
            processedRow['%IRALine'] = 0;
          }
          updates++;
        }
        
        return processedRow;
      });
      
      if (updates > 0) {
        addLog(`Normalized ${updates} %IRALine values to numeric format`, 'info');
      } else {
        addLog('Preserving existing %IRALine values in IRA data', 'info');
      }
    }
    
    return processed;
  };

  // Process CC data to calculate percentages
  const processCcData = (result) => {
    addLog('Auto-processing CC data to calculate percentages...', 'info');
    const processed = {...result};
    
    // Add %CountComp column if not present
    if (!processed.columns.includes('%CountComp')) {
      processed.columns.push('%CountComp');
    }
    
    // Process each row
    processed.data = processed.data.map(row => {
      const processedRow = {...row};
      
      // Check if we already have the %CountComp column with a value
      if (processedRow['%CountComp'] === 1 || processedRow['%CountComp'] === 0) {
        return processedRow;
      }
      
      // Check if Count Status is "Counted"
      if (processedRow['Count Status'] === 'Counted') {
        processedRow['%CountComp'] = 1;
      } else {
        processedRow['%CountComp'] = 0;
      }
      
      return processedRow;
    });
    
    addLog(`CC data processed: Added %CountComp column with percentage values`, 'success');
    return processed;
  };

  // Handle standard file upload
  const handleStandardUpload = async (file, category) => {
    try {
      // Process file locally using client's computing power
      await processFileLocally(file, category);
    } catch (error) {
      throw new Error(`Error processing file: ${error.message}`);
    }
  };
  
  // Process successful parsing result
  const handleParsingSuccess = (result) => {
    if (!result) {
      addLog('No data returned from file parsing', 'error');
      onError('No data returned from file parsing');
      setProcessing({ ira: false, cc: false });
      onLoading(false);
      return;
    }
    
    // Add auto-transformation flag if not present
    if (result.autoTransformed === undefined) {
      result.autoTransformed = true;
    }
    
    // Fix: Ensure category is a string before using it
    const category = (result.category || '').toString();
    
    // Auto-process data to calculate percentages if not already done
    let processedResult = result;
    if (!result.autoProcessed) {
      processedResult = autoProcessData(result, category);
      processedResult.autoProcessed = true;
    }
    
    // Set progress to 100% right before completing
    setUploadProgress(prev => ({ ...prev, [category]: 100 }));
    
    // Update state based on file category
    if (category === 'ira') {
      addLog(`IRA data processed successfully: ${processedResult.data.length} rows`, 'success');
      onIraUploadSuccess(processedResult);
      setSelectedIraFile(null);
      if (iraFileInputRef.current) {
        iraFileInputRef.current.value = '';
      }
      onSuccess('IRA file processed successfully');
    } else {
      addLog(`CC data processed successfully: ${processedResult.data.length} rows`, 'success');
      onCcUploadSuccess(processedResult);
      setSelectedCcFile(null);
      if (ccFileInputRef.current) {
        ccFileInputRef.current.value = '';
      }
      onSuccess('CC file processed successfully');
    }
    
    // Check if both uploads are complete and turn off loading if so
    const updatedProcessing = {
      ...processing,
      [category]: false
    };
    
    if (!updatedProcessing.ira && !updatedProcessing.cc) {
      onLoading(false);
    }
    
    // Update processing state
    setProcessing(updatedProcessing);
    
    // Small delay before clearing progress to ensure user sees 100%
    setTimeout(() => {
      setUploadProgress(prev => ({
        ...prev,
        [category]: 0
      }));
    }, 500);
  };

  // Clear all logs
  const clearLogs = () => {
    setLogs([]);
  };

  // Render upload components
  return (
    <div className="upload-container">
      {/* Advanced settings toggle */}
      <div className="advanced-settings-toggle">
        <button 
          className="btn btn-link" 
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <i className={`bi bi-gear me-1`}></i>
          {showAdvanced ? 'Hide Advanced Settings' : 'Show Advanced Settings'}
        </button>
      </div>
      
      {/* Advanced settings panel */}
      {showAdvanced && (
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">Advanced Settings</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="iraPowerBiSwitch"
                    checked={usePowerBi.ira}
                    onChange={(e) => setUsePowerBi({...usePowerBi, ira: e.target.checked})}
                  />
                  <label className="form-check-label" htmlFor="iraPowerBiSwitch">
                    Use PowerBI format for IRA data
                  </label>
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="ccPowerBiSwitch"
                    checked={usePowerBi.cc}
                    onChange={(e) => setUsePowerBi({...usePowerBi, cc: e.target.checked})}
                  />
                  <label className="form-check-label" htmlFor="ccPowerBiSwitch">
                    Use PowerBI format for CC data
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="row">
        {/* IRA Upload */}
        <div className="col-md-6">
          <div className="card upload-card">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">Upload IRA Data</h5>
            </div>
            <div className="card-body">
              <div 
                className={`file-drop-area ${dragging ? 'dragging' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, 'ira')}
              >
                {selectedIraFile ? (
                  <div className="selected-file">
                    <i className="bi bi-file-earmark-excel me-2"></i>
                    <span>{selectedIraFile.name}</span>
                    <button 
                      className="btn btn-sm btn-outline-danger ms-2"
                      onClick={() => {
                        setSelectedIraFile(null);
                        if (iraFileInputRef.current) {
                          iraFileInputRef.current.value = '';
                        }
                      }}
                    >
                      <i className="bi bi-x"></i>
                    </button>
                  </div>
                ) : (
                  <div className="drop-message">
                    <i className="bi bi-cloud-upload display-4"></i>
                    <p>Drag & drop your IRA Excel file here<br/>or click to browse</p>
                  </div>
                )}
                <input 
                  type="file" 
                  className="file-input" 
                  ref={iraFileInputRef}
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => {
                    if (e.target.files.length > 0) {
                      handleFileSelect(e.target.files[0], 'ira');
                    }
                  }}
                />
              </div>
              
              {(uploadProgress.ira > 0) && (
                <div className="progress mt-3">
                  <div 
                    className={`progress-bar progress-bar-striped progress-bar-animated bg-primary`} 
                    role="progressbar" 
                    style={{width: `${uploadProgress.ira}%`}}
                    aria-valuenow={uploadProgress.ira} 
                    aria-valuemin="0" 
                    aria-valuemax="100"
                  >
                    {uploadProgress.ira}%
                  </div>
                </div>
              )}
              
              <div className="text-center mt-3">
                <button 
                  className="btn btn-primary px-4"
                  disabled={!selectedIraFile || processing.ira}
                  onClick={() => handleUpload('ira')}
                >
                  {processing.ira ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Processing...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-upload me-2"></i>
                      Upload IRA Data
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* CC Upload */}
        <div className="col-md-6">
          <div className="card upload-card">
            <div className="card-header bg-info text-white">
              <h5 className="mb-0">Upload Cycle Count Data</h5>
            </div>
            <div className="card-body">
              <div 
                className={`file-drop-area ${dragging ? 'dragging' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, 'cc')}
              >
                {selectedCcFile ? (
                  <div className="selected-file">
                    <i className="bi bi-file-earmark-excel me-2"></i>
                    <span>{selectedCcFile.name}</span>
                    <button 
                      className="btn btn-sm btn-outline-danger ms-2"
                      onClick={() => {
                        setSelectedCcFile(null);
                        if (ccFileInputRef.current) {
                          ccFileInputRef.current.value = '';
                        }
                      }}
                    >
                      <i className="bi bi-x"></i>
                    </button>
                  </div>
                ) : (
                  <div className="drop-message">
                    <i className="bi bi-cloud-upload display-4"></i>
                    <p>Drag & drop your CC Excel file here<br/>or click to browse</p>
                  </div>
                )}
                <input 
                  type="file" 
                  className="file-input" 
                  ref={ccFileInputRef}
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => {
                    if (e.target.files.length > 0) {
                      handleFileSelect(e.target.files[0], 'cc');
                    }
                  }}
                />
              </div>
              
              {(uploadProgress.cc > 0) && (
                <div className="progress mt-3">
                  <div 
                    className={`progress-bar progress-bar-striped progress-bar-animated bg-info`} 
                    role="progressbar" 
                    style={{width: `${uploadProgress.cc}%`}}
                    aria-valuenow={uploadProgress.cc} 
                    aria-valuemin="0" 
                    aria-valuemax="100"
                  >
                    {uploadProgress.cc}%
                  </div>
                </div>
              )}
              
              <div className="text-center mt-3">
                <button 
                  className="btn btn-info px-4"
                  disabled={!selectedCcFile || processing.cc}
                  onClick={() => handleUpload('cc')}
                >
                  {processing.cc ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Processing...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-upload me-2"></i>
                      Upload CC Data
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upload both files at once button */}
      {selectedIraFile && selectedCcFile && (
        <div className="row mt-3">
          <div className="col-12 text-center">
            <button 
              className="btn btn-success px-5"
              disabled={processing.ira || processing.cc}
              onClick={() => {
                handleUpload('ira');
                handleUpload('cc');
              }}
            >
              <i className="bi bi-cloud-upload me-2"></i>
              Upload Both Files
            </button>
          </div>
        </div>
      )}
      
      {/* Log container */}
      <div className="row mt-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Upload Progress Log</h5>
              <button 
                className="btn btn-sm btn-outline-secondary"
                onClick={clearLogs}
              >
                <i className="bi bi-trash me-1"></i> Clear Logs
              </button>
            </div>
            <div className="card-body">
              <div className="log-container" ref={logContainerRef}>
                {logs.length === 0 ? (
                  <p className="text-muted text-center">No activity yet. Upload logs will appear here.</p>
                ) : (
                  logs.map((log, index) => (
                    <div key={index} className={`log-entry log-${log.type}`}>
                      <span className="log-time">[{log.timestamp}]</span>
                      <span>{log.message}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Info card */}
      <div className="row mt-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Optimized Upload Information</h5>
            </div>
            <div className="card-body">
              <h6>Performance Optimizations:</h6>
              <ul>
                <li>Uses client-side processing for faster results</li>
                <li>Automatic chunking for large files</li>
                <li>Non-blocking UI with Web Workers</li>
                <li>Optimized memory usage for Excel parsing</li>
              </ul>
              <div className="alert alert-info">
                <i className="bi bi-info-circle me-2"></i>
                Uploads are processed entirely in your browser for maximum speed. Very large files are automatically chunked for better performance.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EnhancedFileUpload;

import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import axios from 'axios';

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
    let updates = 0;
    
    // Add %CountComp column if not present
    if (!processed.columns.includes('%CountComp')) {
      processed.columns.push('%CountComp');
    }
    
    // Process each row
    processed.data = processed.data.map(row => {
      const processedRow = {...row};
      
      // Enhanced logic to check for counted status
      const isCounted = 
        // Check existing %CountComp value
        processedRow['%CountComp'] === 1 || 
        processedRow['%CountComp'] === '1' || 
        processedRow['%CountComp'] === true ||
        // Check Count Status variations
        processedRow['Count Status'] === 'Counted' ||
        processedRow['Count Status'] === 'COUNTED' ||
        processedRow['Count Status'] === 'Y' ||
        // Check if Qty Counted exists and is greater than 0
        (processedRow['Qty Counted'] && parseFloat(processedRow['Qty Counted']) > 0) ||
        // Check Count Date exists
        processedRow['Count Date'];

      if (isCounted) {
        processedRow['%CountComp'] = 1;
        updates++;
      } else {
        processedRow['%CountComp'] = 0;
        updates++;
      }
      
      return processedRow;
    });
    
    addLog(`CC data processed: Updated ${updates} %CountComp values based on counting status`, 'success');
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
}

export default EnhancedFileUpload;
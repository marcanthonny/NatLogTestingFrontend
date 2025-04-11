import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';

function ExcelUploader({ onUploadSuccess, onError, onLoading }) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processing, setProcessing] = useState(false);

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    if (!file.name.match(/\.(xlsx|xls|xlsb|csv)$/)) {
      onError('Please upload a valid Excel (XLSX, XLS, XLSB) or CSV file');
      return;
    }

    try {
      setProcessing(true);
      onLoading(true);
      const reader = new FileReader();

      reader.onprogress = (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(progress);
        }
      };

      reader.onload = async (e) => {
        try {
          setUploadProgress(100);
          const data = e.target.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          const columns = jsonData[0];
          const rows = jsonData.slice(1).map((row) => {
            const rowData = {};
            columns.forEach((col, i) => {
              rowData[col] = row[i];
            });
            return rowData;
          });

          onUploadSuccess({
            columns,
            data: rows,
            filename: file.name,
          });
        } catch (err) {
          onError('Error processing file: ' + err.message);
        } finally {
          setProcessing(false);
          onLoading(false);
          setTimeout(() => setUploadProgress(0), 1000);
        }
      };

      reader.onerror = (err) => {
        setProcessing(false);
        onError('Error reading file: ' + err.message);
        onLoading(false);
        setUploadProgress(0);
      };

      reader.readAsBinaryString(file);
    } catch (err) {
      setProcessing(false);
      onError('Error reading file: ' + err.message);
      onLoading(false);
      setUploadProgress(0);
    }
  }, [onUploadSuccess, onError, onLoading]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.ms-excel.sheet.binary.macroEnabled.12': ['.xlsb'],
      'text/csv': ['.csv']
    }
  });

  return (
    <div className="excel-uploader">
      <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
        <input {...getInputProps()} />
        <i className="bi bi-file-earmark-spreadsheet"></i>
        <p>Drop an Excel file here, or click to select</p>
        <small className="text-muted">Supports .xlsx, .xls, .xlsb and .csv files</small>
      </div>
      {(uploadProgress > 0 || processing) && (
        <div className="mt-4">
          <div className="progress">
            <div 
              className="progress-bar progress-bar-striped progress-bar-animated"
              role="progressbar"
              style={{ width: `${uploadProgress}%` }}
              aria-valuenow={uploadProgress}
              aria-valuemin="0"
              aria-valuemax="100"
            >
              {processing && uploadProgress === 100 ? 'Processing...' : `${uploadProgress}%`}
            </div>
          </div>
          <small className="text-muted d-block text-center mt-2">
            {processing && uploadProgress === 100 ? 'Processing Excel file...' : 'Uploading file...'}
          </small>
        </div>
      )}
    </div>
  );
}

export default ExcelUploader;

importScripts('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js');

self.onmessage = function(e) {
  const { file, fileType, sheetIndex, isPowerBi, category } = e.data;
  
  try {
    // Parse the workbook
    const workbook = XLSX.read(file, { type: 'binary' });
    
    // Get the sheet names
    const sheetNames = workbook.SheetNames;
    
    // Use the specified sheet or the first one
    const sheet = workbook.Sheets[sheetNames[sheetIndex || 0]];
    
    // Convert to array of objects
    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });
    
    // Get header row (first row)
    const headers = jsonData[0];
    
    // Process data rows
    const rows = [];
    for (let i = 1; i < jsonData.length; i++) {
      const row = {};
      for (let j = 0; j < headers.length; j++) {
        if (headers[j]) { // Skip empty headers
          row[headers[j]] = jsonData[i][j];
        }
      }
      rows.push(row);
    }
    
    // Send the parsed data back to the main thread
    self.postMessage({
      success: true,
      data: {
        columns: headers,
        data: rows,
        fileType,
        isPowerBi,
        category: String(category || '') // Ensure category is a string
      }
    });
  } catch (error) {
    self.postMessage({
      success: false,
      error: error.message
    });
  }
};

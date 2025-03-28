importScripts('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js');

self.onmessage = function(e) {
  const { file, fileType, sheetIndex, isPowerBi, category } = e.data;
  
  try {
    // Convert Uint8Array to binary string
    let binaryString = '';
    const bytes = new Uint8Array(file);
    for (let i = 0; i < bytes.byteLength; i++) {
      binaryString += String.fromCharCode(bytes[i]);
    }
    
    // Parse the workbook using the binary string
    const workbook = XLSX.read(binaryString, { type: 'binary' });
    
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

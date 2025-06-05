// Google Apps Script code cho feedback system - Improved Version
function doPost(e) {
  try {
    console.log('📥 Received POST request');
    console.log('📄 Content Type:', e.postData.type);
    console.log('📄 Post Data:', e.postData.contents);
    
    let data;
    
    // Handle different content types
    if (e.postData.type === 'application/json') {
      // JSON data từ fetch/XHR
      data = JSON.parse(e.postData.contents);
      console.log('✅ Parsed JSON data:', data);
    } else if (e.postData.type === 'application/x-www-form-urlencoded' || e.postData.type === 'multipart/form-data') {
      // Form data từ sendBeacon hoặc form submission
      data = {
        timestamp: e.parameter.timestamp,
        messageText: e.parameter.messageText,
        feedbackType: e.parameter.feedbackType,
        messageIndex: e.parameter.messageIndex,
        userAgent: e.parameter.userAgent,
        url: e.parameter.url
      };
      console.log('✅ Parsed form data:', data);
    } else {
      // Fallback: try to parse as JSON first, then use parameters
      try {
        data = JSON.parse(e.postData.contents);
      } catch (parseError) {
        data = {
          timestamp: e.parameter.timestamp,
          messageText: e.parameter.messageText,
          feedbackType: e.parameter.feedbackType,
          messageIndex: e.parameter.messageIndex,
          userAgent: e.parameter.userAgent,
          url: e.parameter.url
        };
      }
      console.log('✅ Fallback parsed data:', data);
    }
    
    // Save to spreadsheet
    const result = saveToSpreadsheet(data);
    
    // Return success response với CORS headers
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: 'Feedback saved successfully via POST',
        method: 'POST',
        contentType: e.postData.type,
        timestamp: new Date().toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400'
      });
      
  } catch (error) {
    console.error('❌ Error in doPost:', error);
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString(),
        method: 'POST',
        timestamp: new Date().toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      });
  }
}

function doGet(e) {
  try {
    console.log('📥 Received GET request');
    console.log('📄 Parameters:', e.parameter);
    
    const callback = e.parameter.callback;
    
    // Check if this is feedback data
    if (e.parameter.feedbackType) {
      // This is feedback data từ JSONP hoặc Image beacon
      const data = {
        timestamp: e.parameter.timestamp || new Date().toISOString(),
        messageText: e.parameter.messageText || 'No message',
        feedbackType: e.parameter.feedbackType || 'unknown',
        messageIndex: e.parameter.messageIndex || 0,
        userAgent: e.parameter.userAgent || 'Unknown browser',
        url: e.parameter.url || 'Unknown URL'
      };
      
      console.log('✅ Processing feedback data:', data);
      
      // Save to spreadsheet
      const result = saveToSpreadsheet(data);
      
      const response = {
        success: true,
        message: 'Feedback saved successfully via GET',
        method: 'GET',
        timestamp: new Date().toISOString()
      };
      
      // If callback provided, return JSONP response
      if (callback) {
        console.log('📤 Returning JSONP response');
        return ContentService
          .createTextOutput(`${callback}(${JSON.stringify(response)})`)
          .setMimeType(ContentService.MimeType.JAVASCRIPT);
      } else {
        // Regular JSON response hoặc Image beacon (return 1x1 pixel)
        if (e.parameter.format === 'image') {
          console.log('📤 Returning 1x1 pixel image');
          // Return 1x1 transparent pixel for image beacon
          return Utilities.newBlob(
            Utilities.base64Decode('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'),
            'image/gif'
          );
        } else {
          console.log('📤 Returning JSON response');
          return ContentService
            .createTextOutput(JSON.stringify(response))
            .setMimeType(ContentService.MimeType.JSON)
            .setHeaders({
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type'
            });
        }
      }
    } else {
      // This is a test/debugging request
      const response = {
        success: true,
        message: 'Google Apps Script is working!',
        timestamp: new Date().toISOString(),
        parameters: e.parameter,
        availableMethods: ['GET', 'POST', 'JSONP', 'Image Beacon']
      };
      
      if (callback) {
        return ContentService
          .createTextOutput(`${callback}(${JSON.stringify(response)})`)
          .setMimeType(ContentService.MimeType.JAVASCRIPT);
      } else {
        return ContentService
          .createTextOutput(JSON.stringify(response))
          .setMimeType(ContentService.MimeType.JSON)
          .setHeaders({
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
          });
      }
    }
    
  } catch (error) {
    console.error('❌ Error in doGet:', error);
    
    const errorResponse = {
      success: false,
      error: error.toString(),
      method: 'GET',
      timestamp: new Date().toISOString()
    };
    
    const callback = e.parameter.callback;
    
    if (callback) {
      return ContentService
        .createTextOutput(`${callback}(${JSON.stringify(errorResponse)})`)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    } else {
      if (e.parameter.format === 'image') {
        // Return 1x1 red pixel để indicate error
        return Utilities.newBlob(
          Utilities.base64Decode('R0lGODlhAQABAIAAAP8AAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'),
          'image/gif'
        );
      } else {
        return ContentService
          .createTextOutput(JSON.stringify(errorResponse))
          .setMimeType(ContentService.MimeType.JSON)
          .setHeaders({
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
          });
      }
    }
  }
}

function doOptions(e) {
  // Handle preflight CORS requests
  console.log('📥 Received OPTIONS request (CORS preflight)');
  
  return ContentService
    .createTextOutput('')
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    });
}

// Helper function để save data vào spreadsheet
function saveToSpreadsheet(data) {
  try {
    // ⚠️ QUAN TRỌNG: Thay thế bằng ID thực của Google Sheets
    const spreadsheetId = "YOUR_SPREADSHEET_ID_HERE"; 
    
    const sheet = SpreadsheetApp.openById(spreadsheetId).getActiveSheet();
    
    // Prepare the data row
    const row = [
      new Date(), // Created Date
      data.timestamp || new Date().toISOString(),
      data.messageText || '',
      data.feedbackType || '',
      data.messageIndex || '',
      data.userAgent || '',
      data.url || ''
    ];
    
    // Add the row to the sheet
    sheet.appendRow(row);
    
    console.log('✅ Data saved to spreadsheet:', row);
    
    return {
      success: true,
      rowsAdded: 1
    };
    
  } catch (error) {
    console.error('❌ Error saving to spreadsheet:', error);
    throw error;
  }
}

// Test function - có thể call manually để test
function testFunction() {
  const testData = {
    timestamp: new Date().toISOString(),
    messageText: 'Test message',
    feedbackType: 'positive',
    messageIndex: 999,
    userAgent: 'Test User Agent',
    url: 'https://test.com'
  };
  
  console.log('🧪 Testing saveToSpreadsheet function...');
  const result = saveToSpreadsheet(testData);
  console.log('✅ Test result:', result);
  
  return result;
} 
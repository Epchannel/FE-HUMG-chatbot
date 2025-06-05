# 📊 Hướng dẫn Setup Google Sheets để Thu thập Feedback

## Bước 1: Tạo Google Sheets

1. Truy cập [Google Sheets](https://sheets.google.com)
2. Tạo một sheet mới với tên "Chatbot Feedback"
3. Tạo header row với các cột sau:
   ```
   A1: Timestamp
   B1: Message Text
   C1: Feedback Type
   D1: Message Index
   E1: User Agent
   F1: URL
   ```

## Bước 2: Tạo Google Apps Script

1. Trong Google Sheets, vào **Extensions** → **Apps Script**
2. Xóa code mặc định và paste code sau:

```javascript
function doPost(e) {
  try {
    let data;
    
    // Handle both JSON and form data
    if (e.postData.type === 'application/json') {
      // JSON data từ fetch/XHR
      data = JSON.parse(e.postData.contents);
    } else {
      // Form data từ form submission
      data = {
        timestamp: e.parameter.timestamp,
        messageText: e.parameter.messageText,
        feedbackType: e.parameter.feedbackType,
        messageIndex: e.parameter.messageIndex,
        userAgent: e.parameter.userAgent,
        url: e.parameter.url
      };
    }
    
    // Mở Google Sheets (thay SHEET_ID bằng ID của sheet bạn)
    const sheet = SpreadsheetApp.openById('YOUR_SHEET_ID_HERE').getActiveSheet();
    
    // Thêm dữ liệu vào sheet
    sheet.appendRow([
      data.timestamp || new Date().toISOString(),
      data.messageText || 'No message',
      data.feedbackType || 'unknown',
      data.messageIndex || 0,
      data.userAgent || 'Unknown browser',
      data.url || 'Unknown URL'
    ]);
    
    // Log để debug
    console.log('Feedback saved:', data);
    
    // Trả về response thành công
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'success',
        message: 'Feedback saved successfully',
        method: e.postData.type || 'form'
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    // Log error để debug
    console.error('Error saving feedback:', error);
    
    // Trả về error
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'error',
        message: error.toString(),
        debug: {
          postDataType: e.postData ? e.postData.type : 'no postData',
          hasParameters: !!e.parameter
        }
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    // Handle GET requests (for image beacon and debugging)
    if (e.parameter.feedbackType) {
      // This is feedback data từ image beacon
      const data = {
        timestamp: e.parameter.timestamp || new Date().toISOString(),
        messageText: e.parameter.messageText || 'No message',
        feedbackType: e.parameter.feedbackType || 'unknown',
        messageIndex: e.parameter.messageIndex || 0,
        userAgent: e.parameter.userAgent || 'Unknown browser',
        url: e.parameter.url || 'Unknown URL'
      };
      
      // Mở Google Sheets
      const sheet = SpreadsheetApp.openById('YOUR_SHEET_ID_HERE').getActiveSheet();
      
      // Thêm dữ liệu vào sheet
      sheet.appendRow([
        data.timestamp,
        data.messageText,
        data.feedbackType,
        data.messageIndex,
        data.userAgent,
        data.url
      ]);
      
      console.log('Feedback saved via GET:', data);
      
      // Return 1x1 transparent pixel
      return Utilities.newBlob(
        Utilities.base64Decode('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'),
        'image/gif'
      );
    } else {
      // Debugging endpoint
      return ContentService
        .createTextOutput(JSON.stringify({
          status: 'success',
          message: 'Apps Script is working!',
          timestamp: new Date().toISOString(),
          parameters: e.parameter
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    console.error('Error in doGet:', error);
    // Return 1x1 red pixel để indicate error
    return Utilities.newBlob(
      Utilities.base64Decode('R0lGODlhAQABAIAAAP8AAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'),
      'image/gif'
    );
  }
}

function doOptions(e) {
  // Handle preflight requests for CORS
  return ContentService
    .createTextOutput("")
    .setMimeType(ContentService.MimeType.JSON);
}
```

## Bước 3: Lấy Sheet ID

1. Trong URL của Google Sheets, copy phần ID:
   ```
   https://docs.google.com/spreadsheets/d/[SHEET_ID_HERE]/edit
   ```
2. Thay thế `YOUR_SHEET_ID_HERE` trong code Apps Script bằng Sheet ID này

## Bước 4: Deploy Apps Script

1. Click **Deploy** → **New deployment**
2. Chọn type: **Web app**
3. Execute as: **Me**
4. Who has access: **Anyone** (quan trọng: phải chọn Anyone!)
5. Click **Deploy**
6. **Authorize permissions** khi được yêu cầu
7. Copy **Web app URL** - đây là URL bạn cần

### ⚠️ Lưu ý quan trọng về CORS:
- Nếu bạn update code Apps Script, phải **Deploy → New deployment** chứ không phải **Manage deployments**
- Đảm bảo chọn **Anyone** trong "Who has access"
- Test URL bằng cách mở trực tiếp trong browser (sẽ thấy response JSON)

## Bước 5: Cập nhật React Code

1. Mở file `src/components/ChatBot.jsx`
2. Tìm dòng:
   ```javascript
   const GOOGLE_SCRIPT_URL = "YOUR_GOOGLE_APPS_SCRIPT_URL_HERE";
   ```
3. Thay thế bằng URL Web app vừa copy:
   ```javascript
   const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec";
   ```

## Bước 6: Test

1. Restart ứng dụng React
2. Gửi tin nhắn với chatbot
3. Click thumbs up/down
4. Kiểm tra Google Sheets để xem dữ liệu có được ghi vào không

## 🔒 Bảo mật (Tùy chọn)

Để tăng cường bảo mật, bạn có thể:

1. **Thêm API Key validation**:
```javascript
function doPost(e) {
  const apiKey = e.parameter.apiKey;
  if (apiKey !== 'YOUR_SECRET_API_KEY') {
    return ContentService.createTextOutput('Unauthorized');
  }
  // ... rest of code
}
```

2. **Giới hạn domain**:
```javascript
function doPost(e) {
  const origin = e.parameter.origin;
  const allowedDomains = ['yourdomain.com', 'localhost'];
  if (!allowedDomains.some(domain => origin.includes(domain))) {
    return ContentService.createTextOutput('Domain not allowed');
  }
  // ... rest of code
}
```

## 📈 Phân tích dữ liệu

Sau khi thu thập được dữ liệu, bạn có thể:

1. Tạo pivot table để phân tích tỷ lệ feedback tích cực/tiêu cực
2. Lọc theo thời gian để xem xu hướng
3. Phân tích những tin nhắn nào nhận được feedback tiêu cực nhiều nhất
4. Xuất dữ liệu để phân tích sâu hơn

## 🛠️ Troubleshooting CORS

Nếu gặp lỗi CORS như bạn:

### 1. Kiểm tra deployment:
```bash
# Mở URL Apps Script trực tiếp trong browser
https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```
- Nếu thấy JSON response → OK
- Nếu thấy "Not Found" → Cần redeploy

### 2. Redeploy Apps Script:
1. Vào Apps Script editor
2. Click **Deploy** → **New deployment** (không phải Manage)
3. Chọn lại tất cả settings
4. Copy URL mới

### 3. Test trong Console:
```javascript
// Test trong browser console
fetch('YOUR_APPS_SCRIPT_URL', {
  method: 'POST',
  body: JSON.stringify({test: 'data'})
}).then(r => console.log('Success:', r))
.catch(e => console.log('Error:', e));
```

### 4. Code hiện tại đã có fallback:
- Thử CORS bình thường trước
- Nếu fail → dùng `no-cors` mode
- Vẫn fail → log data ra console để debug

## 🚨 Lưu ý quan trọng

- Apps Script có giới hạn 6 phút runtime cho mỗi execution
- Google Sheets có giới hạn 10 triệu cells
- Nên backup dữ liệu định kỳ
- Kiểm tra quyền truy cập của Apps Script thường xuyên
- **CORS**: Google Apps Script đôi khi cần 5-10 phút để propagate changes 
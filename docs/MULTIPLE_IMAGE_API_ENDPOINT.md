# Multiple Image Processing API Endpoint

## Overview
This document provides instructions for implementing a new API endpoint in the medi-reader-backend to handle multiple image processing requests from the frontend application.

## Endpoint Details

### URL
```
POST /api/extract-multiple
```

### Purpose
Process multiple medical device images (3-5 images) in a single batch request to extract data points using AI models.

## Request Format

### Content-Type
```
multipart/form-data
```

### Form Data Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `images` | File[] | Yes | Array of image files (3-5 images) |
| `deviceOverride` | String | No | Device model override (e.g., 'fresenius-4008s') |
| `patientId` | String | No | Patient ID for data association |
| `deviceMasterId` | String | No | Device master ID for tracking |
| `imageCount` | String | Yes | Number of images being sent |

### Example Request
```javascript
const formData = new FormData();
formData.append('images', imageBlob1, 'upload_0.jpg');
formData.append('images', imageBlob2, 'upload_1.jpg');
formData.append('images', imageBlob3, 'upload_2.jpg');
formData.append('deviceOverride', 'fresenius-4008s');
formData.append('patientId', 'PATIENT_123');
formData.append('deviceMasterId', 'DEVICE_456');
formData.append('imageCount', '3');

fetch('/api/extract-multiple', {
  method: 'POST',
  body: formData,
  headers: {
    'Accept': 'application/json'
  }
});
```

## Response Format

### Success Response (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "id": "bp_systolic_1",
      "label": "Systolic Blood Pressure",
      "value": "120",
      "unit": "mmHg",
      "confidence": 0.95
    },
    {
      "id": "bp_diastolic_1",
      "label": "Diastolic Blood Pressure", 
      "value": "80",
      "unit": "mmHg",
      "confidence": 0.92
    },
    {
      "id": "hr_1",
      "label": "Heart Rate",
      "value": "72",
      "unit": "bpm",
      "confidence": 0.88
    },
    {
      "id": "temp_1",
      "label": "Body Temperature",
      "value": "98.6",
      "unit": "°F",
      "confidence": 0.90
    }
  ],
  "groupedData": {
    "images": [
      {
        "imageIndex": 0,
        "imageDescription": "Device front panel showing blood pressure readings",
        "dataPoints": [
          {
            "id": "bp_systolic_1",
            "label": "Systolic Blood Pressure",
            "value": "120",
            "unit": "mmHg",
            "confidence": 0.95
          },
          {
            "id": "bp_diastolic_1",
            "label": "Diastolic Blood Pressure", 
            "value": "80",
            "unit": "mmHg",
            "confidence": 0.92
          }
        ]
      },
      {
        "imageIndex": 1,
        "imageDescription": "Device side panel showing heart rate monitor",
        "dataPoints": [
          {
            "id": "hr_1",
            "label": "Heart Rate",
            "value": "72",
            "unit": "bpm",
            "confidence": 0.88
          }
        ]
      },
      {
        "imageIndex": 2,
        "imageDescription": "Device display showing temperature readings",
        "dataPoints": [
          {
            "id": "temp_1",
            "label": "Body Temperature",
            "value": "98.6",
            "unit": "°F",
            "confidence": 0.90
          }
        ]
      }
    ],
    "combinedAnalysis": {
      "summary": "Comprehensive analysis of medical device readings from 3 different views showing blood pressure, heart rate, and temperature measurements",
      "totalDataPoints": 4,
      "imageCount": 3
    }
  },
  "processingTime": 3.45,
  "modelUsed": "gpt-4o",
  "patientId": "PATIENT_123",
  "deviceMasterId": "DEVICE_456",
  "imageCount": 3,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Error Response (400/500)
```json
{
  "success": false,
  "error": "Invalid image count. Must be between 3 and 5 images.",
  "code": "INVALID_IMAGE_COUNT",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Implementation Guide

### 1. Backend Route Setup

Create a new route in your Express.js server:

```javascript
// In your main server file (e.g., server.js or app.js)
app.post('/api/extract-multiple', upload.array('images', 5), async (req, res) => {
  try {
    const { deviceOverride, patientId, deviceMasterId, imageCount } = req.body;
    const images = req.files;
    
    // Validate image count
    const count = parseInt(imageCount);
    if (count < 3 || count > 5) {
      return res.status(400).json({
        success: false,
        error: 'Invalid image count. Must be between 3 and 5 images.',
        code: 'INVALID_IMAGE_COUNT'
      });
    }
    
    // Validate files
    if (!images || images.length !== count) {
      return res.status(400).json({
        success: false,
        error: 'Image count mismatch.',
        code: 'IMAGE_COUNT_MISMATCH'
      });
    }
    
    // Process images with AI
    const result = await processMultipleImages(images, deviceOverride, patientId, deviceMasterId);
    
    res.json({
      success: true,
      ...result
    });
    
  } catch (error) {
    console.error('Multiple image processing error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'PROCESSING_ERROR'
    });
  }
});
```

### 2. Multer Configuration

Configure multer for handling multiple file uploads:

```javascript
const multer = require('multer');
const path = require('path');

const storage = multer.memoryStorage(); // Store in memory for processing
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 5 // Maximum 5 files
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});
```

### 3. AI Processing Function

Implement the multiple image processing logic:

```javascript
async function processMultipleImages(images, deviceOverride, patientId, deviceMasterId) {
  const startTime = Date.now();
  
  try {
    // Convert images to base64 for AI processing
    const imageData = images.map(image => ({
      type: "image_url",
      image_url: {
        url: `data:${image.mimetype};base64,${image.buffer.toString('base64')}`
      }
    }));
    
    // Prepare AI prompt for multiple images
    const prompt = `
    Analyze these ${images.length} medical device images and extract all relevant data points.
    Each image may show different aspects of the same device or different time points.
    Combine information from all images to provide comprehensive data extraction.
    
    Device Type: ${deviceOverride || 'Auto-detect'}
    
    Return a JSON array of data points with the following structure:
    [
      {
        "id": "unique_identifier",
        "label": "Parameter Name",
        "value": "Extracted Value",
        "unit": "Unit of Measurement",
        "confidence": 0.95
      }
    ]
    `;
    
    // Call OpenAI API with multiple images
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            ...imageData
          ]
        }
      ],
      max_tokens: 2000,
      temperature: 0.1
    });
    
    const content = response.choices[0].message.content;
    const extractedData = JSON.parse(content);
    
    const processingTime = (Date.now() - startTime) / 1000;
    
    return {
      data: extractedData,
      processingTime: processingTime,
      modelUsed: "gpt-4o",
      patientId: patientId,
      deviceMasterId: deviceMasterId,
      imageCount: images.length,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('AI processing error:', error);
    throw new Error('Failed to process images with AI');
  }
}
```

### 4. Error Handling

Implement comprehensive error handling:

```javascript
// Error types
const ERROR_CODES = {
  INVALID_IMAGE_COUNT: 'INVALID_IMAGE_COUNT',
  IMAGE_COUNT_MISMATCH: 'IMAGE_COUNT_MISMATCH',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  AI_PROCESSING_ERROR: 'AI_PROCESSING_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR'
};

// Error handler middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 10MB per image.',
        code: ERROR_CODES.FILE_TOO_LARGE
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Too many files. Maximum is 5 images.',
        code: ERROR_CODES.INVALID_IMAGE_COUNT
      });
    }
  }
  
  if (error.message === 'Only image files are allowed') {
    return res.status(400).json({
      success: false,
      error: 'Invalid file type. Only image files are allowed.',
      code: ERROR_CODES.INVALID_FILE_TYPE
    });
  }
  
  // Default error
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    code: 'INTERNAL_ERROR'
  });
});
```

## Testing

### Test with cURL
```bash
# Test with 3 images
curl -X POST http://localhost:3001/api/extract-multiple \
  -F "images=@image1.jpg" \
  -F "images=@image2.jpg" \
  -F "images=@image3.jpg" \
  -F "deviceOverride=fresenius-4008s" \
  -F "patientId=TEST_PATIENT" \
  -F "deviceMasterId=TEST_DEVICE" \
  -F "imageCount=3" \
  -H "Accept: application/json"
```

### Test with Postman
1. Set method to POST
2. URL: `http://localhost:3001/api/extract-multiple`
3. Body type: form-data
4. Add fields:
   - `images` (File): Select multiple image files
   - `deviceOverride` (Text): fresenius-4008s
   - `patientId` (Text): TEST_PATIENT
   - `deviceMasterId` (Text): TEST_DEVICE
   - `imageCount` (Text): 3

## Security Considerations

1. **File Size Limits**: Implement reasonable file size limits (10MB per image)
2. **File Type Validation**: Only allow image files (JPEG, PNG, etc.)
3. **Rate Limiting**: Implement rate limiting to prevent abuse
4. **Authentication**: Add authentication if required
5. **Input Sanitization**: Validate all input parameters

## Performance Optimization

1. **Image Compression**: Compress images before AI processing
2. **Caching**: Cache results for identical image sets
3. **Async Processing**: Use async/await for better performance
4. **Memory Management**: Clean up temporary files and buffers
5. **Connection Pooling**: Use connection pooling for database operations

## Monitoring and Logging

```javascript
// Add logging
console.log(`Processing ${images.length} images for patient ${patientId}`);
console.log(`Processing time: ${processingTime}s`);
console.log(`Extracted ${extractedData.length} data points`);

// Add metrics
const metrics = {
  requestId: generateRequestId(),
  imageCount: images.length,
  processingTime: processingTime,
  dataPointsExtracted: extractedData.length,
  timestamp: new Date().toISOString()
};
```

## Deployment Notes

1. **Environment Variables**: Set up proper environment variables for API keys
2. **Docker**: Create Dockerfile for containerized deployment
3. **Health Checks**: Implement health check endpoints
4. **Load Balancing**: Consider load balancing for high traffic
5. **Monitoring**: Set up application monitoring and alerting

## Data Access Patterns

### Dual Format Response

The API now provides **both formats** for maximum compatibility:

1. **`data`** - Flattened array (for frontend compatibility)
2. **`groupedData`** - Grouped by image (for advanced usage)

### Accessing Data

#### Option 1: Use Flattened Data (Frontend Compatible)
```javascript
// Get all data points (same as before)
const allDataPoints = response.data;
console.log(`Total data points: ${allDataPoints.length}`);

// Display data points
allDataPoints.forEach(point => {
  console.log(`${point.label}: ${point.value} ${point.unit}`);
});
```

#### Option 2: Use Grouped Data (Advanced)
```javascript
// Get data from a specific image
const firstImageData = response.groupedData.images[0].dataPoints;
const secondImageData = response.groupedData.images[1].dataPoints;

// Get image descriptions
response.groupedData.images.forEach((image, index) => {
  console.log(`Image ${index}: ${image.imageDescription}`);
  console.log(`Data points: ${image.dataPoints.length}`);
});

// Get combined analysis
const summary = response.groupedData.combinedAnalysis.summary;
const totalDataPoints = response.groupedData.combinedAnalysis.totalDataPoints;
```

### Frontend Integration Example

```javascript
// Process multiple image response
function processMultipleImageResponse(response) {
  const { data } = response;
  
  // Create a map of image index to data points
  const imageDataMap = {};
  
  data.images.forEach(image => {
    imageDataMap[image.imageIndex] = {
      description: image.imageDescription,
      dataPoints: image.dataPoints
    };
  });
  
  // Display data grouped by image
  Object.entries(imageDataMap).forEach(([index, imageData]) => {
    console.log(`Image ${index}: ${imageData.description}`);
    imageData.dataPoints.forEach(point => {
      console.log(`  ${point.label}: ${point.value} ${point.unit}`);
    });
  });
  
  return imageDataMap;
}
```

## Status: ✅ READY FOR IMPLEMENTATION

This endpoint is ready to be implemented in the medi-reader-backend. The frontend is already configured to call this endpoint when processing multiple images.

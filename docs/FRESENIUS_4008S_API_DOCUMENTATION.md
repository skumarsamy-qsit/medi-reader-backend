# Fresenius 4008S API Documentation

This document describes the API endpoints for the Fresenius 4008S dialysis machine data confirmation and retrieval system.

## Base URL
```
http://localhost:3001/api/fresenius-4008s
```

## Overview

The Fresenius 4008S API provides endpoints for:
- Confirming and storing data points from the Fresenius 4008S dialysis machine
- Retrieving latest data points for a patient
- Retrieving data points within a date range

## Authentication

All endpoints require proper authentication. Include the authentication token in the request headers:
```
Authorization: Bearer <token>
```

## API Endpoints

### 1. Confirm Data Points

**Endpoint:** `POST /api/fresenius-4008s/confirm-data`

**Description:** Receives confirmed data points from the frontend and stores them in the backend database.

**Request Body:**
```json
{
  "patientId": "string (required)",
  "deviceId": "string (required)",
  "sessionId": "string (required)",
  "imageUri": "string (optional)",
  "processingTime": "number (optional)",
  "modelUsed": "string (optional)",
  "confidenceScore": "number (optional)",
  "dataPoints": {
    // Original 4008S Data Points
    "ktV": "number (optional)",
    "plasmaNA": "number (optional)",
    "goalIn": "string (optional, format: h:mm)",
    "clearance": "number (optional)",
    "ufVolume": "number (optional)",
    "ufTimeLeft": "string (optional, format: h:mm)",
    "ufRate": "number (optional)",
    "ufGoal": "number (optional)",
    "effBloodFlow": "number (optional)",
    "cumBloodVol": "number (optional)",
    "bloodPressureSys": "number (optional)",
    "bloodPressureDia": "number (optional)",
    "bloodPressureMap": "number (optional)",
    "bloodPressurePulse": "number (optional)",
    "qb": "number (optional)",
    "anticoagulant": "number (optional)",
    "arterialPressure": "number (optional)",
    "venousPressure": "number (optional)",
    "tmp": "number (optional)",
    "conductivity": "number (optional)",
    
    // New Data Points for Newer 4008S Versions (Dialysate Menu)
    "bpmSys": "number (optional)",
    "bpmDia": "number (optional)",
    "dilution": "string (optional, format: 1+34)",
    "baseNA": "number (optional)",
    "prescribedNA": "number (optional)",
    "bicarbonate": "number (optional)",
    "temperature": "number (optional)",
    "dialysateFlow": "number (optional)",
    "naProfile": "number (optional)",
    "startNA": "number (optional)",
    "cdsStatus": "string (optional)",
    "emptyBIBAG": "string (optional)",
    "conductivityWindow": "number (optional)"
  },
  "metadata": {
    "deviceModel": "string (optional)",
    "deviceVersion": "string (optional)",
    "isValidated": "boolean (optional)",
    "validationNotes": "string (optional)",
    "createdBy": "string (optional)"
  }
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Fresenius 4008S data points confirmed and stored successfully",
  "data": {
    "requestId": "string",
    "patientId": "string",
    "deviceId": "string",
    "sessionId": "string",
    "dataPointsCount": "number",
    "backendResponse": "object"
  },
  "responseTime": "number",
  "timestamp": "datetime"
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Error message",
  "requestId": "string",
  "responseTime": "number",
  "timestamp": "datetime"
}
```

**Example Request:**
```bash
curl -X POST http://localhost:3001/api/fresenius-4008s/confirm-data \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "patientId": "PAT001",
    "deviceId": "DEV001",
    "sessionId": "SESS001",
    "dataPoints": {
      "ktV": 0.68,
      "plasmaNA": 135,
      "goalIn": "1:21",
      "clearance": 158,
      "ufVolume": 1188,
      "ufTimeLeft": "2:11",
      "ufRate": 647,
      "ufGoal": 2600,
      "effBloodFlow": 231,
      "cumBloodVol": 25.2,
      "bloodPressureSys": 126,
      "bloodPressureDia": 62,
      "bloodPressureMap": 101,
      "bloodPressurePulse": 59,
      "qb": 280,
      "anticoagulant": 0.18,
      "arterialPressure": 0,
      "venousPressure": 80,
      "tmp": 80,
      "conductivity": 14.2,
      "bpmSys": 148,
      "bpmDia": 77,
      "dilution": "1+34",
      "baseNA": 140,
      "prescribedNA": 140,
      "bicarbonate": 0,
      "temperature": 36.5,
      "dialysateFlow": 500,
      "naProfile": 0,
      "startNA": 0,
      "cdsStatus": "OFF",
      "emptyBIBAG": "No",
      "conductivityWindow": 14.0
    },
    "metadata": {
      "isValidated": true,
      "createdBy": "user@example.com"
    }
  }'
```

### 2. Get Latest Data Points

**Endpoint:** `GET /api/fresenius-4008s/latest-data/{patientId}`

**Description:** Retrieves the latest data points for a specific patient.

**Path Parameters:**
- `patientId` (required): Patient identifier

**Query Parameters:**
- `deviceId` (optional): Device identifier to filter by specific device
- `sessionId` (optional): Session identifier to filter by specific session

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "patientId": "string",
    "deviceId": "string",
    "sessionId": "string",
    "timestamp": "datetime",
    "deviceModel": "string",
    "deviceVersion": "string",
    "dataPoints": {
      // All data points as key-value pairs
    },
    "metadata": {
      "isValidated": "boolean",
      "validationNotes": "string",
      "createdBy": "string"
    }
  },
  "requestId": "string",
  "responseTime": "number",
  "timestamp": "datetime"
}
```

**Example Request:**
```bash
curl -X GET "http://localhost:3001/api/fresenius-4008s/latest-data/PAT001?deviceId=DEV001" \
  -H "Authorization: Bearer <token>"
```

### 3. Get Data Points by Date Range

**Endpoint:** `GET /api/fresenius-4008s/data-range/{patientId}`

**Description:** Retrieves data points within a specified date range.

**Path Parameters:**
- `patientId` (required): Patient identifier

**Query Parameters:**
- `deviceId` (optional): Device identifier to filter by specific device
- `startDate` (required): Start date in ISO format (e.g., "2024-01-01T00:00:00Z")
- `endDate` (required): End date in ISO format (e.g., "2024-01-31T23:59:59Z")

**Response (Success):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "patientId": "string",
      "deviceId": "string",
      "sessionId": "string",
      "timestamp": "datetime",
      "deviceModel": "string",
      "deviceVersion": "string",
      "dataPoints": {
        // All data points as key-value pairs
      },
      "metadata": {
        "isValidated": "boolean",
        "validationNotes": "string",
        "createdBy": "string"
      }
    }
    // ... more records
  ],
  "requestId": "string",
  "responseTime": "number",
  "timestamp": "datetime"
}
```

**Example Request:**
```bash
curl -X GET "http://localhost:3001/api/fresenius-4008s/data-range/PAT001?startDate=2024-01-01T00:00:00Z&endDate=2024-01-31T23:59:59Z&deviceId=DEV001" \
  -H "Authorization: Bearer <token>"
```

## Data Validation

The API validates data points against the Fresenius 4008S device configuration rules:

### Validation Rules

1. **Range Validation**: Numeric values must be within specified ranges
2. **Format Validation**: String values must match required formats
3. **Required Fields**: patientId, deviceId, and sessionId are always required
4. **Data Type Validation**: Values must be of the correct data type

### Example Validation Errors

```json
{
  "success": false,
  "error": "Data validation failed",
  "validationErrors": [
    "UF Volume: UF Volume should be between 0-10000 mL",
    "Blood Pressure SYS: Systolic blood pressure should be between 80-200 mmHg"
  ],
  "requestId": "string",
  "timestamp": "datetime"
}
```

## Error Handling

The API handles various error scenarios:

### HTTP Status Codes

- `200 OK`: Request successful
- `400 Bad Request`: Invalid request data or validation errors
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Access denied
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error
- `503 Service Unavailable`: Backend service unavailable

### Error Response Format

```json
{
  "success": false,
  "error": "Error message",
  "requestId": "string",
  "responseTime": "number",
  "timestamp": "datetime"
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Rate Limit**: 100 requests per minute per IP address
- **Headers**: Rate limit information is included in response headers
- **Exceeded**: Returns 429 Too Many Requests when limit exceeded

## Logging and Monitoring

The API provides comprehensive logging:

- **Request Logging**: All requests are logged with request ID
- **Response Logging**: Response times and status codes are tracked
- **Error Logging**: Detailed error information is logged
- **Audit Trail**: All data modifications are audited

## Security Considerations

1. **Authentication**: All endpoints require valid authentication tokens
2. **Input Validation**: All input data is validated and sanitized
3. **SQL Injection Prevention**: Parameterized queries are used
4. **CORS**: Cross-origin requests are properly configured
5. **HTTPS**: All communications should use HTTPS in production

## Testing

### Test Data

Use the following test data for API testing:

```json
{
  "patientId": "TEST_PATIENT_001",
  "deviceId": "TEST_DEVICE_001",
  "sessionId": "TEST_SESSION_001",
  "dataPoints": {
    "ktV": 0.68,
    "plasmaNA": 135,
    "goalIn": "1:21",
    "clearance": 158,
    "ufVolume": 1188,
    "ufTimeLeft": "2:11",
    "ufRate": 647,
    "ufGoal": 2600,
    "effBloodFlow": 231,
    "cumBloodVol": 25.2,
    "bloodPressureSys": 126,
    "bloodPressureDia": 62,
    "bloodPressureMap": 101,
    "bloodPressurePulse": 59,
    "qb": 280,
    "anticoagulant": 0.18,
    "arterialPressure": 0,
    "venousPressure": 80,
    "tmp": 80,
    "conductivity": 14.2
  }
}
```

### Test Scenarios

1. **Valid Data**: Test with complete, valid data points
2. **Missing Required Fields**: Test with missing patientId, deviceId, or sessionId
3. **Invalid Data Types**: Test with incorrect data types
4. **Validation Errors**: Test with values outside valid ranges
5. **Large Data Sets**: Test with maximum number of data points
6. **Concurrent Requests**: Test with multiple simultaneous requests

## Support

For technical support or questions about the API:

- **Documentation**: Refer to this documentation and the Java Backend API Specification
- **Logs**: Check server logs for detailed error information
- **Monitoring**: Use the health check endpoint to verify service status



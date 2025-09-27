# Java Backend API Specification for Fresenius 4008S Device

This document outlines the Java backend API endpoints that need to be implemented to support the Fresenius 4008S device data storage and retrieval.

## Base URL
```
http://localhost:8080/hdimsAdapterWeb
```

## Environment Variables
The gateway expects the following environment variable to be set:
```bash
BACKEND_BASE_URL=http://localhost:8080/hdimsAdapterWeb
```

## API Endpoints

### 1. Store Fresenius 4008S Data Points

**Endpoint:** `POST /api/fresenius-4008s/store-data`

**Description:** Stores confirmed data points from the Fresenius 4008S dialysis machine.

**Request Body:**
```json
{
  "patientId": "string (required)",
  "deviceId": "string (required)", 
  "sessionId": "string (required)",
  "deviceModel": "string (default: 'Fresenius 4008 S')",
  "deviceVersion": "string (default: '1.0')",
  "imageUri": "string (optional)",
  "processingTime": "number (optional)",
  "modelUsed": "string (optional)",
  "confidenceScore": "number (optional)",
  "createdBy": "string (optional)",
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
    
    // New Data Points for Newer 4008S Versions
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

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "patientId": "string",
    "deviceId": "string",
    "sessionId": "string",
    "timestamp": "datetime",
    "dataPointsCount": "number"
  },
  "message": "Data stored successfully"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

### 2. Get Latest Fresenius 4008S Data Points

**Endpoint:** `GET /api/fresenius-4008s/latest-data/{patientId}`

**Description:** Retrieves the latest data points for a specific patient.

**Path Parameters:**
- `patientId` (required): Patient identifier

**Query Parameters:**
- `deviceId` (optional): Device identifier to filter by specific device
- `sessionId` (optional): Session identifier to filter by specific session

**Response:**
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
  }
}
```

### 3. Get Fresenius 4008S Data Points by Date Range

**Endpoint:** `GET /api/fresenius-4008s/data-range/{patientId}`

**Description:** Retrieves data points within a specified date range.

**Path Parameters:**
- `patientId` (required): Patient identifier

**Query Parameters:**
- `deviceId` (optional): Device identifier to filter by specific device
- `startDate` (required): Start date in ISO format (e.g., "2024-01-01T00:00:00Z")
- `endDate` (required): End date in ISO format (e.g., "2024-01-31T23:59:59Z")

**Response:**
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
  "totalCount": "number",
  "startDate": "datetime",
  "endDate": "datetime"
}
```

## Database Integration

The Java backend should implement the following database operations:

### 1. Data Storage
- Use the MSSQL stored procedure `sp_InsertFresenius4008SDataPoint` to store data points
- Ensure all required fields (patientId, deviceId, sessionId) are always present
- Handle data validation according to the device configuration rules

### 2. Data Retrieval
- Use the MSSQL stored procedures:
  - `sp_GetFresenius4008SLatestDataPoints` for latest data
  - `sp_GetFresenius4008SDataPointsByDateRange` for date range queries
- Implement proper error handling and logging

### 3. Data Validation
- Validate data points against the device configuration rules
- Ensure data types and ranges are correct
- Return appropriate error messages for validation failures

## Error Handling

The backend should handle the following error scenarios:

1. **Validation Errors**: Return 400 Bad Request with specific validation messages
2. **Database Errors**: Return 500 Internal Server Error with generic error message
3. **Missing Required Fields**: Return 400 Bad Request with field-specific error messages
4. **Network/Timeout Errors**: Return 503 Service Unavailable with retry information

## Security Considerations

1. **Authentication**: Implement proper authentication/authorization
2. **Input Validation**: Sanitize all input data
3. **SQL Injection Prevention**: Use parameterized queries
4. **Rate Limiting**: Implement rate limiting for API endpoints
5. **Logging**: Log all API calls and errors for audit purposes

## Example Implementation

### Controller Method
```java
@RestController
@RequestMapping("/api/fresenius-4008s")
public class Fresenius4008SController {
    
    @Autowired
    private Fresenius4008SService service;
    
    @PostMapping("/store-data")
    public ResponseEntity<?> storeData(@RequestBody Fresenius4008SDataRequest request) {
        try {
            // Validate required fields
            if (request.getPatientId() == null || request.getDeviceId() == null || request.getSessionId() == null) {
                return ResponseEntity.badRequest().body(new ErrorResponse("Missing required fields"));
            }
            
            // Store data
            Fresenius4008SDataResponse response = service.storeData(request);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ErrorResponse("Internal server error"));
        }
    }
}
```

### Service Method
```java
@Service
public class Fresenius4008SService {
    
    @Autowired
    private Fresenius4008SRepository repository;
    
    public Fresenius4008SDataResponse storeData(Fresenius4008SDataRequest request) {
        // Call stored procedure to insert data
        return repository.insertDataPoint(request);
    }
}
```

## Testing

The backend should include comprehensive tests for:

1. **Unit Tests**: Test individual methods and data validation
2. **Integration Tests**: Test database operations and API endpoints
3. **Performance Tests**: Test with large datasets and concurrent requests
4. **Error Handling Tests**: Test various error scenarios

## Monitoring and Logging

Implement the following monitoring:

1. **API Response Times**: Monitor endpoint performance
2. **Error Rates**: Track and alert on high error rates
3. **Database Performance**: Monitor query execution times
4. **Data Quality**: Track validation failures and data quality metrics



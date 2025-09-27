import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { FRESENIUS_4008S_CONFIG } from '../services/devices/fresenius/4008s/config.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Interface for the data point confirmation request
interface Fresenius4008SDataPointConfirmation {
  patientId: string;
  deviceId: string;
  sessionId: string;
  imageUri?: string;
  processingTime?: number;
  modelUsed?: string;
  confidenceScore?: number;
  dataPoints: {
    // Original 4008S Data Points
    ktV?: number;
    plasmaNA?: number;
    goalIn?: string;
    clearance?: number;
    ufVolume?: number;
    ufTimeLeft?: string;
    ufRate?: number;
    ufGoal?: number;
    effBloodFlow?: number;
    cumBloodVol?: number;
    bloodPressureSys?: number;
    bloodPressureDia?: number;
    bloodPressureMap?: number;
    bloodPressurePulse?: number;
    qb?: number;
    anticoagulant?: number;
    arterialPressure?: number;
    venousPressure?: number;
    tmp?: number;
    conductivity?: number;
    
    // New Data Points for Newer 4008S Versions
    bpmSys?: number;
    bpmDia?: number;
    dilution?: string;
    baseNA?: number;
    prescribedNA?: number;
    bicarbonate?: number;
    temperature?: number;
    dialysateFlow?: number;
    naProfile?: number;
    startNA?: number;
    cdsStatus?: string;
    emptyBIBAG?: string;
    conductivityWindow?: number;
  };
  metadata?: {
    deviceModel?: string;
    deviceVersion?: string;
    isValidated?: boolean;
    validationNotes?: string;
    createdBy?: string;
  };
}

// Interface for the backend API response
interface BackendAPIResponse {
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
}

/**
 * POST /api/fresenius-4008s/confirm-data
 * Endpoint to receive confirmed data points from the frontend
 */
router.post('/confirm-data', async (req, res) => {
  const startTime = Date.now();
  const requestId = `fresenius_4008s_confirm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  console.log('🏥 [Fresenius4008S] ===== DATA CONFIRMATION REQUEST =====');
  console.log('🏥 [Fresenius4008S] Request ID:', requestId);
  console.log('🏥 [Fresenius4008S] Request received at:', new Date().toISOString());
  
  try {
    const confirmationData: Fresenius4008SDataPointConfirmation = req.body;
    
    // Validate required fields
    if (!confirmationData.patientId) {
      return res.status(400).json({
        success: false,
        error: 'patientId is required',
        requestId,
        timestamp: new Date().toISOString()
      });
    }
    
    if (!confirmationData.deviceId) {
      return res.status(400).json({
        success: false,
        error: 'deviceId is required',
        requestId,
        timestamp: new Date().toISOString()
      });
    }
    
    if (!confirmationData.sessionId) {
      return res.status(400).json({
        success: false,
        error: 'sessionId is required',
        requestId,
        timestamp: new Date().toISOString()
      });
    }
    
    // Validate data points against device configuration
    const validationErrors = validateDataPoints(confirmationData.dataPoints);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Data validation failed',
        validationErrors,
        requestId,
        timestamp: new Date().toISOString()
      });
    }
    
    // Prepare data for backend API call
    const backendPayload = {
      patientId: confirmationData.patientId,
      deviceId: confirmationData.deviceId,
      sessionId: confirmationData.sessionId,
      deviceModel: FRESENIUS_4008S_CONFIG.displayName,
      deviceVersion: FRESENIUS_4008S_CONFIG.version,
      imageUri: confirmationData.imageUri,
      processingTime: confirmationData.processingTime,
      modelUsed: confirmationData.modelUsed,
      confidenceScore: confirmationData.confidenceScore,
      createdBy: confirmationData.metadata?.createdBy,
      dataPoints: confirmationData.dataPoints,
      metadata: confirmationData.metadata
    };
    
    console.log('🏥 [Fresenius4008S] Calling backend API with payload:', {
      patientId: backendPayload.patientId,
      deviceId: backendPayload.deviceId,
      sessionId: backendPayload.sessionId,
      dataPointsCount: Object.keys(backendPayload.dataPoints).length
    });
    
    // Call the Java backend API
    const backendResponse = await callBackendAPI(backendPayload);
    
    const responseTime = Date.now() - startTime;
    
    if (backendResponse.success) {
      console.log('✅ [Fresenius4008S] Data confirmed and stored successfully');
    //   logger.info({
    //     event: 'fresenius_4008s_data_confirmed',
    //     requestId,
    //     patientId: confirmationData.patientId,
    //     deviceId: confirmationData.deviceId,
    //     sessionId: confirmationData.sessionId,
    //     responseTime,
    //     timestamp: new Date().toISOString()
    //   });
      
      res.json({
        success: true,
        message: 'Fresenius 4008S data points confirmed and stored successfully',
        data: {
          requestId,
          patientId: confirmationData.patientId,
          deviceId: confirmationData.deviceId,
          sessionId: confirmationData.sessionId,
          dataPointsCount: Object.keys(confirmationData.dataPoints).length,
          backendResponse: backendResponse.data
        },
        responseTime,
        timestamp: new Date().toISOString()
      });
    } else {
      console.error('❌ [Fresenius4008S] Backend API call failed:', backendResponse.error);
    //   logger.error({
    //     event: 'fresenius_4008s_backend_error',
    //     requestId,
    //     patientId: confirmationData.patientId,
    //     deviceId: confirmationData.deviceId,
    //     sessionId: confirmationData.sessionId,
    //     error: backendResponse.error,
    //     responseTime,
    //     timestamp: new Date().toISOString()
    //   });
      
      res.status(500).json({
        success: false,
        error: 'Failed to store data in backend',
        backendError: backendResponse.error,
        requestId,
        responseTime,
        timestamp: new Date().toISOString()
      });
    }
    
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error.message || 'Unknown error occurred';
    
    console.error('❌ [Fresenius4008S] Error processing confirmation request:', errorMessage);
    if (error.stack) {
      console.error('❌ [Fresenius4008S] Error stack:', error.stack);
    }
    
    // logger.error({
    //   event: 'fresenius_4008s_confirmation_error',
    //   requestId,
    //   error: errorMessage,
    //   errorType: error instanceof Error ? error.constructor.name : typeof error,
    //   responseTime,
    //   timestamp: new Date().toISOString()
    // });
    
    res.status(500).json({
      success: false,
      error: errorMessage,
      requestId,
      responseTime,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/fresenius-4008s/latest-data/:patientId
 * Endpoint to retrieve latest data points for a patient
 */
router.get('/latest-data/:patientId', async (req, res) => {
  const startTime = Date.now();
  const requestId = `fresenius_4008s_latest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const { patientId } = req.params;
  const { deviceId, sessionId } = req.query;
  
  console.log('🔍 [Fresenius4008S] ===== LATEST DATA REQUEST =====');
  console.log('🔍 [Fresenius4008S] Request ID:', requestId);
  console.log('🔍 [Fresenius4008S] Patient ID:', patientId);
  console.log('🔍 [Fresenius4008S] Device ID:', deviceId);
  console.log('🔍 [Fresenius4008S] Session ID:', sessionId);
  
  try {
    // Call backend API to get latest data
    const backendResponse = await callBackendGetAPI(patientId, deviceId as string, sessionId as string);
    
    const responseTime = Date.now() - startTime;
    
    if (backendResponse.success) {
      console.log('✅ [Fresenius4008S] Latest data retrieved successfully');
    //   logger.info({
    //     event: 'fresenius_4008s_latest_data_retrieved',
    //     requestId,
    //     patientId,
    //     deviceId,
    //     sessionId,
    //     responseTime,
    //     timestamp: new Date().toISOString()
    //   });
      
      res.json({
        success: true,
        data: backendResponse.data,
        requestId,
        responseTime,
        timestamp: new Date().toISOString()
      });
    } else {
      console.error('❌ [Fresenius4008S] Failed to retrieve latest data:', backendResponse.error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve latest data',
        backendError: backendResponse.error,
        requestId,
        responseTime,
        timestamp: new Date().toISOString()
      });
    }
    
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error.message || 'Unknown error occurred';
    
    console.error('❌ [Fresenius4008S] Error retrieving latest data:', errorMessage);
    // logger.error({
    //   event: 'fresenius_4008s_latest_data_error',
    //   requestId,
    //   patientId,
    //   error: errorMessage,
    //   responseTime,
    //   timestamp: new Date().toISOString()
    // });
    
    res.status(500).json({
      success: false,
      error: errorMessage,
      requestId,
      responseTime,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/fresenius-4008s/data-range/:patientId
 * Endpoint to retrieve data points within a date range
 */
router.get('/data-range/:patientId', async (req, res) => {
  const startTime = Date.now();
  const requestId = `fresenius_4008s_range_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const { patientId } = req.params;
  const { deviceId, startDate, endDate } = req.query;
  
  console.log('📅 [Fresenius4008S] ===== DATA RANGE REQUEST =====');
  console.log('📅 [Fresenius4008S] Request ID:', requestId);
  console.log('📅 [Fresenius4008S] Patient ID:', patientId);
  console.log('📅 [Fresenius4008S] Device ID:', deviceId);
  console.log('📅 [Fresenius4008S] Start Date:', startDate);
  console.log('📅 [Fresenius4008S] End Date:', endDate);
  
  try {
    // Validate date parameters
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate and endDate are required',
        requestId,
        timestamp: new Date().toISOString()
      });
    }
    
    // Call backend API to get data within date range
    const backendResponse = await callBackendGetRangeAPI(patientId, deviceId as string, startDate as string, endDate as string);
    
    const responseTime = Date.now() - startTime;
    
    if (backendResponse.success) {
      console.log('✅ [Fresenius4008S] Data range retrieved successfully');
    //   logger.info({
    //     event: 'fresenius_4008s_data_range_retrieved',
    //     requestId,
    //     patientId,
    //     deviceId,
    //     startDate,
    //     endDate,
    //     responseTime,
    //     timestamp: new Date().toISOString()
    //   });
      
      res.json({
        success: true,
        data: backendResponse.data,
        requestId,
        responseTime,
        timestamp: new Date().toISOString()
      });
    } else {
      console.error('❌ [Fresenius4008S] Failed to retrieve data range:', backendResponse.error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve data range',
        backendError: backendResponse.error,
        requestId,
        responseTime,
        timestamp: new Date().toISOString()
      });
    }
    
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error.message || 'Unknown error occurred';
    
    console.error('❌ [Fresenius4008S] Error retrieving data range:', errorMessage);
    // logger.error({
    //   event: 'fresenius_4008s_data_range_error',
    //   requestId,
    //   patientId,
    //   error: errorMessage,
    //   responseTime,
    //   timestamp: new Date().toISOString()
    // });
    
    res.status(500).json({
      success: false,
      error: errorMessage,
      requestId,
      responseTime,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Validate data points against device configuration
 */
function validateDataPoints(dataPoints: any): string[] {
  const errors: string[] = [];
  
  // Validate against device configuration rules
  for (const rule of FRESENIUS_4008S_CONFIG.validationRules) {
    const value = dataPoints[rule.field.toLowerCase().replace(/\s+/g, '')];
    
    if (value !== undefined && value !== null) {
      if (rule.type === 'range') {
        const numValue = parseFloat(value);
        if (isNaN(numValue) || numValue < rule.min! || numValue > rule.max!) {
          errors.push(`${rule.field}: ${rule.message}`);
        }
      } else if (rule.type === 'pattern' && rule.pattern) {
        const regex = new RegExp(rule.pattern);
        if (!regex.test(value.toString())) {
          errors.push(`${rule.field}: ${rule.message}`);
        }
      }
    }
  }
  
  return errors;
}

/**
 * Call the Java backend API to store data
 */
async function callBackendAPI(payload: any): Promise<BackendAPIResponse> {
  try {
    const backendBaseUrl = process.env.BACKEND_BASE_URL || 'http://localhost:8080/hdimsAdapterWeb';
    const endpoint = `${backendBaseUrl}/api/fresenius-4008s/store-data`;
    
    console.log('🔗 [Fresenius4008S] Calling backend API:', endpoint);
    
    const response = await axios.post(endpoint, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 30000 // 30 seconds timeout
    });
    
    return {
      success: true,
      data: response.data,
      message: 'Data stored successfully'
    };
    
  } catch (error: any) {
    console.error('❌ [Fresenius4008S] Backend API call failed:', error.message);
    return {
      success: false,
      error: error.message || 'Backend API call failed'
    };
  }
}

/**
 * Call the Java backend API to get latest data
 */
async function callBackendGetAPI(patientId: string, deviceId?: string, sessionId?: string): Promise<BackendAPIResponse> {
  try {
    const backendBaseUrl = process.env.BACKEND_BASE_URL || 'http://localhost:8080/hdimsAdapterWeb';
    let endpoint = `${backendBaseUrl}/api/fresenius-4008s/latest-data/${patientId}`;
    
    const params = new URLSearchParams();
    if (deviceId) params.append('deviceId', deviceId);
    if (sessionId) params.append('sessionId', sessionId);
    
    if (params.toString()) {
      endpoint += `?${params.toString()}`;
    }
    
    console.log('🔗 [Fresenius4008S] Calling backend GET API:', endpoint);
    
    const response = await axios.get(endpoint, {
      headers: {
        'Accept': 'application/json'
      },
      timeout: 30000 // 30 seconds timeout
    });
    
    return {
      success: true,
      data: response.data,
      message: 'Latest data retrieved successfully'
    };
    
  } catch (error: any) {
    console.error('❌ [Fresenius4008S] Backend GET API call failed:', error.message);
    return {
      success: false,
      error: error.message || 'Backend GET API call failed'
    };
  }
}

/**
 * Call the Java backend API to get data within date range
 */
async function callBackendGetRangeAPI(patientId: string, deviceId: string, startDate: string, endDate: string): Promise<BackendAPIResponse> {
  try {
    const backendBaseUrl = process.env.BACKEND_BASE_URL || 'http://localhost:8080/hdimsAdapterWeb';
    const endpoint = `${backendBaseUrl}/api/fresenius-4008s/data-range/${patientId}`;
    
    const params = new URLSearchParams();
    if (deviceId) params.append('deviceId', deviceId);
    params.append('startDate', startDate);
    params.append('endDate', endDate);
    
    const fullEndpoint = `${endpoint}?${params.toString()}`;
    
    console.log('🔗 [Fresenius4008S] Calling backend GET range API:', fullEndpoint);
    
    const response = await axios.get(fullEndpoint, {
      headers: {
        'Accept': 'application/json'
      },
      timeout: 30000 // 30 seconds timeout
    });
    
    return {
      success: true,
      data: response.data,
      message: 'Data range retrieved successfully'
    };
    
  } catch (error: any) {
    console.error('❌ [Fresenius4008S] Backend GET range API call failed:', error.message);
    return {
      success: false,
      error: error.message || 'Backend GET range API call failed'
    };
  }
}

export default router;



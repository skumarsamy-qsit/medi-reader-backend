import { DataPoint } from '../types/data.js';
import { DeviceDataPoint, ProcessingContext } from '../types/devices.js';
import { DeviceRegistry } from './deviceRegistry.js';
import { logger } from '../utils/logger.js';
import { performanceMonitor } from '../utils/performance.js';
import { ProcessingError, ERROR_CODES } from '../types/errors.js';

/**
 * Generalized LLM Service that delegates to device-specific processors
 * Singleton pattern ensures consistent API usage across the app
 */
export class LLMService {
  private static instance: LLMService;
  private deviceRegistry: DeviceRegistry;
  private processingQueue: Map<string, Promise<any>> = new Map();

  constructor() {
    this.deviceRegistry = DeviceRegistry.getInstance();
  }

  static getInstance(): LLMService {
    if (!LLMService.instance) {
      LLMService.instance = new LLMService();
    }
    return LLMService.instance;
  }

  private async queueProcessing<T>(
    key: string, 
    operation: () => Promise<T>
  ): Promise<T> {
    // Always process fresh - disable queue caching for image processing
    // if (this.processingQueue.has(key)) {
    //   logger.info('Using queued processing result', 'LLMService', { key });
    //   return this.processingQueue.get(key)!;
    // }

    const promise = operation().finally(() => {
      this.processingQueue.delete(key);
    });

    this.processingQueue.set(key, promise);
    return promise;
  }

  /**
   * Main method to extract data from medical device images using device-specific processors
   */
  async extractDataFromImage(base64Image: string, deviceOverride?: string, patientId?: string, deviceMasterId?: string): Promise<{
    data: DeviceDataPoint[];
    processingTime: number;
    modelUsed: string;
    patientId?: string;
    deviceMasterId?: string;
  }> {
    const context = 'LLMService.extractDataFromImage';
    const processingKey = `${base64Image.substring(0, 50)}_${deviceOverride || 'auto'}`;
    
    console.log('🚀 [LLMService] ===== EXTRACT DATA START =====');
    console.log('🚀 [LLMService] Extract data start time:', new Date().toISOString());
    console.log('📊 [LLMService] Base64 image length:', base64Image.length);
    console.log('🔧 [LLMService] Device override:', deviceOverride);
    console.log('👤 [LLMService] Patient ID:', patientId);
    console.log('🏥 [LLMService] Device Master ID:', deviceMasterId);
    
    return this.queueProcessing(processingKey, async () => {
      performanceMonitor.startTimer('llm_extract_data');
      logger.info('Starting generalized image processing', context, { deviceOverride });

      try {
        // Step 1: Determine device type (override or detect)
        console.log('🔍 [LLMService] Step 1: Determining device type at:', new Date().toISOString());
        
        let deviceKey: string;
        if (deviceOverride) {
          deviceKey = deviceOverride;
          console.log('🔧 [LLMService] Using manual device selection:', deviceKey);
          
          logger.info('Using manual device selection', context, { deviceKey });
        } else {
          console.log('🔍 [LLMService] Starting automatic device detection at:', new Date().toISOString());
          
          logger.info('Starting automatic device detection', context);
          performanceMonitor.startTimer('device_detection');
          deviceKey = await this.deviceRegistry.detectDevice(base64Image, false);
          performanceMonitor.endTimer('device_detection');
          console.log('✅ [LLMService] Device detection completed at:', new Date().toISOString());
          
          logger.info('Auto-detected device', context, { deviceKey });
        }
        
        // Step 2: Get device-specific processor
        console.log('🔧 [LLMService] Step 2: Getting processor for:', deviceKey, 'at:', new Date().toISOString());
        
        const processor = this.deviceRegistry.getProcessor(deviceKey);
        if (!processor) {
          console.error('❌ [LLMService] No processor found for device:', deviceKey);
          
          throw new ProcessingError(
            ERROR_CODES.DEVICE_NOT_SUPPORTED,
            `No processor found for device: ${deviceKey}`,
            { deviceKey },
            context
          );
        }
        console.log('✅ [LLMService] Processor obtained for:', deviceKey);
        
        // Step 3: Create processing context
        console.log('🔧 [LLMService] Step 3: Creating processing context at:', new Date().toISOString());
        const deviceModel = this.deviceRegistry.getModel(deviceKey);
        if (!deviceModel) {
          console.error('❌ [LLMService] No model config found for device:', deviceKey);
          throw new ProcessingError(
            ERROR_CODES.DEVICE_NOT_SUPPORTED,
            `No model config found for device: ${deviceKey}`,
            { deviceKey },
            context
          );
        }
        console.log('✅ [LLMService] Device model obtained:', deviceModel.displayName);
        
        const processingContext: ProcessingContext = {
          deviceModel,
          imageUri: base64Image,
          patientId: patientId || 'unknown',
          deviceMasterId: deviceMasterId || 'unknown',
          
          processingOptions: {
            enhanceImage: false,
            useDeviceSpecificPrompt: true,
            validateResults: true
          }
        };
        console.log('✅ [LLMService] Processing context created');
        
        // Step 4: Process with device-specific logic
        console.log('🤖 [LLMService] Step 4: Starting device processing at:', new Date().toISOString());
        console.log('🤖 [LLMService] Using processor for:', deviceKey);
        
        logger.info('Processing with device-specific processor', context, { deviceKey });
        performanceMonitor.startTimer('device_processing');
        console.log('⏰ [LLMService] About to call processor.processImage at:', new Date().toISOString());
        // const result = await processor.processImage(base64Image, processingContext);
        interface ProcessorResult {
          data: DeviceDataPoint[];
          processingTime: number;
          modelUsed: string;
        }

        let result: ProcessorResult;
        // Set useBackend to true or false as needed; defaulting to false here
        const useBackend = false;
        if (useBackend) {
          result = await processor.processImageViaBackend(base64Image, processingContext, 'http://10.29.8.179:3001/api/extract');
        } else {
          result = await processor.processImage(base64Image, processingContext);
        }
        console.log('⏰ [LLMService] processor.processImage completed at:', new Date().toISOString());
        performanceMonitor.endTimer('device_processing');
        
        const totalTime = performanceMonitor.endTimer('llm_extract_data');
        console.log('✅ [LLMService] ===== EXTRACT DATA COMPLETED =====');
        console.log('✅ [LLMService] Total processing time:', totalTime / 1000, 'seconds');
        
        logger.info('Processing completed successfully', context, {
          dataPoints: result.data.length,
          processingTime: result.processingTime,
          totalTime: totalTime / 1000
        });

        return {
          data: result.data,
          processingTime: Math.round(result.processingTime * 10) / 10,
          modelUsed: result.modelUsed,
          patientId: patientId,
          deviceMasterId: deviceMasterId
        };
        
      } catch (error) {
        performanceMonitor.endTimer('llm_extract_data');
        console.error('❌ [LLMService] ===== EXTRACT DATA FAILED =====');
        console.error('❌ [LLMService] Error at:', new Date().toISOString());
        
        logger.error('LLM extraction failed', context, error);
        throw error;
      }
    });
  }

  getSupportedDevices() {
    return this.deviceRegistry.getSupportedDevices();
  }

  getPerformanceMetrics() {
    return performanceMonitor.getMetrics();
  }

  clearProcessingQueue() {
    this.processingQueue.clear();
    logger.info('Processing queue cleared', 'LLMService');
  }
}
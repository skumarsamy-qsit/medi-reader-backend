import { DataPoint } from '../types/data.js';
import { DeviceDataPoint, ProcessingContext } from '../types/devices.js';
import { DeviceRegistry } from './deviceRegistry.js';
import { logger } from '../utils/logger.js';
import { performanceMonitor } from '../utils/performance.js';
import { ProcessingError, ERROR_CODES } from '../types/errors.js';
import { Express } from 'express';

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

  private getCategoryForLabel(label: string): 'ultrafiltration' | 'temperature' | 'conductivity' | 'concentration' | 'pressure' | 'flow' | 'time' | 'other' {
    const labelLower = label.toLowerCase();
    
    if (labelLower.includes('uf') || labelLower.includes('ultrafiltration') || labelLower.includes('kt/v')) {
      return 'ultrafiltration';
    } else if (labelLower.includes('temperature') || labelLower.includes('temp')) {
      return 'temperature';
    } else if (labelLower.includes('conductivity') || labelLower.includes('conduct')) {
      return 'conductivity';
    } else if (labelLower.includes('concentration') || labelLower.includes('na') || labelLower.includes('sodium')) {
      return 'concentration';
    } else if (labelLower.includes('pressure') || labelLower.includes('arterial') || labelLower.includes('venous') || labelLower.includes('tmp')) {
      return 'pressure';
    } else if (labelLower.includes('flow') || labelLower.includes('blood') || labelLower.includes('rate')) {
      return 'flow';
    } else if (labelLower.includes('time') || labelLower.includes('goal') || labelLower.includes('clearance')) {
      return 'time';
    } else {
      return 'other';
    }
  }

  getPerformanceMetrics() {
    return performanceMonitor.getMetrics();
  }

  clearProcessingQueue() {
    this.processingQueue.clear();
    logger.info('Processing queue cleared', 'LLMService');
  }

  /**
   * Process multiple images for data extraction
   * This method handles multiple images and combines their data extraction results
   */
  async processMultipleImages(
    images: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] }, 
    deviceOverride?: string, 
    patientId?: string, 
    deviceMasterId?: string
  ): Promise<{
    data: any[];
    groupedData?: any;
    processingTime: number;
    modelUsed: string;
    patientId?: string;
    deviceMasterId?: string;
    imageCount: number;
    timestamp: string;
  }> {
    const startTime = Date.now();
    const context = 'LLMService.processMultipleImages';
    
    // Handle different image formats (array or object with field names)
    const imageArray = Array.isArray(images) ? images : Object.values(images).flat();
    
    console.log('🚀 [LLMService] ===== PROCESS MULTIPLE IMAGES START =====');
    console.log('🚀 [LLMService] Processing', imageArray.length, 'images at:', new Date().toISOString());
    console.log('🔧 [LLMService] Device override:', deviceOverride);
    console.log('👤 [LLMService] Patient ID:', patientId);
    console.log('🏥 [LLMService] Device Master ID:', deviceMasterId);
    
    try {
      // Convert images to base64 for AI processing
      const imageData = imageArray.map(image => ({
        type: "image_url",
        image_url: {
          url: `data:${image.mimetype};base64,${image.buffer.toString('base64')}`
        }
      }));
      
      // Get device-specific prompt if available
      let devicePrompt = '';
      if (deviceOverride === 'fresenius-4008s') {
        const { FRESENIUS_4008S_PROMPT } = await import('./devices/fresenius/4008s/prompts.js');
        devicePrompt = FRESENIUS_4008S_PROMPT;
      } else if (deviceOverride === 'fresenius-4008b') {
        const { FRESENIUS_4008B_PROMPT } = await import('./devices/fresenius/4008b/prompts.js');
        devicePrompt = FRESENIUS_4008B_PROMPT;
      } else if (deviceOverride === 'nipro-surdialx') {
        const { NIPRO_SURDIALX_PROMPT } = await import('./devices/nipro/surdialx/prompts.js');
        devicePrompt = NIPRO_SURDIALX_PROMPT;
      } else if (deviceOverride === 'nipro-surdial55plus') {
        const { NIPRO_SURDIAL55PLUS_PROMPT } = await import('./devices/nipro/surdial55plus/prompts.js');
        devicePrompt = NIPRO_SURDIAL55PLUS_PROMPT;
      }
      else if (deviceOverride === 'nikkiso-dbb27') {
        const { NIKKISO_DBB27_PROMPT } = await import('./devices/nikkiso/dbb27/prompts.js');
        devicePrompt = NIKKISO_DBB27_PROMPT;
      } else {
        throw new Error(`No prompt found for device: ${deviceOverride}`);
      }
      
      // Prepare AI prompt for multiple images with device-specific analysis
      const prompt = devicePrompt ? `
      ${devicePrompt}
      
      CRITICAL: This is a MULTIPLE IMAGE processing request. You are analyzing ${imageArray.length} images of the same device.
      
      Return a JSON object with the following structure:
      {
        "images": [
          {
            "imageIndex": 0,
            "imageDescription": "Brief description of what this image shows",
            "dataPoints": [
              {
                "label": "Parameter Name",
                "value": "Extracted Value",
                "unit": "Unit of Measurement",
                "confidence": 0.95
              }
            ]
          },
          {
            "imageIndex": 1,
            "imageDescription": "Brief description of what this image shows", 
            "dataPoints": [
              {
                "label": "Parameter Name 2",
                "value": "Extracted Value 2",
                "unit": "Unit of Measurement 2",
                "confidence": 0.92
              }
            ]
          }
        ],
        "combinedAnalysis": {
          "summary": "Overall analysis combining insights from all images",
          "totalDataPoints": 2,
          "imageCount": ${imageArray.length}
        }
      }
      
      Analyze each image individually using the device-specific instructions above and provide specific data points for each one.
      ` : `
      Analyze these ${imageArray.length} medical device images and extract data points from each image individually.
      Each image may show different aspects of the same device or different time points.
      
      Device Type: ${deviceOverride || 'Auto-detect'}
      
      For each image, provide a comprehensive analysis and return a JSON object with the following structure:
      {
        "images": [
          {
            "imageIndex": 0,
            "imageDescription": "Brief description of what this image shows",
            "dataPoints": [
              {
                "id": "unique_identifier",
                "label": "Parameter Name",
                "value": "Extracted Value",
                "unit": "Unit of Measurement",
                "confidence": 0.95
              }
            ]
          },
          {
            "imageIndex": 1,
            "imageDescription": "Brief description of what this image shows",
            "dataPoints": [
              {
                "id": "unique_identifier_2",
                "label": "Parameter Name 2",
                "value": "Extracted Value 2",
                "unit": "Unit of Measurement 2",
                "confidence": 0.92
              }
            ]
          }
        ],
        "combinedAnalysis": {
          "summary": "Overall analysis combining insights from all images",
          "totalDataPoints": 2,
          "imageCount": ${imageArray.length}
        }
      }
      
      Analyze each image individually and provide specific data points for each one.
      `;
      
      // Get OpenAI API key
      const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';
      if (!apiKey) {
        throw new Error('OpenAI API key is required');
      }

      // Call OpenAI API with multiple images
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
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
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
      }

      const responseData = await response.json();
      const content = responseData.choices[0].message.content;
      
      // Extract JSON from markdown code blocks if present
      let jsonContent = content;
      if (content.includes('```json')) {
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) {
          jsonContent = jsonMatch[1].trim();
        }
      } else if (content.includes('```')) {
        // Handle generic code blocks
        const codeMatch = content.match(/```\s*([\s\S]*?)\s*```/);
        if (codeMatch && codeMatch[1]) {
          jsonContent = codeMatch[1].trim();
        }
      }
      
      let extractedData;
      try {
        extractedData = JSON.parse(jsonContent);
      } catch (parseError) {
        const errorMessage = parseError instanceof Error ? parseError.message : String(parseError);
        console.error('❌ [LLMService] JSON parsing failed:', parseError);
        console.error('❌ [LLMService] Raw content:', content);
        console.error('❌ [LLMService] Extracted JSON content:', jsonContent);
        throw new Error(`Failed to parse AI response as JSON: ${errorMessage}`);
      }
      
      const processingTime = (Date.now() - startTime) / 1000;
      
      console.log('✅ [LLMService] ===== PROCESS MULTIPLE IMAGES COMPLETED =====');
      console.log('✅ [LLMService] Processing time:', processingTime, 'seconds');
      console.log('✅ [LLMService] Images analyzed:', extractedData.images?.length || 0);
      console.log('✅ [LLMService] Total data points:', extractedData.combinedAnalysis?.totalDataPoints || 0);
      console.log('🔍 [LLMService] Extracted data structure:', JSON.stringify(extractedData, null, 2));
      
      logger.info('Multiple images processing completed successfully', context, {
        imageCount: imageArray.length,
        imagesAnalyzed: extractedData.images?.length || 0,
        totalDataPoints: extractedData.combinedAnalysis?.totalDataPoints || 0,
        processingTime: processingTime
      });
      
      // Create flattened data for frontend compatibility with proper DeviceDataPoint format
      const flattenedData = extractedData.images?.flatMap((image: any, imageIndex: number) => 
        image.dataPoints?.map((point: any, pointIndex: number) => ({
          id: `${imageIndex}_${pointIndex}`,
          label: point.label || 'Unknown',
          value: point.value || '',
          unit: point.unit,
          confidence: Math.min(Math.max(point.confidence || 0.5, 0), 1),
          deviceModel: deviceOverride || 'Unknown Device',
          category: this.getCategoryForLabel(point.label)
        })) || []
      ) || [];
      
      return {
        // New grouped format for advanced usage
        groupedData: extractedData,
        // Flattened format for frontend compatibility
        data: flattenedData,
        processingTime: processingTime,
        modelUsed: "gpt-4o",
        patientId: patientId,
        deviceMasterId: deviceMasterId,
        imageCount: imageArray.length,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ [LLMService] ===== PROCESS MULTIPLE IMAGES FAILED =====');
      console.error('❌ [LLMService] Error at:', new Date().toISOString());
      console.error('❌ [LLMService] Error:', error);
      
      logger.error('Multiple images processing failed', context, error);
      throw new Error('Failed to process images with AI');
    }
  }
}
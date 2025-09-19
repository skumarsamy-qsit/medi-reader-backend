import { DeviceModel, ProcessingContext } from '../types/devices.js';
import { NiproSurdial55PlusProcessor } from './devices/nipro/surdial55plus/processor.js';
import { NIPRO_SURDIAL55PLUS_CONFIG } from './devices/nipro/surdial55plus/config.js';
import { NiproSurdialXProcessor } from './devices/nipro/surdialx/processor.js';
import { NIPRO_SURDIALX_CONFIG } from './devices/nipro/surdialx/config.js';
import { Fresenius4008SProcessor } from './devices/fresenius/4008s/processor.js';
import { FRESENIUS_4008S_CONFIG } from './devices/fresenius/4008s/config.js';
import { Fresenius4008BProcessor } from './devices/fresenius/4008b/processor.js';
import { FRESENIUS_4008B_CONFIG } from './devices/fresenius/4008b/config.js';
import { NikkisoDBB27Processor } from './devices/nikkiso/dbb27/processor.js';
import { NIKKISO_DBB27_CONFIG } from './devices/nikkiso/dbb27/config.js';
import { DeviceDetector } from './deviceDetector.js';
import { logger } from '../utils/logger.js';
import { performanceMonitor } from '../utils/performance.js';

export interface DeviceProcessor {
  processImage(base64Image: string, context: ProcessingContext): Promise<{
    data: any[];
    processingTime: number;
    modelUsed: string;
  }>;
  processImageViaBackend(
    image: string | Blob, // Accepts base64 or Blob
    context: ProcessingContext,
    backendUrl: string
  ): Promise<{
    data: any[];
    processingTime: number;
    modelUsed: string;
  }>;
  getConfig(): DeviceModel;
  getSupportedUnits(label: string): string[];
}

export class DeviceRegistry {
  private static instance: DeviceRegistry;
  private processors: Map<string, DeviceProcessor> = new Map();
  private models: Map<string, DeviceModel> = new Map();
  private deviceDetector: DeviceDetector;
  private registrationOrder: string[] = [];

  constructor() {
    this.deviceDetector = DeviceDetector.getInstance();
    this.registerDevice('nipro-surdial55plus', new NiproSurdial55PlusProcessor(), NIPRO_SURDIAL55PLUS_CONFIG);
    this.registerDevice('nipro-surdialx', new NiproSurdialXProcessor(), NIPRO_SURDIALX_CONFIG);
    this.registerDevice('fresenius-4008s', new Fresenius4008SProcessor(), FRESENIUS_4008S_CONFIG);
    this.registerDevice('fresenius-4008b', new Fresenius4008BProcessor(), FRESENIUS_4008B_CONFIG);
    this.registerDevice('nikkiso-dbb27', new NikkisoDBB27Processor(), NIKKISO_DBB27_CONFIG);
    
    logger.info('Device registry initialized', 'DeviceRegistry', {
      deviceCount: this.processors.size,
      devices: this.registrationOrder
    });
  }

  static getInstance(): DeviceRegistry {
    if (!DeviceRegistry.instance) {
      DeviceRegistry.instance = new DeviceRegistry();
    }
    return DeviceRegistry.instance;
  }

  private registerDevice(key: string, processor: DeviceProcessor, config: DeviceModel) {
    this.processors.set(key, processor);
    this.models.set(key, config);
    this.registrationOrder.push(key);
    logger.info('Device registered', 'DeviceRegistry', { 
      key, 
      displayName: config.displayName,
      supportedDataPoints: config.supportedDataPoints.length
    });
  }

  getProcessor(deviceKey: string): DeviceProcessor | null {
    const processor = this.processors.get(deviceKey) || null;
    if (!processor) {
      logger.warn('Processor not found', 'DeviceRegistry.getProcessor', { deviceKey });
    }
    return processor;
  }

  getModel(deviceKey: string): DeviceModel | null {
    const model = this.models.get(deviceKey) || null;
    if (!model) {
      logger.warn('Model not found', 'DeviceRegistry.getModel', { deviceKey });
    }
    return model;
  }

  getAllModels(): DeviceModel[] {
    return Array.from(this.models.values());
  }


  async detectDevice(base64Image: string, useCache: boolean = true): Promise<string> {
    const context = 'DeviceRegistry.detectDevice';
    logger.info('Starting device detection', context, { useCache });
    
    try {
      performanceMonitor.startTimer('registry_device_detection');
      const detectedDevice = await this.deviceDetector.detectDevice(base64Image, useCache);
      performanceMonitor.endTimer('registry_device_detection');
      
      logger.info('Device detected', context, { device: detectedDevice });
      return detectedDevice;
    } catch (error) {
      performanceMonitor.endTimer('registry_device_detection');
      logger.error('Detection failed, using default', context, error);
      return 'nipro-surdialx'; // Default fallback
    }
  }

  getSupportedDevices(): Array<{ key: string; model: DeviceModel }> {
    return Array.from(this.models.entries()).map(([key, model]) => ({ key, model }));
  }

  getRegistryStats() {
    return {
      deviceCount: this.processors.size,
      registrationOrder: this.registrationOrder,
      supportedDevices: this.getSupportedDevices().map(d => ({
        key: d.key,
        displayName: d.model.displayName,
        dataPointCount: d.model.supportedDataPoints.length
      })),
      detectorStats: this.deviceDetector.getDetectionStats()
    };
  }

  validateDeviceSupport(deviceKey: string): boolean {
    const isSupported = this.processors.has(deviceKey) && this.models.has(deviceKey);
    if (!isSupported) {
      logger.warn('Device not supported', 'DeviceRegistry.validateDeviceSupport', { deviceKey });
    }
    return isSupported;
  }
}
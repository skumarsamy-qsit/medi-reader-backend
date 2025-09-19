export interface DeviceModel {
  brand: string;
  model: string;
  version: string;
  displayName: string;
  supportedDataPoints: string[];
  confidenceThresholds: {
    high: number;
    medium: number;
    low: number;
  };
  validationRules: ValidationRule[];
}

export interface ValidationRule {
  field: string;
  type: 'range' | 'pattern' | 'required';
  min?: number;
  max?: number;
  pattern?: string;
  message: string;
}

export interface DeviceDataPoint {
  id: string;
  label: string;
  value: string;
  unit?: string;
  confidence: number;
  deviceModel: string;
  category: 'ultrafiltration' | 'temperature' | 'conductivity' | 'concentration' | 'pressure' | 'flow' | 'time' | 'other';
}

export interface ProcessingContext {
  deviceModel: DeviceModel;
  imageUri: string;
  patientId: string;
  deviceMasterId?: string;
  deviceOverride?: string;
  processingOptions: {
    enhanceImage: boolean;
    useDeviceSpecificPrompt: boolean;
    validateResults: boolean;
  };
}
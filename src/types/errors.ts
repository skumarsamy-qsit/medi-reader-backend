export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  context?: string;
}

export class ProcessingError extends Error {
  public readonly code: string;
  public readonly details?: any;
  public readonly timestamp: Date;
  public readonly context?: string;

  constructor(code: string, message: string, details?: any, context?: string) {
    super(message);
    this.name = 'ProcessingError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date();
    this.context = context;
  }
}

export class ValidationError extends Error {
  public readonly field: string;
  public readonly value: any;
  public readonly rule: string;

  constructor(field: string, value: any, rule: string, message: string) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.value = value;
    this.rule = rule;
  }
}

export class NetworkError extends Error {
  public readonly status?: number;
  public readonly response?: string;

  constructor(message: string, status?: number, response?: string) {
    super(message);
    this.name = 'NetworkError';
    this.status = status;
    this.response = response;
  }
}

export const ERROR_CODES = {
  // Processing errors
  PROCESSING_FAILED: 'PROCESSING_FAILED',
  INVALID_IMAGE: 'INVALID_IMAGE',
  API_KEY_MISSING: 'API_KEY_MISSING',
  DEVICE_NOT_SUPPORTED: 'DEVICE_NOT_SUPPORTED',
  OPENAI_REFUSAL: 'OPENAI_REFUSAL',
  
  // Network errors
  NETWORK_TIMEOUT: 'NETWORK_TIMEOUT',
  API_RATE_LIMIT: 'API_RATE_LIMIT',
  API_UNAVAILABLE: 'API_UNAVAILABLE',
  
  // Storage errors
  STORAGE_FAILED: 'STORAGE_FAILED',
  STORAGE_FULL: 'STORAGE_FULL',
  
  // Validation errors
  INVALID_DATA: 'INVALID_DATA',
  OUT_OF_RANGE: 'OUT_OF_RANGE',
  
  // Camera errors
  CAMERA_PERMISSION_DENIED: 'CAMERA_PERMISSION_DENIED',
  CAMERA_UNAVAILABLE: 'CAMERA_UNAVAILABLE',
} as const;
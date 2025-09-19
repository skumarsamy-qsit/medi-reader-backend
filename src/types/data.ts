export interface DataPoint {
  id: string;
  label: string;
  value: string;
  unit?: string;
  confidence: number;
}

export interface ProcessingResult {
  id: string;
  imageUri: string;
  extractedData: DataPoint[]; // Keep for backward compatibility
  processingTime: number;
  modelUsed: string;
  timestamp: string;
  deviceModel?: string; // Add device model info
  patientId?: string; // Link to patient
  deviceMasterId?: string; // Link to device master
}

export interface HistoryRecord {
  id: string;
  timestamp: string;
  deviceId: string;
  readings: { label: string; value: string; unit?: string }[];
  sessionType: 'Dialysis' | 'Ultrafiltration' | 'Other';
  originalImageUri?: string | null;
  deviceModel?: string; // Add device model info
  patientId?: string; // Link to patient
  patientName?: string; // For display purposes
  patientNric?: string; // For identification
  deviceMasterId?: string; // Link to device master
  deviceMasterName?: string; // For display purposes
  deviceMasterLocation?: string; // For identification
}

export interface AppSettings {
  notificationsEnabled: boolean;
  autoProcess: boolean;
  saveOriginalImages: boolean;
  offlineMode: boolean;
  preferredDevice?: string; // Add preferred device setting
}
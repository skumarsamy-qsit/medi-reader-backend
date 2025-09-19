import { DeviceModel, ValidationRule } from '../../../../types/devices.js';

export const NIPRO_SURDIALX_CONFIG: DeviceModel = {
  brand: 'Nipro',
  model: 'SurdialX',
  version: '1.0',
  displayName: 'Nipro SurdialX',
  supportedDataPoints: [
    'MACHINE_ID',
    'BLOOD_FLOW',
    'TREATMENT_TIME_REMAINING',
    'UF_GOAL',
    'UF_RATE',
    'UF_VOL',
    'ART_PRESSURE',
    'VEN_PRESSURE', 
    'TMP',
    'COND',
    'B_COND',
    'TEMP',
    'PRESCR_NA',
    'PRESCR_BIC',
    'HEPARIN_TOTAL_VOL',
    'HEPARIN_RATE',
    'BPM_SYSTOLIC',
    'BPM_DIASTOLIC',
    'BPM_PULSE',
    'BPM_SYSTOLIC',
    'BPM_DIASTOLIC',
    'BPM_PULSE',
    'CURRENT_DATE',
    'CURRENT_TIME',
    'DIALYSATE_FLOW'
  ],
  confidenceThresholds: {
    high: 0.95,
    medium: 0.85,
    low: 0.70
  },
  validationRules: [
    {
      field: 'TEMP',
      type: 'range',
      min: 30,
      max: 40,
      message: 'Temperature should be between 30-40°C'
    },
    {
      field: 'UF_GOAL',
      type: 'range',
      min: 0,
      max: 10,
      message: 'UF Goal should be between 0-10L'
    },
    {
      field: 'UF_RATE',
      type: 'range',
      min: 0,
      max: 2,
      message: 'UF Rate should be between 0-2 L/h'
    },
    {
      field: 'COND',
      type: 'range',
      min: 10,
      max: 20,
      message: 'Conductivity should be between 10-20 mS/cm'
    },
    {
      field: 'PRESCR_NA',
      type: 'range',
      min: 130,
      max: 150,
      message: 'Prescribed Sodium should be between 130-150 mEq/L'
    },
    {
      field: 'PRESCR_BIC',
      type: 'range',
      min: 20,
      max: 40,
      message: 'Prescribed Bicarbonate should be between 20-40 mEq/L'
    },
    {
      field: 'ART_PRESSURE',
      type: 'range',
      min: -300,
      max: 0,
      message: 'Arterial pressure should be between -300 to 0 mmHg'
    },
    {
      field: 'VEN_PRESSURE',
      type: 'range',
      min: 0,
      max: 300,
      message: 'Venous pressure should be between 0-300 mmHg'
    },
    {
      field: 'BLOOD_FLOW',
      type: 'range',
      min: 50,
      max: 500,
      message: 'Blood flow should be between 50-500 mL/min'
    }
  ]
};

export const NIPRO_SURDIALX_UNITS = {
  'MACHINE_ID': [],
  'BLOOD_FLOW': ['mL/min'],
  'TREATMENT_TIME_REMAINING': ['h:mm'],
  'UF_GOAL': ['L', 'mL'],
  'UF_RATE': ['L/h', 'mL/min'],
  'UF_VOL': ['L', 'mL'],
  'ART_PRESSURE': ['mmHg'],
  'VEN_PRESSURE': ['mmHg'],
  'TMP': ['mmHg'],
  'COND': ['mS/cm'],
  'B_COND': ['mS/cm'],
  'TEMP': ['°C'],
  'PRESCR_NA': ['mEq/L', 'mmol/L'],
  'PRESCR_BIC': ['mEq/L', 'mmol/L'],
  'HEPARIN_TOTAL_VOL': ['mL'],
  'HEPARIN_RATE': ['mL/h'],
  'BPM_SYSTOLIC': ['mmHg'],
  'BPM_DIASTOLIC': ['mmHg'],
  'BPM_PULSE': ['bpm'],
  'CURRENT_DATE': [],
  'CURRENT_TIME': [],
  'DIALYSATE_FLOW': ['mL/min']
};

export const NIPRO_SURDIALX_CATEGORIES = {
  'MACHINE_ID': 'other',
  'BLOOD_FLOW': 'flow',
  'TREATMENT_TIME_REMAINING': 'time',
  'UF_GOAL': 'ultrafiltration',
  'UF_RATE': 'ultrafiltration',
  'UF_VOL': 'ultrafiltration',
  'ART_PRESSURE': 'pressure',
  'VEN_PRESSURE': 'pressure',
  'TMP': 'pressure',
  'COND': 'conductivity',
  'B_COND': 'conductivity',
  'TEMP': 'temperature',
  'PRESCR_NA': 'concentration',
  'PRESCR_BIC': 'concentration',
  'HEPARIN_TOTAL_VOL': 'flow',
  'HEPARIN_RATE': 'flow',
  'BPM_SYSTOLIC': 'pressure',
  'BPM_DIASTOLIC': 'pressure',
  'BPM_PULSE': 'other',
  'CURRENT_DATE': 'time',
  'CURRENT_TIME': 'time',
  'DIALYSATE_FLOW': 'flow'
} as const;
import { DeviceModel, ValidationRule } from '../../../../types/devices.js';

export const NIPRO_SURDIAL55PLUS_CONFIG: DeviceModel = {
  brand: 'Nipro',
  model: 'Surdial 55 Plus',
  version: '1.0',
  displayName: 'Nipro Surdial 55 Plus',
  supportedDataPoints: [
    'UF REMOVED',
    'UF GOAL', 
    'UF LEFT',
    'UF RATE',
    'UF FINISH TIME',
    'TEMP',
    'COND',
    'B COND',
    'Na',
    'Bic',
    'HEPARIN PUMP',
    'DEVICE ID',
    'CURRENT TIME',
    'DIA LEFT',
    'BLOOD PUMP',
    'DIALYSATE FLOW',
    'TMP',
    'VENOUS PRESSURE',
    'ARTERIAL PRESSURE'
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
      field: 'UF REMOVED',
      type: 'range',
      min: 0,
      max: 10,
      message: 'UF Removed should be between 0-10L'
    },
    {
      field: 'COND',
      type: 'range',
      min: 10,
      max: 20,
      message: 'Conductivity should be between 10-20 mS/cm'
    },
    {
      field: 'Na',
      type: 'range',
      min: 130,
      max: 150,
      message: 'Sodium should be between 130-150 mEq/L'
    },
    {
      field: 'Bic',
      type: 'range',
      min: 20,
      max: 40,
      message: 'Bicarbonate should be between 20-40 mEq/L'
    }
  ]
};

export const NIPRO_SURDIAL55PLUS_UNITS = {
  'UF REMOVED': ['L', 'mL'],
  'UF GOAL': ['L', 'mL'],
  'UF RATE': ['mL/min', 'L/h'],
  'TEMP': ['°C'],
  'COND': ['mS/cm'],
  'B COND': ['mS/cm'],
  'Na': ['mEq/L', 'mmol/L'],
  'Bic': ['mEq/L', 'mmol/L'],
  'HEPARIN PUMP': ['mL/h'],
  'BLOOD PUMP': ['mL/min'],
  'DIALYSATE FLOW': ['mL/min'],
  'TMP': ['mmHg'],
  'VENOUS PRESSURE': ['mmHg'],
  'ARTERIAL PRESSURE': ['mmHg']
};

export const NIPRO_SURDIAL55PLUS_CATEGORIES = {
  'UF REMOVED': 'ultrafiltration',
  'UF GOAL': 'ultrafiltration',
  'UF LEFT': 'time',
  'UF RATE': 'ultrafiltration',
  'UF FINISH TIME': 'time',
  'TEMP': 'temperature',
  'COND': 'conductivity',
  'B COND': 'conductivity',
  'Na': 'concentration',
  'Bic': 'concentration',
  'HEPARIN PUMP': 'flow',
  'DEVICE ID': 'other',
  'CURRENT TIME': 'time',
  'DIA LEFT': 'time',
  'BLOOD PUMP': 'flow',
  'DIALYSATE FLOW': 'flow',
  'TMP': 'pressure',
  'VENOUS PRESSURE': 'pressure',
  'ARTERIAL PRESSURE': 'pressure'
} as const;
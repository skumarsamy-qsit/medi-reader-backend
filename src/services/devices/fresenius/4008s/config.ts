import { DeviceModel, ValidationRule } from '../../../../types/devices.js';

export const FRESENIUS_4008S_CONFIG: DeviceModel = {
  brand: 'Fresenius',
  model: '4008 S',
  version: '1.0',
  displayName: 'Fresenius 4008 S',
  supportedDataPoints: [
    'UF VOLUME',
    'UF TIME LEFT',
    'UF RATE',
    'UF GOAL',
    'EFF. BLOOD FLOW',
    'CUM. BLOOD VOL',
    'ARTERIAL PRESSURE',
    'VENOUS PRESSURE',
    'TMP',
    'CONDUCTIVITY',
    'BOTTOM_DISPLAY_1',
    'BOTTOM_DISPLAY_2',
    
  ],
  confidenceThresholds: {
    high: 0.95,
    medium: 0.85,
    low: 0.70
  },
  validationRules: [
    {
      field: 'UF VOLUME',
      type: 'range',
      min: 0,
      max: 10000,
      message: 'UF Volume should be between 0-10000 mL'
    },
    {
      field: 'UF RATE',
      type: 'range',
      min: 0,
      max: 3000,
      message: 'UF Rate should be between 0-3000 mL/h'
    },
    {
      field: 'UF GOAL',
      type: 'range',
      min: 0,
      max: 10000,
      message: 'UF Goal should be between 0-10000 mL'
    },
    {
      field: 'EFF. BLOOD FLOW',
      type: 'range',
      min: 50,
      max: 500,
      message: 'Effective Blood Flow should be between 50-500 mL/min'
    },
    {
      field: 'ARTERIAL PRESSURE',
      type: 'range',
      min: -400,
      max: 0,
      message: 'Arterial pressure should be between -400 to 0 mmHg'
    },
    {
      field: 'VENOUS PRESSURE',
      type: 'range',
      min: 0,
      max: 400,
      message: 'Venous pressure should be between 0-400 mmHg'
    },
    {
      field: 'TMP',
      type: 'range',
      min: 0,
      max: 500,
      message: 'TMP should be between 0-500 mmHg'
    },
    {
      field: 'CONDUCTIVITY',
      type: 'range',
      min: 10,
      max: 20,
      message: 'Conductivity should be between 10-20 mS/cm'
    }
  ]
};

export const FRESENIUS_4008S_UNITS = {
  'UF VOLUME': ['mL'],
  'UF TIME LEFT': ['h:mm'],
  'UF RATE': ['mL/h'],
  'UF GOAL': ['mL'],
  'EFF. BLOOD FLOW': ['mL/min'],
  'CUM. BLOOD VOL': ['L'],
  'ARTERIAL PRESSURE': ['mmHg'],
  'VENOUS PRESSURE': ['mmHg'],
  'TMP': ['mmHg'],
  'CONDUCTIVITY': ['mS/cm'],
  'BOTTOM_DISPLAY_1': [],
  'BOTTOM_DISPLAY_2': []
};

export const FRESENIUS_4008S_CATEGORIES = {
  'UF VOLUME': 'ultrafiltration',
  'UF TIME LEFT': 'time',
  'UF RATE': 'ultrafiltration',
  'UF GOAL': 'ultrafiltration',
  'EFF. BLOOD FLOW': 'flow',
  'CUM. BLOOD VOL': 'flow',
  'ARTERIAL PRESSURE': 'pressure',
  'VENOUS PRESSURE': 'pressure',
  'TMP': 'pressure',
  'CONDUCTIVITY': 'conductivity',
  'BOTTOM_DISPLAY_1': 'other',
  'BOTTOM_DISPLAY_2': 'other'
} as const;
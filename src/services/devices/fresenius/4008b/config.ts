import { DeviceModel, ValidationRule } from '../../../../types/devices.js';

export const FRESENIUS_4008B_CONFIG: DeviceModel = {
  brand: 'Fresenius',
  model: '4008 B',
  version: '1.0',
  displayName: 'Fresenius 4008 B',
  supportedDataPoints: [
    'UF VOLUME',
    'TIME LEFT',
    'UF RATE',
    'UF GOAL',
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

export const FRESENIUS_4008B_UNITS = {
  'UF VOLUME': ['mL'],
  'TIME LEFT': ['h:mm'],
  'UF RATE': ['mL/h'],
  'UF GOAL': ['mL'],
  'ARTERIAL PRESSURE': ['mmHg'],
  'VENOUS PRESSURE': ['mmHg'],
  'TMP': ['mmHg'],
  'CONDUCTIVITY': ['mS/cm'],
  'BOTTOM_DISPLAY_1': [],
  'BOTTOM_DISPLAY_2': []
};

export const FRESENIUS_4008B_CATEGORIES = {
  
} as const;
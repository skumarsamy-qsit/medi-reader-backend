import { DeviceModel, ValidationRule } from '../../../../types/devices.js';

export const NIKKISO_DBB27_CONFIG: DeviceModel = {
  brand: 'Nikkiso',
  model: 'DBB-27',
  version: '1.0',
  displayName: 'Nikkiso DBB-27',
  supportedDataPoints: [
    'VEN PRESS',
    'DIALY PRESS',
    'UF VOLUME',
    'UF GOAL',
    'UF RATE',
    
    'START TIME',
    'ELAPSED TIME',
    'COMPLETE TIME',
    'REMAIN TIME',
    
    'DIALY FLOW',
    'DIALY TEMP',    
    
    'T CONDUCT',
    'B CONDUCT',
    'IP TOTAL',
    'Na CONDUCT',
    'B. FLOW',
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
      field: 'B. FLOW',
      type: 'range',
      min: 50,
      max: 500,
      message: 'Blood flow should be between 50-500 mL/min'
    },
    {
      field: 'DIALY FLOW',
      type: 'range',
      min: 300,
      max: 800,
      message: 'Dialysate flow should be between 300-800 mL/min'
    },
    {
      field: 'VEN PRESS',
      type: 'range',
      min: 0,
      max: 400,
      message: 'Venous pressure should be between 0-400 mmHg'
    },
    {
      field: 'DIALY PRESS',
      type: 'range',
      min: 0,
      max: 500,
      message: 'DIALY PRESS  should be between 0-500 mmHg'
    },
    {
      field: 'T CONDUCT',
      type: 'range',
      min: 10,
      max: 20,
      message: 'T Conductivity should be between 10-20 mS/cm'
    },
    {
      field: 'B CONDUCT',
      type: 'range',
      min: 10,
      max: 20,
      message: 'B Conductivity should be between 10-20 mS/cm'
    },
    {
      field: 'DIALY TEMP',
      type: 'range',
      min: 30,
      max: 40,
      message: 'Dialysate Temperature should be between 30-40°C'
    },
    {
      field: 'IP TOTAL',
      type: 'range',
      min: 0,
      max: 10.0,
      message: 'IP Total should be between 0-10000 mL'
    },
    {
      field: 'Na CONDUCT',
      type: 'range',
      min: 130,
      max: 150,
      message: 'Sodium concentration should be between 130-150 mEq/L'
    },

  ]
};

export const NIKKISO_DBB27_UNITS = {
  'UF VOLUME': ['mL', 'L'],
  'UF RATE': ['mL/h', 'L/h'],
  'UF GOAL': ['mL', 'L'],
  'START TIME': ['h:mm'],
  'ELAPSED TIME': ['h:mm'],
  'COMPLETE TIME': ['h:mm'],
  'REMAIN TIME': ['h:mm'],
  'B. FLOW': ['mL/min'],
  'DIALYS FLOW': ['mL/min'],
  'VEN PRESS': ['mmHg'],
  'DIALY PRESS': ['mmHg'],
  'T CONDUCT': ['mS/cm'],
  'B CONDUCT': ['mS/cm'],
  'DIALY TEMPE': ['°C'],
  'IP TOTAL': ['mL', 'L'],
  'Na CONDUCT': ['mEq/L', 'mmol/L']
};

export const NIKKISO_DBB27_CATEGORIES = {
  /*'UF_VOLUME': 'ultrafiltration',
  'UF_RATE': 'ultrafiltration',
  'UF_GOAL': 'ultrafiltration',
  'TREATMENT_TIME': 'time',
  'TIME_REMAINING': 'time',
  'BLOOD_FLOW': 'flow',
  'DIALYSATE_FLOW': 'flow',
  'ARTERIAL_PRESSURE': 'pressure',
  'VENOUS_PRESSURE': 'pressure',
  'TMP': 'pressure',
  'CONDUCTIVITY': 'conductivity',
  'TEMPERATURE': 'temperature',
  'SODIUM_CONCENTRATION': 'concentration',
  'BICARBONATE_CONCENTRATION': 'concentration',
  'HEPARIN_RATE': 'flow',
  'HEPARIN_VOLUME': 'flow',
  'BLOOD_PUMP_SPEED': 'flow',
  'MACHINE_STATUS': 'other',
  'ALARM_STATUS': 'other',
  'SESSION_TYPE': 'other',
  'PATIENT_ID': 'other',
  'CURRENT_TIME': 'time',
  'CURRENT_DATE': 'time',
  'BOTTOM_DISPLAY_1': 'other',
  'BOTTOM_DISPLAY_2': 'other',
  'BOTTOM_DISPLAY_3': 'other'*/
} as const;
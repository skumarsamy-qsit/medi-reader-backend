import { DeviceModel, ValidationRule } from '../../../../types/devices.js';

export const FRESENIUS_4008S_CONFIG: DeviceModel = {
  brand: 'Fresenius',
  model: '4008 S',
  version: '1.0',
  displayName: 'Fresenius 4008 S',
  supportedDataPoints: [
    'Kt/V',
    'PLASMA NA',
    'GOAL IN',
    'CLEARANCE',
    'UF VOLUME',
    'UF TIME LEFT',
    'UF RATE',
    'UF GOAL',
    'EFF. BLOOD FLOW',
    'CUM. BLOOD VOL',
    'BLOOD PRESSURE SYS',
    'BLOOD PRESSURE DIA',
    'BLOOD PRESSURE MAP',
    'BLOOD PRESSURE PULSE',
    'QB(ml/min)',
    'Anticoagulant (ml)', // sometimes this value has to be taken as Hourly, if it is more than 5 ml/h, and to be termed as Initial (Bolus), 30minuts or 1 hour, and stop time.
    'ARTERIAL PRESSURE',
    'VENOUS PRESSURE',
    'TMP',
    'CONDUCTIVITY',
    // New data points for newer 4008S versions (Dialysate menu)
    'BPM_SYS',
    'BPM_DIA',
    'DILUTION',
    'BASE_NA',
    'PRESCRIBED_NA',
    'BICARBONATE',
    'TEMPERATURE',
    'DIALYSATE_FLOW',
    'NA_PROFILE',
    'START_NA',
    'CDS_STATUS',
    'EMPTY_BIBAG',
    'CONDUCTIVITY_WINDOW'
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
      field: 'Kt/V',
      type: 'range',
      min: 0.0,
      max: 2.0,
      message: 'Kt/V should be between 0.0-2.0'
    },
    {
      field: 'PLASMA NA',
      type: 'range',
      min: 0,
      max: 500,
      message: 'Plasma Na should be between 0-500 mmol/L'
    },
    {
      field: 'UF GOAL',
      type: 'range',
      min: 0,
      max: 10000,
      message: 'UF Goal should be between 0-10000 mL'
    },
    {
      field: 'GOAL IN',
      type: 'range',
      min: 0,
      max: 5,
      message: 'Goal In should be between 0 - 5 hours (h:mm)'
    },
    {
      field: 'CLEARANCE',
      type: 'range',
      min: 0,
      max: 500,
      message: 'Clearance should be between 0-500 ml/min'
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
    },
    {
      field: 'QB(ml/min)',
      type: 'range',
      min: 0,
      max: 1000,
      message: 'Rate should be between 0-1000 ml/min'
    },
    {
      field: 'Anticoagulant (ml)',
      type: 'range',
      min: 0.0,
      max: 5.0,
      message: 'Bolus should be between 0-5 ml'
    },
    {
      field: 'BLOOD PRESSURE SYS',
      type: 'range',
      min: 80,
      max: 200,
      message: 'Systolic blood pressure should be between 80-200 mmHg'
    },
    {
      field: 'BLOOD PRESSURE DIA',
      type: 'range',
      min: 40,
      max: 120,
      message: 'Diastolic blood pressure should be between 40-120 mmHg'
    },
    {
      field: 'BLOOD PRESSURE MAP',
      type: 'range',
      min: 60,
      max: 150,
      message: 'Mean arterial pressure should be between 60-150 mmHg'
    },
    {
      field: 'BLOOD PRESSURE PULSE',
      type: 'range',
      min: 40,
      max: 120,
      message: 'Pulse rate should be between 40-120 1/min'
    },
    // New validation rules for newer 4008S versions
    {
      field: 'BPM_SYS',
      type: 'range',
      min: 80,
      max: 200,
      message: 'BPM Systolic should be between 80-200 mmHg'
    },
    {
      field: 'BPM_DIA',
      type: 'range',
      min: 40,
      max: 120,
      message: 'BPM Diastolic should be between 40-120 mmHg'
    },
    {
      field: 'DILUTION',
      type: 'pattern',
      pattern: '^\\d+\\+\\d+$',
      message: 'Dilution should be in format like "1+34"'
    },
    {
      field: 'BASE_NA',
      type: 'range',
      min: 120,
      max: 150,
      message: 'Base Na+ should be between 120-150 mmol/l'
    },
    {
      field: 'PRESCRIBED_NA',
      type: 'range',
      min: 120,
      max: 150,
      message: 'Prescribed Na+ should be between 120-150 mmol/l'
    },
    {
      field: 'BICARBONATE',
      type: 'range',
      min: -10,
      max: 10,
      message: 'Bicarbonate should be between -10 to +10 mmol/l'
    },
    {
      field: 'TEMPERATURE',
      type: 'range',
      min: 35.0,
      max: 40.0,
      message: 'Temperature should be between 35.0-40.0 °C'
    },
    {
      field: 'DIALYSATE_FLOW',
      type: 'range',
      min: 300,
      max: 800,
      message: 'Dialysate flow should be between 300-800 ml/min'
    },
    {
      field: 'NA_PROFILE',
      type: 'range',
      min: 0,
      max: 10,
      message: 'Na Profile should be between 0-10'
    },
    {
      field: 'START_NA',
      type: 'range',
      min: 0,
      max: 150,
      message: 'Start Na+ should be between 0-150 mmol/l'
    },
    {
      field: 'CONDUCTIVITY_WINDOW',
      type: 'range',
      min: 13.0,
      max: 15.5,
      message: 'Conductivity window should be between 13.0-15.5 mS/cm'
    }
  ]
};

export const FRESENIUS_4008S_UNITS = {
  'Kt/V': [''],
  'PLASMA NA': ['mmol/l'],
  'GOAL IN': ['h:mm'],
  'CLEARANCE': ['ml/min'],
  'UF VOLUME': ['mL'],
  'UF TIME LEFT': ['h:mm'],
  'UF RATE': ['mL/h'],
  'UF GOAL': ['mL'],
  'EFF. BLOOD FLOW': ['mL/min'],
  'CUM. BLOOD VOL': ['L'],
  'BLOOD PRESSURE SYS': ['mmHg'],
  'BLOOD PRESSURE DIA': ['mmHg'],
  'BLOOD PRESSURE MAP': ['mmHg'],
  'BLOOD PRESSURE PULSE': ['1/min'],
  'QB(ml/min)': ['ml/min'],
  'Anticoagulant (ml)': ['ml'],
  'ARTERIAL PRESSURE': ['mmHg'],
  'VENOUS PRESSURE': ['mmHg'],
  'TMP': ['mmHg'],
  'CONDUCTIVITY': ['mS/cm'],
  // New units for newer 4008S versions
  'BPM_SYS': ['mmHg'],
  'BPM_DIA': ['mmHg'],
  'DILUTION': [''],
  'BASE_NA': ['mmol/l'],
  'PRESCRIBED_NA': ['mmol/l'],
  'BICARBONATE': ['mmol/l'],
  'TEMPERATURE': ['°C'],
  'DIALYSATE_FLOW': ['ml/min'],
  'NA_PROFILE': [''],
  'START_NA': ['mmol/l'],
  'CDS_STATUS': [''],
  'EMPTY_BIBAG': [''],
  'CONDUCTIVITY_WINDOW': ['mS/cm']
};

export const FRESENIUS_4008S_CATEGORIES = {
  'Kt/V': 'ultrafiltration',
  'PLASMA NA': 'electrolyte',
  'GOAL IN': 'time',
  'CLEARANCE': 'clearance',
  'UF VOLUME': 'ultrafiltration',
  'UF TIME LEFT': 'time',
  'UF RATE': 'ultrafiltration',
  'UF GOAL': 'ultrafiltration',
  'EFF. BLOOD FLOW': 'flow',
  'CUM. BLOOD VOL': 'flow',
  'BLOOD PRESSURE SYS': 'vital_signs',
  'BLOOD PRESSURE DIA': 'vital_signs',
  'BLOOD PRESSURE MAP': 'vital_signs',
  'BLOOD PRESSURE PULSE': 'vital_signs',
  'QB(ml/min)': 'pump', // sometimes this value has to be taken as Hourly, if it is more than 5 ml/h, and to be termed as Initial (Bolus), 30minuts or 1 hour, and stop time.
  'Anticoagulant (ml)': 'pump',
  'ARTERIAL PRESSURE': 'pressure',
  'VENOUS PRESSURE': 'pressure',
  'TMP': 'pressure',
  'CONDUCTIVITY': 'conductivity',
  // New categories for newer 4008S versions
  'BPM_SYS': 'vital_signs',
  'BPM_DIA': 'vital_signs',
  'DILUTION': 'dialysate',
  'BASE_NA': 'electrolyte',
  'PRESCRIBED_NA': 'electrolyte',
  'BICARBONATE': 'electrolyte',
  'TEMPERATURE': 'dialysate',
  'DIALYSATE_FLOW': 'flow',
  'NA_PROFILE': 'dialysate',
  'START_NA': 'electrolyte',
  'CDS_STATUS': 'status',
  'EMPTY_BIBAG': 'status',
  'CONDUCTIVITY_WINDOW': 'conductivity'
} as const;
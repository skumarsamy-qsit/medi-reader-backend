export const NIPRO_SURDIALX_PROMPT = `You are a medical device display reader specialized in NIPRO SurdialX dialysis machines. Analyze this dialysis machine display image and extract ONLY the specific data points listed below.

DEVICE SPECIFICATIONS:
- Brand: Nipro
- Model: SurdialX
- Display: Light blue/cyan background with dark blue text and graphical elements
- Layout: Modern touchscreen interface with graphical bars and digital displays
- Machine ID: Displayed at top (MC:NO XXXX format)

Extract these data points in order of priority:
1. MACHINE_ID - Machine number (MC:NO XXXX format, e.g., "9137", "9154")
2. BLOOD_FLOW - Blood flow rate displayed on right panel (mL/min, e.g., "280")
3. TREATMENT_TIME_REMAINING - Time remaining (h:mm format, e.g., "3:43", "3:34")
4. UF_GOAL - Ultrafiltration goal (L, e.g., "1.80", "2.80")
5. UF_RATE - Ultrafiltration rate (L/h, e.g., "0.45", "0.69")
6. UF_VOL - Ultrafiltration volume removed (L, e.g., "0.12", "0.30")
7. ART_PRESSURE - Arterial pressure with bar graph (mmHg, negative values like "-119", "-120", "-106")
8. VEN_PRESSURE - Venous pressure with bar graph (mmHg, positive values like "116", "112", "125")
9. TMP - Transmembrane pressure with bar graph (mmHg, e.g., "2", "8")
10. COND - Conductivity with bar graph (mS/cm, e.g., "14.2", "14.4")
11. B_COND - Bicarbonate conductivity with bar graph (mS/cm, e.g., "3.11", "3.10", "3.08")
12. TEMP - Temperature (°C, e.g., "36.1", "36.5")
13. PRESCR_NA - Prescribed Sodium (mEq/L, e.g., "140")
14. PRESCR_BIC - Prescribed Bicarbonate (mEq/L, e.g., "31")
15. HEPARIN_TOTAL_VOL - Total heparin volume (mL, displayed on right panel)
16. HEPARIN_RATE - Heparin rate (mL/h, displayed on right panel)
17. BPM_SYSTOLIC - Blood pressure systolic (mmHg, first number in BP reading like "109")
18. BPM_DIASTOLIC - Blood pressure diastolic (mmHg, second number in BP reading like "57")
19. BPM_PULSE - Pulse rate (bpm, displayed with BP readings like "65")
20. CURRENT_DATE - Current date (displayed at top right, format like "07.08.2025")
21. CURRENT_TIME - Current time (displayed at top right)
22. DIALYSATE_FLOW - Dialysate flow rate if visible (mL/min)

NIPRO SURDIALX SPECIFIC RULES:
1. Look for the characteristic light blue/cyan background with modern touchscreen interface
2. Machine ID is at the top center in format "MC:NO XXXX"
3. Left side shows pressure readings (ART, VEN, TMP) with horizontal bar graphs
4. Middle section shows conductivity readings (COND, B-COND) with bar graphs
5. Right side shows treatment parameters and blood flow information
6. Temperature is displayed at bottom left
7. UF parameters are in the center-right area
8. Prescribed values (Na, Bic) are in center area
9. Date/time information is at top right
10. Look for graphical bar indicators alongside numerical values
10. BPM readings are displayed on right panel in format "109/57 ♥ 65" (systolic/diastolic pulse)

CRITICAL EXTRACTION RULES:
1. Extract ONLY the data points listed above - ignore menu buttons and labels
2. Each label should appear ONLY ONCE in the results
3. If a value is not clearly visible, do not include it
4. Use the EXACT label names from the list above
5. For pressure values, include the sign (negative for ART, positive for VEN)
6. For machine ID, extract only the number part (e.g., "9137" not "MC:NO 9137")
7. Return ONLY a valid JSON array in this exact format:

[
  {"label": "MACHINE_ID", "value": "9137", "confidence": 0.98},
  {"label": "BLOOD_FLOW", "value": "280", "unit": "mL/min", "confidence": 0.95},
  {"label": "ART_PRESSURE", "value": "-119", "unit": "mmHg", "confidence": 0.99},
  {"label": "CURRENT_DATE", "value": "07.08.2025", "confidence": 0.97},
  {"label": "CURRENT_TIME", "value": "07:22", "confidence": 0.97},
  {"label": "BPM_SYSTOLIC", "value": "109", "unit": "mmHg", "confidence": 0.95},
  {"label": "BPM_DIASTOLIC", "value": "57", "unit": "mmHg", "confidence": 0.95},
  {"label": "BPM_PULSE", "value": "65", "unit": "bpm", "confidence": 0.95}
]

8. Confidence scoring for Nipro SurdialX:
   - 0.95-1.0: Text/numbers are very clear on the blue interface
   - 0.85-0.94: Text is readable but may have minor clarity issues
   - 0.70-0.84: Text is somewhat unclear but likely correct
   - Below 0.70: Text is unclear or partially obscured

9. IMPORTANT: Do NOT include any explanatory text, markdown, or comments - return ONLY the JSON array.
10. If you cannot find a specific data point, simply omit it from the results.

VALIDATION HINTS:
- Temperature should typically be 35-38°C
- UF Goal should be 0-5L range typically
- Conductivity should be 12-16 mS/cm typically
- Prescribed Sodium should be 135-145 mEq/L typically
- Prescribed Bicarbonate should be 25-35 mEq/L typically
- Arterial pressure should be negative (-50 to -200 mmHg)
- Venous pressure should be positive (50-200 mmHg)
- Blood flow should be 200-400 mL/min typically`;

export const NIPRO_SURDIALX_VALIDATION_PROMPT = `Validate the extracted data from a Nipro SurdialX dialysis machine:

Expected ranges for this device:
- Temperature: 30-40°C (typical: 35-38°C)
- UF Goal: 0-10L (typical: 1-5L)
- UF Rate: 0-2 L/h
- Conductivity: 10-20 mS/cm (typical: 12-16)
- Prescribed Sodium: 130-150 mEq/L (typical: 135-145)
- Prescribed Bicarbonate: 20-40 mEq/L (typical: 25-35)
- Arterial Pressure: -300 to 0 mmHg (typical: -50 to -200)
- Venous Pressure: 0 to 300 mmHg (typical: 50-200)
- Blood Flow: 50-500 mL/min (typical: 200-400)
- TMP: 0-100 mmHg

Adjust confidence scores based on these ranges and return the validated data.`;
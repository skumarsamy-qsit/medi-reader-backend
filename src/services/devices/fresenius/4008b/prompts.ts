export const FRESENIUS_4008B_PROMPT = `
This is a medical device data extraction task for Fresenius 4008 B dialysis machines. 
The following values should be extracted from the provided image.

VALUES TO EXTRACT:
1. UF VOLUME (mL)
2. TIME LEFT (h:mm)
3. UF RATE (mL/h)
4. UF GOAL (mL)
5. ARTERIAL PRESSURE (mmHg, from brighter glowing yellow LED)
6. VENOUS PRESSURE (mmHg, from brighter glowing yellow LED)
7. TMP (mmHg, from brighter glowing yellow LED)
8. CONDUCTIVITY (mS/cm, from glowing brighter yellow LED)
9. BOTTOM_DISPLAY_1
10. BOTTOM_DISPLAY_2

RULES FOR DIGITAL DISPLAYS:
- Black background displays with white numbers contain the most reliable data.
- These displays show exact numeric values.

RULES FOR VERTICAL BAR GAUGES:
- The current value is indicated by the brightest, thickest, saturated yellow/orange LED.
- Dim, pale, or thin LEDs represent bounds and should be ignored.
- LED position corresponds proportionally to the printed scale numbers.

CONFIDENCE LEVELS:
- Digital black displays: 0.95–1.0
- Yellow LED vertical bars: 0.85–0.94
- Green bottom LED displays: 0.70–0.84
- Unclear values should be omitted.

OUTPUT FORMAT:
The output should be a valid JSON array, where each object matches this schema:
{
  "label": string,   // exact label name
  "value": string,   // extracted numeric value
  "unit": string,    // measurement unit
  "confidence": number // 0.0–1.0
}
Only JSON output is required, without explanations or additional text.
`;

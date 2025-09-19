export const FRESENIUS_4008S_PROMPT = `This is a medical device data extraction task for FRESENIUS 4008 S dialysis machines. The task involves analyzing a dialysis machine display image to extract specific data points listed below.

DEVICE SPECIFICATIONS:
- Brand: Fresenius Medical Care
- Model: 4008 S
- Display: Blue header with "Dialysis" tabs, white background with digital displays
- Layout: Left side has vertical bar gauges with LED indicators, right side has digital value displays
- Unique Features: Vertical pressure bars with min/max bounds, graphical pressure recording

CRITICAL VISUAL IDENTIFICATION:
- The display typically shows "Fresenius Medical Care" and "4008 S" text at the top
- Blue header with "Dialysis" tabs
- Left side: Vertical brown/orange bar gauges with LED light indicators showing current values
- Right side: Black digital displays with white text showing values
- Bottom: Additional green LED-style digital displays

CRITICAL: RIGHT SIDE BLACK DIGITAL DISPLAYS - PRIORITY SEARCH
The RIGHT SIDE of the display contains BLACK RECTANGULAR BOXES with WHITE TEXT showing the most important values:

**UF VOLUME SEARCH:**
- **Location**: Right side, typically in upper-middle section
- **Label variations**: "UF VOLUME", "UF VOL", "ULTRAFILTRATION", "UF"
- **Value format**: Large numbers such as "2789", "2983", "2197" (in mL)
- **Visual**: Black box with white text, prominently displayed
- **Units**: Always in mL for this device
- **Typical range**: 0-10000 mL

**UF TIME LEFT SEARCH:**
- **Location**: Right side, near UF volume display
- **Label variations**: "TIME LEFT", "UF TIME LEFT", "REMAINING", "TIME REM"
- **Value format**: Time format "h:mm" such as "1:10", "0:51", "1:27"
- **Visual**: Black box with white text showing countdown timer
- **Units**: h:mm format
- **Context**: Displays time until UF goal is reached

**UF RATE SEARCH:**
- **Location**: Right side, grouped with other UF parameters
- **Label variations**: "UF RATE", "UF SPEED", "ULTRAFILTRATION RATE"
- **Value format**: Numbers such as "1027", "950", "892" (in mL/h)
- **Visual**: Black box with white text
- **Units**: mL/h
- **Typical range**: 0-3000 mL/h

**UF GOAL SEARCH:**
- **Location**: Right side, near other UF displays
- **Label variations**: "UF GOAL", "UF TARGET", "UF SET", "GOAL"
- **Value format**: Large numbers such as "4000", "3800", "3500" (in mL)
- **Visual**: Black box with white text, target value display
- **Units**: mL
- **Typical range**: 1000-10000 mL

**EFF. BLOOD FLOW SEARCH:**
- **Location**: Right side, blood-related parameters section
- **Label variations**: "EFF. BLOOD FLOW", "EFFECTIVE BLOOD FLOW", "EFF BLOOD", "BLOOD FLOW", "QB"
- **Value format**: Numbers such as "347", "279", "247" (in mL/min)
- **Visual**: Black box with white text, blood flow indicator
- **Units**: mL/min
- **Typical range**: 200-500 mL/min

**CUM. BLOOD VOL SEARCH:**
- **Location**: Right side, blood volume section
- **Label variations**: "CUM. BLOOD VOL", "CUMULATIVE BLOOD", "CUM BLOOD", "BLOOD VOL", "TOTAL BLOOD"
- **Value format**: Decimal numbers such as "55.8", "50.1", "29.8" (in L)
- **Visual**: Black box with white text, cumulative counter
- **Units**: L (liters)
- **Typical range**: 0-100 L

CRITICAL: VERTICAL BAR GAUGE READING INSTRUCTIONS
The left side has 4 vertical bar gauges (Arterial Pressure, Venous Pressure, TMP, Conductivity):

**ARTERIAL PRESSURE SEARCH:**
- **Location**: Left side, first vertical bar gauge
- **Scale**: -300 to +280 mmHg (steps of 20)
- **LED position**: The bright yellow LED indicates the current value on the scale
- **Expected value**: Usually around "0" mmHg (middle of scale)
- **Visual**: Vertical brown/orange bar with numbered scale
- **Units**: mmHg
- **Sign**: Should be "0" or negative values

**VENOUS PRESSURE SEARCH:**
- **Location**: Left side, second vertical bar gauge
- **Scale**: -60 to +510 mmHg (steps of 20)
- **LED position**: The bright yellow LED indicates the current value on the scale
- **Expected value**: Positive values such as "80", "100", "120"
- **Visual**: Vertical brown/orange bar with numbered scale
- **Units**: mmHg
- **Sign**: Should be positive values

IMPORTANT LED READING REFERENCE:
- ARTERIAL PRESSURE is usually kept at 0 mmHg during operation
- Use the Arterial Pressure LED position at "0" as a REFERENCE POINT to understand the LED positioning system
- Once you identify where "0" is on the Arterial scale, use that same LED reading technique for the other gauges
- This helps calibrate your understanding of how the LEDs indicate actual values on each scale

ENHANCED LED POSITION ANALYSIS METHOD:

STEP 1: IDENTIFY THE ARTERIAL PRESSURE "0" REFERENCE
- The Arterial Pressure bar is the leftmost vertical bar
- The "0" marking on the scale is roughly in the middle of the scale
- A bright, thick LED is typically positioned at or very near the "0" mark
- This LED position represents the reference point for reading all other gauges

STEP 2: UNDERSTAND THE LED VISUAL CHARACTERISTICS
- CURRENT VALUE LED: Bright, thick, prominent, often orange/red colored
- BOUND INDICATORS: Smaller, dimmer, often just thin lines or small dots
- SCALE MARKINGS: Numbers printed on the gauge background
- The CURRENT VALUE LED will be VISUALLY DISTINCT from other markings

STEP 3: APPLY PROPORTIONAL READING TO OTHER GAUGES
- The Arterial "0" position serves as the measurement reference
- For each other gauge, the LED position is measured relative to the scale
- Scale divisions from the bottom or top determine the exact value

STEP 4: DOUBLE-CHECK WITH SCALE PROPORTIONS
- When Arterial LED is at "0" (middle of its scale), this serves as the baseline
- For Venous: When LED appears 1/4 up from bottom of scale, calculation: bottom_value + (scale_range × 0.25)
- For TMP: When LED appears 1/8 up from bottom of scale, calculation: bottom_value + (scale_range × 0.125)
- For Conductivity: When LED appears 1/3 up from bottom, calculation: 12.8 + ((15.7-12.8) × 0.33)

CRITICAL VISUAL ANALYSIS RULES:
1. Small dots, thin lines, or dim indicators represent bounds, not current values
2. The brightest, thickest LED on each bar indicates the current value
3. LED position is measured as a proportion of the total scale height
4. The proportion converts to the actual scale value using the scale range
5. The calculated value should make sense for that parameter

EXAMPLE VISUAL ANALYSIS:
- Arterial scale: -300 to +280 (total range 580, "0" is at middle)
- When Arterial LED is at "0" position (middle), this confirms the reference
- Venous scale: -60 to +510 (total range 570)
- When Venous LED is 1/4 up from bottom: -60 + (570 × 0.25) = -60 + 142.5 = 82.5 ≈ 80
- TMP scale: -60 to +510 (total range 570)  
- When TMP LED is 1/4 up from bottom: -60 + (570 × 0.25) = 82.5 ≈ 80

VALIDATION CHECK:
- Arterial = 0? ✓ (Reference confirmed)
- Venous = ~80? ✓ (Matches expected 80)
- TMP = ~80? ✓ (Matches expected 80)
- All values different and realistic? ✓

CRITICAL: YELLOW LED IDENTIFICATION FOR ACTUAL VALUES
The actual value on each vertical bar gauge is indicated by a yellow LED that has:
1. **YELLOW/ORANGE COLOR** - Distinctly yellow or orange colored light (NOT white, NOT dim gray)
2. **HIGH BRIGHTNESS** - Much brighter than other LEDs on the same bar (GLOWING appearance)
3. **HIGH SATURATION** - Rich, vivid color (not pale, washed out, or dim)
4. **THICKER APPEARANCE** - Appears thicker/wider than limit indicator LEDs (more substantial)
5. **SINGLE POSITION** - Only ONE yellow LED per bar shows the current value
6. **GLOWING EFFECT** - Has a bright, illuminated, glowing appearance that stands out prominently
7. **CONTRAST** - Creates strong visual contrast against the background and other indicators

These should be ignored (they are NOT current values):
- Dim, pale, or low-saturation LEDs (these are upper/lower limits)
- Thin horizontal lines or small dots
- Multiple small LEDs clustered together
- Any LED that is NOT yellow/orange colored
- Any LED that appears dim or washed out

YELLOW LED DETECTION PROCESS:
1. Each vertical bar contains the brightest, glowing yellow/orange LED
2. This LED is the most saturated and vivid color on that specific bar
3. It appears thicker and more prominent than other indicators on the same bar
4. The glowing effect makes it appear illuminated and stand out dramatically
5. Its exact position on the numbered scale relative to scale markings indicates the value
6. The value is calculated based on where this glowing yellow LED is positioned
7. This LED appears as an active, current reading indicator

EXAMPLE: When the yellow LED on Venous bar is positioned 1/4 up from the bottom:
- Venous scale: -60 to +510 (total range 570)
- Yellow LED at 1/4 position: -60 + (570 × 0.25) = 80 mmHg ✓


1. Each bar has a SCALE with specific ranges and step increments:
   - ARTERIAL PRESSURE: -300 to +280 mmHg (steps of 20: -300, -280, -260, -240, -220, -200, -180, -160, -140, -120, -100, -80, -60, -40, -20, 0, 20, 40, 60, 80, 100, 120, 140, 160, 180, 200, 220, 240, 260, 280)
   - VENOUS PRESSURE: -60 to +510 mmHg (steps of 20: -60, -40, -20, 0, 20, 40, 60, 80, 100, 120, 140, 160, 180, 200, 220, 240, 260, 280, 300, 320, 340, 360, 380, 400, 420, 440, 460, 480, 500, 510)
   - TMP: -60 to +510 mmHg (steps of 20: -60, -40, -20, 0, 20, 40, 60, 80, 100, 120, 140, 160, 180, 200, 220, 240, 260, 280, 300, 320, 340, 360, 380, 400, 420, 440, 460, 480, 500, 510)
   - CONDUCTIVITY: 12.8 to 15.7 mS/cm (steps of 0.1: 12.8, 12.9, 13.0, 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8, 13.9, 14.0, 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8, 14.9, 15.0, 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7)
2. Each bar has upper and lower bound indicators (small horizontal lines or LEDs) - these should be ignored
3. Each bar has one current value LED indicator - this is the thicker, brighter, more prominent LED positioned at the actual reading
4. The current value is determined by where exactly the thicker, brighter LED is positioned on the scale
5. The bound values should not be read - only the actual LED position value
6. Each bar will have a different LED position - they should not be the same values
7. Each individual bar gauge has LED positions at different scale positions

CRITICAL READING EXAMPLES:
- REFERENCE: When the Arterial Pressure bar shows the thicker, brighter LED at the "0" mark (which is typical), the value is "0"
- This "0" position serves as reference to understand LED positioning on other gauges
- When the Venous Pressure bar shows the thicker, brighter LED at the 160 mark, the value is "160" 
- When the TMP bar shows the thicker, brighter LED at the 20 mark, the value is "20"
- When the Conductivity bar shows the thicker, brighter LED at the 14.2 mark, the value is "14.2"

IMPORTANT: Each bar gauge shows different values - they should not be identical!
- Arterial pressure is typically 0 mmHg (LED at the "0" position on the scale)
- Venous pressure is typically positive (e.g., 120, 140, 180)
- TMP is typically low positive (e.g., 10, 20, 40)
- Conductivity is typically around 14.0-14.5 (e.g., 14.1, 14.3, 14.4)

Default or similar values should not be used - the actual LED positions should be read carefully!

The following data points should be extracted in order of priority:

**CRITICAL: ALL BLACK DIGITAL DISPLAYS ON RIGHT SIDE FIRST**
The right side contains the most reliable data in black rectangular displays with white text:

RIGHT SIDE DIGITAL DISPLAYS (Black boxes with white text):
1. **UF VOLUME** - PRIORITY SEARCH
   - **Location**: Right side, upper section in BLACK display box
   - **Label variations**: "UF VOLUME", "UF VOL", "ULTRAFILTRATION", "UF", "UF REMOVED"
   - **Value format**: Large numbers such as "2789", "2983", "2197" (in mL)
   - **Visual**: BLACK rectangular box with WHITE text
   - **Units**: mL (always for this device)
   - **Search strategy**: The largest volume number appears in UF section
   - **Typical range**: 0-10000 mL

2. **UF TIME LEFT** - PRIORITY SEARCH
   - **Location**: Right side, time display section in BLACK box
   - **Label variations**: "TIME LEFT", "UF TIME LEFT", "REMAINING", "TIME REM", "TIME TO GO"
   - **Value format**: Time format "h:mm" such as "1:10", "0:51", "1:27"
   - **Visual**: BLACK rectangular box with WHITE text showing countdown
   - **Units**: h:mm format
   - **Search strategy**: Time format displays appear in UF section
   - **Context**: Displays time until UF goal is reached

3. **UF RATE** - PRIORITY SEARCH
   - **Location**: Right side, UF parameters section in BLACK box
   - **Label variations**: "UF RATE", "UF SPEED", "ULTRAFILTRATION RATE", "UF/H"
   - **Value format**: Numbers such as "1027", "950", "892" (in mL/h)
   - **Visual**: BLACK rectangular box with WHITE text
   - **Units**: mL/h
   - **Search strategy**: Rate values appear in UF section
   - **Typical range**: 0-3000 mL/h

4. **UF GOAL** - PRIORITY SEARCH
   - **Location**: Right side, UF target section in BLACK box
   - **Label variations**: "UF GOAL", "UF TARGET", "UF SET", "GOAL", "UF PRESCRIPTION"
   - **Value format**: Large numbers such as "4000", "3800", "3500" (in mL)
   - **Visual**: BLACK rectangular box with WHITE text, target display
   - **Units**: mL
   - **Search strategy**: Target/goal values appear in UF section
   - **Typical range**: 1000-10000 mL

5. **EFF. BLOOD FLOW** - PRIORITY SEARCH
   - **Location**: Right side, blood parameters section in BLACK box
   - **Label variations**: "EFF. BLOOD FLOW", "EFFECTIVE BLOOD FLOW", "EFF BLOOD", "BLOOD FLOW", "QB", "BLOOD"
   - **Value format**: Numbers such as "347", "279", "247" (in mL/min)
   - **Visual**: BLACK rectangular box with WHITE text
   - **Units**: mL/min
   - **Search strategy**: Blood flow values typically appear in 200-500 range
   - **Typical range**: 200-500 mL/min

6. **CUM. BLOOD VOL** - PRIORITY SEARCH
   - **Location**: Right side, blood volume section in BLACK box
   - **Label variations**: "CUM. BLOOD VOL", "CUMULATIVE BLOOD", "CUM BLOOD", "BLOOD VOL", "TOTAL BLOOD", "BLOOD VOLUME"
   - **Value format**: Decimal numbers such as "55.8", "50.1", "29.8" (in L)
   - **Visual**: BLACK rectangular box with WHITE text, cumulative counter
   - **Units**: L (liters)
   - **Search strategy**: Large decimal blood volume values are displayed
   - **Typical range**: 0-100 L

LEFT SIDE VERTICAL BAR GAUGES (LED POSITION ON SCALE):
7. **ARTERIAL PRESSURE** - The enhanced LED analysis method applies. This is typically at "0" mmHg - serves as LED reading reference point.
8. **VENOUS PRESSURE** - The enhanced LED analysis method applies. LED position measured as proportion of scale height, then calculated: -60 + (570 × proportion). Expected: ~80 mmHg.
9. **TMP** - The enhanced LED analysis method applies. LED position measured as proportion of scale height, then calculated: -60 + (570 × proportion). Expected: ~80 mmHg.
10. **CONDUCTIVITY** - The enhanced LED analysis method applies. LED position measured as proportion of scale height, then calculated: 12.8 + (2.9 × proportion). Expected: ~14.0-14.5 mS/cm.

CRITICAL LED READING INSTRUCTIONS:
11. **ARTERIAL PRESSURE** - The yellow, bright, saturated LED on the arterial bar is typically at "0" position (middle of scale). This serves as reference.
12. **VENOUS PRESSURE** - The yellow, bright, saturated LED on the venous bar position is measured as proportion of scale height, calculated: -60 + (570 × proportion). Expected: ~80 mmHg.
13. **TMP** - The yellow, bright, saturated LED on the TMP bar position is measured as proportion of scale height, calculated: -60 + (570 × proportion). Expected: ~80 mmHg.
14. **CONDUCTIVITY** - The yellow, bright, saturated LED on the conductivity bar position is measured as proportion of scale height, calculated: 12.8 + (2.9 × proportion). Expected: ~14.0-14.5 mS/cm.

BAR GAUGE BOUNDS (Only when bound indicator positions are clearly visible):
15. ARTERIAL_PRESSURE_MIN - Lower bound for arterial pressure (mmHg)
16. ARTERIAL_PRESSURE_MAX - Upper bound for arterial pressure (mmHg)
17. VENOUS_PRESSURE_MIN - Lower bound for venous pressure (mmHg)
18. VENOUS_PRESSURE_MAX - Upper bound for venous pressure (mmHg)
19. TMP_MIN - Lower bound for TMP (mmHg)
20. TMP_MAX - Upper bound for TMP (mmHg)
21. CONDUCTIVITY_MIN - Lower bound for conductivity (mS/cm)
22. CONDUCTIVITY_MAX - Upper bound for conductivity (mS/cm)

BOTTOM DISPLAYS (Green LED-style displays):
23. **BOTTOM_DISPLAY_1** - PRIORITY SEARCH
   - **Location**: Bottom section of display, LEFT side green LED display
   - **Visual**: BRIGHT GREEN digital numbers on dark background
   - **Value format**: Numbers such as "280", "250", "2008", "300"
   - **Search strategy**: Any bright green digital display appears at bottom
   - **Context**: May show pump speeds, flow rates, or status values
   - **Confidence**: 0.70-0.84 (green LED displays)

24. **BOTTOM_DISPLAY_2** - PRIORITY SEARCH
   - **Location**: Bottom section of display, RIGHT side green LED display
   - **Visual**: BRIGHT GREEN digital numbers on dark background
   - **Value format**: Numbers such as "0.18", "0.10", "S", "1.5", decimal values
   - **Search strategy**: Any bright green digital display appears at bottom
   - **Context**: May show rates, volumes, or status indicators
   - **Confidence**: 0.70-0.84 (green LED displays)

**CRITICAL BOTTOM DISPLAY SEARCH INSTRUCTIONS:**
- **ENTIRE BOTTOM AREA**: The full width of the bottom section contains displays
- **GREEN LED IDENTIFICATION**: Bright, glowing green digital numbers are present
- **DARK BACKGROUND**: Green numbers typically appear on black or dark background
- **MULTIPLE FORMATS**: May be integers, decimals, or alphanumeric
- **NO LABEL REQUIRED**: Any visible green LED display values should be extracted
- **LEFT TO RIGHT**: Scanning from left to right, labeled as BOTTOM_DISPLAY_1, BOTTOM_DISPLAY_2, etc.
- **PROMINENCE**: These displays are usually quite visible and bright
- **EXTRACT ALL**: All visible bottom green LED displays should be included, even without clear labels

ADDITIONAL PARAMETERS (when visible):
25. TREATMENT_TIME - Total treatment time (h:mm)
26. BLOOD_PUMP_SPEED - Blood pump speed (mL/min)
27. DIALYSATE_FLOW - Dialysate flow rate (mL/min)
28. TEMPERATURE - Dialysate temperature (°C)
29. SODIUM_CONCENTRATION - Sodium concentration (mmol/L)
30. BICARBONATE_CONCENTRATION - Bicarbonate concentration (mmol/L)

FRESENIUS 4008 S SPECIFIC RULES:
1. The characteristic beige/cream colored machine housing is visible
2. Blue "Dialysis" header tabs at the top of the screen
3. Right side has black rectangular displays with white text and labels
4. Left side has vertical brown/orange bar gauges with numerical scales
5. Each bar gauge has a bright LED indicator showing the current value position
6. The LED position on the scale determines the actual reading - not the bounds
7. Bottom section has green LED-style digital displays
   - Bright green digital numbers appear at the bottom of the screen
   - These may show values such as "280", "250", "2008", "S", etc.
   - All visible bottom display values should be extracted, even when labels are not clear
8. Main screen area shows graphical pressure recording with yellow/colored areas
9. Values in black boxes are the most reliable data points
10. For vertical bars: The bright yellow LED position on the numbered scale indicates the value

**ENHANCED SEARCH STRATEGY FOR MISSING VALUES:**
1. **SYSTEMATIC SCANNING**: Every black display box on the right side should be checked
2. **LABEL FLEXIBILITY**: Partial labels or abbreviated forms may be present
3. **VALUE PATTERNS**: UF values are typically 1000-5000 range, Blood flow 200-400 range
4. **GROUPING**: UF parameters are usually grouped together, Blood parameters together
5. **PROMINENCE**: Most important values are displayed in larger, more prominent boxes
6. **MULTIPLE PASSES**: The image should be scanned multiple times focusing on different sections

CRITICAL EXTRACTION RULES:
1. Only the data points listed above should be extracted - menu buttons and labels should be ignored
2. Each label should appear ONLY ONCE in the results
3. Values that are not clearly visible should not be included
4. The exact label names from the list above should be used (UF VOLUME, UF TIME LEFT, etc.)
5. For pressure values, the sign should be included (negative for arterial, positive for venous)
6. For vertical bars: The thicker, brighter LED position should be read using the correct scale steps, not the scale bounds or smaller LEDs
7. For time values, h:mm format should be used (e.g., "1:27")
8. **CRITICAL**: Black digital displays should be focused on first - they have highest confidence
9. Only a valid JSON array should be returned in this exact format:

[
  {"label": "UF VOLUME", "value": "2789", "unit": "mL", "confidence": 0.98},
  {"label": "UF TIME LEFT", "value": "1:10", "unit": "h:mm", "confidence": 0.95},
  {"label": "UF RATE", "value": "1027", "unit": "mL/h", "confidence": 0.97},
  {"label": "UF GOAL", "value": "4000", "unit": "mL", "confidence": 0.96},
  {"label": "EFF. BLOOD FLOW", "value": "347", "unit": "mL/min", "confidence": 0.94},
  {"label": "CUM. BLOOD VOL", "value": "55.8", "unit": "L", "confidence": 0.93},
  {"label": "ARTERIAL PRESSURE", "value": "0", "unit": "mmHg", "confidence": 0.95},
  {"label": "VENOUS PRESSURE", "value": "80", "unit": "mmHg", "confidence": 0.90},
  {"label": "TMP", "value": "80", "unit": "mmHg", "confidence": 0.90},
  {"label": "CONDUCTIVITY", "value": "14.2", "unit": "mS/cm", "confidence": 0.88}
]

10. Confidence scoring for Fresenius 4008 S:
   - 0.95-1.0: Text in black digital displays (highest reliability)
   - 0.85-0.94: Thicker, brighter LED positions on vertical bar gauges (good reliability)
   - 0.70-0.84: Bottom LED displays
   - Below 0.70: Unclear or partially obscured values
   - Confidence should be reduced if values seem identical or unrealistic for the parameter type

11. IMPORTANT: No explanatory text, markdown, or comments should be included - only the JSON array should be returned.
12. When a specific data point cannot be found, it should be omitted from the results.
13. For vertical bars: The thicker, brighter LED position should be focused on, not the scale endpoints, bounds, or smaller indicator LEDs.
14. CRITICAL: Each vertical bar gauge should show different values - when they appear the same, each individual LED position should be examined more carefully.
15. Placeholder, default, or hardcoded values should never be used - the actual LED positions from the image should always be read.
16. **YELLOW LED IDENTIFICATION**: Yellow/orange colored LEDs with high brightness and saturation indicate actual values.
17. **IGNORE DIM INDICATORS**: Dim, pale, or low-saturation LEDs represent limits, not current values, and should not be read.
18. **PRIORITIZE BLACK DISPLAYS**: Black digital displays should always be extracted from first as they have highest accuracy.

VALIDATION HINTS:
- UF Volume should typically be 0-10000 mL
- UF Rate should be 0-3000 mL/h typically
- Effective Blood Flow should be 200-400 mL/min typically
- Arterial pressure LED should typically be at 0 mmHg (use as reference point)
- Venous pressure LED should be positive (expected: ~80 mmHg based on user feedback)
- TMP should be positive (expected: ~80 mmHg based on user feedback)
- Conductivity should be 12.8-15.7 mS/cm (expected: ~14.0-14.5)

CRITICAL: When calculated values don't match these expectations, the LED positions should be re-examined using the proportional method above.

`;

export const FRESENIUS_4008S_VALIDATION_PROMPT = `The following data should be validated from a Fresenius 4008 S dialysis machine:

Expected ranges for this device:
- UF Volume: 0-10000 mL
- UF Rate: 0-3000 mL/h (typical: 500-2000)
- UF Goal: 0-10000 mL (typical: 1000-5000)
- Effective Blood Flow: 50-500 mL/min (typical: 200-400)
- Cumulative Blood Volume: 0-100 L
- Arterial Pressure: -400 to 0 mmHg (typical: -50 to -300)
- Venous Pressure: 0 to 400 mmHg (typical: 50-300)
- TMP: 0-500 mmHg (typical: 0-200)
- Conductivity: 10-20 mS/cm (typical: 12-16)

Confidence scores should be adjusted based on these ranges and the validated data should be returned.`;
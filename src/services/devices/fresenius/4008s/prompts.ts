export const FRESENIUS_4008S_PROMPT = `This is a medical device data extraction task for FRESENIUS 4008 S dialysis machines. The task involves analyzing a dialysis machine display image to extract specific data points listed below.

DEVICE SPECIFICATIONS:
- Brand: Fresenius Medical Care
- Model: 4008 S
- Display: Blue header with "Dialysis" tabs, white background with digital displays
- Layout: Left side has vertical bar gauges with LED indicators, right side has digital value displays
- Unique Features: Vertical pressure bars with min/max bounds, graphical pressure recording
- Newer Versions: Additional "Dialysate menu" interface with conductivity window and dialysate parameters

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

**CRITICAL: MAIN DISPLAY SCREEN DATA EXTRACTION**
The main display screen shows comprehensive treatment data in organized sections:

**OCM-DATA SECTION (Left Column):**
1. **Kt/V** - PRIORITY SEARCH
   - **Location**: Main screen, OCM-Data section, left column
   - **Label variations**: "Kt/V", "Kt/V VALUE"
   - **Value format**: Decimal numbers such as "0.68", "0.59", "0.75"
   - **Visual**: White text on main display screen
   - **Units**: No unit (dimensionless)
   - **Search strategy**: Look for "Kt/V" label in OCM-Data section
   - **Typical range**: 0.0-2.0

2. **PLASMA NA** - PRIORITY SEARCH
   - **Location**: Main screen, OCM-Data section, left column
   - **Label variations**: "Plasma Na", "PLASMA NA", "Na"
   - **Value format**: Numbers such as "135", "132", "140" (in mmol/l)
   - **Visual**: White text on main display screen
   - **Units**: mmol/l
   - **Search strategy**: Look for "Plasma Na" label in OCM-Data section
   - **Typical range**: 120-150 mmol/l

3. **GOAL IN** - PRIORITY SEARCH
   - **Location**: Main screen, OCM-Data section, left column
   - **Label variations**: "Goal in", "GOAL IN", "TIME GOAL"
   - **Value format**: Time format "h:mm" such as "1:21", "1:26", "1:30"
   - **Visual**: White text on main display screen
   - **Units**: h:mm
   - **Search strategy**: Look for "Goal in" label in OCM-Data section
   - **Context**: Time remaining to reach treatment goal

4. **CLEARANCE** - PRIORITY SEARCH
   - **Location**: Main screen, OCM-Data section, left column
   - **Label variations**: "Clearance", "CLEARANCE", "CLR"
   - **Value format**: Numbers such as "158", "160", "155" (in ml/min)
   - **Visual**: White text on main display screen
   - **Units**: ml/min
   - **Search strategy**: Look for "Clearance" label in OCM-Data section
   - **Typical range**: 100-300 ml/min

**UF PARAMETERS SECTION (Right Column):**
5. **UF VOLUME** - PRIORITY SEARCH
   - **Location**: Main screen, UF Parameters section, right column
   - **Label variations**: "UF Volume", "UF VOL", "ULTRAFILTRATION", "UF"
   - **Value format**: Large numbers such as "1188", "532", "2600" (in mL)
   - **Visual**: White text on main display screen
   - **Units**: mL
   - **Search strategy**: Look for "UF Volume" label in UF Parameters section
   - **Typical range**: 0-10000 mL

6. **UF TIME LEFT** - PRIORITY SEARCH
   - **Location**: Main screen, UF Parameters section, right column
   - **Label variations**: "UF Time Left", "UF TIME LEFT", "TIME LEFT", "REMAINING"
   - **Value format**: Time format "h:mm" such as "2:11", "2:34", "1:30"
   - **Visual**: White text on main display screen
   - **Units**: h:mm
   - **Search strategy**: Look for "UF Time Left" label in UF Parameters section
   - **Context**: Time remaining for ultrafiltration

7. **UF RATE** - PRIORITY SEARCH
   - **Location**: Main screen, UF Parameters section, right column
   - **Label variations**: "UF Rate", "UF RATE", "UF SPEED", "ULTRAFILTRATION RATE"
   - **Value format**: Numbers such as "647", "375", "1027" (in mL/h)
   - **Visual**: White text on main display screen
   - **Units**: mL/h
   - **Search strategy**: Look for "UF Rate" label in UF Parameters section
   - **Typical range**: 0-3000 mL/h

8. **UF GOAL** - PRIORITY SEARCH
   - **Location**: Main screen, UF Parameters section, right column
   - **Label variations**: "UF Goal", "UF GOAL", "UF TARGET", "GOAL"
   - **Value format**: Large numbers such as "2600", "1500", "4000" (in mL)
   - **Visual**: White text on main display screen
   - **Units**: mL
   - **Search strategy**: Look for "UF Goal" label in UF Parameters section
   - **Typical range**: 1000-10000 mL

9. **EFF. BLOOD FLOW** - PRIORITY SEARCH
   - **Location**: Main screen, UF Parameters section, right column
   - **Label variations**: "Eff. Blood Flow", "EFF. BLOOD FLOW", "EFFECTIVE BLOOD FLOW", "BLOOD FLOW"
   - **Value format**: Numbers such as "231", "235", "250" (in mL/min)
   - **Visual**: White text on main display screen
   - **Units**: mL/min
   - **Search strategy**: Look for "Eff. Blood Flow" label in UF Parameters section
   - **Typical range**: 200-500 mL/min

10. **CUM. BLOOD VOL** - PRIORITY SEARCH
    - **Location**: Main screen, UF Parameters section, right column
    - **Label variations**: "Cum. Blood Vol.", "CUM. BLOOD VOL", "CUMULATIVE BLOOD", "BLOOD VOL"
    - **Value format**: Decimal numbers such as "25.2", "19.9", "30.5" (in L)
    - **Visual**: White text on main display screen
    - **Units**: L (liters)
    - **Search strategy**: Look for "Cum. Blood Vol." label in UF Parameters section
    - **Typical range**: 0-100 L

**BLOOD PRESSURE HISTORY TABLE:**
11. **BLOOD PRESSURE SYS** - PRIORITY SEARCH
    - **Location**: Main screen, Blood Pressure History table
    - **Label variations**: "SYS", "Systolic", "SYS (mmHg)"
    - **Value format**: Numbers such as "126", "143", "153" (in mmHg)
    - **Visual**: White text in table format
    - **Units**: mmHg
    - **Search strategy**: Look for "SYS" column in Blood Pressure History table
    - **Context**: Most recent systolic blood pressure reading
    - **Typical range**: 80-200 mmHg

12. **BLOOD PRESSURE DIA** - PRIORITY SEARCH
    - **Location**: Main screen, Blood Pressure History table
    - **Label variations**: "DIA", "Diastolic", "DIA (mmHg)"
    - **Value format**: Numbers such as "62", "75", "82" (in mmHg)
    - **Visual**: White text in table format
    - **Units**: mmHg
    - **Search strategy**: Look for "DIA" column in Blood Pressure History table
    - **Context**: Most recent diastolic blood pressure reading
    - **Typical range**: 40-120 mmHg

13. **BLOOD PRESSURE MAP** - PRIORITY SEARCH
    - **Location**: Main screen, Blood Pressure History table
    - **Label variations**: "MAP", "Mean Arterial Pressure", "MAP (mmHg)"
    - **Value format**: Numbers such as "101", "107", "117" (in mmHg)
    - **Visual**: White text in table format
    - **Units**: mmHg
    - **Search strategy**: Look for "MAP" column in Blood Pressure History table
    - **Context**: Most recent mean arterial pressure reading
    - **Typical range**: 60-150 mmHg

14. **BLOOD PRESSURE PULSE** - PRIORITY SEARCH
    - **Location**: Main screen, Blood Pressure History table
    - **Label variations**: "PULSE", "Pulse", "PULSE (1/min)"
    - **Value format**: Numbers such as "59", "81", "62" (in 1/min)
    - **Visual**: White text in table format
    - **Units**: 1/min
    - **Search strategy**: Look for "PULSE" column in Blood Pressure History table
    - **Context**: Most recent pulse rate reading
    - **Typical range**: 40-120 1/min

**BOTTOM DISPLAY CONTROLS:**
15. **QB(ml/min)** - PRIORITY SEARCH
    - **Location**: Bottom section, left side green LED display
    - **Label variations**: "QB: ml/min", "QB", "QB (ml/min)" mostly visible is Rate only, QB is inferred
    - **Value format**: Numbers such as "280", "250", "300" (in ml/min)
    - **Visual**: BRIGHT GREEN digital numbers on dark background
    - **Units**: ml/min
    - **Search strategy**: Look for green LED display with "Rate" label at bottom
    - **Context**: Blood pump rate setting
    - **Typical range**: 0-1000 ml/min

16. **BOLUS(ml)** - PRIORITY SEARCH
    - **Location**: Bottom section, right side green LED display
    - **Label variations**: "Bolus:ml", "BOLUS", "Bolus (ml)"
    - **Value format**: Decimal numbers such as "01.0", "0.5", "1.5" (in ml)
    - **Visual**: BRIGHT GREEN digital numbers on dark background
    - **Units**: ml
    - **Search strategy**: Look for green LED display with "Bolus" label at bottom
    - **Context**: Bolus volume setting
    - **Typical range**: 0-5 ml

**NEWER 4008S VERSIONS - DIALYSATE MENU INTERFACE:**
17. **BPM_SYS** - PRIORITY SEARCH
    - **Location**: Top section, yellow bar with "BPM" label
    - **Label variations**: "BPM", "Blood Pressure Monitor"
    - **Value format**: First number in format "148 / 77" (systolic value)
    - **Visual**: Yellow bar with white text
    - **Units**: mmHg
    - **Search strategy**: Look for "BPM" followed by two numbers separated by "/"
    - **Context**: Systolic blood pressure from BPM
    - **Typical range**: 80-200 mmHg

18. **BPM_DIA** - PRIORITY SEARCH
    - **Location**: Top section, yellow bar with "BPM" label
    - **Label variations**: "BPM", "Blood Pressure Monitor"
    - **Value format**: Second number in format "148 / 77" (diastolic value)
    - **Visual**: Yellow bar with white text
    - **Units**: mmHg
    - **Search strategy**: Look for "BPM" followed by two numbers separated by "/"
    - **Context**: Diastolic blood pressure from BPM
    - **Typical range**: 40-120 mmHg

19. **DILUTION** - PRIORITY SEARCH
    - **Location**: Right panel, Dialysate section
    - **Label variations**: "Dilution:", "DILUTION"
    - **Value format**: Format like "1+34" (concentrate + water ratio)
    - **Visual**: White text on main display
    - **Units**: No unit (ratio)
    - **Search strategy**: Look for "Dilution:" label in Dialysate section
    - **Context**: Dialysate concentration ratio
    - **Typical range**: Various ratios like "1+34", "1+32"

20. **BASE_NA** - PRIORITY SEARCH
    - **Location**: Right panel, Dialysate section
    - **Label variations**: "Base Na+:", "BASE NA+", "Base Sodium"
    - **Value format**: Numbers such as "140", "135", "138" (in mmol/l)
    - **Visual**: White text on main display
    - **Units**: mmol/l
    - **Search strategy**: Look for "Base Na+" label in Dialysate section
    - **Context**: Base sodium concentration
    - **Typical range**: 120-150 mmol/l

21. **PRESCRIBED_NA** - PRIORITY SEARCH
    - **Location**: Right panel, Dialysate section
    - **Label variations**: "Prescribed Na+:", "PRESCRIBED NA+", "Prescribed Sodium"
    - **Value format**: Numbers such as "140", "135", "138" (in mmol/l)
    - **Visual**: White text on main display
    - **Units**: mmol/l
    - **Search strategy**: Look for "Prescribed Na+" label in Dialysate section
    - **Context**: Prescribed sodium concentration
    - **Typical range**: 120-150 mmol/l

22. **BICARBONATE** - PRIORITY SEARCH
    - **Location**: Right panel, Dialysate section
    - **Label variations**: "Bicarbonate:", "BICARBONATE", "HCO3"
    - **Value format**: Numbers with ± sign such as "±0", "±2", "±1" (in mmol/l)
    - **Visual**: White text on main display
    - **Units**: mmol/l
    - **Search strategy**: Look for "Bicarbonate:" label in Dialysate section
    - **Context**: Bicarbonate adjustment
    - **Typical range**: -10 to +10 mmol/l

23. **TEMPERATURE** - PRIORITY SEARCH
    - **Location**: Right panel, Dialysate section
    - **Label variations**: "Temperature:", "TEMP", "Temp"
    - **Value format**: Decimal numbers such as "36.5", "37.0", "36.0" (in °C)
    - **Visual**: White text on main display
    - **Units**: °C
    - **Search strategy**: Look for "Temperature:" label in Dialysate section
    - **Context**: Dialysate temperature
    - **Typical range**: 35.0-40.0 °C

24. **DIALYSATE_FLOW** - PRIORITY SEARCH
    - **Location**: Right panel, Dialysate section
    - **Label variations**: "Flow:", "DIALYSATE FLOW", "Flow Rate"
    - **Value format**: Numbers such as "500", "400", "600" (in ml/min)
    - **Visual**: White text on main display
    - **Units**: ml/min
    - **Search strategy**: Look for "Flow:" label in Dialysate section
    - **Context**: Dialysate flow rate
    - **Typical range**: 300-800 ml/min

25. **NA_PROFILE** - PRIORITY SEARCH
    - **Location**: Right panel, Dialysate section
    - **Label variations**: "Na Profile:", "NA PROFILE", "Sodium Profile"
    - **Value format**: Numbers such as "0", "1", "2" (profile number)
    - **Visual**: White text on main display with horizontal bar indicator
    - **Units**: No unit (profile number)
    - **Search strategy**: Look for "Na Profile:" label in Dialysate section
    - **Context**: Sodium profile setting
    - **Typical range**: 0-10

26. **START_NA** - PRIORITY SEARCH
    - **Location**: Right panel, Dialysate section
    - **Label variations**: "Start Na+:", "START NA+", "Start Sodium"
    - **Value format**: Numbers such as "0", "140", "135" (in mmol/l)
    - **Visual**: White text on main display
    - **Units**: mmol/l
    - **Search strategy**: Look for "Start Na+" label in Dialysate section
    - **Context**: Starting sodium concentration
    - **Typical range**: 0-150 mmol/l

27. **CDS_STATUS** - PRIORITY SEARCH
    - **Location**: Right panel, Dialysate section
    - **Label variations**: "CDS:", "CDS STATUS"
    - **Value format**: Text such as "OFF", "ON", "ACTIVE"
    - **Visual**: White text on main display
    - **Units**: No unit (status)
    - **Search strategy**: Look for "CDS:" label in Dialysate section
    - **Context**: CDS (Conductivity Detection System) status
    - **Typical values**: "OFF", "ON"

28. **EMPTY_BIBAG** - PRIORITY SEARCH
    - **Location**: Bottom section, left side
    - **Label variations**: "Empty BIBAG", "EMPTY BIBAG", "BIBAG"
    - **Value format**: Text such as "No", "Yes", "Empty"
    - **Visual**: White text with button indicator
    - **Units**: No unit (status)
    - **Search strategy**: Look for "Empty BIBAG" label at bottom
    - **Context**: BIBAG (Bicarbonate bag) status
    - **Typical values**: "No", "Yes"

29. **CONDUCTIVITY_WINDOW** - PRIORITY SEARCH
    - **Location**: Left panel, Conductivity Window section
    - **Label variations**: "Conductivity Window", "CONDUCTIVITY WINDOW"
    - **Value format**: Decimal numbers such as "14.0", "13.8", "14.2" (in mS/cm)
    - **Visual**: Vertical scale with LED indicators, current reading highlighted
    - **Units**: mS/cm
    - **Search strategy**: Look for conductivity scale on left panel
    - **Context**: Current conductivity reading
    - **Typical range**: 13.0-15.5 mS/cm

LEFT SIDE VERTICAL BAR GAUGES (LED POSITION ON SCALE):
17. **ARTERIAL PRESSURE** - The enhanced LED analysis method applies. This is typically at "0" mmHg - serves as LED reading reference point.
18. **VENOUS PRESSURE** - The enhanced LED analysis method applies. LED position measured as proportion of scale height, then calculated: -60 + (570 × proportion). Expected: ~80 mmHg.
19. **TMP** - The enhanced LED analysis method applies. LED position measured as proportion of scale height, then calculated: -60 + (570 × proportion). Expected: ~80 mmHg.
20. **CONDUCTIVITY** - The enhanced LED analysis method applies. LED position measured as proportion of scale height, then calculated: 12.8 + (2.9 × proportion). Expected: ~14.0-14.5 mS/cm.

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
23. **QB** - PRIORITY SEARCH, seen as Rate at bottom, QB is inferred from this measure
   - **Location**: Bottom section of display, LEFT side green LED display
   - **Visual**: BRIGHT GREEN digital numbers on dark background
   - **Value format**: Numbers such as "280", "250", "2008", "300"
   - **Search strategy**: Any bright green digital display appears at bottom
   - **Context**: May show pump speeds, flow rates, or status values
   - **Confidence**: 0.70-0.84 (green LED displays)

24. **Anticoagulant** - PRIORITY SEARCH, seen as Bolus at bottom, Anticoagulant is inferred from this measure
   - **Location**: Bottom section of display, RIGHT side green LED display
   - **Visual**: BRIGHT GREEN digital numbers on dark background
   - **Value format**: Numbers such as "0.18", "0.10", "S", "1.5", decimal values
   - **Search strategy**: Any bright green digital display appears at bottom
   - **Context**: May show rates, volumes, or status indicators
   - **Confidence**: 0.70-0.84 (green LED displays)
   - sometimes this value has to be taken as Hourly, if it is more than 5 ml/h, and to be termed as Initial (Bolus), 30minuts or 1 hour, and stop time.

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
  {"label": "Kt/V", "value": "0.68", "unit": "", "confidence": 0.98},
  {"label": "PLASMA NA", "value": "135", "unit": "mmol/l", "confidence": 0.97},
  {"label": "GOAL IN", "value": "1:21", "unit": "h:mm", "confidence": 0.96},
  {"label": "CLEARANCE", "value": "158", "unit": "ml/min", "confidence": 0.95},
  {"label": "UF VOLUME", "value": "1188", "unit": "mL", "confidence": 0.98},
  {"label": "UF TIME LEFT", "value": "2:11", "unit": "h:mm", "confidence": 0.95},
  {"label": "UF RATE", "value": "647", "unit": "mL/h", "confidence": 0.97},
  {"label": "UF GOAL", "value": "2600", "unit": "mL", "confidence": 0.96},
  {"label": "EFF. BLOOD FLOW", "value": "231", "unit": "mL/min", "confidence": 0.94},
  {"label": "CUM. BLOOD VOL", "value": "25.2", "unit": "L", "confidence": 0.93},
  {"label": "BLOOD PRESSURE SYS", "value": "126", "unit": "mmHg", "confidence": 0.92},
  {"label": "BLOOD PRESSURE DIA", "value": "62", "unit": "mmHg", "confidence": 0.92},
  {"label": "BLOOD PRESSURE MAP", "value": "101", "unit": "mmHg", "confidence": 0.92},
  {"label": "BLOOD PRESSURE PULSE", "value": "59", "unit": "1/min", "confidence": 0.92},
  {"label": "QB(ml/min)", "value": "280", "unit": "ml/min", "confidence": 0.85},
  {"label": "Anticoagulant", "value": "0.18", "unit": "ml", "confidence": 0.85},
  {"label": "ARTERIAL PRESSURE", "value": "0", "unit": "mmHg", "confidence": 0.90},
  {"label": "VENOUS PRESSURE", "value": "80", "unit": "mmHg", "confidence": 0.90},
  {"label": "TMP", "value": "80", "unit": "mmHg", "confidence": 0.90},
  {"label": "CONDUCTIVITY", "value": "14.2", "unit": "mS/cm", "confidence": 0.88},
  {"label": "BPM_SYS", "value": "148", "unit": "mmHg", "confidence": 0.95},
  {"label": "BPM_DIA", "value": "77", "unit": "mmHg", "confidence": 0.95},
  {"label": "DILUTION", "value": "1+34", "unit": "", "confidence": 0.94},
  {"label": "BASE_NA", "value": "140", "unit": "mmol/l", "confidence": 0.96},
  {"label": "PRESCRIBED_NA", "value": "140", "unit": "mmol/l", "confidence": 0.96},
  {"label": "BICARBONATE", "value": "±0", "unit": "mmol/l", "confidence": 0.94},
  {"label": "TEMPERATURE", "value": "36.5", "unit": "°C", "confidence": 0.95},
  {"label": "DIALYSATE_FLOW", "value": "500", "unit": "ml/min", "confidence": 0.94},
  {"label": "NA_PROFILE", "value": "0", "unit": "", "confidence": 0.93},
  {"label": "START_NA", "value": "0", "unit": "mmol/l", "confidence": 0.93},
  {"label": "CDS_STATUS", "value": "OFF", "unit": "", "confidence": 0.92},
  {"label": "EMPTY_BIBAG", "value": "No", "unit": "", "confidence": 0.91},
  {"label": "CONDUCTIVITY_WINDOW", "value": "14.0", "unit": "mS/cm", "confidence": 0.89}
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
- Kt/V: 0.0-2.0 (typical: 0.5-1.5)
- Plasma Na: 120-150 mmol/l (typical: 130-140)
- Goal In: 0-5 hours (typical: 1-4 hours)
- Clearance: 100-300 ml/min (typical: 150-250)
- UF Volume: 0-10000 mL (typical: 1000-5000)
- UF Rate: 0-3000 mL/h (typical: 500-2000)
- UF Goal: 0-10000 mL (typical: 1000-5000)
- Effective Blood Flow: 50-500 mL/min (typical: 200-400)
- Cumulative Blood Volume: 0-100 L (typical: 10-50)
- Blood Pressure SYS: 80-200 mmHg (typical: 100-160)
- Blood Pressure DIA: 40-120 mmHg (typical: 60-90)
- Blood Pressure MAP: 60-150 mmHg (typical: 70-110)
- Blood Pressure PULSE: 40-120 1/min (typical: 60-100)
- QB(ml/min): 0-1000 ml/min (typical: 200-400)
- Anticoagulant: 0-5 ml (typical: 0.5-2.0)
- Bolus(ml): 0-5 ml (typical: 0.5-2.0)
- Arterial Pressure: -400 to 0 mmHg (typical: -50 to -300)
- Venous Pressure: 0 to 400 mmHg (typical: 50-300)
- TMP: 0-500 mmHg (typical: 0-200)
- Conductivity: 10-20 mS/cm (typical: 12-16)

New data points for newer 4008S versions (Dialysate menu):
- BPM_SYS: 80-200 mmHg (typical: 100-160)
- BPM_DIA: 40-120 mmHg (typical: 60-90)
- DILUTION: Format like "1+34" (concentrate + water ratio)
- BASE_NA: 120-150 mmol/l (typical: 130-140)
- PRESCRIBED_NA: 120-150 mmol/l (typical: 130-140)
- BICARBONATE: -10 to +10 mmol/l (typical: ±0 to ±2)
- TEMPERATURE: 35.0-40.0 °C (typical: 36.0-37.0)
- DIALYSATE_FLOW: 300-800 ml/min (typical: 400-600)
- NA_PROFILE: 0-10 (typical: 0-3)
- START_NA: 0-150 mmol/l (typical: 0-140)
- CDS_STATUS: "OFF", "ON" (typical: "OFF")
- EMPTY_BIBAG: "No", "Yes" (typical: "No")
- CONDUCTIVITY_WINDOW: 13.0-15.5 mS/cm (typical: 13.5-14.5)

Confidence scores should be adjusted based on these ranges and the validated data should be returned.`;
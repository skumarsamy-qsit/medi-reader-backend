import { logger } from '../utils/logger.js';
import { performanceMonitor } from '../utils/performance.js';
import { CacheManager } from '../utils/cache.js';
import { NetworkError, ProcessingError, ERROR_CODES } from '../types/errors.js';

export interface DeviceDetectionResult {
  deviceKey: string;
  confidence: number;
  detectedFeatures: string[];
}

export class DeviceDetector {
  private static instance: DeviceDetector;
  private cache: CacheManager;
  private detectionMethods: Array<{
    name: string;
    method: (base64Image: string) => Promise<string>;
    weight: number;
  }>;

  constructor() {
    this.cache = CacheManager.getInstance();
    this.detectionMethods = [
      { name: 'visual', method: this.detectByVisualAnalysis.bind(this), weight: 0.4 },
      { name: 'text', method: this.detectByTextAnalysis.bind(this), weight: 0.3 },
      { name: 'layout', method: this.detectByLayoutAnalysis.bind(this), weight: 0.3 }
    ];
  }

  static getInstance(): DeviceDetector {
    if (!DeviceDetector.instance) {
      DeviceDetector.instance = new DeviceDetector();
    }
    return DeviceDetector.instance;
  }

  private generateCacheKey(base64Image: string): string {
    return `device_detection_${base64Image.substring(0, 100)}`;
  }

  /**
   * Detect device type from image using OpenAI Vision API
   */
  async detectDevice(base64Image: string, useCache: boolean = true): Promise<string> {
    const context = 'DeviceDetector.detectDevice';
    logger.info('Starting device detection', context, { useCache });
    
    performanceMonitor.startTimer('device_detection');
    
    // Create a simple hash for caching
    const cacheKey = this.generateCacheKey(base64Image);
    if (useCache && this.cache.has(cacheKey)) {
      const cached = this.cache.get<string>(cacheKey)!;
      logger.info('Using cached detection result', context, { device: cached });
      performanceMonitor.endTimer('device_detection');
      return cached;
    }
    
    try {
      const detectionResults: Array<{ device: string; confidence: number; method: string }> = [];
      
      // Try all detection methods and collect results
      for (const { name, method, weight } of this.detectionMethods) {
        try {
          logger.debug(`Trying detection method: ${name}`, context);
          performanceMonitor.startTimer(`detection_${name}`);
          const result = await method(base64Image);
          performanceMonitor.endTimer(`detection_${name}`);
          
          if (result && result !== 'unknown') {
            detectionResults.push({
              device: result,
              confidence: weight,
              method: name
            });
            logger.debug(`Method ${name} detected: ${result}`, context);
          }
        } catch (error) {
          logger.warn(`Detection method ${name} failed`, context, { error: error instanceof Error ? error.message : String(error) });
          continue;
        }
      }
      
      // Determine final device based on weighted results
      const detectedDevice = this.selectBestDevice(detectionResults);
      
      // Cache the result
      this.cache.set(cacheKey, detectedDevice, 30 * 60 * 1000); // 30 minutes
      
      performanceMonitor.endTimer('device_detection');
      logger.info('Device detection completed', context, { 
        device: detectedDevice,
        methods: detectionResults.length
      });
      return detectedDevice;
      
    } catch (error) {
      performanceMonitor.endTimer('device_detection');
      logger.error('Device detection failed', context, error);
      return 'nipro-surdialx'; // Default fallback
    }
  }

  private selectBestDevice(results: Array<{ device: string; confidence: number; method: string }>): string {
    if (results.length === 0) {
      return 'nipro-surdialx'; // Default
    }

    // Group by device and sum confidence scores
    const deviceScores = new Map<string, number>();
    for (const result of results) {
      const currentScore = deviceScores.get(result.device) || 0;
      deviceScores.set(result.device, currentScore + result.confidence);
    }

    // Find device with highest total confidence
    let bestDevice = 'nipro-surdialx';
    let bestScore = 0;
    
    for (const [device, score] of deviceScores.entries()) {
      if (score > bestScore) {
        bestScore = score;
        bestDevice = device;
      }
    }

    logger.debug('Device selection results', 'DeviceDetector', { 
      scores: Object.fromEntries(deviceScores),
      selected: bestDevice
    });

    return bestDevice;
  }

  private async detectByVisualAnalysis(base64Image: string): Promise<string> {
    const context = 'DeviceDetector.detectByVisualAnalysis';
    logger.debug('Starting visual analysis', context);
    
    const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';
    if (!apiKey) {
      throw new ProcessingError(
        ERROR_CODES.API_KEY_MISSING,
        'OpenAI API key is required for device detection',
        undefined,
        context
      );
    }

    const prompt = this.getSimpleDetectionPrompt();
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: { 
                url: `data:image/jpeg;base64,${base64Image}`,
                detail: "high" // Use high detail for better detection
              }
            }
          ]
        }],
        max_tokens: 50,
        temperature: 0.0 // Use 0 temperature for consistent results
      })
    });

    if (!response.ok) {
      const responseText = await response.text();
      logger.error('Visual analysis API error', context, { 
        status: response.status, 
        response: responseText 
      });
      throw new NetworkError(
        `Visual analysis failed: ${response.status}`,
        response.status,
        responseText
      );
    }

    let result;
    try {
      const responseText = await response.text();
      logger.debug('Visual analysis response received', context, { 
        responseLength: responseText.length 
      });
      result = JSON.parse(responseText);
    } catch (parseError) {
      logger.error('JSON parse error in visual analysis', context, parseError);
      throw new ProcessingError(
        ERROR_CODES.INVALID_DATA,
        'Invalid JSON response from OpenAI API',
        parseError,
        context
      );
    }
    
    const detectionResult = result.choices[0].message.content.trim();
    
    logger.debug('Visual analysis result', context, { result: detectionResult });
    return this.parseDetectionResult(detectionResult);
  }

  private async detectByTextAnalysis(base64Image: string): Promise<string> {
    const context = 'DeviceDetector.detectByTextAnalysis';
    logger.debug('Starting text analysis', context);
    
    const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';
    if (!apiKey) {
      throw new ProcessingError(
        ERROR_CODES.API_KEY_MISSING,
        'OpenAI API key is required for text analysis',
        undefined,
        context
      );
    }

    const textPrompt = `Analyze this medical device display image and extract ANY visible text that might indicate the device model.

Look specifically for:
1. Model names: "Surdial 55 Plus", "SurdialX", "Surdial X"
2. Brand text: "NIPRO"
3. Any version numbers or model identifiers
4. Screen labels or interface text

Return ONLY the extracted text, one item per line. If you see model-specific text, highlight it.`;
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{
          role: "user",
          content: [
            { type: "text", text: textPrompt },
            {
              type: "image_url",
              image_url: { 
                url: `data:image/jpeg;base64,${base64Image}`,
                detail: "high"
              }
            }
          ]
        }],
        max_tokens: 200,
        temperature: 0.0
      })
    });

    if (!response.ok) {
      const responseText = await response.text();
      logger.error('Text analysis API error', context, { 
        status: response.status, 
        response: responseText 
      });
      throw new NetworkError(
        `Text analysis failed: ${response.status}`,
        response.status,
        responseText
      );
    }

    let result;
    try {
      const responseText = await response.text();
      logger.debug('Text analysis response received', context);
      result = JSON.parse(responseText);
    } catch (parseError) {
      logger.error('JSON parse error in text analysis', context, parseError);
      throw new ProcessingError(
        ERROR_CODES.INVALID_DATA,
        'Invalid JSON response from text analysis',
        parseError,
        context
      );
    }
    
    const extractedText = result.choices[0].message.content.toLowerCase();
    
    logger.debug('Text analysis extracted text', context, { text: extractedText });
    
    // Analyze extracted text for model indicators
    if (extractedText.includes('surdial 55 plus') || extractedText.includes('55 plus')) {
      return 'nipro-surdial55plus';
    }
    if (extractedText.includes('surdialx') || extractedText.includes('surdial x')) {
      return 'nipro-surdialx';
    }
    
    return 'unknown';
  }

  private async detectByLayoutAnalysis(base64Image: string): Promise<string> {
    const context = 'DeviceDetector.detectByLayoutAnalysis';
    logger.debug('Starting layout analysis', context);
    
    const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';
    if (!apiKey) {
      throw new ProcessingError(
        ERROR_CODES.API_KEY_MISSING,
        'OpenAI API key is required for layout analysis',
        undefined,
        context
      );
    }

    const layoutPrompt = `Analyze the LAYOUT and VISUAL STYLE of this medical device display:

SURDIAL 55 PLUS characteristics:
- Dark blue background with bright yellow/white text
- Simple rectangular text boxes
- Digital LCD-style display
- Minimal graphics, mostly text
- Traditional medical device appearance

SURDIALX characteristics:
- Light blue/cyan background
- Modern touchscreen interface
- Horizontal bar graphs for pressures
- Rounded buttons and modern UI elements
- Colorful graphical interface
- Machine ID format "MC:NO XXXX" at top

Based ONLY on the visual layout and interface style, which device is this?
Answer with ONLY: "surdial55plus" or "surdialx"`;
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{
          role: "user",
          content: [
            { type: "text", text: layoutPrompt },
            {
              type: "image_url",
              image_url: { 
                url: `data:image/jpeg;base64,${base64Image}`,
                detail: "high"
              }
            }
          ]
        }],
        max_tokens: 50,
        temperature: 0.0
      })
    });

    if (!response.ok) {
      const responseText = await response.text();
      logger.error('Layout analysis API error', context, { 
        status: response.status, 
        response: responseText 
      });
      throw new NetworkError(
        `Layout analysis failed: ${response.status}`,
        response.status,
        responseText
      );
    }

    let result;
    try {
      const responseText = await response.text();
      logger.debug('Layout analysis response received', context);
      result = JSON.parse(responseText);
    } catch (parseError) {
      logger.error('JSON parse error in layout analysis', context, parseError);
      throw new ProcessingError(
        ERROR_CODES.INVALID_DATA,
        'Invalid JSON response from layout analysis',
        parseError,
        context
      );
    }
    
    const layoutResult = result.choices[0].message.content.trim().toLowerCase();
    
    logger.debug('Layout analysis result', context, { result: layoutResult });
    
    if (layoutResult.includes('surdial55plus') || layoutResult.includes('55plus')) {
      return 'nipro-surdial55plus';
    }
    if (layoutResult.includes('surdialx')) {
      return 'nipro-surdialx';
    }
    
    return 'unknown';
  }

  private getSimpleDetectionPrompt(): string {
    return `Look at this dialysis machine display image and identify the device model.

DEVICE IDENTIFICATION:

1. NIPRO SURDIAL 55 PLUS:
   - Dark blue background with yellow/white text
   - Simple LCD-style display
   - Answer: surdial55plus

2. NIPRO SURDIALX:
   - Light blue/cyan background with modern interface
   - Touchscreen with bar graphs
   - Answer: surdialx

3. FRESENIUS 4008 S:
   - Beige/cream colored machine housing
   - Blue "Dialysis" header tabs
   - Vertical brown/orange bar gauges on left
   - Black digital displays on right
   - Answer: fresenius4008s

4. FRESENIUS 4008 B:
   - Similar to 4008 S but may have additional substitution displays
   - Beige/cream colored machine housing
   - Blue "Dialysis" header tabs
   - Vertical brown/orange bar gauges on left
   - Black digital displays on right
   - Answer: fresenius4008b

5. NIKKISO DBB-27:
   - Modern touchscreen interface
   - NIKKISO branding visible
   - Digital parameter displays
   - Answer: nikkisodbb27

Answer with ONLY: surdial55plus OR surdialx OR fresenius4008s OR fresenius4008b OR nikkisodbb27`;
  }

  private parseDetectionResult(result: string): string {
    const cleanResult = result.toLowerCase().trim();
    
    logger.debug('Parsing detection result', 'DeviceDetector.parseDetectionResult', { 
      result: cleanResult 
    });
    
    // Check for specific device indicators
    if (cleanResult.includes('surdial55plus') || 
        cleanResult.includes('surdial 55 plus') ||
        cleanResult.includes('55plus') || 
        cleanResult.includes('55 plus') ||
        cleanResult === 'surdial55plus') {
      logger.info('Device detected: Surdial55Plus', 'DeviceDetector.parseDetectionResult');
      return 'nipro-surdial55plus';
    }
    
    if (cleanResult.includes('surdialx') || 
        cleanResult.includes('surdial x') ||
        cleanResult.includes('surdial-x') ||
        cleanResult === 'surdialx') {
      logger.info('Device detected: SurdialX', 'DeviceDetector.parseDetectionResult');
      return 'nipro-surdialx';
    }
    
    if (cleanResult.includes('fresenius4008s') || 
        cleanResult.includes('fresenius 4008s') ||
        cleanResult.includes('4008s') || 
        cleanResult.includes('4008 s') ||
        cleanResult === 'fresenius4008s') {
      logger.info('Device detected: Fresenius 4008 S', 'DeviceDetector.parseDetectionResult');
      return 'fresenius-4008s';
    }
    
    if (cleanResult.includes('fresenius4008b') || 
        cleanResult.includes('fresenius 4008b') ||
        cleanResult.includes('4008b') || 
        cleanResult.includes('4008 b') ||
        cleanResult === 'fresenius4008b') {
      logger.info('Device detected: Fresenius 4008 B', 'DeviceDetector.parseDetectionResult');
      return 'fresenius-4008b';
    }
    
    if (cleanResult.includes('nikkisodbb27') || 
        cleanResult.includes('nikkiso dbb27') ||
        cleanResult.includes('dbb27') || 
        cleanResult.includes('dbb-27') ||
        cleanResult === 'nikkisodbb27') {
      logger.info('Device detected: Nikkiso DBB-27', 'DeviceDetector.parseDetectionResult');
      return 'nikkiso-dbb27';
    }
    
    // Default fallback
    logger.warn('Could not determine device type, using default', 'DeviceDetector.parseDetectionResult', {
      result: cleanResult,
      fallback: 'nipro-surdialx'
    });
    return 'nipro-surdialx';
  }

  clearCache() {
    this.cache.clear();
    logger.info('Detection cache cleared', 'DeviceDetector');
  }

  /**
   * Get device detection confidence based on visual features
   */
  async getDetectionConfidence(base64Image: string, detectedDevice: string): Promise<number> {
    // This could be enhanced with more sophisticated analysis
    // For now, return a base confidence
    return 0.85;
  }

  getDetectionStats() {
    return {
      cache: this.cache.getStats(),
      performance: performanceMonitor.getMetrics(),
      methods: this.detectionMethods.map(m => ({ name: m.name, weight: m.weight }))
    };
  }
}
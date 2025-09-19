import { DeviceDataPoint, ProcessingContext } from '../../../../types/devices.js';
import { ProcessingError } from '../../../../types/errors.js';
import { FRESENIUS_4008B_CONFIG, FRESENIUS_4008B_UNITS, FRESENIUS_4008B_CATEGORIES } from './config.js';
import { FRESENIUS_4008B_PROMPT } from './prompts.js';

export class Fresenius4008BProcessor {
  private config = FRESENIUS_4008B_CONFIG;

  async processImage(base64Image: string, context: ProcessingContext): Promise<{
    data: DeviceDataPoint[];
    processingTime: number;
    modelUsed: string;
  }> {
    const startTime = Date.now();
    
    console.log('🔧 [Fresenius4008B] Processing image with device-specific logic');
    
    try {
      // Use device-specific prompt
      const prompt = context.processingOptions.useDeviceSpecificPrompt 
        ? FRESENIUS_4008B_PROMPT 
        : this.getGenericPrompt();

      // Call OpenAI API with device-specific prompt
      const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';
      if (!apiKey) {
        throw new Error('OpenAI API key is required');
      }

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
                  url: base64Image.startsWith('data:') ? base64Image : `data:image/jpeg;base64,${base64Image}`,
                  detail: "high"
                }
              }
            ]
          }],
          max_tokens: 2000,
          temperature: 0.1
        })
      });

      console.log('📡 [Fresenius4008B] API Response status:', response.status);
      const headersObj: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headersObj[key] = value;
      });
      console.log('📡 [Fresenius4008B] API Response headers:', headersObj);

      if (!response.ok) {
        let errorMessage = `OpenAI API Error: ${response.status}`;
        try {
          const responseText = await response.text();
          console.error('❌ [Fresenius4008B] Error response text:', responseText);
          
          // Try to parse as JSON first
          try {
            const errorData = JSON.parse(responseText);
            errorMessage += ` - ${errorData.error?.message || errorData.message || 'Unknown error'}`;
          } catch {
            // If not JSON, use the raw text
            errorMessage += ` - ${responseText.substring(0, 200)}`;
          }
        } catch (textError) {
          console.error('❌ [Fresenius4008B] Could not read error response:', textError);
          errorMessage += ' - Could not read error response';
        }
        throw new Error(errorMessage);
      }

      let result;
      try {
        const responseText = await response.text();
        console.log('📡 [Fresenius4008B] Raw response:', responseText.substring(0, 500));
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ [Fresenius4008B] JSON parse error:', parseError);
        throw new ProcessingError('PROCESSING_FAILED', 'Invalid JSON response from OpenAI API. Please check your API key and try again.', { parseError }, 'Fresenius4008B');
      }
      
      const extractedText = result.choices[0].message.content;
      const safeExtractedText = extractedText || '';
      
      // Check if OpenAI is refusing to analyze the image
      if (safeExtractedText.includes("I'm unable to analyze images directly") || 
          safeExtractedText.includes("I cannot analyze") ||
          safeExtractedText.includes("I'm not able to") ||
          safeExtractedText.includes("I'm sorry, I can't extract data from this image") ||
          safeExtractedText.includes("I'm sorry, but I can't analyze the image") ||
          safeExtractedText.includes("I can't analyze the image")) {
        console.error('❌ [Fresenius4008B] OpenAI API refusing to analyze image');
        throw new ProcessingError('OPENAI_REFUSAL', safeExtractedText, { rawResponse: safeExtractedText }, 'Fresenius4008B');
      }
      
      let extractedData: any[] = [];
      
      const jsonMatch = safeExtractedText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          extractedData = JSON.parse(jsonMatch[0]);
        } catch (parseError) {
          console.warn('⚠️ [Fresenius4008B] Failed to parse JSON from API response:', parseError);
          console.log('📄 [Fresenius4008B] Raw content:', safeExtractedText);
          if (safeExtractedText.toLowerCase().includes("sorry") || safeExtractedText.toLowerCase().includes("can't")) {
            throw new ProcessingError('OPENAI_REFUSAL', safeExtractedText, { rawResponse: safeExtractedText }, 'Fresenius4008B');
          }
          throw new ProcessingError('PROCESSING_FAILED', 'OpenAI returned invalid JSON format', { rawResponse: safeExtractedText.substring(0, 200) }, 'Fresenius4008B');
        }
      } else {
        console.warn('⚠️ [Fresenius4008B] No JSON array found in API response');
        console.log('📄 [Fresenius4008B] Raw content:', safeExtractedText);
        if (safeExtractedText.toLowerCase().includes("sorry") || safeExtractedText.toLowerCase().includes("can't")) {
          throw new ProcessingError('OPENAI_REFUSAL', safeExtractedText, { rawResponse: safeExtractedText }, 'Fresenius4008B');
        }
        throw new ProcessingError('PROCESSING_FAILED', 'OpenAI did not return expected JSON format', { rawResponse: safeExtractedText.substring(0, 200) }, 'Fresenius4008B');
      }
      
      // Clean and validate data using device-specific logic
      extractedData = this.cleanAndValidateData(extractedData);
      
      // Convert to DeviceDataPoint format
      const processedData: DeviceDataPoint[] = extractedData.map((item: any, index: number) => ({
        id: (index + 1).toString(),
        label: item.label || 'Unknown',
        value: item.value || '',
        unit: item.unit,
        confidence: Math.min(Math.max(item.confidence || 0.5, 0), 1),
        deviceModel: this.config.displayName,
        category: this.getCategoryForLabel(item.label)
      }));

      // Apply device-specific validation if enabled
      const validatedData = context.processingOptions.validateResults 
        ? await this.validateData(processedData)
        : processedData;

      const processingTime = (Date.now() - startTime) / 1000;
      
      console.log('✅ [Fresenius4008B] Processing completed:', validatedData.length, 'data points');
      
      return {
        data: validatedData,
        processingTime: Math.round(processingTime * 10) / 10,
        modelUsed: 'gpt-4o-fresenius-4008b'
      };
      
    } catch (error) {
      console.error('❌ [Fresenius4008B] Processing failed:', error);
      throw error;
    }
  }

  async processImageViaBackend(
    image: string | Blob, // Accepts base64 or Blob
    context: ProcessingContext,
    backendUrl: string = 'http://10.29.8.179:3001/api/extract'
  ): Promise<{
    data: DeviceDataPoint[];
    processingTime: number;
    modelUsed: string;
  }> {
    const startTime = Date.now();
    try {
      // Prepare FormData for backend
      const formData = new FormData();
      if (typeof image === 'string' && image.startsWith('data:image')) {
        // Convert base64 to Blob
        const byteString = atob(image.split(',')[1]);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
        formData.append('image', new Blob([ab], { type: 'image/jpeg' }), 'upload.jpg');
      } else {
        // If image is a string (base64), convert to Blob before appending
        if (typeof image === 'string') {
          // If it's a data URL, extract the base64 part and convert to Blob
          if (image.startsWith('data:image')) {
            const byteString = atob(image.split(',')[1]);
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
            formData.append('image', new Blob([ab], { type: 'image/jpeg' }), 'upload.jpg');
          } else {
            throw new Error('Image string must be a data URL');
          }
        } else {
          formData.append('image', image, 'upload.jpg');
        }
      }
      formData.append('deviceOverride', context.deviceOverride || '');
      formData.append('patientId', context.patientId || '');
      formData.append('deviceMasterId', context.deviceMasterId || '');

      const response = await fetch(backendUrl, {
        method: 'POST',
        body: formData,
        headers: { Accept: 'application/json' }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Backend error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      const processingTime = (Date.now() - startTime) / 1000;
      return {
        ...result,
        processingTime: Math.round(processingTime * 10) / 10,
        modelUsed: 'backend-fresenius-4008b'
      };
    } catch (error) {
      console.error('❌ [Fresenius4008B] Backend processing failed:', error);
      throw error;
    }
  }

  private cleanAndValidateData(data: any[]): any[] {
    const seenLabels = new Set<string>();
    const cleanedData: any[] = [];
    
    // Process in priority order
    for (const priorityLabel of this.config.supportedDataPoints) {
      const item = data.find(d => 
        d.label === priorityLabel || 
        this.isLabelVariant(d.label, priorityLabel)
      );
      
      if (item && !seenLabels.has(item.label)) {
        // Normalize label
        item.label = this.normalizeLabel(item.label);
        seenLabels.add(item.label);
        cleanedData.push(item);
      }
    }
    
    return cleanedData;
  }

  private isLabelVariant(label: string, targetLabel: string): boolean {
    const variants: Record<string, string[]> = {
      'UF_VOLUME': ['UF Volume', 'Ultrafiltration Volume'],
      'UF_TIME_LEFT': ['UF Time Left', 'Time Left'],
      'UF_RATE': ['UF Rate', 'Ultrafiltration Rate'],
      'UF_GOAL': ['UF Goal', 'Ultrafiltration Goal'],
      'EFF_BLOOD_FLOW': ['Eff. Blood Flow', 'Effective Blood Flow', 'Blood Flow'],
      'CUM_BLOOD_VOL': ['Cum. Blood Vol', 'Cumulative Blood Volume'],
      'ARTERIAL_PRESSURE': ['Arterial Pressure', 'Art. Pressure'],
      'VENOUS_PRESSURE': ['Venous Pressure', 'Ven. Pressure'],
      'TMP': ['Transmembrane Pressure'],
      'CONDUCTIVITY': ['Conductivity', 'Cond'],
      'SUBSTITUTION_VOLUME': ['Substitution Volume', 'Sub. Volume'],
      'SUBSTITUTION_RATE': ['Substitution Rate', 'Sub. Rate']
    };
    
    return variants[targetLabel]?.includes(label) || false;
  }

  private normalizeLabel(label: string): string {
    const normalizations: Record<string, string> = {
      'UF Volume': 'UF_VOLUME',
      'Ultrafiltration Volume': 'UF_VOLUME',
      'UF Time Left': 'UF_TIME_LEFT',
      'Time Left': 'UF_TIME_LEFT',
      'UF Rate': 'UF_RATE',
      'Ultrafiltration Rate': 'UF_RATE',
      'UF Goal': 'UF_GOAL',
      'Ultrafiltration Goal': 'UF_GOAL',
      'Eff. Blood Flow': 'EFF_BLOOD_FLOW',
      'Effective Blood Flow': 'EFF_BLOOD_FLOW',
      'Blood Flow': 'EFF_BLOOD_FLOW',
      'Cum. Blood Vol': 'CUM_BLOOD_VOL',
      'Cumulative Blood Volume': 'CUM_BLOOD_VOL',
      'Arterial Pressure': 'ARTERIAL_PRESSURE',
      'Art. Pressure': 'ARTERIAL_PRESSURE',
      'Venous Pressure': 'VENOUS_PRESSURE',
      'Ven. Pressure': 'VENOUS_PRESSURE',
      'Transmembrane Pressure': 'TMP',
      'Conductivity': 'CONDUCTIVITY',
      'Cond': 'CONDUCTIVITY',
      'Substitution Volume': 'SUBSTITUTION_VOLUME',
      'Sub. Volume': 'SUBSTITUTION_VOLUME',
      'Substitution Rate': 'SUBSTITUTION_RATE',
      'Sub. Rate': 'SUBSTITUTION_RATE'
    };
    
    return normalizations[label] || label;
  }

  private getCategoryForLabel(label: string): DeviceDataPoint['category'] {
    return (FRESENIUS_4008B_CATEGORIES as any)[label] || 'other';
  }

  private async validateData(data: DeviceDataPoint[]): Promise<DeviceDataPoint[]> {
    return data.map(point => {
      let adjustedConfidence = point.confidence;
      
      // Apply device-specific validation rules
      const rule = this.config.validationRules.find(r => r.field === point.label);
      if (rule && rule.type === 'range') {
        const value = parseFloat(point.value);
        if (!isNaN(value)) {
          if (value >= (rule.min || 0) && value <= (rule.max || Infinity)) {
            adjustedConfidence = Math.min(adjustedConfidence + 0.05, 1.0);
          } else {
            adjustedConfidence = Math.max(adjustedConfidence - 0.2, 0.5);
            console.warn(`⚠️ [Fresenius4008B] ${point.label} value ${value} outside expected range`);
          }
        }
      }
      
      return {
        ...point,
        confidence: adjustedConfidence
      };
    });
  }

  private getGenericPrompt(): string {
    return `Analyze this medical device display and extract visible data points. Return as JSON array with label, value, unit, and confidence fields.`;
  }

  getConfig() {
    return this.config;
  }

  getSupportedUnits(label: string): string[] {
    return FRESENIUS_4008B_UNITS[label as keyof typeof FRESENIUS_4008B_UNITS] || [];
  }
}
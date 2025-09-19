// REVERT_MARKER: Original googleGenAi.js moved for serverside refactor. Restore if issues arise.
import { GoogleGenAI, HarmCategory } from '@google/genai';
import logger from './logger.js';

const GOOGLE_CLOUD_PROJECT = 'gen-lang-client-0691058403';
const GOOGLE_CLOUD_LOCATION = process.env.GOOGLE_CLOUD_LOCATION || 'global';

const generationConfig = {
  maxOutputTokens: 65535,
  temperature: 1,
  topP: 0.95,
  safetySettings: [
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: 'OFF' },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: 'OFF' },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: 'OFF' },
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: 'OFF' }
  ],
};

export async function generateContent(
  input: any,
  thread: any[] = [],
  projectId: string = GOOGLE_CLOUD_PROJECT,
  location: string = GOOGLE_CLOUD_LOCATION
) {
  logger.info({
    event: 'generateContent_call',
    input,
    thread,
    projectId,
    location,
    timestamp: new Date().toISOString()
  });

  try {
    const ai = new GoogleGenAI({
      vertexai: true,
      project: projectId,
      location: location,
    });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      // config: generationConfig,
      contents: input,
    });

    logger.info({
      event: 'generateContent_success',
      responsePreview: typeof response.text === 'string' ? response.text.slice(0, 100) : '',
      timestamp: new Date().toISOString()
    });

    return response.text ?? '';
  } catch (err) {
    logger.error({
      event: 'generateContent_error',
      error: err instanceof Error ? err.message : String(err),
      timestamp: new Date().toISOString()
    });
    throw err;
  }
}

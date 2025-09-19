// REVERT_MARKER: Original aiService.js moved for serverside refactor. Restore if issues arise.
import { generateContent } from './googleGenAi.js';
import logger from './logger.js';

export async function getAIResponse(input, thread = []) {
  logger.info({
    event: 'getAIResponse_call',
    input,
    thread,
    timestamp: new Date().toISOString()
  });

  try {
    const result = await generateContent(input, thread);
    logger.info({
      event: 'getAIResponse_success',
      resultPreview: typeof result === 'string' ? result.slice(0, 100) : '',
      timestamp: new Date().toISOString()
    });
    return result;
  } catch (err) {
    logger.error({
      event: 'getAIResponse_error',
      error: err instanceof Error ? err.message : String(err),
      timestamp: new Date().toISOString()
    });
    throw err;
  }
}

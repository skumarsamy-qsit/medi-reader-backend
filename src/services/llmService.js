// Simplified LLM Service for MediReader24 Backend
import logger from './logger.js';

export class LLMService {
    constructor() {
        // Simplified constructor
    }

    static getInstance() {
        if (!LLMService.instance) {
            LLMService.instance = new LLMService();
        }
        return LLMService.instance;
    }

    async extractDataFromImage(base64Image, deviceOverride, patientId, deviceMasterId) {
        const context = 'LLMService.extractDataFromImage';
        
        console.log('🚀 [LLMService] ===== EXTRACT DATA START =====');
        console.log('🚀 [LLMService] Extract data start time:', new Date().toISOString());
        console.log('📊 [LLMService] Base64 image length:', base64Image.length);
        console.log('🔧 [LLMService] Device override:', deviceOverride);
        console.log('👤 [LLMService] Patient ID:', patientId);
        console.log('🏥 [LLMService] Device Master ID:', deviceMasterId);
        
        logger.info('Starting image processing', context, { deviceOverride, patientId, deviceMasterId });

        try {
            // For now, return mock data
            const mockData = [
                {
                    id: '1',
                    label: 'UF REMOVED',
                    value: '2.5',
                    unit: 'L',
                    confidence: 0.95
                },
                {
                    id: '2',
                    label: 'BLOOD FLOW',
                    value: '300',
                    unit: 'ml/min',
                    confidence: 0.92
                }
            ];

            const processingTime = 1.2;
            const modelUsed = 'Mock Model';

            console.log('✅ [LLMService] ===== EXTRACT DATA COMPLETED =====');
            console.log('✅ [LLMService] Processing time:', processingTime, 'seconds');
            
            logger.info('Processing completed successfully', context, {
                dataPoints: mockData.length,
                processingTime: processingTime
            });

            return {
                data: mockData,
                processingTime: processingTime,
                modelUsed: modelUsed,
                patientId: patientId,
                deviceMasterId: deviceMasterId
            };
            
        } catch (error) {
            console.error('❌ [LLMService] ===== EXTRACT DATA FAILED =====');
            console.error('❌ [LLMService] Error at:', new Date().toISOString());
            
            logger.error('LLM extraction failed', context, error);
            throw error;
        }
    }

    getSupportedDevices() {
        return ['fresenius-4008s', 'fresenius-4008b', 'nipro-surdial55plus', 'nipro-surdialx', 'nikkiso-dbb27'];
    }

    getPerformanceMetrics() {
        return {};
    }

    clearProcessingQueue() {
        logger.info('Processing queue cleared', 'LLMService');
    }
}

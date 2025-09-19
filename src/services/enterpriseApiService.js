// Enterprise API Service for MediReader24 Backend
import logger from './logger.js';

export class EnterpriseApiService {
    constructor() {
        this.ENTERPRISE_API_URL = 'http://localhost:8080/hdimsAdapterWeb/enterprise';
        this.TIMEOUT = 30000; // 30 seconds
    }

    async fetchEnterpriseData(enterpriseId, businessUnitId = null) {
        const context = 'EnterpriseApiService.fetchEnterpriseData';
        const url = businessUnitId 
            ? `${this.ENTERPRISE_API_URL}/${enterpriseId}?businessUnitId=${businessUnitId}`
            : `${this.ENTERPRISE_API_URL}/${enterpriseId}`;
            
        logger.info('Fetching enterprise data from API', { 
            context,
            url,
            enterpriseId,
            businessUnitId 
        });

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            logger.info('Enterprise data fetched successfully', {
                context,
                enterpriseId: data.data?.enterprise?.enterpriseId,
                enterpriseName: data.data?.enterprise?.enterpriseName,
                businessUnitsCount: data.data?.enterprise?.businessUnits?.length || 0,
                totalDevices: data.data?.enterprise?.businessUnits?.reduce((sum, bu) => sum + (bu.iotDevices?.length || 0), 0) || 0,
                totalPatients: data.data?.enterprise?.businessUnits?.reduce((sum, bu) => sum + (bu.patients?.length || 0), 0) || 0
            });

            return data;
        } catch (error) {
            logger.error('Failed to fetch enterprise data', {
                context,
                error: error.message,
                url,
                enterpriseId,
                businessUnitId
            });
            throw new Error(`Failed to fetch enterprise data: ${error.message}`);
        }
    }

    async fetchEnterpriseDataWithRetry(enterpriseId, businessUnitId = null, maxRetries = 3) {
        const context = 'EnterpriseApiService.fetchEnterpriseDataWithRetry';
        let lastError = null;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                logger.debug(`Attempt ${attempt}/${maxRetries} to fetch enterprise data`, {
                    context,
                    enterpriseId,
                    businessUnitId
                });
                return await this.fetchEnterpriseData(enterpriseId, businessUnitId);
            } catch (error) {
                lastError = error;
                logger.warn(`Attempt ${attempt} failed`, {
                    context,
                    error: error.message,
                    enterpriseId,
                    businessUnitId
                });
                
                if (attempt < maxRetries) {
                    const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
                    logger.debug(`Waiting ${delay}ms before retry`, { context });
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        logger.error('All retry attempts failed', {
            context,
            maxRetries,
            lastError: lastError?.message,
            enterpriseId,
            businessUnitId
        });
        throw lastError || new Error('Failed to fetch enterprise data after all retries');
    }
}

// Singleton instance
let enterpriseApiServiceInstance = null;

export function getEnterpriseApiService() {
    if (!enterpriseApiServiceInstance) {
        enterpriseApiServiceInstance = new EnterpriseApiService();
    }
    return enterpriseApiServiceInstance;
}

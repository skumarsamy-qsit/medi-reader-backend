// Data Transformers for Enterprise API Integration
import logger from './logger.js';

// Brand mapping from Enterprise API brandName numbers to actual brand names
const BRAND_MAPPING = {
    1: 'Fresenius',
    2: 'Nikkiso', 
    3: 'Baxter',
    4: 'Nipro',
    5: 'B. Braun',
    6: 'Gambro',
    7: 'Toray',
    8: 'Asahi Kasei',
    9: 'Bellco',
    10: 'Medtronic'
};

// Model mapping from Enterprise API model numbers to actual model names
const MODEL_MAPPING = {
    1: '4008 S',
    2: '4008 B',
    3: '4008 S Artis',
    4: '4008 S Fresenius',
    5: 'DBB-27',
    6: 'DBB-27C',
    7: 'DBB-06',
    8: 'Surdial 55 Plus',
    9: 'SurdialX',
    10: 'Surdial-55',
    11: 'AK 96',
    12: 'AK 98',
    13: 'AK 200 Ultra',
    14: 'AK 200 Ultra S',
    15: 'Dialog+',
    16: 'Dialog iQ',
    17: 'Integra',
    18: 'Integra iQ',
    19: 'Integra iQ+',
    20: 'Integra iQ+ with Citrate'
};

export class DataTransformers {
    /**
     * Transform Enterprise API data to Patient array
     */
    static transformToPatients(enterpriseData, businessUnitId = null) {
        const context = 'DataTransformers.transformToPatients';
        logger.debug('Transforming enterprise data to patients', { context, businessUnitId });

        const patients = [];
        
        try {
            enterpriseData.data.enterprise.businessUnits.forEach((businessUnit) => {
                // Filter by businessUnitId if specified
                if (businessUnitId && businessUnit.businessUnitId !== parseInt(businessUnitId)) {
                    return;
                }

                if (businessUnit.patients && businessUnit.patients.length > 0) {
                    businessUnit.patients.forEach((enterprisePatient) => {
                        // Mask the NRIC/FIN number for privacy
                        const maskedNric = this.maskNric(enterprisePatient.nricFinNumber);
                        const maskedName = this.maskName(enterprisePatient.patientName);
                        
                        const patient = {
                            PatientId: `P${enterprisePatient.patientId.toString().padStart(3, '0')}`,
                            RegistrationNumber: `REG${enterprisePatient.patientId.toString().padStart(3, '0')}`,
                            MaskedNric: maskedNric,
                            MaskedName: maskedName,
                            DateofBirth: enterprisePatient.dateOfBirth.split('T')[0], // Extract date part
                            GenderValue: enterprisePatient.gender === 1 ? 'Male' : enterprisePatient.gender === 2 ? 'Female' : 'Unknown',
                            BusinessUnitCode: businessUnit.businessUnit10charCode,
                            EnterpriseCode: `ENT${enterpriseData.data.enterprise.enterpriseId.toString().padStart(3, '0')}`
                        };
                        patients.push(patient);
                    });
                }
            });

            logger.info('Patients transformed successfully', { 
                context,
                count: patients.length,
                sampleIds: patients.slice(0, 3).map(p => p.PatientId),
                businessUnitId
            });

            return patients;
        } catch (error) {
            logger.error('Failed to transform patients', { context, error: error.message });
            throw new Error(`Failed to transform patients: ${error.message}`);
        }
    }

    /**
     * Transform Enterprise API data to DeviceMaster array
     */
    static transformToDeviceMasters(enterpriseData, businessUnitId = null) {
        const context = 'DataTransformers.transformToDeviceMasters';
        logger.debug('Transforming enterprise data to device masters', { context, businessUnitId });

        const devices = [];
        
        try {
            enterpriseData.data.enterprise.businessUnits.forEach((businessUnit) => {
                // Filter by businessUnitId if specified
                if (businessUnitId && businessUnit.businessUnitId !== parseInt(businessUnitId)) {
                    return;
                }

                businessUnit.iotDevices.forEach((iotDevice) => {
                    const device = {
                        DeviceId: `DEV${iotDevice.deviceId.toString().padStart(3, '0')}`,
                        DeviceName: iotDevice.deviceName || `Device ${iotDevice.deviceId}`,
                        DeviceModel: MODEL_MAPPING[iotDevice.model] || `Model ${iotDevice.model}`,
                        Brand: BRAND_MAPPING[iotDevice.brandName] || `Brand ${iotDevice.brandName}`,
                        SerialNumber: iotDevice.serialNumber || `SN${iotDevice.deviceId.toString().padStart(3, '0')}`,
                        Notes: iotDevice.remarks || iotDevice.deviceDescription || '',
                        Status: 'Active' // Default status
                    };
                    devices.push(device);
                });
            });

            logger.info('Device masters transformed successfully', { 
                context,
                count: devices.length,
                sampleIds: devices.slice(0, 3).map(d => d.DeviceId),
                businessUnitId
            });

            return devices;
        } catch (error) {
            logger.error('Failed to transform device masters', { context, error: error.message });
            throw new Error(`Failed to transform device masters: ${error.message}`);
        }
    }

    /**
     * Transform Enterprise API data to both Patient and DeviceMaster arrays
     */
    static transformEnterpriseData(enterpriseData, businessUnitId = null) {
        const context = 'DataTransformers.transformEnterpriseData';
        logger.debug('Transforming complete enterprise data', { context, businessUnitId });

        try {
            const patients = this.transformToPatients(enterpriseData, businessUnitId);
            const devices = this.transformToDeviceMasters(enterpriseData, businessUnitId);

            logger.info('Enterprise data transformation completed', {
                context,
                patientsCount: patients.length,
                devicesCount: devices.length,
                enterpriseId: enterpriseData.data.enterprise.enterpriseId,
                enterpriseName: enterpriseData.data.enterprise.enterpriseName,
                businessUnitId
            });

            return { patients, devices };
        } catch (error) {
            logger.error('Failed to transform enterprise data', { context, error: error.message });
            throw error;
        }
    }

    /**
     * Get brand name by ID
     */
    static getBrandName(brandId) {
        return BRAND_MAPPING[brandId] || `Brand ${brandId}`;
    }

    /**
     * Get model name by ID
     */
    static getModelName(modelId) {
        return MODEL_MAPPING[modelId] || `Model ${modelId}`;
    }

    /**
     * Mask NRIC/FIN number for privacy
     */
    static maskNric(nric) {
        if (!nric || nric.length < 4) return 'S****000A';
        
        const firstChar = nric.charAt(0);
        const lastChar = nric.charAt(nric.length - 1);
        const middleStars = '*'.repeat(Math.max(4, nric.length - 2));
        
        return `${firstChar}${middleStars}${lastChar}`;
    }

    /**
     * Mask patient name for privacy
     */
    static maskName(name) {
        if (!name || name.trim().length === 0) return 'Patient ***';
        
        const trimmedName = name.trim();
        const nameParts = trimmedName.split(' ');
        
        if (nameParts.length === 1) {
            // Single name - show first 2 chars + *** + last char
            const singleName = nameParts[0];
            if (singleName.length <= 2) return `${singleName}***`;
            return `${singleName.substring(0, 2)}***${singleName.charAt(singleName.length - 1)}`;
        } else {
            // Multiple names - show first name + *** + last name first char
            const firstName = nameParts[0];
            const lastName = nameParts[nameParts.length - 1];
            return `${firstName} ***${lastName.charAt(0)}`;
        }
    }
}

// Test script for Enterprise API integration
import { getEnterpriseApiService } from './src/services/enterpriseApiService.js';
import { DataTransformers } from './src/services/dataTransformers.js';

async function testEnterpriseApi() {
    console.log('🧪 Testing Enterprise API Integration...');
    
    try {
        // Test 1: Fetch enterprise data
        console.log('\n📡 Test 1: Fetching enterprise data...');
        const enterpriseApiService = getEnterpriseApiService();
        const enterpriseData = await enterpriseApiService.fetchEnterpriseData('1');
        console.log('✅ Enterprise data fetched successfully');
        console.log('Enterprise ID:', enterpriseData.data.enterprise.enterpriseId);
        console.log('Enterprise Name:', enterpriseData.data.enterprise.enterpriseName);
        console.log('Business Units:', enterpriseData.data.enterprise.businessUnits.length);
        
        // Test 2: Transform patients
        console.log('\n👥 Test 2: Transforming patients...');
        const patients = DataTransformers.transformToPatients(enterpriseData);
        console.log('✅ Patients transformed:', patients.length);
        if (patients.length > 0) {
            console.log('Sample patient:', {
                PatientId: patients[0].PatientId,
                MaskedName: patients[0].MaskedName,
                MaskedNric: patients[0].MaskedNric,
                GenderValue: patients[0].GenderValue
            });
        }
        
        // Test 3: Transform devices
        console.log('\n🔧 Test 3: Transforming devices...');
        const devices = DataTransformers.transformToDeviceMasters(enterpriseData);
        console.log('✅ Devices transformed:', devices.length);
        if (devices.length > 0) {
            console.log('Sample device:', {
                DeviceId: devices[0].DeviceId,
                DeviceName: devices[0].DeviceName,
                Brand: devices[0].Brand,
                DeviceModel: devices[0].DeviceModel
            });
        }
        
        // Test 4: Transform both
        console.log('\n🔄 Test 4: Transforming both patients and devices...');
        const result = DataTransformers.transformEnterpriseData(enterpriseData);
        console.log('✅ Complete transformation successful');
        console.log('Patients:', result.patients.length);
        console.log('Devices:', result.devices.length);
        
        // Test 5: Test with business unit filter
        console.log('\n🏢 Test 5: Testing business unit filter...');
        const businessUnitId = enterpriseData.data.enterprise.businessUnits[0]?.businessUnitId;
        if (businessUnitId) {
            const filteredResult = DataTransformers.transformEnterpriseData(enterpriseData, businessUnitId);
            console.log('✅ Business unit filter test successful');
            console.log('Filtered Patients:', filteredResult.patients.length);
            console.log('Filtered Devices:', filteredResult.devices.length);
        }
        
        console.log('\n🎉 All tests passed!');
        return true;
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Stack:', error.stack);
        return false;
    }
}

// Run the test
testEnterpriseApi().then(success => {
    process.exit(success ? 0 : 1);
});

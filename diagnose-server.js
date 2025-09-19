// Diagnostic script to check server issues
console.log('🔍 Diagnosing server issues...');

try {
    console.log('1. Checking imports...');
    
    // Test basic imports
    const express = await import('express');
    console.log('✅ Express imported successfully');
    
    const cors = await import('cors');
    console.log('✅ CORS imported successfully');
    
    const multer = await import('multer');
    console.log('✅ Multer imported successfully');
    
    // Test service imports
    console.log('2. Checking service imports...');
    
    try {
        const { getEnterpriseApiService } = await import('./src/services/enterpriseApiService.js');
        console.log('✅ Enterprise API service imported successfully');
    } catch (error) {
        console.error('❌ Enterprise API service import failed:', error.message);
    }
    
    try {
        const { DataTransformers } = await import('./src/services/dataTransformers.js');
        console.log('✅ Data transformers imported successfully');
    } catch (error) {
        console.error('❌ Data transformers import failed:', error.message);
    }
    
    try {
        const logger = await import('./src/services/logger.js');
        console.log('✅ Logger imported successfully');
    } catch (error) {
        console.error('❌ Logger import failed:', error.message);
    }
    
    try {
        const { LLMService } = await import('./src/services/llmService.js');
        console.log('✅ LLM Service imported successfully');
    } catch (error) {
        console.error('❌ LLM Service import failed:', error.message);
    }
    
    console.log('3. Testing server creation...');
    const app = express.default();
    app.use(cors.default());
    app.use(express.default.json());
    
    // Add test endpoint
    app.get('/api/test', (req, res) => {
        res.json({ message: 'Test endpoint working' });
    });
    
    const PORT = 3001;
    const server = app.listen(PORT, () => {
        console.log(`✅ Test server started on port ${PORT}`);
        console.log(`Test URL: http://localhost:${PORT}/api/test`);
        
        // Close server after test
        setTimeout(() => {
            server.close();
            console.log('✅ Test server closed');
            process.exit(0);
        }, 2000);
    });
    
} catch (error) {
    console.error('❌ Diagnostic failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
}

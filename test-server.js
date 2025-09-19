// Simple test to verify server endpoint
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// Test endpoint
app.get('/api/enterprise', (req, res) => {
    console.log('Enterprise endpoint called with:', req.query);
    res.json({
        success: true,
        message: 'Enterprise endpoint is working',
        query: req.query
    });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Test server running on port ${PORT}`);
    console.log(`Test enterprise endpoint: http://localhost:${PORT}/api/enterprise?enterpriseId=1&dataModel=patients`);
});

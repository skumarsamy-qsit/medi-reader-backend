// REVERT_MARKER: Original server.js moved for serverside refactor. Restore if issues arise.
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import bodyParser, { json } from 'body-parser';
import axios from 'axios';
import { generateContent } from './services/googleGenAi.js';
import logger from './services/logger.js';
import { LLMService } from './services/llmService.js';
import AuthService from './services/authService.js';
import { getEnterpriseApiService } from './services/enterpriseApiService.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import fresenius4008sRouter from './routes/fresenius4008s.js';

// Load environment variables
dotenv.config();

// File storage management
const ensureDirectoryExists = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`📁 Created directory: ${dirPath}`);
  }
};

// Initialize folder structure on server start
const initializeFolderStructure = () => {
  const baseDir = process.cwd();
  const folders = ['to_extract', 'extracted', 'output'];
  
  folders.forEach(folder => {
    const folderPath = path.join(baseDir, folder);
    ensureDirectoryExists(folderPath);
  });
  
  console.log('📁 [FileStorage] Folder structure initialized');
};

const getTimestamp = () => {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
};

const saveImageToExtract = async (imageBuffer: Buffer, originalName: string, patientId: string, deviceId: string, imageId: number): Promise<string> => {
  const timestamp = getTimestamp();
  const fileExtension = path.extname(originalName) || '.jpg';
  const fileName = `${patientId}_${deviceId}_${imageId}_${timestamp}${fileExtension}`;
  
  const toExtractDir = path.join(process.cwd(), 'to_extract');
  ensureDirectoryExists(toExtractDir);
  
  const filePath = path.join(toExtractDir, fileName);
  fs.writeFileSync(filePath, imageBuffer);
  
  console.log(`💾 [FileStorage] Image saved to extract: ${fileName}`);
  return filePath;
};

const moveImageToExtracted = (sourcePath: string, patientId: string, deviceId: string, imageId: number): string => {
  const timestamp = getTimestamp();
  const fileExtension = path.extname(sourcePath);
  const fileName = `${patientId}_${deviceId}_${imageId}_${timestamp}${fileExtension}`;
  
  const extractedDir = path.join(process.cwd(), 'extracted');
  ensureDirectoryExists(extractedDir);
  
  const destinationPath = path.join(extractedDir, fileName);
  fs.renameSync(sourcePath, destinationPath);
  
  console.log(`📁 [FileStorage] Image moved to extracted: ${fileName}`);
  return destinationPath;
};

const saveResultJson = (result: any, patientId: string, deviceId: string): string => {
  const timestamp = getTimestamp();
  const fileName = `${patientId}_${deviceId}_${timestamp}.json`;
  
  const outputDir = path.join(process.cwd(), 'output');
  ensureDirectoryExists(outputDir);
  
  const filePath = path.join(outputDir, fileName);
  fs.writeFileSync(filePath, JSON.stringify(result, null, 2));
  
  console.log(`📄 [FileStorage] Result JSON saved: ${fileName}`);
  return filePath;
};

// Error codes for multiple image processing
const ERROR_CODES = {
  INVALID_IMAGE_COUNT: 'INVALID_IMAGE_COUNT',
  IMAGE_COUNT_MISMATCH: 'IMAGE_COUNT_MISMATCH',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  AI_PROCESSING_ERROR: 'AI_PROCESSING_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  PROCESSING_ERROR: 'PROCESSING_ERROR'
};

// Extend Express Request type to include userId
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}
// Enhanced multer configuration for multiple image processing
const storage = multer.memoryStorage(); // Store in memory for processing
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file (as per documentation)
    files: 5 // Maximum 5 files
  },
  fileFilter: (req, file, cb) => {
    // Check file type - only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      const error = new Error('Only image files are allowed') as any;
      error.code = 'INVALID_FILE_TYPE';
      cb(error, false);
    }
  }
});
const llmService = LLMService.getInstance();
const authService = AuthService.getInstance();

const app = express();
app.use(cors());
// Increase limit to 10mb (or higher if needed)
app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ limit: '200mb', extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      genai: 'available',
      extract: 'available',
      auth: 'available'
    }
  });
});

// Authentication middleware
const authenticateToken = async (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ success: false, error: 'Access token required' });
  }

  try {
    const validation = await authService.validateToken(token);
    if (!validation.valid) {
      return res.status(403).json({ success: false, error: 'Invalid or expired token' });
    }
    
    req.userId = validation.userId;
    next();
  } catch (error) {
    return res.status(403).json({ success: false, error: 'Invalid token' });
  }
};

// Authentication endpoints
app.post('/api/auth/login', async (req, res) => {
  const startTime = Date.now();
  const requestId = `auth_login_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  console.log('🔐 [Auth] ===== LOGIN REQUEST START =====');
  console.log('🔐 [Auth] Request ID:', requestId);
  console.log('🔐 [Auth] Request received at:', new Date().toISOString());
  console.log('🔐 [Auth] Request headers:', req.headers);
  console.log('🔐 [Auth] Request body:', JSON.stringify(req.body, null, 2));
  
  logger.info({
    event: 'auth_login_request',
    endpoint: '/api/auth/login',
    requestId,
    username: req.body.username,
    hasPassword: !!req.body.password,
    timestamp: new Date().toISOString()
  });

  try {
    const result = await authService.login(req.body);
    const responseTime = Date.now() - startTime;
    
    console.log('✅ [Auth] ===== LOGIN REQUEST SUCCESS =====');
    console.log('✅ [Auth] Request ID:', requestId);
    console.log('✅ [Auth] Response time:', responseTime, 'ms');
    console.log('✅ [Auth] Success:', result.success);
    console.log('✅ [Auth] User ID:', result.user?.id);
    console.log('✅ [Auth] Username:', result.user?.firstName);
    console.log('✅ [Auth] Role:', result.user?.role);
    console.log('✅ [Auth] Has token:', !!result.token);
    
    logger.info({
      event: 'auth_login_success',
      endpoint: '/api/auth/login',
      requestId,
      responseTime,
      success: result.success,
      userId: result.user?.id,
      username: result.user?.firstName,
      role: result.user?.role,
      hasToken: !!result.token,
      timestamp: new Date().toISOString()
    });
    
    res.json(result);
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    console.error('❌ [Auth] ===== LOGIN REQUEST FAILED =====');
    console.error('❌ [Auth] Request ID:', requestId);
    console.error('❌ [Auth] Error at:', new Date().toISOString());
    console.error('❌ [Auth] Error message:', errorMessage);
    console.error('❌ [Auth] Response time:', responseTime, 'ms');
    
    logger.error({
      event: 'auth_login_error',
      endpoint: '/api/auth/login',
      requestId,
      error: errorMessage,
      responseTime,
      timestamp: new Date().toISOString()
    });
    
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  const startTime = Date.now();
  const requestId = `auth_register_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  console.log('🔐 [Auth] ===== REGISTER REQUEST START =====');
  console.log('🔐 [Auth] Request ID:', requestId);
  console.log('🔐 [Auth] Request received at:', new Date().toISOString());
  console.log('🔐 [Auth] Request body:', JSON.stringify(req.body, null, 2));
  
  logger.info({
    event: 'auth_register_request',
    endpoint: '/api/auth/register',
    requestId,
    email: req.body.email,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    role: req.body.role,
    timestamp: new Date().toISOString()
  });

  try {
    const result = await authService.register(req.body);
    const responseTime = Date.now() - startTime;
    
    console.log('✅ [Auth] ===== REGISTER REQUEST SUCCESS =====');
    console.log('✅ [Auth] Request ID:', requestId);
    console.log('✅ [Auth] Response time:', responseTime, 'ms');
    console.log('✅ [Auth] Success:', result.success);
    console.log('✅ [Auth] User ID:', result.user?.id);
    console.log('✅ [Auth] Email:', result.user?.email);
    console.log('✅ [Auth] Role:', result.user?.role);
    
    logger.info({
      event: 'auth_register_success',
      endpoint: '/api/auth/register',
      requestId,
      responseTime,
      success: result.success,
      userId: result.user?.id,
      email: result.user?.email,
      role: result.user?.role,
      timestamp: new Date().toISOString()
    });
    
    res.json(result);
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    console.error('❌ [Auth] ===== REGISTER REQUEST FAILED =====');
    console.error('❌ [Auth] Request ID:', requestId);
    console.error('❌ [Auth] Error message:', errorMessage);
    console.error('❌ [Auth] Response time:', responseTime, 'ms');
    
    logger.error({
      event: 'auth_register_error',
      endpoint: '/api/auth/register',
      requestId,
      error: errorMessage,
      responseTime,
      timestamp: new Date().toISOString()
    });
    
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

app.post('/api/auth/logout', authenticateToken, async (req, res) => {
  const startTime = Date.now();
  const requestId = `auth_logout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  console.log('🔐 [Auth] ===== LOGOUT REQUEST START =====');
  console.log('🔐 [Auth] Request ID:', requestId);
  console.log('🔐 [Auth] Request received at:', new Date().toISOString());
  console.log('🔐 [Auth] User ID:', req.userId);
  console.log('🔐 [Auth] Has refresh token:', !!req.body.refreshToken);
  
  logger.info({
    event: 'auth_logout_request',
    endpoint: '/api/auth/logout',
    requestId,
    userId: req.userId,
    hasRefreshToken: !!req.body.refreshToken,
    timestamp: new Date().toISOString()
  });

  try {
    const refreshToken = req.body.refreshToken;
    const result = await authService.logout(refreshToken);
    
    // Clear any cached enterprise data for this user
    // This ensures fresh data is loaded on next login
    console.log('🧹 [Auth] Clearing enterprise data cache for user:', req.userId);
    
    const responseTime = Date.now() - startTime;
    
    console.log('✅ [Auth] ===== LOGOUT REQUEST SUCCESS =====');
    console.log('✅ [Auth] Request ID:', requestId);
    console.log('✅ [Auth] Response time:', responseTime, 'ms');
    console.log('✅ [Auth] Success:', result.success);
    console.log('✅ [Auth] Message:', result.message);
    
    logger.info({
      event: 'auth_logout_success',
      endpoint: '/api/auth/logout',
      requestId,
      responseTime,
      success: result.success,
      message: result.message,
      timestamp: new Date().toISOString()
    });
    
    res.json(result);
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    console.error('❌ [Auth] ===== LOGOUT REQUEST FAILED =====');
    console.error('❌ [Auth] Request ID:', requestId);
    console.error('❌ [Auth] Error message:', errorMessage);
    console.error('❌ [Auth] Response time:', responseTime, 'ms');
    
    logger.error({
      event: 'auth_logout_error',
      endpoint: '/api/auth/logout',
      requestId,
      error: errorMessage,
      responseTime,
      timestamp: new Date().toISOString()
    });
    
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

app.get('/api/auth/validate', authenticateToken, async (req, res) => {
  const startTime = Date.now();
  const requestId = `auth_validate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  console.log('🔐 [Auth] ===== VALIDATE REQUEST START =====');
  console.log('🔐 [Auth] Request ID:', requestId);
  console.log('🔐 [Auth] Request received at:', new Date().toISOString());
  console.log('🔐 [Auth] User ID:', req.userId);
  
  logger.info({
    event: 'auth_validate_request',
    endpoint: '/api/auth/validate',
    requestId,
    userId: req.userId,
    timestamp: new Date().toISOString()
  });

  try {
    if (!req.userId) {
      console.log('❌ [Auth] User ID missing from request');
      return res.status(400).json({ success: false, error: 'User ID missing from request' });
    }
    const user = authService.getUserById(req.userId as string);
    if (!user) {
      console.log('❌ [Auth] User not found for ID:', req.userId);
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    const { password, ...userWithoutPassword } = user;
    const responseTime = Date.now() - startTime;
    
    console.log('✅ [Auth] ===== VALIDATE REQUEST SUCCESS =====');
    console.log('✅ [Auth] Request ID:', requestId);
    console.log('✅ [Auth] Response time:', responseTime, 'ms');
    console.log('✅ [Auth] User ID:', user.id);
    console.log('✅ [Auth] Username:', user.firstName);
    console.log('✅ [Auth] Role:', user.role);
    
    logger.info({
      event: 'auth_validate_success',
      endpoint: '/api/auth/validate',
      requestId,
      responseTime,
      userId: user.id,
      username: user.firstName,
      role: user.role,
      timestamp: new Date().toISOString()
    });
    
    res.json({ success: true, user: userWithoutPassword });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    console.error('❌ [Auth] ===== VALIDATE REQUEST FAILED =====');
    console.error('❌ [Auth] Request ID:', requestId);
    console.error('❌ [Auth] Error message:', errorMessage);
    console.error('❌ [Auth] Response time:', responseTime, 'ms');
    
    logger.error({
      event: 'auth_validate_error',
      endpoint: '/api/auth/validate',
      requestId,
      error: errorMessage,
      responseTime,
      timestamp: new Date().toISOString()
    });
    
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

app.post('/api/auth/refresh', async (req, res) => {
  const startTime = Date.now();
  const requestId = `auth_refresh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  console.log('🔐 [Auth] ===== REFRESH REQUEST START =====');
  console.log('🔐 [Auth] Request ID:', requestId);
  console.log('🔐 [Auth] Request received at:', new Date().toISOString());
  console.log('🔐 [Auth] Has refresh token:', !!req.body.refreshToken);
  
  logger.info({
    event: 'auth_refresh_request',
    endpoint: '/api/auth/refresh',
    requestId,
    hasRefreshToken: !!req.body.refreshToken,
    timestamp: new Date().toISOString()
  });

  try {
    const { refreshToken } = req.body;
    const result = await authService.refreshToken(refreshToken);
    const responseTime = Date.now() - startTime;
    
    console.log('✅ [Auth] ===== REFRESH REQUEST SUCCESS =====');
    console.log('✅ [Auth] Request ID:', requestId);
    console.log('✅ [Auth] Response time:', responseTime, 'ms');
    console.log('✅ [Auth] Success:', result.success);
    console.log('✅ [Auth] User ID:', result.user?.id);
    console.log('✅ [Auth] Has new token:', !!result.token);
    
    logger.info({
      event: 'auth_refresh_success',
      endpoint: '/api/auth/refresh',
      requestId,
      responseTime,
      success: result.success,
      userId: result.user?.id,
      hasNewToken: !!result.token,
      timestamp: new Date().toISOString()
    });
    
    res.json(result);
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    console.error('❌ [Auth] ===== REFRESH REQUEST FAILED =====');
    console.error('❌ [Auth] Request ID:', requestId);
    console.error('❌ [Auth] Error message:', errorMessage);
    console.error('❌ [Auth] Response time:', responseTime, 'ms');
    
    logger.error({
      event: 'auth_refresh_error',
      endpoint: '/api/auth/refresh',
      requestId,
      error: errorMessage,
      responseTime,
      timestamp: new Date().toISOString()
    });
    
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(400).json({ success: false, error: 'User ID missing from request' });
    }
    const result = await authService.updateUser(req.userId as string, req.body);
    res.json(result);
  } catch (error) {
    console.error('Profile update endpoint error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const result = await authService.resetPassword(req.body);
    res.json(result);
  } catch (error) {
    console.error('Reset password endpoint error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

app.post('/api/auth/confirm-reset-password', async (req, res) => {
  try {
    const result = await authService.confirmResetPassword(req.body);
    res.json(result);
  } catch (error) {
    console.error('Confirm reset password endpoint error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(400).json({ success: false, error: 'User ID missing from request' });
    }
    const { currentPassword, newPassword } = req.body;
    const result = await authService.changePassword(req.userId as string, currentPassword, newPassword);
    res.json(result);
  } catch (error) {
    console.error('Change password endpoint error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

app.post('/api/auth/verify-email', async (req, res) => {
  try {
    // For now, just return success - in production, implement email verification
    res.json({ success: true, message: 'Email verification not implemented yet' });
  } catch (error) {
    console.error('Verify email endpoint error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

app.post('/api/auth/verify-phone', async (req, res) => {
  try {
    // For now, just return success - in production, implement phone verification
    res.json({ success: true, message: 'Phone verification not implemented yet' });
  } catch (error) {
    console.error('Verify phone endpoint error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

app.post('/api/genai', async (req, res) => {
    const startTime = Date.now();
    const requestId = `genai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('🤖 [GenAI] ===== REQUEST START =====');
    console.log('🤖 [GenAI] Request ID:', requestId);
    console.log('🤖 [GenAI] Request received at:', new Date().toISOString());
    console.log('🤖 [GenAI] Request headers:', req.headers);
    console.log('🤖 [GenAI] Request body size:', JSON.stringify(req.body).length, 'characters');
    
    logger.info({
        event: 'api_call',
        endpoint: '/api/genai',
        requestId,
        input: req.body.input,
        thread: req.body.thread,
        inputLength: req.body.input?.length || 0,
        threadLength: Array.isArray(req.body.thread) ? req.body.thread.length : (typeof req.body.thread === 'string' ? 1 : 0),
        timestamp: new Date().toISOString()
    });

    try {
        const { input, thread } = req.body;
        
        // Ensure thread is an array as expected by generateContent function
        const threadArray = Array.isArray(thread) ? thread : (typeof thread === 'string' ? [thread] : []);
        
        console.log('🤖 [GenAI] Input preview:', typeof input === 'string' ? input.substring(0, 200) + (input.length > 200 ? '...' : '') : 'Non-string input');
        console.log('🤖 [GenAI] Thread preview:', Array.isArray(threadArray) ? `Array with ${threadArray.length} items` : 'Non-array thread');
        console.log('🤖 [GenAI] Calling generateContent...');
        
        const genaiStartTime = Date.now();
        const result = await generateContent(input, threadArray);
        const genaiTime = Date.now() - genaiStartTime;
        const totalResponseTime = Date.now() - startTime;

        console.log('✅ [GenAI] ===== REQUEST SUCCESS =====');
        console.log('✅ [GenAI] Request ID:', requestId);
        console.log('✅ [GenAI] GenAI processing time:', genaiTime, 'ms');
        console.log('✅ [GenAI] Total response time:', totalResponseTime, 'ms');
        console.log('✅ [GenAI] Result type:', typeof result);
        console.log('✅ [GenAI] Result length:', typeof result === 'string' ? result.length : 'N/A');
        console.log('✅ [GenAI] Result preview:', typeof result === 'string' ? result.substring(0, 300) + (result.length > 300 ? '...' : '') : 'Non-string result');

        logger.info({
            event: 'api_success',
            endpoint: '/api/genai',
            requestId,
            responseTime: totalResponseTime,
            genaiProcessingTime: genaiTime,
            resultLength: typeof result === 'string' ? result.length : 0,
            resultPreview: typeof result === 'string' ? result.slice(0, 200) : '',
            timestamp: new Date().toISOString()
        });

        res.json({ 
            result,
            metadata: {
                requestId,
                processingTime: genaiTime,
                totalTime: totalResponseTime,
                timestamp: new Date().toISOString()
            }
        });
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        const responseTime = Date.now() - startTime;

        console.error('❌ [GenAI] ===== REQUEST FAILED =====');
        console.error('❌ [GenAI] Request ID:', requestId);
        console.error('❌ [GenAI] Error at:', new Date().toISOString());
        console.error('❌ [GenAI] Error type:', err instanceof Error ? err.constructor.name : typeof err);
        console.error('❌ [GenAI] Error message:', errorMessage);
        console.error('❌ [GenAI] Response time:', responseTime, 'ms');
        if (err instanceof Error && err.stack) {
            console.error('❌ [GenAI] Error stack:', err.stack);
        }

        logger.error({
            event: 'api_error',
            endpoint: '/api/genai', 
            requestId,
            error: errorMessage,
            errorType: err instanceof Error ? err.constructor.name : typeof err,
            responseTime,
            timestamp: new Date().toISOString()
        });

        res.status(500).json({ 
            error: errorMessage,
            requestId,
            timestamp: new Date().toISOString()
        });
    }
});

app.post('/api/extract-multiple', upload.array('images', 5), async (req, res) => {
  const startTime = Date.now();
  const requestId = `extract_multiple_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  let savedImagePaths: string[] = [];
  
  console.log('🖼️ [ExtractMultiple] ===== REQUEST START =====');
  console.log('🖼️ [ExtractMultiple] Request ID:', requestId);
  console.log('🖼️ [ExtractMultiple] Request received at:', new Date().toISOString());
  
  try {
    const { deviceOverride, patientId, deviceMasterId, imageCount } = req.body;
    const images = req.files;
    
    console.log('🖼️ [ExtractMultiple] Request details:', {
      imageCount: imageCount,
      deviceOverride: deviceOverride,
      patientId: patientId,
      deviceMasterId: deviceMasterId,
      actualImageCount: images ? images.length : 0
    });
    
    logger.info({
      event: 'extract_multiple_request',
      endpoint: '/api/extract-multiple',
      requestId,
      imageCount: parseInt(imageCount),
      deviceOverride,
      patientId,
      deviceMasterId,
      timestamp: new Date().toISOString()
    });
    
    // Validate image count
    const count = parseInt(imageCount);
    if (count > 5) {
      console.error('❌ [ExtractMultiple] Invalid image count:', count);
      return res.status(400).json({
        success: false,
        error: 'Invalid image count. Must be between 3 and 5 images.',
        code: ERROR_CODES.INVALID_IMAGE_COUNT,
        timestamp: new Date().toISOString()
      });
    }
    
    // Validate files
    if (!images || images.length !== count) {
      console.error('❌ [ExtractMultiple] Image count mismatch:', {
        expected: count,
        actual: images ? images.length : 0
      });
      return res.status(400).json({
        success: false,
        error: 'Image count mismatch.',
        code: ERROR_CODES.IMAGE_COUNT_MISMATCH,
        timestamp: new Date().toISOString()
      });
    }
    
    // Save images to to_extract folder first
    const imagePromises = (images as Express.Multer.File[]).map(async (image, index) => {
      const savedPath = await saveImageToExtract(
        image.buffer, 
        image.originalname, 
        patientId || 'unknown', 
        deviceMasterId || 'unknown', 
        index
      );
      return savedPath;
    });
    
    const savedPaths = await Promise.all(imagePromises);
    savedImagePaths.push(...savedPaths);
    
    console.log('💾 [ExtractMultiple] All images saved to to_extract folder');
    
    // Process images with AI
    console.log('🤖 [ExtractMultiple] Starting AI processing...');
    const result = await llmService.processMultipleImages(images as any, deviceOverride, patientId, deviceMasterId);
    const responseTime = Date.now() - startTime;
    
    console.log('✅ [ExtractMultiple] ===== REQUEST SUCCESS =====');
    console.log('✅ [ExtractMultiple] Request ID:', requestId);
    console.log('✅ [ExtractMultiple] Response time:', responseTime, 'ms');
    console.log('✅ [ExtractMultiple] Data points extracted:', result.data.length);
    console.log('🔍 [ExtractMultiple] Result structure:', JSON.stringify(result, null, 2));
    
    // Move images from to_extract to extracted folder
    const extractedImagePaths: string[] = [];
    savedImagePaths.forEach((imagePath, index) => {
      try {
        const extractedPath = moveImageToExtracted(
          imagePath, 
          patientId || 'unknown', 
          deviceMasterId || 'unknown', 
          index
        );
        extractedImagePaths.push(extractedPath);
      } catch (error) {
        console.error('❌ [ExtractMultiple] Failed to move image:', error);
      }
    });
    
    // Save result JSON to output folder
    const jsonFilePath = saveResultJson(result, patientId || 'unknown', deviceMasterId || 'unknown');
    
    logger.info({
      event: 'extract_multiple_success',
      endpoint: '/api/extract-multiple',
      requestId,
      responseTime,
      dataPoints: result.data.length,
      processingTime: result.processingTime,
      imageCount: result.imageCount,
      extractedImages: extractedImagePaths.length,
      jsonFilePath: jsonFilePath,
      timestamp: new Date().toISOString()
    });
    
    res.json({
      success: true,
      ...result,
      fileStorage: {
        extractedImages: extractedImagePaths,
        jsonResult: jsonFilePath
      }
    });
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Clean up saved images from to_extract folder on error
    if (savedImagePaths && savedImagePaths.length > 0) {
      console.log('🧹 [ExtractMultiple] Cleaning up saved images due to error...');
      savedImagePaths.forEach((imagePath: string) => {
        try {
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
            console.log(`🗑️ [ExtractMultiple] Cleaned up: ${imagePath}`);
          }
        } catch (cleanupError) {
          console.error('❌ [ExtractMultiple] Failed to clean up image:', cleanupError);
        }
      });
    }
    
    console.error('❌ [ExtractMultiple] ===== REQUEST FAILED =====');
    console.error('❌ [ExtractMultiple] Request ID:', requestId);
    console.error('❌ [ExtractMultiple] Error at:', new Date().toISOString());
    console.error('❌ [ExtractMultiple] Error message:', errorMessage);
    console.error('❌ [ExtractMultiple] Response time:', responseTime, 'ms');
    
    logger.error({
      event: 'extract_multiple_error',
      endpoint: '/api/extract-multiple',
      requestId,
      error: errorMessage,
      responseTime,
      timestamp: new Date().toISOString()
    });
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: ERROR_CODES.PROCESSING_ERROR,
      timestamp: new Date().toISOString()
    });
  }
});


// Device Data Extraction Endpoint
app.post('/api/extract', upload.single('image'), async (req, res) => {
    const startTime = Date.now();
    let savedImagePath: string | null = null;

    if (!req.file || !req.file.buffer) {
        logger.error({
            event: 'api_error',
            endpoint: '/api/extract',
            error: 'No image file uploaded or file buffer missing',
            timestamp: new Date().toISOString()
        });
        return res.status(400).json({ 
            error: 'No image file uploaded or file buffer missing',
            timestamp: new Date().toISOString()
        });
    }

    const imageBuffer = req.file.buffer;
    // Extract just the base64 part - the processor will add the data URL prefix
    const base64Image = imageBuffer.toString('base64');
    
    console.log('🔍 [Server] Debug base64 info:');
    console.log('🔍 [Server] Image buffer length:', imageBuffer.length);
    console.log('🔍 [Server] Base64 length:', base64Image.length);
    console.log('🔍 [Server] Base64 first 50 chars:', base64Image.substring(0, 50));
    console.log('🔍 [Server] Base64 last 50 chars:', base64Image.substring(Math.max(0, base64Image.length - 50)));
    console.log('🔍 [Server] MIME type:', req.file?.mimetype);
    logger.info({
        event: 'api_call',
        endpoint: '/api/extract',
        input: `<Buffer length=${imageBuffer.length}> | dataUrl length=${base64Image.length}>`,
        deviceOverride: req.body.deviceOverride,
        patientId: req.body.patientId,
        deviceMasterId: req.body.deviceMasterId,
        timestamp: new Date().toISOString()
    });

    try {
        const { deviceOverride, patientId, deviceMasterId } = req.body;
        
        // Save image to to_extract folder first
        savedImagePath = await saveImageToExtract(
            imageBuffer,
            req.file.originalname,
            patientId || 'unknown',
            deviceMasterId || 'unknown',
            0 // Single image, so index is 0
        );
        
        console.log('💾 [Extract] Image saved to to_extract folder');
        
        const result = await llmService.extractDataFromImage(
            base64Image, // pass data URL string
            deviceOverride,
            patientId,
            deviceMasterId
        );
        const responseTime = Date.now() - startTime;

        // Move image from to_extract to extracted folder
        let extractedImagePath: string | null = null;
        if (savedImagePath) {
            try {
                extractedImagePath = moveImageToExtracted(
                    savedImagePath,
                    patientId || 'unknown',
                    deviceMasterId || 'unknown',
                    0 // Single image, so index is 0
                );
            } catch (error) {
                console.error('❌ [Extract] Failed to move image:', error);
            }
        }
        
        // Save result JSON to output folder
        const jsonFilePath = saveResultJson(result, patientId || 'unknown', deviceMasterId || 'unknown');
        
        logger.info({
            event: 'api_success',
            endpoint: '/api/extract',
            responseTime,
            dataPoints: result.data?.length ?? 0,
            extractedImage: extractedImagePath,
            jsonFilePath: jsonFilePath,
            timestamp: new Date().toISOString()
        });

        res.json({
            success: true,
            data: result.data,
            processingTime: result.processingTime,
            modelUsed: result.modelUsed,
            patientId: result.patientId,
            deviceMasterId: result.deviceMasterId,
            fileStorage: {
                extractedImage: extractedImagePath,
                jsonResult: jsonFilePath
            }
        });
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        const responseTime = Date.now() - startTime;
        
        // Clean up saved image from to_extract folder on error
        if (savedImagePath) {
            console.log('🧹 [Extract] Cleaning up saved image due to error...');
            try {
                if (fs.existsSync(savedImagePath)) {
                    fs.unlinkSync(savedImagePath);
                    console.log(`🗑️ [Extract] Cleaned up: ${savedImagePath}`);
                }
            } catch (cleanupError) {
                console.error('❌ [Extract] Failed to clean up image:', cleanupError);
            }
        }

        logger.error({
            event: 'api_error',
            endpoint: '/api/extract',
            error: errorMessage,
            responseTime,
            timestamp: new Date().toISOString()
        });

        res.status(500).json({ 
            success: false,
            error: errorMessage 
        });
    }
});

// Enterprise Data Endpoint
app.get('/api/enterprise', async (req, res) => {
    const startTime = Date.now();
    const { enterpriseId, businessUnitId, dataModel } = req.query;
    
    console.log('🔍 Enterprise endpoint called:', { enterpriseId, businessUnitId, dataModel });
    
    logger.info({
        event: 'api_call',
        endpoint: '/api/enterprise',
        enterpriseId,
        businessUnitId,
        dataModel,
        timestamp: new Date().toISOString()
    });

    try {
        // Validate required parameters
        if (!enterpriseId) {
            return res.status(400).json({
                success: false,
                error: 'enterpriseId is required'
            });
        }

        if (!dataModel || !['patients', 'devices', 'both', 'Patients', 'Devices', 'Both']
            .includes(dataModel as string)) {
            return res.status(400).json({
                success: false,
                error: 'dataModel is required and must be one of: patients, devices, both (case insensitive)'
            });
        }

        // Normalize dataModel to lowercase for processing
        const normalizedDataModel = (dataModel as string).toLowerCase();

        // Call the HDIMS adapter API
        const gatewayBaseUrl = process.env.GATEWAY_BASE_URL || 'http://localhost:8080/hdimsAdapterWeb';
        let hdimsAdapterUrl = `${gatewayBaseUrl}/enterprise/${enterpriseId}`;
        if (businessUnitId) {
            hdimsAdapterUrl += `/businessUnitId/${businessUnitId}`;
        }
        
        console.log('🔍 Calling HDIMS adapter:', hdimsAdapterUrl);
        
        // Retry logic for HDIMS adapter calls
        let hdimsResponse;
        let retryCount = 0;
        const maxRetries = 2;
        
        while (retryCount <= maxRetries) {
            try {
                console.log(`🔍 Attempting HDIMS adapter call (attempt ${retryCount + 1}/${maxRetries + 1}):`, hdimsAdapterUrl);
                
                hdimsResponse = await axios.get(hdimsAdapterUrl, {
                    timeout: 30000, // 30 second timeout (increased from 10s)
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                });
                
                console.log('✅ HDIMS adapter response received on attempt', retryCount + 1);
                break; // Success, exit retry loop
                
            } catch (retryError) {
                retryCount++;
                const errorMessage = retryError instanceof Error ? retryError.message : String(retryError);
                const isTimeout = errorMessage.includes('timeout');
                
                console.error(`❌ HDIMS adapter attempt ${retryCount} failed:`, errorMessage);
                
                if (retryCount > maxRetries) {
                    // Final attempt failed, throw the error
                    throw retryError;
                } else if (isTimeout) {
                    // Wait before retry for timeout errors
                    console.log(`⏳ Waiting 2 seconds before retry ${retryCount + 1}...`);
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }
        }

        console.log('✅ HDIMS adapter response received:', {
            status: hdimsResponse!.status,
            dataKeys: Object.keys(hdimsResponse!.data || {}),
            dataType: typeof hdimsResponse!.data
            // enterpriseResponse: JSON.stringify(hdimsResponse.data.data, null, 2)
        });

        // Process the response based on dataModel parameter
        let result: any = {};
        
        // Extract data from the GraphQL response structure: { data: { enterprise: { businessUnits: [{ iotDevices: [], patients: [] }] } } }
        const enterpriseData = hdimsResponse!.data.data?.enterprise || hdimsResponse!.data.enterprise || hdimsResponse!.data;
        console.log('🔍 Enterprise data structure:', {
            hasData: !!hdimsResponse!.data.data,
            hasEnterprise: !!enterpriseData,
            hasBusinessUnits: !!enterpriseData?.businessUnit
        });
        
        // Extract data from business units array
        const businessUnit = enterpriseData?.businessUnit || [];
        let allPatients: any[] = [];
        let allDevices: any[] = [];
        
        // Collect data from all business units - preserve original structure
        businessUnit.forEach((businessUnit: any, index: number) => {
            console.log(`🔍 Business Unit ${index + 1}:`, {
                businessUnitId: businessUnit.businessUnitId,
                businessUnitName: businessUnit.businessUnitName,
                patientsCount: businessUnit.patients?.length || 0,
                iotDevicesCount: businessUnit.iotDevices?.length || 0
            });
            
            if (businessUnit.patients) {
                // Transform patient data to match frontend format
                const transformedPatients = businessUnit.patients.map((patient: any) => ({
                    PatientId: patient.patientId?.toString() || '',
                    // RegistrationNumber: `REG${patient.patientId}` || '',
                    MaskedNric: patient.nricFinNumber ? `****${patient.nricFinNumber.slice(-4)}` : '',
                    MaskedName: patient.patientName ? `${patient.patientName.split(' ')[0]} ${'*'.repeat(3)}` : '',
                    DateofBirth: patient.dateOfBirth || '',
                    GenderValue: patient.gender === 1 ? 'Male' : patient.gender === 2 ? 'Female' : 'Other',
                    patientPhoto: patient.patientPhoto || null // Add patient photo data
                }));
                allPatients = allPatients.concat(transformedPatients);
            }
            if (businessUnit.iotDevices) {
                // Transform device data to match frontend format
                const transformedDevices = businessUnit.iotDevices.map((device: any) => ({
                    DeviceId: device.deviceId?.toString() || '',
                    DeviceName: device.deviceName || '',
                    DeviceModel: device.model?.toString() || '',
                    Brand: device.brandName?.toString() || '',
                    SerialNumber: device.serialNumber || '',
                    Notes: device.remarks || '',
                    Status: 'Active'
                }));
                allDevices = allDevices.concat(transformedDevices);
            }
        });
        
        if (normalizedDataModel === 'patients' || normalizedDataModel === 'both') {
            result.patients = allPatients;
            console.log('🔍 Patients data found:', {
                // patients: result.patients,
                patientsLength: result.patients?.length || 0,
                patientsType: typeof result.patients
            });
        }
        
        if (normalizedDataModel === 'devices' || normalizedDataModel === 'both') {
            result.devices = allDevices;
            console.log('🔍 Devices data found:', {
                // devices: result.devices,
                devicesLength: result.devices?.length || 0,
                devicesType: typeof result.devices
            });
        }

        // Always include enterprise structure
        result.enterprise = enterpriseData;
        result.businessUnit = businessUnit;

        // If no specific data model filtering, return all data
        if (!normalizedDataModel || normalizedDataModel === 'both') {
            result = {
                // patients: allPatients,
                // devices: allDevices,
                enterprise: enterpriseData,
                // businessUnit: businessUnit
            };
        }

        // Log the final result for debugging
        console.log('🔍 Final result:', {
            hdimsAdapterUrl,
            enterpriseId,
            businessUnitId,
            dataModel,
            patientsCount: result.patients?.length || 0,
            devicesCount: result.devices?.length || 0,
            hasPatients: !!result.patients,
            hasDevices: !!result.devices
        });

        const responseTime = Date.now() - startTime;

        logger.info({
            event: 'api_success',
            endpoint: '/api/enterprise',
            responseTime,
            enterpriseId,
            businessUnitId,
            dataModel,
            hdimsStatus: hdimsResponse!.status,
            patientsCount: result.patients?.length || 0,
            devicesCount: result.devices?.length || 0,
            timestamp: new Date().toISOString()
        });

        res.json({
            success: true,
            data: result,
            enterpriseId: enterpriseId,
            businessUnitId: businessUnitId || null,
            dataModel,
            responseTime,
            hdimsAdapterUrl
        });

    } catch (hdimsError) {
        console.error('❌ HDIMS adapter error:', hdimsError);
        
        // Log the error details
        const errorMessage = hdimsError instanceof Error ? hdimsError.message : String(hdimsError);
        const errorStatus = hdimsError instanceof Error && 'response' in hdimsError 
            ? (hdimsError as any).response?.status 
            : 'unknown';
        
        logger.error({
            event: 'hdims_adapter_error',
            endpoint: '/api/enterprise',
            enterpriseId: req.query.enterpriseId,
            businessUnitId: req.query.businessUnitId,
            dataModel: req.query.dataModel,
            error: errorMessage,
            errorStatus,
            // hdimsAdapterUrl: hdimsAdapterUrl,
            timestamp: new Date().toISOString()
        });

        // Return error response with more helpful information
        const isTimeout = errorMessage.includes('timeout');
        const isConnectionError = errorMessage.includes('ECONNREFUSED') || errorMessage.includes('ENOTFOUND');
        
        let userMessage = 'HDIMS adapter service unavailable';
        if (isTimeout) {
            userMessage = 'Enterprise data service is taking too long to respond. Please try again in a few moments.';
        } else if (isConnectionError) {
            userMessage = 'Enterprise data service is currently unavailable. Please check your connection and try again.';
        }
        
        res.status(502).json({
            success: false,
            error: userMessage,
            details: errorMessage,
            // hdimsAdapterUrl: hdimsAdapterUrl,
            enterpriseId: req.query.enterpriseId,
            businessUnitId: req.query.businessUnitId,
            dataModel: req.query.dataModel,
            isTimeout,
            isConnectionError
        });
        return;
    }
});

// Lookup Data Endpoint
app.post('/api/lookups', async (req, res) => {
  const startTime = Date.now();
  const requestId = `lookups_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const { enterpriseId, lookupNames } = req.body;
  
  console.log('🔍 [Lookups] ===== REQUEST START =====');
  console.log('🔍 [Lookups] Request ID:', requestId);
  console.log('🔍 [Lookups] Request received at:', new Date().toISOString());
  console.log('🔍 [Lookups] Enterprise ID:', enterpriseId);
  console.log('🔍 [Lookups] Lookup Names:', lookupNames);
  
  logger.info({
    event: 'lookups_request',
    endpoint: '/api/lookups',
    requestId,
    enterpriseId,
    lookupNames,
    timestamp: new Date().toISOString()
  });

  try {
    // Validate required parameters
    if (!enterpriseId) {
      console.log('❌ [Lookups] Enterprise ID is required');
      return res.status(400).json({
        success: false,
        error: 'enterpriseId is required'
      });
    }

    if (!lookupNames || !Array.isArray(lookupNames) || lookupNames.length === 0) {
      console.log('❌ [Lookups] Lookup names array is required');
      return res.status(400).json({
        success: false,
        error: 'lookupNames is required and must be a non-empty array'
      });
    }

    // Validate that all lookup names are strings
    const invalidNames = lookupNames.filter(name => typeof name !== 'string' || name.trim() === '');
    if (invalidNames.length > 0) {
      console.log('❌ [Lookups] Invalid lookup names:', invalidNames);
      return res.status(400).json({
        success: false,
        error: 'All lookup names must be non-empty strings'
      });
    }

    console.log('🔍 [Lookups] Calling enterprise API service...');
    
    // Call the enterprise API service
    const enterpriseApiService = getEnterpriseApiService();
    const lookupData = await enterpriseApiService.fetchLookupDataWithRetry(enterpriseId, lookupNames);
    
    const responseTime = Date.now() - startTime;
    
    console.log('✅ [Lookups] ===== REQUEST SUCCESS =====');
    console.log('✅ [Lookups] Request ID:', requestId);
    console.log('✅ [Lookups] Response time:', responseTime, 'ms');
    console.log('✅ [Lookups] Lookup data keys:', Object.keys(lookupData));
    
    logger.info({
      event: 'lookups_success',
      endpoint: '/api/lookups',
      requestId,
      responseTime,
      enterpriseId,
      lookupNames,
      dataKeys: Object.keys(lookupData),
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      data: lookupData,
      enterpriseId,
      lookupNames,
      responseTime,
      requestId
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    console.error('❌ [Lookups] ===== REQUEST FAILED =====');
    console.error('❌ [Lookups] Request ID:', requestId);
    console.error('❌ [Lookups] Error at:', new Date().toISOString());
    console.error('❌ [Lookups] Error message:', errorMessage);
    console.error('❌ [Lookups] Response time:', responseTime, 'ms');
    
    logger.error({
      event: 'lookups_error',
      endpoint: '/api/lookups',
      requestId,
      error: errorMessage,
      responseTime,
      enterpriseId,
      lookupNames,
      timestamp: new Date().toISOString()
    });

    res.status(500).json({
      success: false,
      error: 'Failed to fetch lookup data',
      details: errorMessage,
      requestId,
      timestamp: new Date().toISOString()
    });
  }
});

// Error handling middleware for multer errors
app.use((error: any, req: any, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 10MB per image.',
        code: ERROR_CODES.FILE_TOO_LARGE,
        timestamp: new Date().toISOString()
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Too many files. Maximum is 5 images.',
        code: ERROR_CODES.INVALID_IMAGE_COUNT,
        timestamp: new Date().toISOString()
      });
    }
  }
  
  if (error.message === 'Only image files are allowed') {
    return res.status(400).json({
      success: false,
      error: 'Invalid file type. Only image files are allowed.',
      code: ERROR_CODES.INVALID_FILE_TYPE,
      timestamp: new Date().toISOString()
    });
  }
  
  // Default error
  console.error('❌ [Server] Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    timestamp: new Date().toISOString()
  });
});

// Register Fresenius 4008S device routes
app.use('/api/fresenius-4008s', fresenius4008sRouter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log('🚀 [Server] ===== STARTING SERVER =====');
    console.log(`🚀 [Server] GenAI server running on port ${PORT}`);
    console.log(`🚀 [Server] Health check: http://localhost:${PORT}/api/health`);
    console.log(`🚀 [Server] GenAI endpoint: http://localhost:${PORT}/api/genai`);
    console.log(`🚀 [Server] Extract endpoint: http://localhost:${PORT}/api/extract`);
    console.log(`🚀 [Server] Extract Multiple endpoint: http://localhost:${PORT}/api/extract-multiple`);
    console.log(`🚀 [Server] Enterprise endpoint: http://localhost:${PORT}/api/enterprise`);
    console.log(`🚀 [Server] Lookups endpoint: http://localhost:${PORT}/api/lookups`);
    console.log(`🚀 [Server] Fresenius 4008S endpoints: http://localhost:${PORT}/api/fresenius-4008s`);
    console.log('🚀 [Server] ===== SERVER READY =====');
    
    // Initialize folder structure
    initializeFolderStructure();
    
    logger.info({ event: 'server_start', port: PORT, timestamp: new Date().toISOString() });
});

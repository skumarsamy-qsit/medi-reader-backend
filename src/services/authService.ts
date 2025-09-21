import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'admin' | 'doctor' | 'nurse' | 'technician';
  password: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  createdAt: string;
  updatedAt: string;
  enterpriseId: number;
  enterpriseBusinessUnitId: number;
  hasAdminRole: boolean;
  hasDoctorRole: boolean;
  hasNurseRole: boolean;
  authorities: string;
  authToken: string;
}

export interface AuthResponse {
  success: boolean;
  user?: Omit<User, 'password'>;
  token?: string;
  refreshToken?: string;
  message?: string;
  error?: string;
}

// UserResponse interface to match backend gateway server format
export interface UserResponse {
  userId: number;
  username: string;
  fullName: string;
  enterpriseId: number;
  enterpriseBusinessUnitId: number;
  hasAdminRole: boolean;
  hasDoctorRole: boolean;
  hasNurseRole: boolean;
  authorities: string;
  authToken: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'doctor' | 'nurse' | 'technician';
}

export interface ResetPasswordData {
  email?: string;
  phone?: string;
  method: 'email' | 'phone' | '2fa';
}

export interface ResetPasswordConfirmData {
  token: string;
  newPassword: string;
  method: 'email' | 'phone' | '2fa';
}

class AuthService {
  private static instance: AuthService;
  private users: Map<string, User> = new Map();
  private refreshTokens: Map<string, { userId: string; expiresAt: Date }> = new Map();
  private resetTokens: Map<string, { userId: string; expiresAt: Date }> = new Map();
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'medi-reader-24-secret-key-change-in-production';
  private readonly JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'medi-reader-24-refresh-secret-key-change-in-production';
  private readonly JWT_EXPIRES_IN = '24h';
  private readonly REFRESH_TOKEN_EXPIRES_IN = '7d';

  private constructor() {
    // Initialize with a default admin user for testing
    this.createDefaultAdmin();
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private async createDefaultAdmin() {
    const adminId = uuidv4();
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const adminUser: User = {
      id: adminId,
      email: 'admin@medireader24.com',
      firstName: 'admin',
      lastName: 'user',
      phone: '+1234567890',
      role: 'admin',
      password: hashedPassword,
      isEmailVerified: true,
      isPhoneVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      enterpriseId: 1,
      enterpriseBusinessUnitId: 1,
      hasAdminRole: true,
      hasDoctorRole: false,
      hasNurseRole: false,
      authorities: 'admin',
      authToken: '',
    };

    this.users.set(adminId, adminUser);
    this.users.set(adminUser.email, adminUser); // Also index by email for quick lookup
  }

  private generateTokens(userId: string): { token: string; refreshToken: string } {
    const token = jwt.sign(
      { userId, type: 'access' },
      this.JWT_SECRET,
      { expiresIn: this.JWT_EXPIRES_IN }
    );

    const refreshToken = jwt.sign(
      { userId, type: 'refresh' },
      this.JWT_REFRESH_SECRET,
      { expiresIn: this.REFRESH_TOKEN_EXPIRES_IN }
    );

    // Store refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
    this.refreshTokens.set(refreshToken, { userId, expiresAt });

    return { token, refreshToken };
  }

  private getUserWithoutPassword(user: User): Omit<User, 'password'> {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  public async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const { username, password } = credentials;

      console.log('🔐 [AuthService] ===== LOGIN REQUEST START =====');
      console.log('🔐 [AuthService] Username:', username);
      console.log('🔐 [AuthService] Has password:', !!password);
      console.log('🔐 [AuthService] Calling backend gateway server...');

      // Call backend gateway server
      const gatewayBaseUrl = process.env.GATEWAY_BASE_URL || 'http://localhost:8080/hdimsAdapterWeb';
      const gatewayUrl = `${gatewayBaseUrl}/auth/login`;
      const loginRequest = {
        username: username,
        password: password
      };

      console.log('🔐 [AuthService] Gateway URL:', gatewayUrl);
      console.log('🔐 [AuthService] Login request:', JSON.stringify(loginRequest, null, 2));

      try {
        const gatewayResponse = await axios.post(gatewayUrl, loginRequest, {
          timeout: 10000, // 10 second timeout
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        console.log('✅ [AuthService] ===== GATEWAY RESPONSE SUCCESS =====');
        console.log('✅ [AuthService] Status:', gatewayResponse.status);
        console.log('✅ [AuthService] Response data:', JSON.stringify(gatewayResponse.data, null, 2));

        const userResponse: UserResponse = gatewayResponse.data;

        // Convert UserResponse to our internal User format
        const user: User = {
          id: userResponse.userId.toString(),
          email: username, // Use username as email for now
          firstName: userResponse.username,
          lastName: userResponse.fullName.split(' ').slice(1).join(' ') || '',
          phone: '',
          role: this.mapRolesToRole(userResponse),
          password: '', // No password stored locally
          isEmailVerified: true,
          isPhoneVerified: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          enterpriseId: userResponse.enterpriseId,
          enterpriseBusinessUnitId: userResponse.enterpriseBusinessUnitId,
          hasAdminRole: userResponse.hasAdminRole,
          hasDoctorRole: userResponse.hasDoctorRole,
          hasNurseRole: userResponse.hasNurseRole,
          authorities: userResponse.authorities,
          authToken: userResponse.authToken,
        };

        // Store user locally for session management
        this.users.set(user.id, user);
        this.users.set(user.email, user);

        // Generate our own tokens for session management
        const { token, refreshToken } = this.generateTokens(user.id);

        console.log('✅ [AuthService] ===== LOGIN SUCCESS =====');
        console.log('✅ [AuthService] User ID:', user.id);
        console.log('✅ [AuthService] Username:', user.firstName);
        console.log('✅ [AuthService] Role:', user.role);
        console.log('✅ [AuthService] Enterprise ID:', userResponse.enterpriseId);
        console.log('✅ [AuthService] Business Unit ID:', userResponse.enterpriseBusinessUnitId);

        return {
          success: true,
          user: this.getUserWithoutPassword(user),
          token,
          refreshToken,
        };

      } catch (gatewayError) {
        console.error('❌ [AuthService] ===== GATEWAY ERROR =====');
        console.error('❌ [AuthService] Gateway error:', gatewayError);
        
        const errorMessage = gatewayError instanceof Error ? gatewayError.message : String(gatewayError);
        const errorStatus = gatewayError instanceof Error && 'response' in gatewayError 
          ? (gatewayError as any).response?.status 
          : 'unknown';

        console.error('❌ [AuthService] Error message:', errorMessage);
        console.error('❌ [AuthService] Error status:', errorStatus);

        // If gateway returns 401/403, it's invalid credentials
        if (errorStatus === 401 || errorStatus === 403) {
          return {
            success: false,
            error: 'Invalid username or password',
          };
        }

        // For other errors, return generic error
        return {
          success: false,
          error: 'Authentication service unavailable',
        };
      }

    } catch (error) {
      console.error('❌ [AuthService] ===== LOGIN ERROR =====');
      console.error('❌ [AuthService] Error:', error);
      return {
        success: false,
        error: 'Internal server error',
      };
    }
  }

  private mapRolesToRole(userResponse: UserResponse): 'admin' | 'doctor' | 'nurse' | 'technician' {
    if (userResponse.hasAdminRole) {
      return 'admin';
    } else if (userResponse.hasDoctorRole) {
      return 'doctor';
    } else if (userResponse.hasNurseRole) {
      return 'nurse';
    } else {
      return 'technician'; // Default role
    }
  }

  public async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      const { email, password, firstName, lastName, phone, role } = userData;

      // Check if user already exists
      const existingUser = Array.from(this.users.values()).find(u => u.email === email);
      if (existingUser) {
        return {
          success: false,
          error: 'User with this email already exists',
        };
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create new user
      const userId = uuidv4();
      const newUser: User = {
        id: userId,
        email,
        firstName,
        lastName,
        phone,
        role,
        password: hashedPassword,
        isEmailVerified: false,
        isPhoneVerified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        enterpriseId: 1,
        enterpriseBusinessUnitId: 1,
        hasAdminRole: false,
        hasDoctorRole: false,
        hasNurseRole: false,
        authorities: 'user',
        authToken: '',
      };

      // Store user
      this.users.set(userId, newUser);
      this.users.set(email, newUser); // Also index by email

      // Generate tokens
      const { token, refreshToken } = this.generateTokens(userId);

      return {
        success: true,
        user: this.getUserWithoutPassword(newUser),
        token,
        refreshToken,
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: 'Internal server error',
      };
    }
  }

  public async validateToken(token: string): Promise<{ valid: boolean; userId?: string }> {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as any;
      if (decoded.type !== 'access') {
        return { valid: false };
      }

      const user = this.users.get(decoded.userId);
      if (!user) {
        return { valid: false };
      }

      return { valid: true, userId: decoded.userId };
    } catch (error) {
      return { valid: false };
    }
  }

  public async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      const tokenData = this.refreshTokens.get(refreshToken);
      if (!tokenData || tokenData.expiresAt < new Date()) {
        this.refreshTokens.delete(refreshToken);
        return {
          success: false,
          error: 'Invalid or expired refresh token',
        };
      }

      const user = this.users.get(tokenData.userId);
      if (!user) {
        return {
          success: false,
          error: 'User not found',
        };
      }

      // Generate new tokens
      const { token: newToken, refreshToken: newRefreshToken } = this.generateTokens(user.id);

      // Remove old refresh token
      this.refreshTokens.delete(refreshToken);

      return {
        success: true,
        user: this.getUserWithoutPassword(user),
        token: newToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      console.error('Token refresh error:', error);
      return {
        success: false,
        error: 'Internal server error',
      };
    }
  }

  public async logout(refreshToken?: string): Promise<AuthResponse> {
    try {
      if (refreshToken) {
        this.refreshTokens.delete(refreshToken);
      }

      return {
        success: true,
        message: 'Logged out successfully',
      };
    } catch (error) {
      console.error('Logout error:', error);
      return {
        success: false,
        error: 'Internal server error',
      };
    }
  }

  public async resetPassword(data: ResetPasswordData): Promise<AuthResponse> {
    try {
      const { email, phone, method } = data;

      let user: User | undefined;
      if (method === 'email' && email) {
        user = Array.from(this.users.values()).find(u => u.email === email);
      } else if (method === 'phone' && phone) {
        user = Array.from(this.users.values()).find(u => u.phone === phone);
      }

      if (!user) {
        return {
          success: false,
          error: 'User not found',
        };
      }

      // Generate reset token
      const resetToken = uuidv4();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour
      this.resetTokens.set(resetToken, { userId: user.id, expiresAt });

      // In a real application, you would send this token via email/SMS
      console.log(`Reset token for ${user.email}: ${resetToken}`);

      return {
        success: true,
        message: `Reset token sent via ${method}`,
      };
    } catch (error) {
      console.error('Password reset error:', error);
      return {
        success: false,
        error: 'Internal server error',
      };
    }
  }

  public async confirmResetPassword(data: ResetPasswordConfirmData): Promise<AuthResponse> {
    try {
      const { token, newPassword, method } = data;

      const tokenData = this.resetTokens.get(token);
      if (!tokenData || tokenData.expiresAt < new Date()) {
        this.resetTokens.delete(token);
        return {
          success: false,
          error: 'Invalid or expired reset token',
        };
      }

      const user = this.users.get(tokenData.userId);
      if (!user) {
        return {
          success: false,
          error: 'User not found',
        };
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update user password
      user.password = hashedPassword;
      user.updatedAt = new Date().toISOString();

      // Remove reset token
      this.resetTokens.delete(token);

      return {
        success: true,
        message: 'Password reset successfully',
      };
    } catch (error) {
      console.error('Password reset confirmation error:', error);
      return {
        success: false,
        error: 'Internal server error',
      };
    }
  }

  public async updateUser(userId: string, updates: Partial<Omit<User, 'id' | 'password' | 'createdAt'>>): Promise<AuthResponse> {
    try {
      const user = this.users.get(userId);
      if (!user) {
        return {
          success: false,
          error: 'User not found',
        };
      }

      // Update user
      Object.assign(user, updates, { updatedAt: new Date().toISOString() });

      return {
        success: true,
        user: this.getUserWithoutPassword(user),
      };
    } catch (error) {
      console.error('User update error:', error);
      return {
        success: false,
        error: 'Internal server error',
      };
    }
  }

  public async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<AuthResponse> {
    try {
      const user = this.users.get(userId);
      if (!user) {
        return {
          success: false,
          error: 'User not found',
        };
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return {
          success: false,
          error: 'Current password is incorrect',
        };
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      user.password = hashedPassword;
      user.updatedAt = new Date().toISOString();

      return {
        success: true,
        message: 'Password changed successfully',
      };
    } catch (error) {
      console.error('Password change error:', error);
      return {
        success: false,
        error: 'Internal server error',
      };
    }
  }

  public getUserById(userId: string): User | undefined {
    return this.users.get(userId);
  }
}

export default AuthService;

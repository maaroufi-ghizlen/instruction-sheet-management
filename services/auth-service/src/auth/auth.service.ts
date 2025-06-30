// services/auth-service/src/auth/auth.service.ts

import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';
import { User, UserDocument } from '../database/schemas/user.schema';
import { RefreshToken, RefreshTokenDocument } from '../database/schemas/refresh-token.schema';
import { UserRole } from '@shared/enums/enums';
import { JwtPayload } from '@shared/types';
import {
  LoginDto,
  RegisterDto,
  RefreshTokenDto,
  ChangePasswordDto,
  Verify2FaDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  LoginResponseDto,
  Setup2FaResponseDto,
} from './dto';
import { randomBytes, createHash } from 'crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(RefreshToken.name) private refreshTokenModel: Model<RefreshTokenDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  // User Registration
  async register(registerDto: RegisterDto): Promise<{ message: string; userId: string }> {
    const { email, password, firstName, lastName, role, departmentId } = registerDto;

    // Check if user already exists
    const existingUser = await this.userModel.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const saltRounds = this.configService.get<number>('BCRYPT_SALT_ROUNDS') || 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = new this.userModel({
      email: email.toLowerCase(),
      passwordHash,
      firstName,
      lastName,
      role,
      departmentId,
      isActive: true,
      isTwoFactorEnabled: false,
      loginAttempts: 0,
    });

    await user.save();

    this.logger.log(`User registered successfully: ${email}`);

    return {
      message: 'User registered successfully',
      userId: (user._id as any).toString(),
    };
  }

  // User Login
  async login(loginDto: LoginDto, ipAddress?: string, userAgent?: string): Promise<LoginResponseDto> {
    const { email, password, twoFactorToken } = loginDto;

    // Validate user credentials
    const user = await this.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if 2FA is required
    if (user.isTwoFactorEnabled) {
      if (!twoFactorToken) {
        throw new UnauthorizedException('Two-factor authentication token required');
      }

      const isValidToken = this.verify2FAToken(user.twoFactorSecret, twoFactorToken);
      if (!isValidToken) {
        throw new UnauthorizedException('Invalid two-factor authentication token');
      }
    }

    // Update user login info
    user.lastLoginAt = new Date();
    await user.resetLoginAttempts();
    await user.save();

    // Generate tokens
    const payload: JwtPayload = {
      sub: (user._id as any).toString(),
      email: user.email,
      role: user.role,
      departmentId: (user.departmentId as any).toString(),
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = await this.generateRefreshToken((user._id as any).toString(), ipAddress, userAgent);

    this.logger.log(`User logged in successfully: ${email}`);

    return {
      accessToken,
      refreshToken: refreshToken.token,
      user: user.toJSON() as any,
      expiresIn: 900, // 15 minutes
    };
  }

  // Validate user credentials
  async validateUser(email: string, password: string): Promise<UserDocument | null> {
    const user = await this.userModel
      .findOne({ email: email.toLowerCase() })
      .select('+passwordHash +loginAttempts +lockedUntil');

    if (!user) {
      return null;
    }

    // Check if account is locked
    if (user.isLocked) {
      throw new UnauthorizedException('Account is temporarily locked due to too many failed attempts');
    }

    // Check if account is active
    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    
    if (!isPasswordValid) {
      // Increment login attempts
      await user.incLoginAttempts();
      return null;
    }

    // Reset login attempts on successful authentication
    if (user.loginAttempts > 0) {
      await user.resetLoginAttempts();
    }

    return user;
  }

  // Refresh Token
  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<{ accessToken: string; refreshToken: string }> {
    const { refreshToken } = refreshTokenDto;

    const tokenDoc = await this.refreshTokenModel
      .findOne({ token: refreshToken, isRevoked: false })
      .populate('userId');

    if (!tokenDoc || !(tokenDoc as any).isValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = tokenDoc.userId as any;
    if (!user.isActive) {
      throw new UnauthorizedException('User account is deactivated');
    }

    // Generate new tokens
    const payload: JwtPayload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      departmentId: user.departmentId.toString(),
    };

    const accessToken = this.jwtService.sign(payload);
    
    // Revoke old refresh token
    tokenDoc.isRevoked = true;
    await tokenDoc.save();

    // Generate new refresh token
    const newRefreshToken = await this.generateRefreshToken(
      user._id.toString(),
      tokenDoc.ipAddress,
      tokenDoc.userAgent,
    );

    return {
      accessToken,
      refreshToken: newRefreshToken.token,
    };
  }

  // Generate Refresh Token
  private async generateRefreshToken(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<RefreshTokenDocument> {
    const token = randomBytes(64).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    const refreshToken = new this.refreshTokenModel({
      token,
      userId,
      expiresAt,
      ipAddress,
      userAgent,
    });

    return await refreshToken.save();
  }

  // Logout
  async logout(refreshToken: string): Promise<{ message: string }> {
    await this.refreshTokenModel.updateOne(
      { token: refreshToken },
      { isRevoked: true },
    );

    return { message: 'Logged out successfully' };
  }

  // Logout from all devices
  async logoutFromAllDevices(userId: string): Promise<{ message: string }> {
    await this.refreshTokenModel.updateMany(
      { userId, isRevoked: false },
      { isRevoked: true },
    );

    return { message: 'Logged out from all devices successfully' };
  }

  // Change Password
  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<{ message: string }> {
    const { currentPassword, newPassword } = changePasswordDto;

    const user = await this.userModel.findById(userId).select('+passwordHash');
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Check if new password is different from current
    const isSamePassword = await bcrypt.compare(newPassword, user.passwordHash);
    if (isSamePassword) {
      throw new BadRequestException('New password must be different from current password');
    }

    // Hash new password
    const saltRounds = this.configService.get<number>('BCRYPT_SALT_ROUNDS') || 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    user.passwordHash = newPasswordHash;
    user.passwordChangedAt = new Date();
    await user.save();

    // Revoke all refresh tokens to force re-login
    await this.logoutFromAllDevices(userId);

    this.logger.log(`Password changed for user: ${user.email}`);

    return { message: 'Password changed successfully' };
  }

  // Setup Two-Factor Authentication
  async setup2FA(userId: string): Promise<Setup2FaResponseDto> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `${user.email} (Instruction Sheet Management)`,
      issuer: 'InstructionSheet',
      length: 32,
    });

    // Generate QR code
    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url || '');

    // Generate backup codes
    const backupCodes = Array.from({ length: 8 }, () => 
      Math.random().toString(36).substring(2, 10).toUpperCase()
    );

    // Store secret (don't enable 2FA yet, wait for verification)
    user.twoFactorSecret = secret.base32;
    await user.save();

    return {
      secret: secret.base32 || '',
      qrCodeUrl: qrCodeUrl,
      backupCodes,
    };
  }

  // Enable Two-Factor Authentication
  async enable2FA(userId: string, verify2FaDto: Verify2FaDto): Promise<{ message: string }> {
    const { token } = verify2FaDto;

    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.twoFactorSecret) {
      throw new BadRequestException('Two-factor authentication setup not initiated');
    }

    // Verify token
    const isValidToken = this.verify2FAToken(user.twoFactorSecret, token);
    if (!isValidToken) {
      throw new BadRequestException('Invalid verification code');
    }

    // Enable 2FA
    user.isTwoFactorEnabled = true;
    await user.save();

    this.logger.log(`2FA enabled for user: ${user.email}`);

    return { message: 'Two-factor authentication enabled successfully' };
  }

  // Disable Two-Factor Authentication
  async disable2FA(userId: string, verify2FaDto: Verify2FaDto): Promise<{ message: string }> {
    const { token } = verify2FaDto;

    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.isTwoFactorEnabled) {
      throw new BadRequestException('Two-factor authentication is not enabled');
    }

    // Verify token
    const isValidToken = this.verify2FAToken(user.twoFactorSecret, token);
    if (!isValidToken) {
      throw new BadRequestException('Invalid verification code');
    }

    // Disable 2FA
    user.isTwoFactorEnabled = false;
    (user.twoFactorSecret as any) = undefined;
    await user.save();

    this.logger.log(`2FA disabled for user: ${user.email}`);

    return { message: 'Two-factor authentication disabled successfully' };
  }

  // Verify 2FA Token
  private verify2FAToken(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2, // Allow 2 windows for time drift
    });
  }

  // Forgot Password
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
    const { email } = forgotPasswordDto;

    const user = await this.userModel.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Don't reveal if email exists
      return { message: 'If your email exists in our system, you will receive a password reset link' };
    }

    // Generate reset token (in real implementation, send via email)
    const resetToken = randomBytes(32).toString('hex');
    const resetTokenHash = createHash('sha256').update(resetToken).digest('hex');

    // Store reset token hash (would normally save to database with expiration)
    // For demo purposes, we'll just log it
    this.logger.log(`Password reset token for ${email}: ${resetToken}`);

    return { message: 'If your email exists in our system, you will receive a password reset link' };
  }

  // Reset Password
  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    const { token, newPassword } = resetPasswordDto;

    // In real implementation, verify token from database
    // For demo purposes, we'll skip token verification
    this.logger.log(`Password reset attempted with token: ${token}`);

    return { message: 'Password reset successfully' };
  }

  // Get user profile
  async getProfile(userId: string): Promise<UserDocument> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  // Validate JWT payload for strategy
  async validateJwtPayload(payload: JwtPayload): Promise<UserDocument> {
    const user = await this.userModel.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return user;
  }
}
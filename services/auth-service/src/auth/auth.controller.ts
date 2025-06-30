// services/auth-service/src/auth/auth.controller.ts

import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  Logger,
  Ip,
  Headers,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
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
  UserResponseDto,
} from './dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { ApiAuth } from './decorators/api-auth.decorator';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { UserDocument } from '../database/schemas/user.schema';
import { UserRole } from '../../../../shared/common/enums/enums';

@ApiTags('Authentication')
@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register a new user',
    description: 'Create a new user account with email, password, and profile information',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User registered successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'User registered successfully' },
        userId: { type: 'string', example: '507f1f77bcf86cd799439011' },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiConflictResponse({ description: 'User with this email already exists' })
  @ApiTooManyRequestsResponse({ description: 'Too many requests' })
  async register(@Body(ValidationPipe) registerDto: RegisterDto) {
    this.logger.log(`Registration attempt for email: ${registerDto.email}`);
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User login',
    description: 'Authenticate user with email and password, optionally with 2FA token',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Login successful',
    type: LoginResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials or 2FA token' })
  @ApiTooManyRequestsResponse({ description: 'Too many requests' })
  async login(
    @Body(ValidationPipe) loginDto: LoginDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<LoginResponseDto> {
    this.logger.log(`Login attempt for email: ${loginDto.email} from IP: ${ipAddress}`);
    return this.authService.login(loginDto, ipAddress, userAgent);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Generate a new access token using a valid refresh token',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Token refreshed successfully',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
        refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiUnauthorizedResponse({ description: 'Invalid refresh token' })
  @ApiTooManyRequestsResponse({ description: 'Too many requests' })
  async refreshToken(@Body(ValidationPipe) refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto);
  }

  @ApiAuth()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User logout',
    description: 'Logout user and revoke refresh token',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Logout successful',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Logged out successfully' },
      },
    },
  })
  async logout(@Body() body: { refreshToken: string }) {
    return this.authService.logout(body.refreshToken);
  }

  @ApiAuth()
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Logout from all devices',
    description: 'Revoke all refresh tokens for the user across all devices',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Logged out from all devices successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Logged out from all devices successfully' },
      },
    },
  })
  async logoutFromAllDevices(@CurrentUser('_id') userId: string) {
    return this.authService.logoutFromAllDevices(userId);
  }

  @ApiAuth()
  @Get('profile')
  @ApiOperation({
    summary: 'Get user profile',
    description: 'Retrieve the authenticated user\'s profile information',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User profile retrieved successfully',
    type: UserResponseDto,
  })
  async getProfile(@CurrentUser() user: UserDocument): Promise<UserDocument> {
    return user;
  }

  @ApiAuth()
  @Put('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Change password',
    description: 'Change the authenticated user\'s password',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password changed successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Password changed successfully' },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid current password or password requirements not met' })
  async changePassword(
    @CurrentUser('_id') userId: string,
    @Body(ValidationPipe) changePasswordDto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(userId, changePasswordDto);
  }

  @ApiAuth()
  @Post('2fa/setup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Setup two-factor authentication',
    description: 'Initialize 2FA setup and get QR code for authenticator app',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '2FA setup initiated successfully',
    type: Setup2FaResponseDto,
  })
  async setup2FA(@CurrentUser('_id') userId: string): Promise<Setup2FaResponseDto> {
    return this.authService.setup2FA(userId);
  }

  @ApiAuth()
  @Post('2fa/enable')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Enable two-factor authentication',
    description: 'Enable 2FA by verifying the setup with a token from the authenticator app',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '2FA enabled successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Two-factor authentication enabled successfully' },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid verification code or 2FA not set up' })
  async enable2FA(
    @CurrentUser('_id') userId: string,
    @Body(ValidationPipe) verify2FaDto: Verify2FaDto,
  ) {
    return this.authService.enable2FA(userId, verify2FaDto);
  }

  @ApiAuth()
  @Post('2fa/disable')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Disable two-factor authentication',
    description: 'Disable 2FA by verifying with a token from the authenticator app',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '2FA disabled successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Two-factor authentication disabled successfully' },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid verification code or 2FA not enabled' })
  async disable2FA(
    @CurrentUser('_id') userId: string,
    @Body(ValidationPipe) verify2FaDto: Verify2FaDto,
  ) {
    return this.authService.disable2FA(userId, verify2FaDto);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request password reset',
    description: 'Send password reset link to user\'s email',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password reset email sent (if email exists)',
    schema: {
      type: 'object',
      properties: {
        message: { 
          type: 'string', 
          example: 'If your email exists in our system, you will receive a password reset link' 
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid email format' })
  @ApiTooManyRequestsResponse({ description: 'Too many requests' })
  async forgotPassword(@Body(ValidationPipe) forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset password',
    description: 'Reset password using a valid reset token',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password reset successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Password reset successfully' },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid reset token or password requirements not met' })
  @ApiTooManyRequestsResponse({ description: 'Too many requests' })
  async resetPassword(@Body(ValidationPipe) resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @ApiAuth({ roles: [UserRole.ADMIN] })
  @Get('admin/health')
  @ApiOperation({
    summary: 'Admin health check',
    description: 'Health check endpoint for administrators',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Service health status',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'healthy' },
        timestamp: { type: 'string', example: '2024-01-15T10:30:00Z' },
        service: { type: 'string', example: 'auth-service' },
        version: { type: 'string', example: '1.0.0' },
      },
    },
  })
  async adminHealth() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'auth-service',
      version: '1.0.0',
      uptime: process.uptime(),
    };
  }
}
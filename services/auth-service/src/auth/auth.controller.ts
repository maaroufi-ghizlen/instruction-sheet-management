// services/auth-service/src/auth/auth.controller.ts

import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
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
import { Public } from '@instruction-sheet/shared';
import { CurrentUser } from '@instruction-sheet/shared';
import { ApiAuth } from '@instruction-sheet/shared';
import { UserDocument } from '../database/schemas/user.schema';

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
        message: { type: 'string', example: 'Logout successful' },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  async logout(@Body(ValidationPipe) refreshTokenDto: RefreshTokenDto) {
    return this.authService.logout(refreshTokenDto.refreshToken);
  }

  @ApiAuth()
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Logout from all devices',
    description: 'Revoke all refresh tokens for the user',
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
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  async logoutFromAllDevices(@CurrentUser() user: UserDocument) {
    return this.authService.logoutFromAllDevices(user._id.toString());
  }

  @ApiAuth()
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Change user password',
    description: 'Change the current user password with authentication required',
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
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiUnauthorizedResponse({ description: 'Authentication required or current password incorrect' })
  async changePassword(
    @CurrentUser() user: UserDocument,
    @Body(ValidationPipe) changePasswordDto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(user._id.toString(), changePasswordDto);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request password reset',
    description: 'Send password reset link to user email',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password reset email sent',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'If your email exists in our system, you will receive a password reset link' },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid email address' })
  @ApiTooManyRequestsResponse({ description: 'Too many requests' })
  async forgotPassword(@Body(ValidationPipe) forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset password with token',
    description: 'Reset user password using token received via email',
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
  @ApiBadRequestResponse({ description: 'Invalid input data or expired token' })
  @ApiTooManyRequestsResponse({ description: 'Too many requests' })
  async resetPassword(@Body(ValidationPipe) resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @ApiAuth()
  @Post('setup-2fa')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Setup two-factor authentication',
    description: 'Generate QR code and secret for 2FA setup',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '2FA setup initiated',
    type: Setup2FaResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  async setup2FA(@CurrentUser() user: UserDocument): Promise<Setup2FaResponseDto> {
    return this.authService.setup2FA(user._id.toString());
  }

  @ApiAuth()
  @Post('enable-2fa')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Enable two-factor authentication',
    description: 'Verify 2FA token and enable two-factor authentication',
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
  @ApiBadRequestResponse({ description: 'Invalid 2FA token' })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  async enable2FA(
    @CurrentUser() user: UserDocument,
    @Body(ValidationPipe) verify2FaDto: Verify2FaDto,
  ) {
    return this.authService.enable2FA(user._id.toString(), verify2FaDto);
  }

  @ApiAuth()
  @Post('disable-2fa')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Disable two-factor authentication',
    description: 'Disable 2FA for the authenticated user',
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
  @ApiBadRequestResponse({ description: 'Invalid 2FA token' })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  async disable2FA(
    @CurrentUser() user: UserDocument,
    @Body(ValidationPipe) verify2FaDto: Verify2FaDto,
  ) {
    return this.authService.disable2FA(user._id.toString(), verify2FaDto);
  }

  @ApiAuth()
  @Get('profile')
  @ApiOperation({
    summary: 'Get user profile',
    description: 'Get current authenticated user profile information',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User profile retrieved successfully',
    type: UserResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  async getProfile(@CurrentUser() user: UserDocument): Promise<UserResponseDto> {
    return this.authService.getProfile(user._id.toString());
  }
}

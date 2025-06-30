
// services/auth-service/test/auth.controller.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { UserRole } from '@shared/common/types';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    refreshToken: jest.fn(),
    logout: jest.fn(),
    logoutFromAllDevices: jest.fn(),
    changePassword: jest.fn(),
    setup2FA: jest.fn(),
    enable2FA: jest.fn(),
    disable2FA: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
  };

  const mockUser = {
    _id: 'user-id',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: UserRole.PREPARATEUR,
    departmentId: 'dept-id',
    isActive: true,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    })
    .overrideGuard(ThrottlerGuard)
    .useValue({ canActivate: () => true })
    .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a user', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'SecurePassword123!',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.PREPARATEUR,
        departmentId: 'dept-id',
      };

      const expectedResult = {
        message: 'User registered successfully',
        userId: 'user-id',
      };

      mockAuthService.register.mockResolvedValue(expectedResult);

      const result = await controller.register(registerDto);

      expect(result).toEqual(expectedResult);
      expect(authService.register).toHaveBeenCalledWith(registerDto);
    });
  });

  describe('login', () => {
    it('should login a user', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'testPassword',
      };

      const expectedResult = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: mockUser,
        expiresIn: 900,
      };

      mockAuthService.login.mockResolvedValue(expectedResult);

      const result = await controller.login(loginDto, '127.0.0.1', 'test-agent');

      expect(result).toEqual(expectedResult);
      expect(authService.login).toHaveBeenCalledWith(
        loginDto,
        '127.0.0.1',
        'test-agent'
      );
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const result = await controller.getProfile(mockUser as any);

      expect(result).toEqual(mockUser);
    });
  });

  describe('changePassword', () => {
    it('should change password', async () => {
      const changePasswordDto = {
        currentPassword: 'currentPassword',
        newPassword: 'NewSecurePassword123!',
      };

      const expectedResult = { message: 'Password changed successfully' };

      mockAuthService.changePassword.mockResolvedValue(expectedResult);

      const result = await controller.changePassword('user-id', changePasswordDto);

      expect(result).toEqual(expectedResult);
      expect(authService.changePassword).toHaveBeenCalledWith(
        'user-id',
        changePasswordDto
      );
    });
  });

  describe('adminHealth', () => {
    it('should return health status', async () => {
      const result = await controller.adminHealth();

      expect(result).toHaveProperty('status', 'healthy');
      expect(result).toHaveProperty('service', 'auth-service');
      expect(result).toHaveProperty('version', '1.0.0');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('uptime');
    });
  });
});
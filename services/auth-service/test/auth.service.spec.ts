
// services/auth-service/test/auth.service.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../src/auth/auth.service';
import { User } from '../src/database/schemas/user.schema';
import { RefreshToken } from '../src/database/schemas/refresh-token.schema';
import { UserRole } from '@shared/common/types';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let userModel: any;
  let refreshTokenModel: any;
  let jwtService: JwtService;

  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    email: 'test@example.com',
    passwordHash: 'hashedPassword',
    firstName: 'John',
    lastName: 'Doe',
    role: UserRole.PREPARATEUR,
    departmentId: '507f1f77bcf86cd799439012',
    isActive: true,
    isTwoFactorEnabled: false,
    loginAttempts: 0,
    save: jest.fn(),
    toJSON: jest.fn().mockReturnValue({
      id: '507f1f77bcf86cd799439011',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: UserRole.PREPARATEUR,
      departmentId: '507f1f77bcf86cd799439012',
      isActive: true,
    }),
    resetLoginAttempts: jest.fn(),
    get isLocked() { return false; },
  };

  const mockUserModel = {
    findOne: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockRefreshTokenModel = {
    findOne: jest.fn(),
    create: jest.fn(),
    updateOne: jest.fn(),
    updateMany: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        'BCRYPT_SALT_ROUNDS': 12,
        'JWT_SECRET': 'test-secret',
        'TWO_FACTOR_SERVICE_NAME': 'Test Service',
        'TWO_FACTOR_ISSUER': 'Test Issuer',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
        {
          provide: getModelToken(RefreshToken.name),
          useValue: mockRefreshTokenModel,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userModel = module.get(getModelToken(User.name));
    refreshTokenModel = module.get(getModelToken(RefreshToken.name));
    jwtService = module.get<JwtService>(JwtService);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto = {
      email: 'newuser@example.com',
      password: 'SecurePassword123!',
      firstName: 'Jane',
      lastName: 'Doe',
      role: UserRole.PREPARATEUR,
      departmentId: '507f1f77bcf86cd799439012',
    };

    it('should register a new user successfully', async () => {
      // Mock user doesn't exist
      mockUserModel.findOne.mockResolvedValue(null);
      
      // Mock constructor and save
      const mockNewUser = {
        ...mockUser,
        _id: 'new-user-id',
        save: jest.fn().mockResolvedValue(true),
      };
      
      // Mock constructor
      userModel.mockImplementation(() => mockNewUser);

      // Mock bcrypt
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassword' as never);

      const result = await service.register(registerDto);

      expect(result).toEqual({
        message: 'User registered successfully',
        userId: 'new-user-id',
      });
      expect(mockUserModel.findOne).toHaveBeenCalledWith({ 
        email: registerDto.email.toLowerCase() 
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 12);
    });

    it('should throw ConflictException if user already exists', async () => {
      // Mock user exists
      mockUserModel.findOne.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
      expect(mockUserModel.findOne).toHaveBeenCalledWith({ 
        email: registerDto.email.toLowerCase() 
      });
    });
  });

  describe('validateUser', () => {
    it('should return user if credentials are valid', async () => {
      const password = 'testPassword';
      
      // Mock user found with password
      mockUserModel.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          ...mockUser,
          passwordHash: 'hashedPassword',
          loginAttempts: 0,
        }),
      });

      // Mock bcrypt compare
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      const result = await service.validateUser('test@example.com', password);

      expect(result).toBeDefined();
      expect(mockUserModel.findOne).toHaveBeenCalledWith({ 
        email: 'test@example.com' 
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(password, 'hashedPassword');
    });

    it('should return null if user not found', async () => {
      mockUserModel.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      const result = await service.validateUser('nonexistent@example.com', 'password');

      expect(result).toBeNull();
    });

    it('should return null if password is invalid', async () => {
      const mockUserWithMethods = {
        ...mockUser,
        passwordHash: 'hashedPassword',
        loginAttempts: 0,
        incLoginAttempts: jest.fn().mockResolvedValue(true),
      };

      mockUserModel.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUserWithMethods),
      });

      // Mock bcrypt compare to fail
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      const result = await service.validateUser('test@example.com', 'wrongPassword');

      expect(result).toBeNull();
      expect(mockUserWithMethods.incLoginAttempts).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if account is locked', async () => {
      const lockedUser = {
        ...mockUser,
        get isLocked() { return true; },
      };

      mockUserModel.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(lockedUser),
      });

      await expect(
        service.validateUser('test@example.com', 'password')
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if account is inactive', async () => {
      const inactiveUser = {
        ...mockUser,
        isActive: false,
      };

      mockUserModel.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(inactiveUser),
      });

      await expect(
        service.validateUser('test@example.com', 'password')
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'testPassword',
    };

    it('should login user successfully', async () => {
      // Mock validateUser
      jest.spyOn(service, 'validateUser').mockResolvedValue(mockUser as any);

      // Mock refresh token creation
      const mockRefreshToken = {
        token: 'refresh-token',
        save: jest.fn().mockResolvedValue(true),
      };
      refreshTokenModel.mockImplementation(() => mockRefreshToken);

      const result = await service.login(loginDto, '127.0.0.1', 'test-agent');

      expect(result).toEqual({
        accessToken: 'mock-jwt-token',
        refreshToken: 'refresh-token',
        user: mockUser.toJSON(),
        expiresIn: 900,
      });
      expect(service.validateUser).toHaveBeenCalledWith(
        loginDto.email, 
        loginDto.password
      );
      expect(jwtService.sign).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if user validation fails', async () => {
      jest.spyOn(service, 'validateUser').mockResolvedValue(null);

      await expect(
        service.login(loginDto, '127.0.0.1', 'test-agent')
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should require 2FA token when enabled', async () => {
      const userWith2FA = {
        ...mockUser,
        isTwoFactorEnabled: true,
      };
      
      jest.spyOn(service, 'validateUser').mockResolvedValue(userWith2FA as any);

      await expect(
        service.login(loginDto, '127.0.0.1', 'test-agent')
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const refreshTokenDto = { refreshToken: 'valid-refresh-token' };
      
      const mockTokenDoc = {
        userId: mockUser,
        isValid: true,
        isRevoked: false,
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        save: jest.fn().mockResolvedValue(true),
      };

      mockRefreshTokenModel.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockTokenDoc),
      });

      // Mock new refresh token creation
      const mockNewRefreshToken = {
        token: 'new-refresh-token',
        save: jest.fn().mockResolvedValue(true),
      };
      refreshTokenModel.mockImplementation(() => mockNewRefreshToken);

      const result = await service.refreshToken(refreshTokenDto);

      expect(result).toEqual({
        accessToken: 'mock-jwt-token',
        refreshToken: 'new-refresh-token',
      });
      expect(mockTokenDoc.save).toHaveBeenCalled();
      expect(jwtService.sign).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      const refreshTokenDto = { refreshToken: 'invalid-refresh-token' };
      
      mockRefreshTokenModel.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.refreshToken(refreshTokenDto)
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      mockRefreshTokenModel.updateOne.mockResolvedValue({ acknowledged: true });

      const result = await service.logout('refresh-token');

      expect(result).toEqual({ message: 'Logged out successfully' });
      expect(mockRefreshTokenModel.updateOne).toHaveBeenCalledWith(
        { token: 'refresh-token' },
        { isRevoked: true }
      );
    });
  });

  describe('logoutFromAllDevices', () => {
    it('should logout from all devices successfully', async () => {
      mockRefreshTokenModel.updateMany.mockResolvedValue({ acknowledged: true });

      const result = await service.logoutFromAllDevices('user-id');

      expect(result).toEqual({ message: 'Logged out from all devices successfully' });
      expect(mockRefreshTokenModel.updateMany).toHaveBeenCalledWith(
        { userId: 'user-id', isRevoked: false },
        { isRevoked: true }
      );
    });
  });
});

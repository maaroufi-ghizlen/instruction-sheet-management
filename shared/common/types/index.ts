// shared/common/types.ts
import { UserRole } from '../enums/enums'
import { User } from '../interfaces/interfaces'

// DTOs for API communication
export interface LoginRequestDto {
  email: string;
  password: string;
  twoFactorToken?: string;
}

export interface LoginResponseDto {
  accessToken: string;
  refreshToken: string;
  user: Omit<User, 'passwordHash' | 'refreshToken' | 'twoFactorSecret'>;
  expiresIn: number;
}

export interface RegisterRequestDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  departmentId: string;
}

export interface RefreshTokenRequestDto {
  refreshToken: string;
}

export interface JwtPayload {
  sub: string; // user id
  email: string;
  role: UserRole;
  departmentId: string;
  iat?: number;
  exp?: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
  timestamp: string;
  path?: string;
}

export interface PaginationDto {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: PaginationDto;
}

// Common validation schemas
export interface FileUploadDto {
  originalName: string;
  mimeType: string;
  size: number;
  buffer: Buffer;
}

export interface ValidationRequestDto {
  sheetId: string;
  action: 'approve' | 'reject';
  comments?: string;
}

// Service communication interfaces
export interface ServiceHealthCheck {
  service: string;
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  dependencies: {
    database: boolean;
    redis: boolean;
    queue?: boolean;
  };
}

// Configuration interfaces
export interface DatabaseConfig {
  uri: string;
  options?: {
    useNewUrlParser?: boolean;
    useUnifiedTopology?: boolean;
    maxPoolSize?: number;
    serverSelectionTimeoutMS?: number;
  };
}

export interface RedisConfig {
  url: string;
  options?: {
    retryDelayOnFailover?: number;
    maxRetriesPerRequest?: number;
    lazyConnect?: boolean;
  };
}

export interface JwtConfig {
  secret: string;
  refreshSecret: string;
  accessTokenExpirationTime: string;
  refreshTokenExpirationTime: string;
}

export interface RateLimitConfig {
  ttl: number;
  max: number;
}

// Error interfaces
export interface ServiceError {
  code: string;
  message: string;
  service: string;
  timestamp: string;
  details?: any;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

// JWT Payload interface
export interface JwtPayload {
  sub: string; // User ID
  email: string;
  role: UserRole;
  departmentId: string;
  iat?: number;
  exp?: number;
}
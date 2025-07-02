// shared/common/constants.ts
export const API_VERSIONS = {
  V1: 'v1',
} as const;

export const DEFAULT_PAGINATION = {
  PAGE: 1,
  LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

export const JWT_CONSTANTS = {
  ACCESS_TOKEN_EXPIRES_IN: '15m',
  REFRESH_TOKEN_EXPIRES_IN: '7d',
} as const;

export const VALIDATION_RULES = {
  PASSWORD_MIN_LENGTH: 8,
  NAME_MIN_LENGTH: 2,
  DESCRIPTION_MAX_LENGTH: 500,
} as const;

export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const JWT_ACCESS_TOKEN_EXPIRATION = '15m';
export const JWT_REFRESH_TOKEN_EXPIRATION = '7d';
export const BCRYPT_SALT_ROUNDS = 12;
export const MAX_LOGIN_ATTEMPTS = 5;
export const ACCOUNT_LOCK_TIME = 2 * 60 * 60 * 1000; // 2 hours

export const SUPPORTED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
];

export const QR_CODE_SIZE = 256;
export const QR_CODE_ERROR_CORRECTION = 'M';

export const API_RATE_LIMIT = {
  TTL: 60, // seconds
  MAX: 100, // requests per TTL
};

export const ROLES_HIERARCHY = {
  admin: 5,
  ipdf: 4,
  iqp: 3,
  preparateur: 2,
  end_user: 1,
};

export const SERVICE_PORTS = {
  AUTH: 3001,
  USER: 3002,
  SHEET: 3003,
  VALIDATION: 3004,
  QR: 3005,
  NOTIFICATION: 3006,
  ANALYTICS: 3007,
  DEPARTMENT: 3008,
  REPORT: 3009,
  AUDIT: 3010,
  SETTINGS: 3011,
  GATEWAY: 3000,
};

export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  TWO_FACTOR_REQUIRED: 'TWO_FACTOR_REQUIRED',
};

export const SUCCESS_MESSAGES = {
  USER_REGISTERED: 'User registered successfully',
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logged out successfully',
  PASSWORD_CHANGED: 'Password changed successfully',
  TWO_FACTOR_ENABLED: 'Two-factor authentication enabled successfully',
  TWO_FACTOR_DISABLED: 'Two-factor authentication disabled successfully',
  FILE_UPLOADED: 'File uploaded successfully',
  VALIDATION_COMPLETED: 'Validation completed successfully',
};
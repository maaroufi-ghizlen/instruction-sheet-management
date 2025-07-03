"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SUCCESS_MESSAGES = exports.ERROR_CODES = exports.SERVICE_PORTS = exports.ROLES_HIERARCHY = exports.API_RATE_LIMIT = exports.QR_CODE_ERROR_CORRECTION = exports.QR_CODE_SIZE = exports.SUPPORTED_FILE_TYPES = exports.ACCOUNT_LOCK_TIME = exports.MAX_LOGIN_ATTEMPTS = exports.BCRYPT_SALT_ROUNDS = exports.JWT_REFRESH_TOKEN_EXPIRATION = exports.JWT_ACCESS_TOKEN_EXPIRATION = exports.MAX_FILE_SIZE = exports.MIN_PASSWORD_LENGTH = exports.MAX_PAGE_SIZE = exports.DEFAULT_PAGE_SIZE = exports.VALIDATION_RULES = exports.JWT_CONSTANTS = exports.DEFAULT_PAGINATION = exports.API_VERSIONS = void 0;
exports.API_VERSIONS = {
    V1: 'v1',
};
exports.DEFAULT_PAGINATION = {
    PAGE: 1,
    LIMIT: 10,
    MAX_LIMIT: 100,
};
exports.JWT_CONSTANTS = {
    ACCESS_TOKEN_EXPIRES_IN: '15m',
    REFRESH_TOKEN_EXPIRES_IN: '7d',
};
exports.VALIDATION_RULES = {
    PASSWORD_MIN_LENGTH: 8,
    NAME_MIN_LENGTH: 2,
    DESCRIPTION_MAX_LENGTH: 500,
};
exports.DEFAULT_PAGE_SIZE = 10;
exports.MAX_PAGE_SIZE = 100;
exports.MIN_PASSWORD_LENGTH = 8;
exports.MAX_FILE_SIZE = 10 * 1024 * 1024;
exports.JWT_ACCESS_TOKEN_EXPIRATION = '15m';
exports.JWT_REFRESH_TOKEN_EXPIRATION = '7d';
exports.BCRYPT_SALT_ROUNDS = 12;
exports.MAX_LOGIN_ATTEMPTS = 5;
exports.ACCOUNT_LOCK_TIME = 2 * 60 * 60 * 1000;
exports.SUPPORTED_FILE_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
];
exports.QR_CODE_SIZE = 256;
exports.QR_CODE_ERROR_CORRECTION = 'M';
exports.API_RATE_LIMIT = {
    TTL: 60,
    MAX: 100,
};
exports.ROLES_HIERARCHY = {
    admin: 5,
    ipdf: 4,
    iqp: 3,
    preparateur: 2,
    end_user: 1,
};
exports.SERVICE_PORTS = {
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
exports.ERROR_CODES = {
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
exports.SUCCESS_MESSAGES = {
    USER_REGISTERED: 'User registered successfully',
    LOGIN_SUCCESS: 'Login successful',
    LOGOUT_SUCCESS: 'Logged out successfully',
    PASSWORD_CHANGED: 'Password changed successfully',
    TWO_FACTOR_ENABLED: 'Two-factor authentication enabled successfully',
    TWO_FACTOR_DISABLED: 'Two-factor authentication disabled successfully',
    FILE_UPLOADED: 'File uploaded successfully',
    VALIDATION_COMPLETED: 'Validation completed successfully',
};
//# sourceMappingURL=constants.js.map
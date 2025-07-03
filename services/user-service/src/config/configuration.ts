// services/user-service/src/config/configuration.ts

export default () => ({
  // Database Configuration
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/instruction_sheet_db',
  },

  // JWT Configuration (for validating tokens from Auth Service)
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    accessTokenExpirationTime: process.env.JWT_ACCESS_TOKEN_EXPIRATION_TIME || '15m',
  },

  // Service Ports
  ports: {
    user: parseInt(process.env.USER_SERVICE_PORT, 10) || 3002,
    auth: parseInt(process.env.AUTH_SERVICE_PORT, 10) || 3001,
    gateway: parseInt(process.env.GATEWAY_PORT, 10) || 3000,
  },

  // Environment Configuration
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'debug',

  // Rate Limiting Configuration
  rateLimit: {
    ttl: parseInt(process.env.RATE_LIMIT_TTL, 10) || 60,
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
  },

  // CORS Configuration
  cors: {
    origins: process.env.CORS_ORIGINS || 'http://localhost:3000',
    credentials: process.env.CORS_CREDENTIALS === 'true',
  },

  // Pagination Configuration
  pagination: {
    defaultLimit: parseInt(process.env.DEFAULT_PAGE_LIMIT, 10) || 10,
    maxLimit: parseInt(process.env.MAX_PAGE_LIMIT, 10) || 100,
  },

  // Security Configuration
  security: {
    apiKeyHeader: process.env.API_KEY_HEADER || 'x-api-key',
  },

  // Audit Configuration
  audit: {
    enabled: process.env.AUDIT_ENABLED !== 'false',
    retentionDays: parseInt(process.env.AUDIT_RETENTION_DAYS, 10) || 365,
  },

  // Monitoring Configuration
  monitoring: {
    healthCheckTimeout: parseInt(process.env.HEALTH_CHECK_TIMEOUT, 10) || 5000,
    metricsPort: parseInt(process.env.METRICS_PORT, 10) || 9091,
  },
});
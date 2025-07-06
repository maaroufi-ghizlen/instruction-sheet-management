// services/user-service/src/config/configuration.ts

export default () => ({
  // Database Configuration
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/instruction_sheet_db',
  },

  // Redis Configuration
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key',
    accessTokenExpirationTime: process.env.JWT_ACCESS_TOKEN_EXPIRATION_TIME || '15m',
    refreshTokenExpirationTime: process.env.JWT_REFRESH_TOKEN_EXPIRATION_TIME || '7d',
  },

  // Bcrypt Configuration
  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12,
  },

  // Service Ports
  ports: {
    auth: parseInt(process.env.AUTH_SERVICE_PORT, 10) || 3001,
    user: parseInt(process.env.USER_SERVICE_PORT, 10) || 3002,
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

  // Email Configuration
  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASS,
    from: process.env.EMAIL_FROM || 'noreply@yourcompany.com',
  },

  // Security Configuration
  security: {
    encryptionKey: process.env.ENCRYPTION_KEY || 'your-32-character-encryption-key-here',
    apiKeyHeader: process.env.API_KEY_HEADER || 'x-api-key',
  },

  // File Upload Configuration
  upload: {
    path: process.env.UPLOAD_PATH || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 10485760, // 10MB
    allowedTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || ['pdf', 'doc', 'docx', 'txt'],
  },

  // Monitoring Configuration
  monitoring: {
    healthCheckTimeout: parseInt(process.env.HEALTH_CHECK_TIMEOUT, 10) || 5000,
    metricsPort: parseInt(process.env.METRICS_PORT, 10) || 9090,
  },
});
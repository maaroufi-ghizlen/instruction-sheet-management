// services/validation-service/src/config/configuration.ts

export default () => ({
  // Service Configuration
  service: {
    name: 'validation-service',
    version: '1.0.0',
    port: parseInt(process.env.VALIDATION_SERVICE_PORT, 10) || 3005,
    environment: process.env.NODE_ENV || 'development',
  },

  // Database Configuration
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/instruction_sheet_db',
    options: {
      retryWrites: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    },
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  // Rate Limiting
  rateLimit: {
    ttl: parseInt(process.env.RATE_LIMIT_TTL, 10) || 60000, // 1 minute
    limit: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100, // 100 requests per minute
  },

  // Pagination
  pagination: {
    defaultLimit: parseInt(process.env.DEFAULT_PAGE_LIMIT, 10) || 10,
    maxLimit: parseInt(process.env.MAX_PAGE_LIMIT, 10) || 100,
  },

  // Validation Configuration
  validation: {
    defaultTimeoutHours: parseInt(process.env.VALIDATION_TIMEOUT_HOURS, 10) || 72, // 3 days
    maxValidationRetries: parseInt(process.env.MAX_VALIDATION_RETRIES, 10) || 3,
    requireBothStages: process.env.REQUIRE_BOTH_STAGES === 'true' || true,
  },

  // CORS Configuration
  cors: {
    origin: process.env.CORS_ORIGIN || true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
  },

  // API Configuration
  api: {
    prefix: process.env.API_PREFIX || 'api/v1',
    version: process.env.API_VERSION || '1.0',
  },
});
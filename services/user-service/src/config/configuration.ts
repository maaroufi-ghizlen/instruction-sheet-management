// services/user-service/src/config/configuration.ts

const configuration = () => {
  const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
  console.log('🔧 Configuration loading - JWT_SECRET:', jwtSecret ? 'Present' : 'Missing');
  console.log('🔧 Configuration loading - JWT_SECRET length:', jwtSecret?.length);
  console.log('🔧 Configuration loading - All env vars:', Object.keys(process.env).filter(key => key.includes('JWT')));
  
  return {
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
      secret: jwtSecret,
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

    // Other service URLs
    services: {
      auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
      user: process.env.USER_SERVICE_URL || 'http://localhost:3002',
      gateway: process.env.GATEWAY_URL || 'http://localhost:3000',
    },

    // API Keys
    apiKeys: {
      recaptcha: process.env.RECAPTCHA_SECRET_KEY,
      sendgrid: process.env.SENDGRID_API_KEY,
    },
  };
};

export default configuration;
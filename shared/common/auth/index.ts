
// shared/common/auth/index.ts

// Auth utilities and JWT strategy
export * from './utils/auth.utils';
export * from './shared-jwt.strategy';
export * from './shared-auth.module';

// Guards (re-export from guards module)
export * from '../guards/jwt-auth.guard';
export * from '../guards/roles.guard';
export * from '../guards/department.guard';
export * from '../guards/two-factor.guard';

// export * from './strategies/local.strategy'; // Temporarily removed - has service dependencies
// export * from './strategies/local.strategy'; // Commented out due to circular dependency

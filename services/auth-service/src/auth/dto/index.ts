// services/auth-service/src/auth/dto/index.ts

export * from './auth-response.dto';
export * from './change-password.dto';
export * from './forgot-password.dto';
export * from './login.dto';
export * from './refresh-token.dto';
export * from './register.dto';
export * from './reset-password.dto';
export * from './verify-2fa.dto';
export * from './update-profile.dto';

// Export aliases for backward compatibility
export { LoginResponseDto as AuthResponseDto } from './auth-response.dto';
export { Verify2FaDto as Disable2FaDto } from './verify-2fa.dto';
export { Verify2FaDto as Setup2FaDto } from './verify-2fa.dto';

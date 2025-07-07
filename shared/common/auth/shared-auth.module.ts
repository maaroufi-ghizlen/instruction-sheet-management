// shared/common/auth/shared-auth.module.ts

import { Module, Global, DynamicModule } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { SharedJwtStrategy } from './shared-jwt.strategy';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { DepartmentGuard } from '../guards/department.guard';

export interface SharedAuthModuleOptions {
  imports?: any[];
  inject?: any[];
  useFactory?: (configService: any) => { secret: string; signOptions: any };
  jwtSecret?: string;
}

@Global()
@Module({})
export class SharedAuthModule {
  static forRootAsync(options?: SharedAuthModuleOptions): DynamicModule {
    return {
      module: SharedAuthModule,
      imports: [
        ConfigModule, 
        PassportModule.register({ 
          defaultStrategy: 'jwt',
          session: false 
        }),
        JwtModule.registerAsync({
          global: true,
          imports: options?.imports || [ConfigModule],
          inject: options?.inject || [ConfigService],
          useFactory: options?.useFactory || (async (configService: ConfigService) => {
            const secret = options?.jwtSecret || configService.get<string>('jwt.secret') || configService.get<string>('JWT_SECRET');
            console.log('🔧 SharedAuthModule JwtModule factory - secret:', secret ? 'Present' : 'Missing');
            console.log('🔧 SharedAuthModule JwtModule factory - secret length:', secret?.length);
            
            return {
              secret: secret,
              signOptions: {
                expiresIn: configService.get<string>('jwt.accessTokenExpirationTime') || configService.get<string>('JWT_ACCESS_TOKEN_EXPIRATION_TIME') || '15m',
              },
            };
          }),
        }),
      ],
      providers: [
        // Core authentication components
        SharedJwtStrategy,
        
        // Guards with proper dependency injection
        JwtAuthGuard,
        RolesGuard,
        DepartmentGuard,
        
        // Reflector for guards
        Reflector,
        
        // JWT Secret provider for backward compatibility
        {
          provide: 'JWT_SECRET',
          useFactory: options?.useFactory ? 
            (configService: ConfigService) => {
              const result = options.useFactory(configService);
              return result.secret;
            } :
            ((configService: ConfigService) => {
              const secret = options?.jwtSecret || configService.get<string>('jwt.secret') || configService.get<string>('JWT_SECRET');
              console.log('🔧 SharedAuthModule JWT_SECRET provider - secret:', secret ? 'Present' : 'Missing');
              return secret;
            }),
          inject: options?.inject || [ConfigService],
        },
      ],
      exports: [
        // Core modules
        PassportModule, 
        JwtModule,
        
        // Strategy
        SharedJwtStrategy,
        
        // Guards
        JwtAuthGuard,
        RolesGuard,
        DepartmentGuard,
        
        // Reflector for consumers
        Reflector,
        
        // JwtService from JwtModule
        'JwtService',
      ],
    };
  }

  constructor() {
    console.log('📦 SharedAuthModule initialized');
  }
}

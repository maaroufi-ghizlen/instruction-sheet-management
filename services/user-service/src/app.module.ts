// services/user-service/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { APP_GUARD, Reflector } from '@nestjs/core';

import { 
  JwtAuthGuard, 
  RolesGuard,
  DepartmentGuard 
} from '@instruction-sheet/shared';
import { JwtStrategy } from './auth/jwt.strategy';

import { UsersModule } from './users/users.module';
import { DatabaseModule } from './database/database.module';
import configuration from './config/configuration';

@Module({
  imports: [
    // Configuration module
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: [
        '.env.local',
        '.env.development',
        '.env',
      ],
      cache: true,
      expandVariables: true,
    }),

    // Rate limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        ttl: configService.get<number>('RATE_LIMIT_TTL') || 60000,
        limit: configService.get<number>('RATE_LIMIT_MAX') || 100,
      }),
    }),

    // Database
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const uri = 'mongodb://127.0.0.1:27017/instruction_sheet_db';
        console.log('🔍 MongoDB URI being used:', uri);
        return {
          uri,
          retryWrites: true,
          maxPoolSize: 10,
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
        };
      },
    }),

    // JWT (for token validation)
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_ACCESS_TOKEN_EXPIRATION_TIME') || '15m',
        },
      }),
    }),

    // Passport
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // Custom modules
    DatabaseModule,
    UsersModule,
  ],
  controllers: [],
  providers: [
    // Register local JWT strategy
    JwtStrategy,
    
    // Register JwtAuthGuard as global guard
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    
    // ✅ CRITICAL: Register RolesGuard as global guard with factory
    {
      provide: APP_GUARD,
      useFactory: (reflector: Reflector) => new RolesGuard(reflector),
      inject: [Reflector],
    },
    
    // ✅ CRITICAL: Register DepartmentGuard as global guard with factory
    {
      provide: APP_GUARD,
      useFactory: (reflector: Reflector) => new DepartmentGuard(reflector),
      inject: [Reflector],
    },
    
    // ✅ CRITICAL: Provide Reflector explicitly
    Reflector,
  ],
})
export class AppModule {}
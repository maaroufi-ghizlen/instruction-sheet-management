// services/validation-service/src/app.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import { 
  JwtAuthGuard, 
  RolesGuard,
  DepartmentGuard,
  SharedAuthModule
} from '@instruction-sheet/shared';

import { ValidationModule } from './validation/validation.module';
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
        throttlers: [
          {
            ttl: configService.get<number>('RATE_LIMIT_TTL') || 60000,
            limit: configService.get<number>('RATE_LIMIT_MAX') || 100,
          },
        ],
      }),
    }),

    // Shared Authentication Module - MUST come before other modules that use authentication
    SharedAuthModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET') || 'your-super-secret-jwt-key';
        console.log('🔧 Validation-Service SharedAuthModule factory - secret:', secret ? 'Present' : 'Missing');
        console.log('🔧 Validation-Service SharedAuthModule factory - secret length:', secret?.length);
        return {
          secret: secret,
          signOptions: {
            expiresIn: configService.get<string>('JWT_ACCESS_TOKEN_EXPIRATION_TIME') || '15m',
          },
        };
      },
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

    // Database module
    DatabaseModule,

    // Feature modules
    ValidationModule,
  ],
  controllers: [],
  providers: [
    // Global guards - using instances from SharedAuthModule
    {
      provide: APP_GUARD,
      useExisting: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useExisting: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useExisting: DepartmentGuard,
    },
  ],
})
export class AppModule {}
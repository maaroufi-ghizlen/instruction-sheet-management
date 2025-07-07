// services/auth-service/src/app.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { SharedAuthModule } from '@instruction-sheet/shared';
import { AuthModule } from './auth/auth.module';
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
      useFactory: (configService: ConfigService) => [
        {
          ttl: configService.get<number>('RATE_LIMIT_TTL') || 60000,
          limit: configService.get<number>('RATE_LIMIT_MAX') || 100,
        },
      ],
    }),

    // Shared Authentication Module - MUST come before other modules that use authentication
    SharedAuthModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET') || configService.get<string>('jwt.secret');
        console.log('🔧 Auth-Service SharedAuthModule factory - secret:', secret ? 'Present' : 'Missing');
        console.log('🔧 Auth-Service SharedAuthModule factory - secret length:', secret?.length);
        return {
          secret: secret,
          signOptions: {
            expiresIn: configService.get<string>('JWT_ACCESS_TOKEN_EXPIRATION_TIME') || configService.get<string>('jwt.accessTokenExpirationTime') || '15m',
          },
        };
      },
    }),

    // Database - FIXED MongoDB options
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI') || 'mongodb://localhost:27017/instruction_sheet_db',
        // FIXED: Removed unsupported options
        retryWrites: true,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        // Removed: bufferMaxEntries, bufferCommands (not supported in newer versions)
      }),
    }),

    // Custom modules
    DatabaseModule,
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
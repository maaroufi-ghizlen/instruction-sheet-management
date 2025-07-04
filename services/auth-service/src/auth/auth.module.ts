
// services/auth-service/src/auth/auth.module.ts
// 🔄 CHANGES: Updated to use shared JWT strategy and removed local guards/decorators

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

// ✅ ADDED: Import shared JWT strategy
import { SharedJwtStrategy } from '@instruction-sheet/shared';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User, UserSchema } from '../database/schemas/user.schema';
import { RefreshToken, RefreshTokenSchema } from '../database/schemas/refresh-token.schema';

@Module({
  imports: [
    ConfigModule, // ✅ ADDED: Import ConfigModule to make ConfigService available
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: RefreshToken.name, schema: RefreshTokenSchema },
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_ACCESS_TOKEN_EXPIRATION_TIME') || '15m',
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    // ✅ FIXED: Use factory provider for SharedJwtStrategy to inject ConfigService
    {
      provide: SharedJwtStrategy,
      useFactory: (configService: ConfigService) => {
        return new SharedJwtStrategy(configService);
      },
      inject: [ConfigService],
    },
    // ❌ REMOVED: Local guards (now imported from shared package where needed)
    // RolesGuard,
    // JwtAuthGuard,
    // TwoFactorGuard,
    // DepartmentGuard,
  ],
  exports: [AuthService],
})
export class AuthModule {}
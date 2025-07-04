// services/user-service/src/users/users.module.ts
// ✅ CORRECT FIX: Simplified - just import what's needed, no local Reflector

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

// ✅ Import guards directly from shared package
import { RolesGuard, DepartmentGuard } from '@instruction-sheet/shared';

import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User, UserSchema } from '../database/schemas/user.schema';
import { UserOwnershipGuard } from './guards/user-ownership.guard';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
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
  controllers: [UsersController],
  providers: [
    UsersService,
    UserOwnershipGuard,
    // ✅ CORRECT FIX: Register guards as providers - Reflector will be injected from global scope
    RolesGuard,
    DepartmentGuard,
  ],
  exports: [UsersService, MongooseModule],
})
export class UsersModule {}

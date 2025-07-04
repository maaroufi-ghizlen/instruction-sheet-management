
// services/user-service/src/users/users.module.ts
// 🔄 CHANGES: Updated to use shared JWT strategy and removed local guards/decorators

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { SharedModule } from '../shared/shared.module';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User, UserSchema } from '../database/schemas/user.schema';
import { UserOwnershipGuard } from './guards/user-ownership.guard';

@Module({
  imports: [
    SharedModule, // ✅ ULTIMATE FIX: Import dedicated shared module
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
    // ✅ REMOVED: Moved shared guards to AppModule for global availability
  ],
  exports: [UsersService, MongooseModule],
})
export class UsersModule {}

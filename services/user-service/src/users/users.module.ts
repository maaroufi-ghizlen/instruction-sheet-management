// services/user-service/src/users/users.module.ts

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User, UserSchema } from '../database/schemas/user.schema';
import { JwtStrategy } from '../auth/strategies/jwt.strategy';
import { RolesGuard } from '@shared/guards/roles.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
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
    JwtStrategy,
    RolesGuard,
    JwtAuthGuard,
    UserOwnershipGuard,
  ],
  exports: [UsersService, MongooseModule],
})
export class UsersModule {}
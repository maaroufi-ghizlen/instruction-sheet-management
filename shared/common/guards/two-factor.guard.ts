
// services/auth-service/src/auth/guards/two-factor.guard.ts

import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SKIP_2FA_KEY } from '../decorators/skip-2fa.decorator';

@Injectable()
export class TwoFactorGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const skip2FA = this.reflector.getAllAndOverride<boolean>(SKIP_2FA_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skip2FA) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    
    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    // If 2FA is enabled for the user but not verified in this session
    if (user.isTwoFactorEnabled && !user.isTwoFactorAuthenticated) {
      throw new UnauthorizedException('Two-factor authentication required');
    }

    return true;
  }
}
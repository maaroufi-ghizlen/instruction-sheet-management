// services/user-service/src/users/guards/admin-only.guard.ts

import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@shared/enums/enums';

@Injectable()
export class AdminOnlyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('This operation requires admin privileges');
    }

    return true;
  }
}
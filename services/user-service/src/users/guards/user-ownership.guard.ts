
// services/user-service/src/users/guards/user-ownership.guard.ts

import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@shared/enums/enums';

@Injectable()
export class UserOwnershipGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const targetUserId = request.params.id;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Admins can access any user
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    // Users can only access their own profile
    if (user.sub === targetUserId) {
      return true;
    }

    throw new ForbiddenException('You can only access your own profile');
  }
}

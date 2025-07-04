// services/user-service/src/users/guards/role-modification.guard.ts

import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@instruction-sheet/shared';

@Injectable()
export class RoleModificationGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const updateData = request.body;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // If no role modification is being attempted, allow
    if (!updateData.role) {
      return true;
    }

    // Only admins can modify roles
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only administrators can modify user roles');
    }

    return true;
  }
}

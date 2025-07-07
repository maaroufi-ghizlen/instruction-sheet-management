// shared/common/guards/roles.guard.ts

import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../enums/enums';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const { user } = request;
    
    console.log('🔐 RolesGuard - Request headers:', request.headers?.authorization ? 'Bearer token present' : 'No Authorization header');
    console.log('🔐 RolesGuard - User from request:', user);
    
    if (!user) {
      console.log('❌ RolesGuard - No user in request');
      throw new ForbiddenException('User not authenticated');
    }

    const hasRole = requiredRoles.some((role) => user.role === role);
    
    if (!hasRole) {
      console.log('❌ RolesGuard - User role mismatch. Required:', requiredRoles, 'User role:', user.role);
      throw new ForbiddenException(
        `Access denied. Required roles: ${requiredRoles.join(', ')}. User role: ${user.role}`,
      );
    }

    console.log('✅ RolesGuard - User authorized');
    return true;
  }
}

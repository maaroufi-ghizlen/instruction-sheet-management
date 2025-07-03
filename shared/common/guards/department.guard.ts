// services/auth-service/src/auth/guards/department.guard.ts

import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../enums/enums';
import { DEPARTMENT_ACCESS_KEY } from '../decorators/department-access.decorator';

@Injectable()
export class DepartmentGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiresDepartmentAccess = this.reflector.getAllAndOverride<boolean>(
      DEPARTMENT_ACCESS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiresDepartmentAccess) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const { user } = request;
    
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Admins can access all departments
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    // Get department ID from request params, query, or body
    const departmentId = 
      request.params?.departmentId || 
      request.query?.departmentId || 
      request.body?.departmentId;

    if (!departmentId) {
      // If no specific department is requested, allow access
      return true;
    }

    // Check if user belongs to the requested department
    if (user.departmentId.toString() !== departmentId) {
      throw new ForbiddenException('Access denied to this department');
    }

    return true;
  }
}

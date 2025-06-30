
// services/auth-service/src/auth/decorators/api-auth.decorator.ts

import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiUnauthorizedResponse, ApiForbiddenResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { TwoFactorGuard } from '../guards/two-factor.guard';
import { UserRole } from '../../../../../shared/common/enums/enums';
import { Roles } from './roles.decorator';

interface ApiAuthOptions {
  roles?: UserRole[];
  requireTwoFactor?: boolean;
}

export function ApiAuth(options: ApiAuthOptions = {}) {
  const decorators = [
    UseGuards(JwtAuthGuard),
    ApiBearerAuth('JWT-auth'),
    ApiUnauthorizedResponse({
      description: 'Unauthorized - Invalid or missing authentication token',
    }),
  ];

  if (options.roles && options.roles.length > 0) {
    decorators.push(
      UseGuards(RolesGuard),
      Roles(...options.roles),
      ApiForbiddenResponse({
        description: `Forbidden - Required roles: ${options.roles.join(', ')}`,
      }),
    );
  }

  if (options.requireTwoFactor) {
    decorators.push(UseGuards(TwoFactorGuard));
  }

  return applyDecorators(...decorators);
}

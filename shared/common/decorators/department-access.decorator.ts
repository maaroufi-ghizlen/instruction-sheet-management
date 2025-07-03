// services/auth-service/src/auth/decorators/department-access.decorator.ts

import { SetMetadata } from '@nestjs/common';

export const DEPARTMENT_ACCESS_KEY = 'requiresDepartmentAccess';
export const RequireDepartmentAccess = () => SetMetadata(DEPARTMENT_ACCESS_KEY, true);
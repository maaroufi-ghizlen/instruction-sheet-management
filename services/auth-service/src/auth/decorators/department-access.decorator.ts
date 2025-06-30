// services/auth-service/src/auth/decorators/department-access.decorator.ts

import { SetMetadata } from '@nestjs/common';

export const DEPARTMENT_ACCESS_KEY = 'departmentAccess';
export const DepartmentAccess = () => SetMetadata(DEPARTMENT_ACCESS_KEY, true);
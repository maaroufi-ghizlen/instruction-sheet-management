// services/user-service/src/shared/shared.module.ts
// ✅ ULTIMATE FIX: Dedicated module for shared guards with proper dependency injection

import { Module } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard, DepartmentGuard } from '@instruction-sheet/shared';

@Module({
  providers: [
    Reflector,
    {
      provide: RolesGuard,
      useFactory: (reflector: Reflector) => new RolesGuard(reflector),
      inject: [Reflector],
    },
    {
      provide: DepartmentGuard,
      useFactory: (reflector: Reflector) => new DepartmentGuard(reflector),
      inject: [Reflector],
    },
  ],
  exports: [RolesGuard, DepartmentGuard, Reflector],
})
export class SharedModule {}

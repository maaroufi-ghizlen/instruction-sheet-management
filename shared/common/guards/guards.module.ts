// shared/common/guards/guards.module.ts
import { Module } from '@nestjs/common';
import { RolesGuard } from './roles.guard';
import { DepartmentGuard } from './department.guard';

@Module({
providers: [RolesGuard, DepartmentGuard],
exports: [RolesGuard, DepartmentGuard],
})
export class SharedGuardsModule {}
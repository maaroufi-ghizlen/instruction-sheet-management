// services/validation-service/src/validation/validation.module.ts

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SharedAuthModule } from '@instruction-sheet/shared';
import { ValidationController } from './validation.controller';
import { ValidationService } from './validation.service';
import { ValidationWorkflow, ValidationWorkflowSchema } from '../database/schemas/validation-workflow.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ValidationWorkflow.name, schema: ValidationWorkflowSchema },
    ]),
    SharedAuthModule, // Import to ensure guards have access to required dependencies
  ],
  controllers: [ValidationController],
  providers: [ValidationService],
  exports: [ValidationService],
})
export class ValidationModule {}
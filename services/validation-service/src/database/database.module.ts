// services/validation-service/src/database/database.module.ts

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ValidationWorkflow, ValidationWorkflowSchema } from './schemas/validation-workflow.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ValidationWorkflow.name, schema: ValidationWorkflowSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}
// services/sheet-service/src/database/database.module.ts

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Sheet, SheetSchema } from './schemas/sheet.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Sheet.name, schema: SheetSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}
// services/sheet-service/src/sheets/sheets.module.ts

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SharedAuthModule } from '@instruction-sheet/shared';
import { SheetsController } from './sheets.controller';
import { SheetsService } from './sheets.service';
import { Sheet, SheetSchema } from '../database/schemas/sheet.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Sheet.name, schema: SheetSchema },
    ]),
    SharedAuthModule, // Import to ensure guards have access to required dependencies
  ],
  controllers: [SheetsController],
  providers: [SheetsService],
  exports: [SheetsService],
})
export class SheetsModule {}
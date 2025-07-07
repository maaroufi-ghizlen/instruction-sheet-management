

// services/sheet-service/src/sheets/dto/update-sheet.dto.ts

import { ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsString, 
  IsOptional, 
  IsArray,
  IsEnum,
  MinLength,
  MaxLength,
  ArrayMaxSize
} from 'class-validator';
import { Transform } from 'class-transformer';
import { SheetStatus } from '@instruction-sheet/shared';

export class UpdateSheetDto {
  @ApiPropertyOptional({
    description: 'Sheet title',
    example: 'Updated Safety Procedures Manual',
    minLength: 3,
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Title must be at least 3 characters long' })
  @MaxLength(200, { message: 'Title cannot exceed 200 characters' })
  @Transform(({ value }) => value?.trim())
  title?: string;

  @ApiPropertyOptional({
    description: 'Detailed description of the sheet content',
    example: 'Updated comprehensive safety procedures',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Description cannot exceed 1000 characters' })
  @Transform(({ value }) => value?.trim())
  description?: string;

  @ApiPropertyOptional({
    description: 'Sheet status',
    enum: SheetStatus,
    example: SheetStatus.APPROVED,
  })
  @IsOptional()
  @IsEnum(SheetStatus)
  status?: SheetStatus;

  @ApiPropertyOptional({
    description: 'Tags for categorization',
    example: ['safety', 'procedures', 'manufacturing', 'updated'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10, { message: 'Maximum 10 tags allowed' })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Validation comments (when updating status)',
    example: 'Sheet reviewed and approved for use',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Validation comments cannot exceed 500 characters' })
  @Transform(({ value }) => value?.trim())
  validationComments?: string;
}

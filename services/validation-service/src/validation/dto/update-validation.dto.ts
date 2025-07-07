
// services/validation-service/src/validation/dto/update-validation.dto.ts

import { ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsEnum, 
  IsOptional,
  IsString,
  IsMongoId,
  IsDateString,
  MaxLength
} from 'class-validator';
import { Transform } from 'class-transformer';
import { Types } from 'mongoose';
import { ValidationStatus } from '../../database/schemas/validation-workflow.schema';

export class UpdateValidationDto {
  @ApiPropertyOptional({
    description: 'Validation status',
    enum: ValidationStatus,
    example: ValidationStatus.IN_REVIEW,
  })
  @IsOptional()
  @IsEnum(ValidationStatus)
  status?: ValidationStatus;

  @ApiPropertyOptional({
    description: 'Validation notes',
    example: 'Document reviewed and approved',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Notes cannot exceed 1000 characters' })
  @Transform(({ value }) => value?.trim())
  notes?: string;

  @ApiPropertyOptional({
    description: 'User ID to reassign this validation to',
    example: '60f7b1b3e1b3c4a5d8e9f0a3',
  })
  @IsOptional()
  @IsMongoId({ message: 'Assigned user must be a valid MongoDB ObjectId' })
  assignedTo?: Types.ObjectId;

  @ApiPropertyOptional({
    description: 'Due date for validation',
    example: '2024-02-01T15:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  dueDate?: Date;
}
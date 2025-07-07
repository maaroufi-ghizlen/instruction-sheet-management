// services/validation-service/src/validation/dto/create-validation.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { 
  IsMongoId, 
  IsEnum, 
  IsOptional,
  IsString,
  IsDateString,
  MaxLength
} from 'class-validator';
import { Transform } from 'class-transformer';
import { Types } from 'mongoose';
import { ValidationStage } from '../../database/schemas/validation-workflow.schema';

export class CreateValidationDto {
  @ApiProperty({
    description: 'Sheet ID to be validated',
    example: '60f7b1b3e1b3c4a5d8e9f0a1',
  })
  @IsMongoId({ message: 'Sheet ID must be a valid MongoDB ObjectId' })
  sheetId: Types.ObjectId;

  @ApiProperty({
    description: 'Validation stage',
    enum: ValidationStage,
    example: ValidationStage.IPDF,
  })
  @IsEnum(ValidationStage)
  stage: ValidationStage;

  @ApiProperty({
    description: 'User ID to assign this validation to',
    example: '60f7b1b3e1b3c4a5d8e9f0a2',
    required: false,
  })
  @IsOptional()
  @IsMongoId({ message: 'Assigned user must be a valid MongoDB ObjectId' })
  assignedTo?: Types.ObjectId;

  @ApiProperty({
    description: 'Due date for validation',
    example: '2024-01-30T10:00:00.000Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dueDate?: Date;

  @ApiProperty({
    description: 'Initial notes for the validation',
    example: 'Initial review assigned to IPDF team',
    required: false,
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Notes cannot exceed 1000 characters' })
  @Transform(({ value }) => value?.trim())
  notes?: string;
}

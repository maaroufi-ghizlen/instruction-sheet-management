
// services/validation-service/src/validation/dto/validation-query.dto.ts

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsMongoId, IsInt, Min, Max, IsBoolean } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { Types } from 'mongoose';
import { ValidationStatus, ValidationStage } from '../../database/schemas/validation-workflow.schema';

export class ValidationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by sheet ID',
    example: '60f7b1b3e1b3c4a5d8e9f0a1',
  })
  @IsOptional()
  @IsMongoId()
  sheetId?: Types.ObjectId;

  @ApiPropertyOptional({
    description: 'Filter by validation status',
    enum: ValidationStatus,
    example: ValidationStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(ValidationStatus)
  status?: ValidationStatus;

  @ApiPropertyOptional({
    description: 'Filter by validation stage',
    enum: ValidationStage,
    example: ValidationStage.IPDF,
  })
  @IsOptional()
  @IsEnum(ValidationStage)
  stage?: ValidationStage;

  @ApiPropertyOptional({
    description: 'Filter by validator ID',
    example: '60f7b1b3e1b3c4a5d8e9f0a2',
  })
  @IsOptional()
  @IsMongoId()
  validatedBy?: Types.ObjectId;

  @ApiPropertyOptional({
    description: 'Filter by assigned user ID',
    example: '60f7b1b3e1b3c4a5d8e9f0a3',
  })
  @IsOptional()
  @IsMongoId()
  assignedTo?: Types.ObjectId;

  @ApiPropertyOptional({
    description: 'Filter by active status',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Search term for notes',
    example: 'approved',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  search?: string;

  @ApiPropertyOptional({
    description: 'Page number (1-based)',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Sort field',
    example: 'createdAt',
    enum: ['createdAt', 'updatedAt', 'validatedAt', 'dueDate', 'status', 'stage'],
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort order',
    example: 'desc',
    enum: ['asc', 'desc'],
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}

// services/validation-service/src/validation/dto/validation-response.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { Types } from 'mongoose';
import { ValidationStatus, ValidationStage } from '../../database/schemas/validation-workflow.schema';

export class ValidationResponseDto {
  @ApiProperty({
    description: 'Validation workflow ID',
    example: '60f7b1b3e1b3c4a5d8e9f0a0',
  })
  @Expose()
  @Transform(({ obj }) => obj._id?.toString() || obj.id?.toString())
  id: string;

  @ApiProperty({
    description: 'Sheet ID being validated',
    example: '60f7b1b3e1b3c4a5d8e9f0a1',
  })
  @Expose()
  @Transform(({ value }) => value?.toString())
  sheetId: string;

  @ApiProperty({
    description: 'Validation status',
    enum: ValidationStatus,
    example: ValidationStatus.PENDING,
  })
  @Expose()
  status: ValidationStatus;

  @ApiPropertyOptional({
    description: 'User ID who validated',
    example: '60f7b1b3e1b3c4a5d8e9f0a2',
  })
  @Expose()
  @Transform(({ value }) => value?.toString())
  validatedBy?: string;

  @ApiProperty({
    description: 'Validation stage',
    enum: ValidationStage,
    example: ValidationStage.IPDF,
  })
  @Expose()
  stage: ValidationStage;

  @ApiPropertyOptional({
    description: 'Validation notes',
    example: 'Document reviewed and approved',
  })
  @Expose()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Validation timestamp',
    example: '2024-01-25T14:30:00.000Z',
  })
  @Expose()
  validatedAt?: Date;

  @ApiPropertyOptional({
    description: 'User ID assigned to this validation',
    example: '60f7b1b3e1b3c4a5d8e9f0a3',
  })
  @Expose()
  @Transform(({ value }) => value?.toString())
  assignedTo?: string;

  @ApiPropertyOptional({
    description: 'Assignment timestamp',
    example: '2024-01-20T09:00:00.000Z',
  })
  @Expose()
  assignedAt?: Date;

  @ApiPropertyOptional({
    description: 'Due date for validation',
    example: '2024-01-30T23:59:00.000Z',
  })
  @Expose()
  dueDate?: Date;

  @ApiProperty({
    description: 'Number of retry attempts',
    example: 0,
  })
  @Expose()
  retryCount: number;

  @ApiProperty({
    description: 'Whether the validation is active',
    example: true,
  })
  @Expose()
  isActive: boolean;

  @ApiProperty({
    description: 'Whether validation is pending',
    example: true,
  })
  @Expose()
  isPending: boolean;

  @ApiProperty({
    description: 'Whether validation is in review',
    example: false,
  })
  @Expose()
  isInReview: boolean;

  @ApiProperty({
    description: 'Whether validation is validated',
    example: false,
  })
  @Expose()
  isValidated: boolean;

  @ApiProperty({
    description: 'Whether validation is rejected',
    example: false,
  })
  @Expose()
  isRejected: boolean;

  @ApiProperty({
    description: 'Whether this is IPDF stage',
    example: true,
  })
  @Expose()
  isIPDFStage: boolean;

  @ApiProperty({
    description: 'Whether this is IQP stage',
    example: false,
  })
  @Expose()
  isIQPStage: boolean;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-20T14:45:00.000Z',
  })
  @Expose()
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'Last modification timestamp',
    example: '2024-01-20T14:45:00.000Z',
  })
  @Expose()
  lastModifiedAt?: Date;

  @ApiPropertyOptional({
    description: 'User ID who last modified this validation',
    example: '60f7b1b3e1b3c4a5d8e9f0a4',
  })
  @Expose()
  @Transform(({ value }) => value?.toString())
  lastModifiedBy?: string;
}

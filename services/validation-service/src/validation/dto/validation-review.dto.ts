

// services/validation-service/src/validation/dto/validation-review.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { 
  IsEnum, 
  IsOptional,
  IsString,
  MaxLength
} from 'class-validator';
import { Transform } from 'class-transformer';

export enum ReviewAction {
  APPROVE = 'approve',
  REJECT = 'reject',
}

export class ValidationReviewDto {
  @ApiProperty({
    description: 'Review action (approve or reject)',
    enum: ReviewAction,
    example: ReviewAction.APPROVE,
  })
  @IsEnum(ReviewAction)
  action: ReviewAction;

  @ApiProperty({
    description: 'Review notes/comments',
    example: 'Document meets all quality standards and requirements',
    maxLength: 1000,
  })
  @IsString()
  @MaxLength(1000, { message: 'Notes cannot exceed 1000 characters' })
  @Transform(({ value }) => value?.trim())
  notes: string;
}

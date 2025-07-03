
// shared/common/dtos/base-response.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BaseResponseDto {
  @ApiProperty({
    description: 'Request success status',
    example: true,
  })
  success: boolean;

  @ApiPropertyOptional({
    description: 'Response message',
    example: 'Operation completed successfully',
  })
  message?: string;

  @ApiProperty({
    description: 'Response timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  timestamp: string;

  @ApiPropertyOptional({
    description: 'Request path',
    example: '/api/v1/users',
  })
  path?: string;
}

export class ErrorResponseDto extends BaseResponseDto {
  @ApiProperty({
    description: 'Error details',
    example: ['Validation failed', 'Invalid input'],
  })
  errors: string[];

  @ApiProperty({
    description: 'Error code',
    example: 'VALIDATION_ERROR',
  })
  code: string;
}
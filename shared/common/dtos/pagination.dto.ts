// shared/common/dtos/pagination.dto.ts

import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

export class PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    minimum: 1,
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
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

export class PaginationMetaDto {
  @ApiPropertyOptional({ example: 1 })
  page: number;

  @ApiPropertyOptional({ example: 10 })
  limit: number;

  @ApiPropertyOptional({ example: 50 })
  total: number;

  @ApiPropertyOptional({ example: 5 })
  totalPages: number;

  @ApiPropertyOptional({ example: true })
  hasNextPage: boolean;

  @ApiPropertyOptional({ example: false })
  hasPrevPage: boolean;
}

export class PaginatedResponseDto<T> {
  data: T[];
  pagination: PaginationMetaDto;
}

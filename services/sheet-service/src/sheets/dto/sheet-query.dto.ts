
// services/sheet-service/src/sheets/dto/sheet-query.dto.ts

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsMongoId, IsInt, Min, Max, IsBoolean } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { Types } from 'mongoose';
import { SheetStatus } from '@instruction-sheet/shared';

export class SheetQueryDto {
  @ApiPropertyOptional({
    description: 'Search term for title, reference, or description',
    example: 'safety',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: SheetStatus,
    example: SheetStatus.PENDING_IPDF,
  })
  @IsOptional()
  @IsEnum(SheetStatus)
  status?: SheetStatus;

  @ApiPropertyOptional({
    description: 'Filter by department ID',
    example: '60f7b1b3e1b3c4a5d8e9f0a1',
  })
  @IsOptional()
  @IsMongoId()
  department?: Types.ObjectId;

  @ApiPropertyOptional({
    description: 'Filter by uploader ID',
    example: '60f7b1b3e1b3c4a5d8e9f0a2',
  })
  @IsOptional()
  @IsMongoId()
  uploadedBy?: Types.ObjectId;

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
    description: 'Filter by tags (comma-separated)',
    example: 'safety,procedures',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.split(',').map((tag: string) => tag.trim()).filter(Boolean))
  tags?: string[];

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
    enum: ['title', 'reference', 'createdAt', 'updatedAt', 'status'],
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
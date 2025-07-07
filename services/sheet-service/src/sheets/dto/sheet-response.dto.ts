
// services/sheet-service/src/sheets/dto/sheet-response.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { Types } from 'mongoose';
import { SheetStatus } from '@instruction-sheet/shared';

export class SheetResponseDto {
  @ApiProperty({
    description: 'Sheet ID',
    example: '60f7b1b3e1b3c4a5d8e9f0a0',
  })
  @Expose()
  @Transform(({ obj }) => obj._id?.toString() || obj.id?.toString())
  id: string;

  @ApiProperty({
    description: 'Sheet title',
    example: 'Safety Procedures Manual',
  })
  @Expose()
  title: string;

  @ApiProperty({
    description: 'Unique reference number',
    example: 'REF-2024-001',
  })
  @Expose()
  reference: string;

  @ApiProperty({
    description: 'Sheet description',
    example: 'Comprehensive safety procedures for manufacturing operations',
  })
  @Expose()
  description: string;

  @ApiProperty({
    description: 'Sheet status',
    enum: SheetStatus,
    example: SheetStatus.DRAFT,
  })
  @Expose()
  status: SheetStatus;

  @ApiProperty({
    description: 'User ID who uploaded this sheet',
    example: '60f7b1b3e1b3c4a5d8e9f0a1',
  })
  @Expose()
  @Transform(({ value }) => value?.toString())
  uploadedBy: string;

  @ApiProperty({
    description: 'Department ID where this sheet belongs',
    example: '60f7b1b3e1b3c4a5d8e9f0a2',
  })
  @Expose()
  @Transform(({ value }) => value?.toString())
  department: string;

  @ApiProperty({
    description: 'Original filename',
    example: 'safety-procedures-manual.pdf',
  })
  @Expose()
  originalFileName: string;

  @ApiProperty({
    description: 'File MIME type',
    example: 'application/pdf',
  })
  @Expose()
  mimeType: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 2048576,
  })
  @Expose()
  fileSize: number;

  @ApiPropertyOptional({
    description: 'File checksum',
    example: 'sha256:abc123def456...',
  })
  @Expose()
  checksum?: string;

  @ApiProperty({
    description: 'Tags for categorization',
    example: ['safety', 'procedures', 'manufacturing'],
    type: [String],
  })
  @Expose()
  tags: string[];

  @ApiProperty({
    description: 'Version number',
    example: 1,
  })
  @Expose()
  version: number;

  @ApiProperty({
    description: 'Whether the sheet is active',
    example: true,
  })
  @Expose()
  isActive: boolean;

  @ApiProperty({
    description: 'Whether the sheet is validated',
    example: false,
  })
  @Expose()
  isValidated: boolean;

  @ApiProperty({
    description: 'Whether the sheet is pending',
    example: true,
  })
  @Expose()
  isPending: boolean;

  @ApiProperty({
    description: 'Whether the sheet is rejected',
    example: false,
  })
  @Expose()
  isRejected: boolean;

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
    description: 'Validation timestamp',
    example: '2024-01-22T09:15:00.000Z',
  })
  @Expose()
  validatedAt?: Date;

  @ApiPropertyOptional({
    description: 'User ID who validated this sheet',
    example: '60f7b1b3e1b3c4a5d8e9f0a3',
  })
  @Expose()
  @Transform(({ value }) => value?.toString())
  validatedBy?: string;

  @ApiPropertyOptional({
    description: 'Validation comments',
    example: 'Sheet reviewed and approved for use',
  })
  @Expose()
  validationComments?: string;

  @ApiPropertyOptional({
    description: 'Last modification timestamp',
    example: '2024-01-20T14:45:00.000Z',
  })
  @Expose()
  lastModifiedAt?: Date;

  @ApiPropertyOptional({
    description: 'User ID who last modified this sheet',
    example: '60f7b1b3e1b3c4a5d8e9f0a4',
  })
  @Expose()
  @Transform(({ value }) => value?.toString())
  lastModifiedBy?: string;
}

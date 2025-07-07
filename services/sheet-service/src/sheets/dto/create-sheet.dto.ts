// services/sheet-service/src/sheets/dto/create-sheet.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { 
  IsString, 
  IsNotEmpty, 
  IsMongoId, 
  IsOptional,
  IsArray,
  IsNumber,
  IsPositive,
  MinLength,
  MaxLength,
  ArrayMaxSize
} from 'class-validator';
import { Transform } from 'class-transformer';
import { Types } from 'mongoose';

export class CreateSheetDto {
  @ApiProperty({
    description: 'Sheet title',
    example: 'Safety Procedures Manual',
    minLength: 3,
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'Title must be at least 3 characters long' })
  @MaxLength(200, { message: 'Title cannot exceed 200 characters' })
  @Transform(({ value }) => value?.trim())
  title: string;

  @ApiProperty({
    description: 'Unique reference number for the sheet',
    example: 'REF-2024-001',
    minLength: 3,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'Reference must be at least 3 characters long' })
  @MaxLength(50, { message: 'Reference cannot exceed 50 characters' })
  @Transform(({ value }) => value?.trim().toUpperCase())
  reference: string;

  @ApiProperty({
    description: 'Detailed description of the sheet content',
    example: 'Comprehensive safety procedures for manufacturing operations',
    maxLength: 1000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000, { message: 'Description cannot exceed 1000 characters' })
  @Transform(({ value }) => value?.trim())
  description: string;

  @ApiProperty({
    description: 'Internal file path or storage key',
    example: '/uploads/sheets/2024/safety-procedures-manual.pdf',
  })
  @IsString()
  @IsNotEmpty()
  filePath: string;

  @ApiProperty({
    description: 'Encryption initialization vector',
    example: 'abc123def456ghi789',
  })
  @IsString()
  @IsNotEmpty()
  encryptionIv: string;

  @ApiProperty({
    description: 'Department ID where this sheet belongs',
    example: '60f7b1b3e1b3c4a5d8e9f0a1',
  })
  @IsMongoId({ message: 'Department must be a valid MongoDB ObjectId' })
  department: Types.ObjectId;

  @ApiProperty({
    description: 'Original filename of the uploaded file',
    example: 'safety-procedures-manual.pdf',
  })
  @IsString()
  @IsNotEmpty()
  originalFileName: string;

  @ApiProperty({
    description: 'MIME type of the file',
    example: 'application/pdf',
  })
  @IsString()
  @IsNotEmpty()
  mimeType: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 2048576,
  })
  @IsNumber()
  @IsPositive()
  fileSize: number;

  @ApiProperty({
    description: 'File checksum for integrity verification',
    example: 'sha256:abc123def456...',
    required: false,
  })
  @IsOptional()
  @IsString()
  checksum?: string;

  @ApiProperty({
    description: 'Tags for categorization',
    example: ['safety', 'procedures', 'manufacturing'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10, { message: 'Maximum 10 tags allowed' })
  tags?: string[];

  @ApiProperty({
    description: 'Version number',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  version?: number = 1;
}
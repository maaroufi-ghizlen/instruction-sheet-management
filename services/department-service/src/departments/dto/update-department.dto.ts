
// services/department-service/src/departments/dto/update-department.dto.ts

import { ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsString, 
  IsOptional, 
  IsBoolean, 
  IsMongoId, 
  IsArray,
  MinLength,
  MaxLength,
  ArrayUnique
} from 'class-validator';
import { Transform } from 'class-transformer';
import { Types } from 'mongoose';

export class UpdateDepartmentDto {
  @ApiPropertyOptional({
    description: 'Department name',
    example: 'Engineering',
    minLength: 3,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Department name must be at least 3 characters long' })
  @MaxLength(100, { message: 'Department name cannot exceed 100 characters' })
  @Transform(({ value }) => value?.trim())
  name?: string;

  @ApiPropertyOptional({
    description: 'Department description',
    example: 'Responsible for software development and technical solutions',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Description cannot exceed 500 characters' })
  @Transform(({ value }) => value?.trim())
  description?: string;

  @ApiPropertyOptional({
    description: 'Department manager user ID',
    example: '60f7b1b3e1b3c4a5d8e9f0a1',
  })
  @IsOptional()
  @IsMongoId({ message: 'Manager must be a valid MongoDB ObjectId' })
  manager?: Types.ObjectId;

  @ApiPropertyOptional({
    description: 'List of employee user IDs',
    example: ['60f7b1b3e1b3c4a5d8e9f0a2', '60f7b1b3e1b3c4a5d8e9f0a3'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true, message: 'Each employee must be a valid MongoDB ObjectId' })
  @ArrayUnique({ message: 'Employee IDs must be unique' })
  employees?: Types.ObjectId[];

  @ApiPropertyOptional({
    description: 'Whether the department is active',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
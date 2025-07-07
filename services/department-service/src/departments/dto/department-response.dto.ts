

// services/department-service/src/departments/dto/department-response.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { Types } from 'mongoose';

export class DepartmentResponseDto {
  @ApiProperty({
    description: 'Department ID',
    example: '60f7b1b3e1b3c4a5d8e9f0a0',
  })
  @Expose()
  @Transform(({ obj }) => obj._id?.toString() || obj.id?.toString())
  id: string;

  @ApiProperty({
    description: 'Department name',
    example: 'Engineering',
  })
  @Expose()
  name: string;

  @ApiProperty({
    description: 'Department description',
    example: 'Responsible for software development and technical solutions',
  })
  @Expose()
  description: string;

  @ApiProperty({
    description: 'Whether the department is active',
    example: true,
  })
  @Expose()
  isActive: boolean;

  @ApiPropertyOptional({
    description: 'Department manager user ID',
    example: '60f7b1b3e1b3c4a5d8e9f0a1',
  })
  @Expose()
  @Transform(({ value }) => value?.toString())
  manager?: string;

  @ApiProperty({
    description: 'List of employee user IDs',
    example: ['60f7b1b3e1b3c4a5d8e9f0a2', '60f7b1b3e1b3c4a5d8e9f0a3'],
    type: [String],
  })
  @Expose()
  @Transform(({ value }) => value?.map((id: Types.ObjectId) => id.toString()) || [])
  employees: string[];

  @ApiProperty({
    description: 'List of sheet IDs associated with this department',
    example: ['60f7b1b3e1b3c4a5d8e9f0a4', '60f7b1b3e1b3c4a5d8e9f0a5'],
    type: [String],
  })
  @Expose()
  @Transform(({ value }) => value?.map((id: Types.ObjectId) => id.toString()) || [])
  sheets: string[];

  @ApiProperty({
    description: 'Number of employees in the department',
    example: 5,
  })
  @Expose()
  employeeCount: number;

  @ApiProperty({
    description: 'Number of sheets associated with the department',
    example: 12,
  })
  @Expose()
  sheetCount: number;

  @ApiProperty({
    description: 'Whether a manager is assigned to the department',
    example: true,
  })
  @Expose()
  isManagerAssigned: boolean;

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
    description: 'User ID who last modified the department',
    example: '60f7b1b3e1b3c4a5d8e9f0a6',
  })
  @Expose()
  @Transform(({ value }) => value?.toString())
  lastModifiedBy?: string;
}

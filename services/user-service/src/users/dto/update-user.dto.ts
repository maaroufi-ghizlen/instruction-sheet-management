
// services/user-service/src/users/dto/update-user.dto.ts

import { IsEmail, IsString, MinLength, IsEnum, IsMongoId, IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@shared/enums/enums';

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'User email address',
    example: 'updated@company.com',
    format: 'email',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email?: string;

  @ApiPropertyOptional({
    description: 'User first name',
    example: 'John',
    minLength: 2,
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'First name must be at least 2 characters long' })
  firstName?: string;

  @ApiPropertyOptional({
    description: 'User last name',
    example: 'Doe',
    minLength: 2,
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Last name must be at least 2 characters long' })
  lastName?: string;

  @ApiPropertyOptional({
    description: 'User role in the system',
    enum: UserRole,
    example: UserRole.PREPARATEUR,
  })
  @IsOptional()
  @IsEnum(UserRole, { message: 'Role must be a valid user role' })
  role?: UserRole;

  @ApiPropertyOptional({
    description: 'Department ID the user belongs to',
    example: '507f1f77bcf86cd799439011',
  })
  @IsOptional()
  @IsMongoId({ message: 'Department ID must be a valid MongoDB ObjectId' })
  departmentId?: string;

  @ApiPropertyOptional({
    description: 'Whether the user account is active',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}


// services/user-service/src/users/dto/user-response.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@shared/enums/enums';

export class UserResponseDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  id: string;

  @ApiProperty({ example: 'user@company.com' })
  email: string;

  @ApiProperty({ example: 'John' })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  lastName: string;

  @ApiProperty({ example: 'John Doe' })
  fullName: string;

  @ApiProperty({ enum: UserRole, example: UserRole.PREPARATEUR })
  role: UserRole;

  @ApiProperty({ example: '507f1f77bcf86cd799439012' })
  departmentId: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: false })
  isTwoFactorEnabled: boolean;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  lastLoginAt?: Date;

  @ApiProperty({ example: '2024-01-10T09:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  updatedAt: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  lastModifiedAt?: Date;

  @ApiProperty({ example: '507f1f77bcf86cd799439013' })
  lastModifiedBy?: string;
}

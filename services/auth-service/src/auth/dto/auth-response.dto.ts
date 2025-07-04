
// services/auth-service/src/auth/dto/auth-response.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@instruction-sheet/shared';

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
  lastLoginAt: Date;

  @ApiProperty({ example: '2024-01-10T09:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  updatedAt: Date;
}

export class LoginResponseDto {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'JWT refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;

  @ApiProperty({ description: 'User information' })
  user: UserResponseDto;

  @ApiProperty({
    description: 'Token expiration time in seconds',
    example: 900,
  })
  expiresIn: number;
}

export class Setup2FaResponseDto {
  @ApiProperty({
    description: 'Secret key for manual entry',
    example: 'JBSWY3DPEHPK3PXP',
  })
  secret: string;

  @ApiProperty({
    description: 'QR code data URL for scanning',
    example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
  })
  qrCodeUrl: string;

  @ApiProperty({
    description: 'Backup codes for recovery',
    example: ['12345678', '87654321', '11223344'],
  })
  backupCodes: string[];
}
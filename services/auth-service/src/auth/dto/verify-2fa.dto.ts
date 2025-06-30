// services/auth-service/src/auth/dto/verify-2fa.dto.ts

import { IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class Verify2FaDto {
  @ApiProperty({
    description: 'Six-digit verification code from authenticator app',
    example: '123456',
    pattern: '^[0-9]{6}$',
  })
  @IsString()
  @Matches(/^[0-9]{6}$/, { message: 'Verification code must be 6 digits' })
  token: string;
}
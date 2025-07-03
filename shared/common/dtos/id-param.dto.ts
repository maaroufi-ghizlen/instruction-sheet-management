// shared/common/dtos/id-param.dto.ts

import { IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class IdParamDto {
  @ApiProperty({
    description: 'MongoDB ObjectId',
    example: '507f1f77bcf86cd799439011',
  })
  @IsMongoId({ message: 'Invalid ID format' })
  id: string;
}


// services/user-service/src/users/dto/users-list-response.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from './user-response.dto';

export class PaginationMetaDto {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 50 })
  total: number;

  @ApiProperty({ example: 5 })
  totalPages: number;

  @ApiProperty({ example: true })
  hasNextPage: boolean;

  @ApiProperty({ example: false })
  hasPrevPage: boolean;
}

export class UsersListResponseDto {
  @ApiProperty({ type: [UserResponseDto] })
  users: UserResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  pagination: PaginationMetaDto;
}

// services/user-service/src/users/users.controller.ts
// 🔄 CHANGES: Updated imports to use @shared package instead of local files

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Put,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';


import {
  JwtAuthGuard,
  RolesGuard,
  DepartmentGuard,
} from '@instruction-sheet/shared';
import {
  Roles,
  CurrentUser,
  ApiAuth,
  SwaggerAuth,
  RequireDepartmentAccess,
} from '@instruction-sheet/shared';
import { UserRole } from '@instruction-sheet/shared';
import {
  PaginationQueryDto,
  SearchQueryDto,
  IdParamDto,
  BaseResponseDto,
} from '@instruction-sheet/shared';

import { UsersService } from './users.service';
// 🔄 UNCHANGED: Keep service-specific guards that are unique to user service
import { UserOwnershipGuard } from './guards/user-ownership.guard';
// 🔄 UNCHANGED: Keep service-specific DTOs
import {
  CreateUserDto,
  UpdateUserDto,
  UsersQueryDto,
  UserResponseDto,
  UsersListResponseDto,
} from './dto';

@ApiTags('Users')
@Controller('users')
@UseGuards(ThrottlerGuard, JwtAuthGuard) // 🔄 CHANGED: Using shared JwtAuthGuard
@ApiBearerAuth('JWT-auth')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(RolesGuard) // 🔄 CHANGED: Using shared RolesGuard
  @Roles(UserRole.ADMIN) // 🔄 CHANGED: Using shared Roles decorator
  @HttpCode(HttpStatus.CREATED)
  @SwaggerAuth({ // 🔄 CHANGED: Using shared SwaggerAuth decorator
    summary: 'Create a new user',
    description: 'Creates a new user account. Only accessible by administrators.',
    successStatus: 201,
    successDescription: 'User created successfully',
  })
  @ApiResponse({ status: 409, description: 'Conflict - user with email already exists' })
  async create(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser() user: any, // 🔄 CHANGED: Using shared CurrentUser decorator
  ): Promise<UserResponseDto> {
    this.logger.log(`Admin ${user.email} creating new user: ${createUserDto.email}`);
    return this.usersService.create(createUserDto, user.sub);
  }

  @Get()
  @UseGuards(RolesGuard) // 🔄 CHANGED: Using shared RolesGuard
  @Roles(UserRole.ADMIN, UserRole.PREPARATEUR, UserRole.IPDF, UserRole.IQP) // 🔄 CHANGED: Using shared Roles decorator
  @SwaggerAuth({ // 🔄 CHANGED: Using shared SwaggerAuth decorator
    summary: 'Get all users with filtering and pagination',
    description: 'Retrieves a paginated list of users with optional filtering.',
  })
  async findAll(@Query() query: UsersQueryDto): Promise<UsersListResponseDto> {
    this.logger.log('Fetching users with query', query);
    return this.usersService.findAll(query);
  }

  @Get('stats')
  @UseGuards(RolesGuard) // 🔄 CHANGED: Using shared RolesGuard
  @Roles(UserRole.ADMIN) // 🔄 CHANGED: Using shared Roles decorator
  @SwaggerAuth({ // 🔄 CHANGED: Using shared SwaggerAuth decorator
    summary: 'Get user statistics',
    description: 'Retrieves user statistics including total, active, inactive counts and role distribution.',
  })
  async getUserStats() {
    this.logger.log('Fetching user statistics');
    return this.usersService.getUserStats();
  }

  @Get('by-department/:departmentId')
  @UseGuards(RolesGuard, DepartmentGuard) // 🔄 CHANGED: Using shared guards
  @Roles(UserRole.ADMIN, UserRole.PREPARATEUR, UserRole.IPDF, UserRole.IQP) // 🔄 CHANGED: Using shared Roles decorator
  @RequireDepartmentAccess() // 🔄 CHANGED: Using shared decorator
  @SwaggerAuth({ // 🔄 CHANGED: Using shared SwaggerAuth decorator
    summary: 'Get users by department',
    description: 'Retrieves all active users in a specific department.',
  })
  async getUsersByDepartment(
    @Param() params: IdParamDto, // 🔄 CHANGED: Using shared DTO for ID validation
  ): Promise<UserResponseDto[]> {
    this.logger.log(`Fetching users for department: ${params.id}`);
    return this.usersService.getUsersByDepartment(params.id);
  }

  @Get(':id')
  @UseGuards(RolesGuard, UserOwnershipGuard) // 🔄 CHANGED: RolesGuard from shared, UserOwnershipGuard kept local
  @Roles(UserRole.ADMIN, UserRole.PREPARATEUR, UserRole.IPDF, UserRole.IQP, UserRole.END_USER) // 🔄 CHANGED: Using shared Roles decorator
  @SwaggerAuth({ // 🔄 CHANGED: Using shared SwaggerAuth decorator
    summary: 'Get user by ID',
    description: 'Retrieves a specific user by ID. Users can only access their own profile unless they are administrators.',
  })
  async findOne(@Param() params: IdParamDto): Promise<UserResponseDto> { // 🔄 CHANGED: Using shared DTO
    this.logger.log(`Fetching user: ${params.id}`);
    return this.usersService.findOne(params.id);
  }

  @Put(':id')
  @UseGuards(RolesGuard, UserOwnershipGuard) // 🔄 CHANGED: RolesGuard from shared, UserOwnershipGuard kept local
  @Roles(UserRole.ADMIN, UserRole.PREPARATEUR, UserRole.IPDF, UserRole.IQP, UserRole.END_USER) // 🔄 CHANGED: Using shared Roles decorator
  @SwaggerAuth({ // 🔄 CHANGED: Using shared SwaggerAuth decorator
    summary: 'Update user',
    description: 'Updates a user profile. Users can update their own profile, administrators can update any user.',
  })
  async update(
    @Param() params: IdParamDto, // 🔄 CHANGED: Using shared DTO
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() user: any, // 🔄 CHANGED: Using shared CurrentUser decorator
  ): Promise<UserResponseDto> {
    this.logger.log(`Updating user: ${params.id} by ${user.email}`);
    return this.usersService.update(params.id, updateUserDto, user.sub);
  }

  @Patch(':id/deactivate')
  @UseGuards(RolesGuard) // 🔄 CHANGED: Using shared RolesGuard
  @Roles(UserRole.ADMIN) // 🔄 CHANGED: Using shared Roles decorator
  @SwaggerAuth({ // 🔄 CHANGED: Using shared SwaggerAuth decorator
    summary: 'Deactivate user',
    description: 'Deactivates a user account. Only accessible by administrators.',
  })
  async deactivate(
    @Param() params: IdParamDto, // 🔄 CHANGED: Using shared DTO
    @CurrentUser() user: any, // 🔄 CHANGED: Using shared CurrentUser decorator
  ): Promise<UserResponseDto> {
    this.logger.log(`Deactivating user: ${params.id} by admin ${user.email}`);
    return this.usersService.deactivate(params.id, user.sub);
  }

  @Patch(':id/activate')
  @UseGuards(RolesGuard) // 🔄 CHANGED: Using shared RolesGuard
  @Roles(UserRole.ADMIN) // 🔄 CHANGED: Using shared Roles decorator
  @SwaggerAuth({ // 🔄 CHANGED: Using shared SwaggerAuth decorator
    summary: 'Activate user',
    description: 'Activates a user account. Only accessible by administrators.',
  })
  async activate(
    @Param() params: IdParamDto, // 🔄 CHANGED: Using shared DTO
    @CurrentUser() user: any, // 🔄 CHANGED: Using shared CurrentUser decorator
  ): Promise<UserResponseDto> {
    this.logger.log(`Activating user: ${params.id} by admin ${user.email}`);
    return this.usersService.activate(params.id, user.sub);
  }

  @Delete(':id')
  @UseGuards(RolesGuard) // 🔄 CHANGED: Using shared RolesGuard
  @Roles(UserRole.ADMIN) // 🔄 CHANGED: Using shared Roles decorator
  @HttpCode(HttpStatus.NO_CONTENT)
  @SwaggerAuth({ // 🔄 CHANGED: Using shared SwaggerAuth decorator
    summary: 'Delete user',
    description: 'Permanently deletes a user account. Only accessible by administrators.',
    successStatus: 204,
  })
  async remove(
    @Param() params: IdParamDto, // 🔄 CHANGED: Using shared DTO
    @CurrentUser() user: any, // 🔄 CHANGED: Using shared CurrentUser decorator
  ): Promise<void> {
    this.logger.log(`Deleting user: ${params.id} by admin ${user.email}`);
    await this.usersService.remove(params.id);
  }
}
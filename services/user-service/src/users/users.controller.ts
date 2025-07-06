// services/user-service/src/users/users.controller.ts
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

// Import decorators from shared package
import {
  Roles,
  CurrentUser,
  SwaggerAuth,
  RequireDepartmentAccess,
} from '@instruction-sheet/shared';
import { UserRole } from '@instruction-sheet/shared';
import {
  IdParamDto,
} from '@instruction-sheet/shared';

import { UsersService } from './users.service';
import { UserOwnershipGuard } from './guards/user-ownership.guard';
import {
  CreateUserDto,
  UpdateUserDto,
  UsersQueryDto,
  UserResponseDto,
  UsersListResponseDto,
} from './dto';

@ApiTags('Users')
@Controller('users')
@UseGuards(ThrottlerGuard) // JwtAuthGuard is now global
@ApiBearerAuth('JWT-auth')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.ADMIN) // RolesGuard will be applied globally
  @HttpCode(HttpStatus.CREATED)
  @SwaggerAuth({
    summary: 'Create a new user',
    description: 'Creates a new user account. Only accessible by administrators.',
    successStatus: 201,
    successDescription: 'User created successfully',
  })
  @ApiResponse({ status: 409, description: 'Conflict - user with email already exists' })
  async create(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser() user: any,
  ): Promise<UserResponseDto> {
    this.logger.log(`Admin ${user.email} creating new user: ${createUserDto.email}`);
    return this.usersService.create(createUserDto, user.sub);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.PREPARATEUR, UserRole.IPDF, UserRole.IQP) // RolesGuard will be applied globally
  @SwaggerAuth({
    summary: 'Get all users with filtering and pagination',
    description: 'Retrieves a paginated list of users with optional filtering.',
  })
  async findAll(@Query() query: UsersQueryDto): Promise<UsersListResponseDto> {
    this.logger.log('Fetching users with query', query);
    return this.usersService.findAll(query);
  }

  @Get('stats')
  @Roles(UserRole.ADMIN)
  @SwaggerAuth({
    summary: 'Get user statistics',
    description: 'Retrieves user statistics including total, active, inactive counts and role distribution.',
  })
  async getUserStats() {
    this.logger.log('Fetching user statistics');
    return this.usersService.getUserStats();
  }

  @Get('by-department/:departmentId')
  @Roles(UserRole.ADMIN, UserRole.PREPARATEUR, UserRole.IPDF, UserRole.IQP)
  @RequireDepartmentAccess()
  @SwaggerAuth({
    summary: 'Get users by department',
    description: 'Retrieves all active users in a specific department.',
  })
  async getUsersByDepartment(
    @Param() params: IdParamDto,
  ): Promise<UserResponseDto[]> {
    this.logger.log(`Fetching users for department: ${params.id}`);
    return this.usersService.getUsersByDepartment(params.id);
  }

  @Get(':id')
  @UseGuards(UserOwnershipGuard)
  @Roles(UserRole.ADMIN, UserRole.PREPARATEUR, UserRole.IPDF, UserRole.IQP, UserRole.END_USER)
  @SwaggerAuth({
    summary: 'Get user by ID',
    description: 'Retrieves a specific user by ID. Users can only access their own profile unless they are administrators.',
  })
  async findOne(@Param() params: IdParamDto): Promise<UserResponseDto> {
    this.logger.log(`Fetching user: ${params.id}`);
    return this.usersService.findOne(params.id);
  }

  @Put(':id')
  @UseGuards(UserOwnershipGuard)
  @Roles(UserRole.ADMIN, UserRole.PREPARATEUR, UserRole.IPDF, UserRole.IQP, UserRole.END_USER)
  @SwaggerAuth({
    summary: 'Update user',
    description: 'Updates a user profile. Users can update their own profile, administrators can update any user.',
  })
  async update(
    @Param() params: IdParamDto,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() user: any,
  ): Promise<UserResponseDto> {
    this.logger.log(`Updating user: ${params.id} by ${user.email}`);
    return this.usersService.update(params.id, updateUserDto, user.sub);
  }

  @Patch(':id/deactivate')
  @Roles(UserRole.ADMIN)
  @SwaggerAuth({
    summary: 'Deactivate user',
    description: 'Deactivates a user account. Only accessible by administrators.',
  })
  async deactivate(
    @Param() params: IdParamDto,
    @CurrentUser() user: any,
  ): Promise<UserResponseDto> {
    this.logger.log(`Deactivating user: ${params.id} by admin ${user.email}`);
    return this.usersService.deactivate(params.id, user.sub);
  }

  @Patch(':id/activate')
  @Roles(UserRole.ADMIN)
  @SwaggerAuth({
    summary: 'Activate user',
    description: 'Activates a user account. Only accessible by administrators.',
  })
  async activate(
    @Param() params: IdParamDto,
    @CurrentUser() user: any,
  ): Promise<UserResponseDto> {
    this.logger.log(`Activating user: ${params.id} by admin ${user.email}`);
    return this.usersService.activate(params.id, user.sub);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @SwaggerAuth({
    summary: 'Delete user',
    description: 'Permanently deletes a user account. Only accessible by administrators.',
    successStatus: 204,
    successDescription: 'User deleted successfully',
  })
  async remove(
    @Param() params: IdParamDto,
    @CurrentUser() user: any,
  ): Promise<void> {
    this.logger.log(`Deleting user: ${params.id} by admin ${user.email}`);
    await this.usersService.remove(params.id);
  }
}
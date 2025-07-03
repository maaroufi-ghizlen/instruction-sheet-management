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
  Req,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { Request } from 'express';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { RolesGuard } from '@shared/guards/roles.guard';
import { UserOwnershipGuard } from './guards/user-ownership.guard';
import { Roles } from '@shared/decorators/roles.decorator';
import { UserRole } from '@shared/enums/enums';
import {
  CreateUserDto,
  UpdateUserDto,
  UsersQueryDto,
  UserResponseDto,
  UsersListResponseDto,
} from './dto';

// Extend Request interface to include user
interface AuthenticatedRequest extends Request {
  user: {
    sub: string;
    email: string;
    role: UserRole;
    departmentId: string;
  };
}

@ApiTags('Users')
@Controller('users')
@UseGuards(ThrottlerGuard)
@ApiBearerAuth('JWT-auth')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new user',
    description: 'Creates a new user account. Only accessible by administrators.',
  })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'array', items: { type: 'string' } },
        error: { type: 'string' },
        statusCode: { type: 'number' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - user with email already exists',
  })
  async create(
    @Body() createUserDto: CreateUserDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<UserResponseDto> {
    this.logger.log(`Admin ${req.user.email} creating new user: ${createUserDto.email}`);
    return this.usersService.create(createUserDto, req.user.sub);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PREPARATEUR, UserRole.IPDF, UserRole.IQP)
  @ApiOperation({
    summary: 'Get all users with filtering and pagination',
    description: 'Retrieves a paginated list of users with optional filtering by role, department, status, and search.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10, max: 100)',
    example: 10,
  })
  @ApiQuery({
    name: 'role',
    required: false,
    enum: UserRole,
    description: 'Filter by user role',
  })
  @ApiQuery({
    name: 'departmentId',
    required: false,
    type: String,
    description: 'Filter by department ID',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Filter by active status',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by name or email',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description: 'Sort field (default: lastName)',
    enum: ['firstName', 'lastName', 'email', 'role', 'createdAt', 'lastLoginAt'],
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    type: String,
    description: 'Sort order (default: asc)',
    enum: ['asc', 'desc'],
  })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
    type: UsersListResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async findAll(@Query() query: UsersQueryDto): Promise<UsersListResponseDto> {
    this.logger.log('Fetching users with query', query);
    return this.usersService.findAll(query);
  }

  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get user statistics',
    description: 'Retrieves user statistics including total, active, inactive counts and role distribution.',
  })
  @ApiResponse({
    status: 200,
    description: 'User statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number', example: 50 },
        active: { type: 'number', example: 45 },
        inactive: { type: 'number', example: 5 },
        byRole: {
          type: 'object',
          example: {
            admin: 2,
            preparateur: 10,
            ipdf: 8,
            iqp: 15,
            end_user: 15,
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async getUserStats() {
    this.logger.log('Fetching user statistics');
    return this.usersService.getUserStats();
  }

  @Get('by-department/:departmentId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PREPARATEUR, UserRole.IPDF, UserRole.IQP)
  @ApiOperation({
    summary: 'Get users by department',
    description: 'Retrieves all active users in a specific department.',
  })
  @ApiParam({
    name: 'departmentId',
    description: 'Department ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
    type: [UserResponseDto],
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid department ID format',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async getUsersByDepartment(@Param('departmentId') departmentId: string): Promise<UserResponseDto[]> {
    this.logger.log(`Fetching users for department: ${departmentId}`);
    return this.usersService.getUsersByDepartment(departmentId);
  }

  @Get(':id')
  @UseGuards(RolesGuard, UserOwnershipGuard)
  @Roles(UserRole.ADMIN, UserRole.PREPARATEUR, UserRole.IPDF, UserRole.IQP, UserRole.END_USER)
  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Retrieves a specific user by ID. Users can only access their own profile unless they are administrators.',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'User retrieved successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid user ID format',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions or not user owner',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async findOne(@Param('id') id: string): Promise<UserResponseDto> {
    this.logger.log(`Fetching user: ${id}`);
    return this.usersService.findOne(id);
  }

  @Put(':id')
  @UseGuards(RolesGuard, UserOwnershipGuard)
  @Roles(UserRole.ADMIN, UserRole.PREPARATEUR, UserRole.IPDF, UserRole.IQP, UserRole.END_USER)
  @ApiOperation({
    summary: 'Update user',
    description: 'Updates a user profile. Users can update their own profile, administrators can update any user.',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed or invalid user ID format',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions or not user owner',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - email already exists',
  })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<UserResponseDto> {
    this.logger.log(`Updating user: ${id} by ${req.user.email}`);
    return this.usersService.update(id, updateUserDto, req.user.sub);
  }

  @Patch(':id/deactivate')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Deactivate user',
    description: 'Deactivates a user account. Only accessible by administrators.',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'User deactivated successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid user ID format',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async deactivate(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<UserResponseDto> {
    this.logger.log(`Deactivating user: ${id} by admin ${req.user.email}`);
    return this.usersService.deactivate(id, req.user.sub);
  }

  @Patch(':id/activate')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Activate user',
    description: 'Activates a user account. Only accessible by administrators.',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'User activated successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid user ID format',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async activate(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<UserResponseDto> {
    this.logger.log(`Activating user: ${id} by admin ${req.user.email}`);
    return this.usersService.activate(id, req.user.sub);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete user',
    description: 'Permanently deletes a user account. Only accessible by administrators.',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 204,
    description: 'User deleted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid user ID format',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async remove(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<void> {
    this.logger.log(`Deleting user: ${id} by admin ${req.user.email}`);
    await this.usersService.remove(id);
  }
}
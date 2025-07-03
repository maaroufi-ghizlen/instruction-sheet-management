// services/user-service/src/users/users.controller.ts

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { JwtAuthGuard } from '@nestjs/passport';
import { ThrottlerGuard } from '@nestjs/throttler';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UserRole } from '@shared/enums/enums';
import { RolesGuard } from './guards/roles.guard';
import { UserOwnershipGuard } from './guards/user-ownership.guard';
import { RoleModificationGuard } from './guards/role-modification.guard';
import { Roles } from './decorators/roles.decorator';
import {
  CreateUserDto,
  UpdateUserDto,
  UsersQueryDto,
  UserResponseDto,
  UsersListResponseDto,
} from './dto';

@ApiTags('User Management')
@Controller('users')
@UseGuards(ThrottlerGuard, JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  /**
   * Create a new user (Admin only)
   */
  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new user',
    description: 'Create a new user account. Only administrators can create users.',
  })
  @ApiBody({
    type: CreateUserDto,
    description: 'User creation data',
  })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid input data',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'array', items: { type: 'string' } },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Email already exists',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 409 },
        message: { type: 'string', example: 'User with this email already exists' },
        error: { type: 'string', example: 'Conflict' },
      },
    },
  })
  async createUser(
    @Body() createUserDto: CreateUserDto,
    @Request() req: any,
  ): Promise<UserResponseDto> {
    this.logger.log(`Creating user: ${createUserDto.email} by ${req.user.sub}`);
    return this.usersService.createUser(createUserDto, req.user.sub);
  }

  /**
   * Get all users with pagination and filtering
   */
  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get all users',
    description: 'Retrieve all users with pagination and filtering options. Only administrators can access this endpoint.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: 'number',
    description: 'Page number (default: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: 'number',
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
    type: 'string',
    description: 'Filter by department ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: 'boolean',
    description: 'Filter by active status',
    example: true,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: 'string',
    description: 'Search by name or email',
    example: 'john',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: 'string',
    description: 'Sort field',
    example: 'lastName',
    enum: ['firstName', 'lastName', 'email', 'role', 'createdAt', 'lastLoginAt'],
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    type: 'string',
    description: 'Sort order',
    example: 'asc',
    enum: ['asc', 'desc'],
  })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
    type: UsersListResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async findAll(@Query() query: UsersQueryDto): Promise<UsersListResponseDto> {
    this.logger.log(`Fetching users with query: ${JSON.stringify(query)}`);
    return this.usersService.findAll(query);
  }

  /**
   * Get user by ID
   */
  @Get(':id')
  @UseGuards(UserOwnershipGuard)
  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Retrieve a specific user by their ID. Users can only access their own profile unless they are administrators.',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
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
    description: 'Bad request - Invalid user ID format',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Can only access own profile',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async findOne(@Param('id') id: string): Promise<UserResponseDto> {
    this.logger.log(`Fetching user: ${id}`);
    return this.usersService.findOne(id);
  }

  /**
   * Update user by ID
   */
  @Put(':id')
  @UseGuards(UserOwnershipGuard, RoleModificationGuard)
  @ApiOperation({
    summary: 'Update user by ID',
    description: 'Update a user\'s information. Users can update their own profile (limited fields), administrators can update any user.',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'User ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiBody({
    type: UpdateUserDto,
    description: 'User update data',
  })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid input data or user ID format',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Can only update own profile or admin access required',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Email already exists',
  })
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req: any,
  ): Promise<UserResponseDto> {
    const isAdmin = req.user.role === UserRole.ADMIN;
    const isSelf = req.user.sub === id;
    
    this.logger.log(`Updating user: ${id} by ${req.user.sub} (admin: ${isAdmin}, self: ${isSelf})`);
    
    return this.usersService.updateUser(
      id,
      updateUserDto,
      req.user.sub,
      isAdmin,
      isSelf,
    );
  }

  /**
   * Delete user by ID (Admin only)
   */
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete user by ID',
    description: 'Soft delete a user by setting their status to inactive. Only administrators can delete users.',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'User ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 204,
    description: 'User deleted successfully (soft delete)',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid user ID format',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required or cannot delete admin users',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async deleteUser(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<void> {
    this.logger.log(`Deleting user: ${id} by ${req.user.sub}`);
    return this.usersService.deleteUser(id, req.user.sub);
  }

  /**
   * Get users by department
   */
  @Get('department/:departmentId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get users by department',
    description: 'Retrieve all active users belonging to a specific department. Only administrators can access this endpoint.',
  })
  @ApiParam({
    name: 'departmentId',
    type: 'string',
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
    description: 'Bad request - Invalid department ID format',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async findByDepartment(
    @Param('departmentId') departmentId: string,
  ): Promise<UserResponseDto[]> {
    this.logger.log(`Fetching users by department: ${departmentId}`);
    return this.usersService.findByDepartment(departmentId);
  }

  /**
   * Get users by role
   */
  @Get('role/:role')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get users by role',
    description: 'Retrieve all active users with a specific role. Only administrators can access this endpoint.',
  })
  @ApiParam({
    name: 'role',
    enum: UserRole,
    description: 'User role',
    example: UserRole.PREPARATEUR,
  })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
    type: [UserResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async findByRole(@Param('role') role: UserRole): Promise<UserResponseDto[]> {
    this.logger.log(`Fetching users by role: ${role}`);
    return this.usersService.findByRole(role);
  }

  /**
   * Get user statistics
   */
  @Get('admin/stats')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get user statistics',
    description: 'Retrieve comprehensive user statistics including counts by role, active/inactive users, and recent users. Only administrators can access this endpoint.',
  })
  @ApiResponse({
    status: 200,
    description: 'User statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalUsers: { type: 'number', example: 150 },
        activeUsers: { type: 'number', example: 142 },
        inactiveUsers: { type: 'number', example: 8 },
        usersByRole: {
          type: 'object',
          properties: {
            ADMIN: { type: 'number', example: 5 },
            PREPARATEUR: { type: 'number', example: 25 },
            IPDF: { type: 'number', example: 15 },
            IQP: { type: 'number', example: 12 },
            END_USER: { type: 'number', example: 85 },
          },
        },
        recentUsers: {
          type: 'array',
          items: { $ref: '#/components/schemas/UserResponseDto' },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async getUserStats() {
    this.logger.log('Fetching user statistics');
    return this.usersService.getUserStats();
  }

  /**
   * Search users
   */
  @Get('search/:term')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Search users',
    description: 'Search for users by name or email. Only administrators can access this endpoint.',
  })
  @ApiParam({
    name: 'term',
    type: 'string',
    description: 'Search term (minimum 2 characters)',
    example: 'john',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: 'number',
    description: 'Maximum number of results (default: 10)',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Users found successfully',
    type: [UserResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async searchUsers(
    @Param('term') term: string,
    @Query('limit') limit?: number,
  ): Promise<UserResponseDto[]> {
    this.logger.log(`Searching users with term: ${term}`);
    return this.usersService.searchUsers(term, limit);
  }
}
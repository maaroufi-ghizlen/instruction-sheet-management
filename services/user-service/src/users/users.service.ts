// services/user-service/src/users/users.service.ts

import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../database/schemas/user.schema';
import { UserRole } from '@shared/enums/enums';
import {
  CreateUserDto,
  UpdateUserDto,
  UsersQueryDto,
  UserResponseDto,
  UsersListResponseDto,
  PaginationMetaDto,
} from './dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  /**
   * Create a new user (Admin only)
   */
  async createUser(createUserDto: CreateUserDto, createdBy: string): Promise<UserResponseDto> {
    const { email, password, firstName, lastName, role, departmentId, isActive = true } = createUserDto;

    // Check if user already exists
    const existingUser = await this.userModel.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = new this.userModel({
      email: email.toLowerCase(),
      passwordHash,
      firstName,
      lastName,
      role,
      departmentId: new Types.ObjectId(departmentId),
      isActive,
      isTwoFactorEnabled: false,
      loginAttempts: 0,
      lastModifiedBy: new Types.ObjectId(createdBy),
      lastModifiedAt: new Date(),
    });

    const savedUser = await user.save();
    
    this.logger.log(`User created successfully: ${email} by ${createdBy}`);
    
    return this.mapToUserResponse(savedUser);
  }

  /**
   * Get all users with pagination and filtering
   */
  async findAll(query: UsersQueryDto): Promise<UsersListResponseDto> {
    const {
      page = 1,
      limit = 10,
      role,
      departmentId,
      isActive,
      search,
      sortBy = 'lastName',
      sortOrder = 'asc',
    } = query;

    // Build filter
    const filter: any = {};
    
    if (role) {
      filter.role = role;
    }
    
    if (departmentId) {
      filter.departmentId = new Types.ObjectId(departmentId);
    }
    
    if (isActive !== undefined) {
      filter.isActive = isActive;
    }
    
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    // Build sort
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Execute queries
    const [users, total] = await Promise.all([
      this.userModel
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.userModel.countDocuments(filter).exec(),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const pagination: PaginationMetaDto = {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };

    return {
      users: users.map(user => this.mapToUserResponse(user)),
      pagination,
    };
  }

  /**
   * Get user by ID
   */
  async findOne(id: string): Promise<UserResponseDto> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid user ID format');
    }

    const user = await this.userModel.findById(id).exec();
    
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return this.mapToUserResponse(user);
  }

  /**
   * Update user (Admin only or self for limited fields)
   */
  async updateUser(
    id: string,
    updateUserDto: UpdateUserDto,
    updatedBy: string,
    isAdmin: boolean = false,
    isSelf: boolean = false,
  ): Promise<UserResponseDto> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid user ID format');
    }

    const user = await this.userModel.findById(id).exec();
    
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Check permissions for field updates
    if (!isAdmin && !isSelf) {
      throw new ForbiddenException('You can only update your own profile or must be an admin');
    }

    // If user is updating themselves, restrict certain fields
    if (isSelf && !isAdmin) {
      const restrictedFields = ['role', 'departmentId', 'isActive'];
      const hasRestrictedField = restrictedFields.some(field => updateUserDto[field] !== undefined);
      
      if (hasRestrictedField) {
        throw new ForbiddenException('You cannot modify role, department, or active status');
      }
    }

    // Check for email uniqueness if email is being updated
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userModel.findOne({ 
        email: updateUserDto.email.toLowerCase(),
        _id: { $ne: id }
      });
      
      if (existingUser) {
        throw new ConflictException('Email already exists');
      }
    }

    // Prepare update data
    const updateData: any = {
      ...updateUserDto,
      lastModifiedBy: new Types.ObjectId(updatedBy),
      lastModifiedAt: new Date(),
    };

    // Convert email to lowercase
    if (updateData.email) {
      updateData.email = updateData.email.toLowerCase();
    }

    // Convert departmentId to ObjectId if provided
    if (updateData.departmentId) {
      updateData.departmentId = new Types.ObjectId(updateData.departmentId);
    }

    // Update user
    const updatedUser = await this.userModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).exec();

    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    this.logger.log(`User updated successfully: ${id} by ${updatedBy}`);
    
    return this.mapToUserResponse(updatedUser);
  }

  /**
   * Delete user (Admin only)
   */
  async deleteUser(id: string, deletedBy: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid user ID format');
    }

    const user = await this.userModel.findById(id).exec();
    
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Prevent deletion of admin users by non-admins
    if (user.role === UserRole.ADMIN) {
      throw new ForbiddenException('Cannot delete admin users');
    }

    // Soft delete by setting isActive to false
    await this.userModel.findByIdAndUpdate(
      id,
      {
        isActive: false,
        lastModifiedBy: new Types.ObjectId(deletedBy),
        lastModifiedAt: new Date(),
      }
    ).exec();

    this.logger.log(`User soft deleted successfully: ${id} by ${deletedBy}`);
  }

  /**
   * Get users by department
   */
  async findByDepartment(departmentId: string): Promise<UserResponseDto[]> {
    if (!Types.ObjectId.isValid(departmentId)) {
      throw new BadRequestException('Invalid department ID format');
    }

    const users = await this.userModel
      .find({ departmentId: new Types.ObjectId(departmentId), isActive: true })
      .sort({ lastName: 1, firstName: 1 })
      .exec();

    return users.map(user => this.mapToUserResponse(user));
  }

  /**
   * Get users by role
   */
  async findByRole(role: UserRole): Promise<UserResponseDto[]> {
    const users = await this.userModel
      .find({ role, isActive: true })
      .sort({ lastName: 1, firstName: 1 })
      .exec();

    return users.map(user => this.mapToUserResponse(user));
  }

  /**
   * Get user statistics
   */
  async getUserStats() {
    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      usersByRole,
      recentUsers,
    ] = await Promise.all([
      this.userModel.countDocuments().exec(),
      this.userModel.countDocuments({ isActive: true }).exec(),
      this.userModel.countDocuments({ isActive: false }).exec(),
      this.userModel.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$role', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]).exec(),
      this.userModel
        .find({ isActive: true })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('firstName lastName email role createdAt')
        .exec(),
    ]);

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      usersByRole: usersByRole.reduce((acc, { _id, count }) => {
        acc[_id] = count;
        return acc;
      }, {}),
      recentUsers: recentUsers.map(user => this.mapToUserResponse(user)),
    };
  }

  /**
   * Search users
   */
  async searchUsers(searchTerm: string, limit: number = 10): Promise<UserResponseDto[]> {
    if (!searchTerm || searchTerm.trim().length < 2) {
      return [];
    }

    const users = await this.userModel
      .find({
        $and: [
          { isActive: true },
          {
            $or: [
              { firstName: { $regex: searchTerm, $options: 'i' } },
              { lastName: { $regex: searchTerm, $options: 'i' } },
              { email: { $regex: searchTerm, $options: 'i' } },
            ],
          },
        ],
      })
      .sort({ lastName: 1, firstName: 1 })
      .limit(limit)
      .exec();

    return users.map(user => this.mapToUserResponse(user));
  }

  /**
   * Check if user exists
   */
  async userExists(id: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) {
      return false;
    }

    const count = await this.userModel.countDocuments({ _id: id, isActive: true }).exec();
    return count > 0;
  }

  /**
   * Update user's last login
   */
  async updateLastLogin(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      return;
    }

    await this.userModel.findByIdAndUpdate(
      id,
      { lastLoginAt: new Date() }
    ).exec();
  }

  /**
   * Map user document to response DTO
   */
  private mapToUserResponse(user: UserDocument): UserResponseDto {
    return {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      role: user.role,
      departmentId: user.departmentId.toString(),
      isActive: user.isActive,
      isTwoFactorEnabled: user.isTwoFactorEnabled,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastModifiedAt: user.lastModifiedAt,
      lastModifiedBy: user.lastModifiedBy?.toString(),
    };
  }
}
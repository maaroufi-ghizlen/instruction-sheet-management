
// services/user-service/src/users/users.service.ts
// 🔄 CHANGES: Updated to use shared utilities and auth helpers

import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';

// 🔄 CHANGED: Import utilities from shared package
// ❌ REMOVED: import * as bcrypt from 'bcrypt';
// ❌ REMOVED: Local pagination logic
// ❌ REMOVED: Local validation utilities

// ✅ ADDED: Import shared utilities and auth helpers
import { AuthUtils, PaginationUtils, ValidationUtils, ResponseUtils } from '@instruction-sheet/shared';

import { User, UserDocument } from '../database/schemas/user.schema';
import {
  CreateUserDto,
  UpdateUserDto,
  UsersQueryDto,
  UserResponseDto,
  UsersListResponseDto,
} from './dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private configService: ConfigService,
  ) {}

  async create(createUserDto: CreateUserDto, createdBy?: string): Promise<UserResponseDto> {
    this.logger.log(`Creating new user: ${createUserDto.email}`);

    try {
      // Check if user already exists
      const existingUser = await this.userModel.findOne({ email: createUserDto.email });
      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      // 🔄 CHANGED: Use shared auth utility for password validation and hashing
      // ❌ REMOVED: const saltRounds = this.configService.get<number>('BCRYPT_SALT_ROUNDS') || 12;
      // ❌ REMOVED: const passwordHash = await bcrypt.hash(createUserDto.password, saltRounds);

      // ✅ ADDED: Use shared auth utilities for password validation and hashing
      const passwordValidation = AuthUtils.validatePasswordStrength(createUserDto.password);
      if (!passwordValidation.isValid) {
        throw new BadRequestException(passwordValidation.errors);
      }

      const saltRounds = this.configService.get<number>('BCRYPT_SALT_ROUNDS') || 12;
      const passwordHash = await AuthUtils.hashPassword(createUserDto.password, saltRounds);

      // Create user
      const userData = {
        email: createUserDto.email,
        passwordHash,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        role: createUserDto.role,
        departmentId: new Types.ObjectId(createUserDto.departmentId),
        isActive: createUserDto.isActive ?? true,
        lastModifiedAt: new Date(),
        lastModifiedBy: createdBy ? new Types.ObjectId(createdBy) : undefined,
      };

      const user = new this.userModel(userData);
      await user.save();

      this.logger.log(`User created successfully: ${user.email}`);
      return this.mapToUserResponse(user);
    } catch (error) {
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to create user: ${createUserDto.email}`, error.stack);
      throw new InternalServerErrorException('Failed to create user');
    }
  }

  async findAll(query: UsersQueryDto): Promise<UsersListResponseDto> {
    this.logger.log('Fetching users with query', query);

    try {
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

      // 🔄 CHANGED: Use shared utilities for building filters and queries
      // ❌ REMOVED: Manual filter building logic
      // ❌ REMOVED: Manual pagination calculations
      // ❌ REMOVED: Manual sort object building

      // ✅ ADDED: Use shared utilities for query building
      const filter: any = {};

      if (role) {
        filter.role = role;
      }

      if (departmentId) {
        filter.departmentId = new Types.ObjectId(departmentId);
      }

      if (typeof isActive === 'boolean') {
        filter.isActive = isActive;
      }

      if (search) {
        const searchFilter = ValidationUtils.buildSearchFilter(
          search,
          ['firstName', 'lastName', 'email']
        );
        Object.assign(filter, searchFilter);
      }

      // Build sort using shared utilities
      const sort = PaginationUtils.buildSortObject(sortBy, sortOrder);
      const skip = PaginationUtils.calculateSkip(page, limit);

      // Execute queries
      const [users, total] = await Promise.all([
        this.userModel
          .find(filter)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .exec(),
        this.userModel.countDocuments(filter),
      ]);

      // Calculate pagination metadata using shared utility
      const pagination = PaginationUtils.calculatePaginationMeta(page, limit, total);

      const userResponses = users.map(user => this.mapToUserResponse(user));

      this.logger.log(`Found ${users.length} users out of ${total} total`);

      return {
        users: userResponses,
        pagination,
      };
    } catch (error) {
      this.logger.error('Failed to fetch users', error.stack);
      throw new InternalServerErrorException('Failed to fetch users');
    }
  }

  async findOne(id: string): Promise<UserResponseDto> {
    this.logger.log(`Fetching user by ID: ${id}`);

    // 🔄 CHANGED: Use shared validation utility
    // ❌ REMOVED: Manual ObjectId validation
    // ✅ ADDED: Use shared validation utility
    if (!ValidationUtils.isValidObjectId(id)) {
      throw new BadRequestException('Invalid user ID format');
    }

    try {
      const user = await this.userModel.findById(id);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      return this.mapToUserResponse(user);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to fetch user: ${id}`, error.stack);
      throw new InternalServerErrorException('Failed to fetch user');
    }
  }

  async findByEmail(email: string): Promise<UserResponseDto | null> {
    this.logger.log(`Fetching user by email: ${email}`);

    try {
      const user = await this.userModel.findOne({ email });
      return user ? this.mapToUserResponse(user) : null;
    } catch (error) {
      this.logger.error(`Failed to fetch user by email: ${email}`, error.stack);
      throw new InternalServerErrorException('Failed to fetch user by email');
    }
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    updatedBy?: string,
  ): Promise<UserResponseDto> {
    this.logger.log(`Updating user: ${id}`);

    // 🔄 CHANGED: Use shared validation utility
    if (!ValidationUtils.isValidObjectId(id)) {
      throw new BadRequestException('Invalid user ID format');
    }

    try {
      const user = await this.userModel.findById(id);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Check for email uniqueness if email is being updated
      if (updateUserDto.email && updateUserDto.email !== user.email) {
        const existingUser = await this.userModel.findOne({ email: updateUserDto.email });
        if (existingUser) {
          throw new ConflictException('User with this email already exists');
        }
      }

      // Prepare update data
      const updateData: any = {
        ...updateUserDto,
        lastModifiedAt: new Date(),
        lastModifiedBy: updatedBy ? new Types.ObjectId(updatedBy) : undefined,
      };

      // Convert departmentId to ObjectId if provided
      if (updateUserDto.departmentId) {
        updateData.departmentId = new Types.ObjectId(updateUserDto.departmentId);
      }

      // Update user
      const updatedUser = await this.userModel.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true },
      );

      if (!updatedUser) {
        throw new NotFoundException('User not found');
      }

      this.logger.log(`User updated successfully: ${updatedUser.email}`);
      return this.mapToUserResponse(updatedUser);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      this.logger.error(`Failed to update user: ${id}`, error.stack);
      throw new InternalServerErrorException('Failed to update user');
    }
  }

  async remove(id: string): Promise<{ message: string }> {
    this.logger.log(`Deleting user: ${id}`);

    // 🔄 CHANGED: Use shared validation utility
    if (!ValidationUtils.isValidObjectId(id)) {
      throw new BadRequestException('Invalid user ID format');
    }

    try {
      const user = await this.userModel.findById(id);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      await this.userModel.findByIdAndDelete(id);
      
      this.logger.log(`User deleted successfully: ${user.email}`);
      return { message: 'User deleted successfully' };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to delete user: ${id}`, error.stack);
      throw new InternalServerErrorException('Failed to delete user');
    }
  }

  async deactivate(id: string, deactivatedBy?: string): Promise<UserResponseDto> {
    this.logger.log(`Deactivating user: ${id}`);

    // 🔄 CHANGED: Use shared validation utility
    if (!ValidationUtils.isValidObjectId(id)) {
      throw new BadRequestException('Invalid user ID format');
    }

    try {
      const updatedUser = await this.userModel.findByIdAndUpdate(
        id,
        {
          isActive: false,
          lastModifiedAt: new Date(),
          lastModifiedBy: deactivatedBy ? new Types.ObjectId(deactivatedBy) : undefined,
        },
        { new: true, runValidators: true },
      );

      if (!updatedUser) {
        throw new NotFoundException('User not found');
      }

      this.logger.log(`User deactivated successfully: ${updatedUser.email}`);
      return this.mapToUserResponse(updatedUser);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to deactivate user: ${id}`, error.stack);
      throw new InternalServerErrorException('Failed to deactivate user');
    }
  }

  async activate(id: string, activatedBy?: string): Promise<UserResponseDto> {
    this.logger.log(`Activating user: ${id}`);

    // 🔄 CHANGED: Use shared validation utility
    if (!ValidationUtils.isValidObjectId(id)) {
      throw new BadRequestException('Invalid user ID format');
    }

    try {
      const updatedUser = await this.userModel.findByIdAndUpdate(
        id,
        {
          isActive: true,
          lastModifiedAt: new Date(),
          lastModifiedBy: activatedBy ? new Types.ObjectId(activatedBy) : undefined,
        },
        { new: true, runValidators: true },
      );

      if (!updatedUser) {
        throw new NotFoundException('User not found');
      }

      this.logger.log(`User activated successfully: ${updatedUser.email}`);
      return this.mapToUserResponse(updatedUser);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to activate user: ${id}`, error.stack);
      throw new InternalServerErrorException('Failed to activate user');
    }
  }

  async getUsersByDepartment(departmentId: string): Promise<UserResponseDto[]> {
    this.logger.log(`Fetching users by department: ${departmentId}`);

    // 🔄 CHANGED: Use shared validation utility
    if (!ValidationUtils.isValidObjectId(departmentId)) {
      throw new BadRequestException('Invalid department ID format');
    }

    try {
      const users = await this.userModel
        .find({ departmentId: new Types.ObjectId(departmentId), isActive: true })
        .sort({ lastName: 1, firstName: 1 })
        .exec();

      return users.map(user => this.mapToUserResponse(user));
    } catch (error) {
      this.logger.error(`Failed to fetch users by department: ${departmentId}`, error.stack);
      throw new InternalServerErrorException('Failed to fetch users by department');
    }
  }

  async getUserStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byRole: Record<string, number>;
  }> {
    this.logger.log('Calculating user statistics');

    try {
      const [total, active, inactive, roleStats] = await Promise.all([
        this.userModel.countDocuments(),
        this.userModel.countDocuments({ isActive: true }),
        this.userModel.countDocuments({ isActive: false }),
        this.userModel.aggregate([
          { $group: { _id: '$role', count: { $sum: 1 } } },
          { $project: { role: '$_id', count: 1, _id: 0 } },
        ]),
      ]);

      const byRole = roleStats.reduce((acc, stat) => {
        acc[stat.role] = stat.count;
        return acc;
      }, {});

      return {
        total,
        active,
        inactive,
        byRole,
      };
    } catch (error) {
      this.logger.error('Failed to calculate user statistics', error.stack);
      throw new InternalServerErrorException('Failed to calculate user statistics');
    }
  }

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

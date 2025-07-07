// services/department-service/src/departments/departments.service.ts

import { 
  Injectable, 
  NotFoundException, 
  ConflictException, 
  BadRequestException,
  Logger 
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Department, DepartmentDocument } from '../database/schemas/department.schema';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { DepartmentQueryDto } from './dto/department-query.dto';

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

@Injectable()
export class DepartmentsService {
  private readonly logger = new Logger(DepartmentsService.name);

  constructor(
    @InjectModel(Department.name) 
    private readonly departmentModel: Model<DepartmentDocument>,
  ) {}

  async create(
    createDepartmentDto: CreateDepartmentDto,
    userId?: Types.ObjectId,
  ): Promise<DepartmentDocument> {
    this.logger.log(`Creating new department: ${createDepartmentDto.name}`);

    try {
      // Check if department with the same name already exists
      const existingDepartment = await this.departmentModel.findOne({
        name: { $regex: new RegExp(`^${createDepartmentDto.name}$`, 'i') },
      });

      if (existingDepartment) {
        throw new ConflictException('Department with this name already exists');
      }

      // Create the department
      const department = new this.departmentModel({
        ...createDepartmentDto,
        lastModifiedAt: new Date(),
        lastModifiedBy: userId,
      });

      const savedDepartment = await department.save();
      this.logger.log(`Department created successfully: ${savedDepartment._id}`);
      
      return savedDepartment;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(`Failed to create department: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to create department');
    }
  }

  async findAll(query: DepartmentQueryDto): Promise<PaginatedResult<DepartmentDocument>> {
    this.logger.log('Fetching departments with pagination');

    try {
      const {
        search,
        isActive,
        manager,
        page = 1,
        limit = 10,
        sortBy = 'name',
        sortOrder = 'asc',
      } = query;

      // Build filter object
      const filter: Record<string, unknown> = {};

      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ];
      }

      if (typeof isActive === 'boolean') {
        filter.isActive = isActive;
      }

      if (manager) {
        filter.manager = manager;
      }

      // Build sort object
      const sort: Record<string, 1 | -1> = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Execute queries
      const [data, total] = await Promise.all([
        this.departmentModel
          .find(filter)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .populate('manager', 'firstName lastName email')
          .populate('employees', 'firstName lastName email')
          .exec(),
        this.departmentModel.countDocuments(filter),
      ]);

      const pages = Math.ceil(total / limit);

      return {
        data,
        pagination: {
          page,
          limit,
          total,
          pages,
          hasNext: page < pages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to fetch departments: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to fetch departments');
    }
  }

  async findOne(id: string, populate = true): Promise<DepartmentDocument> {
    this.logger.log(`Fetching department: ${id}`);

    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid department ID format');
    }

    try {
      let query = this.departmentModel.findById(id);
      
      if (populate) {
        query = query
          .populate('manager', 'firstName lastName email role')
          .populate('employees', 'firstName lastName email role')
          .populate('sheets', 'title status createdAt');
      }

      const department = await query.exec();

      if (!department) {
        throw new NotFoundException(`Department with ID ${id} not found`);
      }

      return department;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to fetch department ${id}: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to fetch department');
    }
  }

  async update(
    id: string,
    updateDepartmentDto: UpdateDepartmentDto,
    userId?: Types.ObjectId,
  ): Promise<DepartmentDocument> {
    this.logger.log(`Updating department: ${id}`);

    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid department ID format');
    }

    try {
      // Check if department exists
      const existingDepartment = await this.departmentModel.findById(id);
      if (!existingDepartment) {
        throw new NotFoundException(`Department with ID ${id} not found`);
      }

      // Check for name conflicts if name is being updated
      if (updateDepartmentDto.name && updateDepartmentDto.name !== existingDepartment.name) {
        const nameConflict = await this.departmentModel.findOne({
          name: { $regex: new RegExp(`^${updateDepartmentDto.name}$`, 'i') },
          _id: { $ne: id },
        });

        if (nameConflict) {
          throw new ConflictException('Department with this name already exists');
        }
      }

      // Update the department
      const updatedDepartment = await this.departmentModel.findByIdAndUpdate(
        id,
        {
          ...updateDepartmentDto,
          lastModifiedAt: new Date(),
          lastModifiedBy: userId,
        },
        { 
          new: true, 
          runValidators: true,
        },
      )
      .populate('manager', 'firstName lastName email role')
      .populate('employees', 'firstName lastName email role')
      .exec();

      this.logger.log(`Department updated successfully: ${id}`);
      return updatedDepartment;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to update department ${id}: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to update department');
    }
  }

  async remove(id: string, userId?: Types.ObjectId): Promise<{ message: string }> {
    this.logger.log(`Deactivating department: ${id}`);

    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid department ID format');
    }

    try {
      const department = await this.departmentModel.findById(id);
      if (!department) {
        throw new NotFoundException(`Department with ID ${id} not found`);
      }

      // Soft delete by setting isActive to false
      await this.departmentModel.findByIdAndUpdate(
        id,
        {
          isActive: false,
          lastModifiedAt: new Date(),
          lastModifiedBy: userId,
        },
        { new: true },
      );

      this.logger.log(`Department deactivated successfully: ${id}`);
      return { message: 'Department deactivated successfully' };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to deactivate department ${id}: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to deactivate department');
    }
  }

  async addEmployee(departmentId: string, employeeId: string): Promise<DepartmentDocument> {
    this.logger.log(`Adding employee ${employeeId} to department ${departmentId}`);

    if (!Types.ObjectId.isValid(departmentId) || !Types.ObjectId.isValid(employeeId)) {
      throw new BadRequestException('Invalid ID format');
    }

    try {
      const department = await this.departmentModel.findById(departmentId);
      if (!department) {
        throw new NotFoundException(`Department with ID ${departmentId} not found`);
      }

      // Check if employee is already in the department
      const employeeObjectId = new Types.ObjectId(employeeId);
      if (department.employees.some(emp => emp.equals(employeeObjectId))) {
        throw new ConflictException('Employee is already in this department');
      }

      // Add employee to department
      const updatedDepartment = await this.departmentModel.findByIdAndUpdate(
        departmentId,
        {
          $addToSet: { employees: employeeObjectId },
          lastModifiedAt: new Date(),
        },
        { new: true },
      )
      .populate('manager', 'firstName lastName email role')
      .populate('employees', 'firstName lastName email role')
      .exec();

      this.logger.log(`Employee added to department successfully`);
      return updatedDepartment;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to add employee to department: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to add employee to department');
    }
  }

  async removeEmployee(departmentId: string, employeeId: string): Promise<DepartmentDocument> {
    this.logger.log(`Removing employee ${employeeId} from department ${departmentId}`);

    if (!Types.ObjectId.isValid(departmentId) || !Types.ObjectId.isValid(employeeId)) {
      throw new BadRequestException('Invalid ID format');
    }

    try {
      const department = await this.departmentModel.findById(departmentId);
      if (!department) {
        throw new NotFoundException(`Department with ID ${departmentId} not found`);
      }

      // Remove employee from department
      const updatedDepartment = await this.departmentModel.findByIdAndUpdate(
        departmentId,
        {
          $pull: { employees: new Types.ObjectId(employeeId) },
          lastModifiedAt: new Date(),
        },
        { new: true },
      )
      .populate('manager', 'firstName lastName email role')
      .populate('employees', 'firstName lastName email role')
      .exec();

      this.logger.log(`Employee removed from department successfully`);
      return updatedDepartment;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to remove employee from department: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to remove employee from department');
    }
  }

  async findByManager(managerId: string): Promise<DepartmentDocument[]> {
    this.logger.log(`Finding departments managed by user: ${managerId}`);

    if (!Types.ObjectId.isValid(managerId)) {
      throw new BadRequestException('Invalid manager ID format');
    }

    try {
      const departments = await this.departmentModel
        .find({ manager: managerId, isActive: true })
        .populate('employees', 'firstName lastName email role')
        .exec();

      return departments;
    } catch (error) {
      this.logger.error(`Failed to find departments by manager: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to find departments by manager');
    }
  }

  async getStatistics(): Promise<Record<string, unknown>> {
    this.logger.log('Generating department statistics');

    try {
      const stats = await this.departmentModel.aggregate([
        {
          $group: {
            _id: null,
            totalDepartments: { $sum: 1 },
            activeDepartments: {
              $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] },
            },
            inactiveDepartments: {
              $sum: { $cond: [{ $eq: ['$isActive', false] }, 1, 0] },
            },
            departmentsWithManager: {
              $sum: { $cond: [{ $ne: ['$manager', null] }, 1, 0] },
            },
            departmentsWithoutManager: {
              $sum: { $cond: [{ $eq: ['$manager', null] }, 1, 0] },
            },
            totalEmployees: { $sum: { $size: '$employees' } },
            totalSheets: { $sum: { $size: '$sheets' } },
            avgEmployeesPerDepartment: { $avg: { $size: '$employees' } },
            avgSheetsPerDepartment: { $avg: { $size: '$sheets' } },
          },
        },
      ]);

      return stats[0] || {};
    } catch (error) {
      this.logger.error(`Failed to generate statistics: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to generate statistics');
    }
  }
}
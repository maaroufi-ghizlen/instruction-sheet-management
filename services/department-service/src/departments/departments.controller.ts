// services/department-service/src/departments/departments.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpStatus,
  HttpCode,
  UseGuards,
  ValidationPipe,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { Types } from 'mongoose';

import { DepartmentsService, PaginatedResult } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { DepartmentResponseDto } from './dto/department-response.dto';
import { DepartmentQueryDto } from './dto/department-query.dto';
import { DepartmentDocument } from '../database/schemas/department.schema';

// Import shared decorators and guards if available
// import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '@shared/auth';
// import { UserRole } from '@shared/enums';

@ApiTags('Departments')
@Controller('departments')
// @ApiBearerAuth()
// @UseGuards(JwtAuthGuard, RolesGuard)
export class DepartmentsController {
  private readonly logger = new Logger(DepartmentsController.name);

  constructor(private readonly departmentsService: DepartmentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Create a new department',
    description: 'Creates a new department in the system. Only admins can create departments.',
  })
  @ApiCreatedResponse({
    description: 'Department created successfully',
    type: DepartmentResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiConflictResponse({ description: 'Department with this name already exists' })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  // @Roles(UserRole.ADMIN)
  async create(
    @Body(new ValidationPipe({ transform: true, whitelist: true })) 
    createDepartmentDto: CreateDepartmentDto,
    // @CurrentUser('id') userId?: Types.ObjectId,
  ): Promise<DepartmentResponseDto> {
    this.logger.log(`Creating department: ${createDepartmentDto.name}`);
    
    const department = await this.departmentsService.create(
      createDepartmentDto,
      // userId,
    );
    
    return this.transformToResponseDto(department);
  }

  @Get()
  @ApiOperation({ 
    summary: 'Get all departments',
    description: 'Retrieves a paginated list of departments with optional filtering and sorting.',
  })
  @ApiOkResponse({
    description: 'Departments retrieved successfully',
    type: DepartmentResponseDto,
    isArray: true,
  })
  @ApiBadRequestResponse({ description: 'Invalid query parameters' })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiQuery({ name: 'search', required: false, description: 'Search term for name or description' })
  @ApiQuery({ name: 'isActive', required: false, description: 'Filter by active status' })
  @ApiQuery({ name: 'manager', required: false, description: 'Filter by manager ID' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (1-based)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Sort field' })
  @ApiQuery({ name: 'sortOrder', required: false, description: 'Sort order (asc/desc)' })
  async findAll(
    @Query(new ValidationPipe({ transform: true, whitelist: true })) 
    query: DepartmentQueryDto,
  ): Promise<{
    data: DepartmentResponseDto[];
    pagination: PaginatedResult<DepartmentDocument>['pagination'];
  }> {
    this.logger.log('Fetching departments with query', JSON.stringify(query));
    
    const result = await this.departmentsService.findAll(query);
    
    return {
      data: result.data.map(dept => this.transformToResponseDto(dept)),
      pagination: result.pagination,
    };
  }

  @Get('statistics')
  @ApiOperation({ 
    summary: 'Get department statistics',
    description: 'Retrieves statistical information about departments.',
  })
  @ApiOkResponse({
    description: 'Statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalDepartments: { type: 'number' },
        activeDepartments: { type: 'number' },
        inactiveDepartments: { type: 'number' },
        departmentsWithManager: { type: 'number' },
        departmentsWithoutManager: { type: 'number' },
        totalEmployees: { type: 'number' },
        totalSheets: { type: 'number' },
        avgEmployeesPerDepartment: { type: 'number' },
        avgSheetsPerDepartment: { type: 'number' },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  // @Roles(UserRole.ADMIN)
  async getStatistics(): Promise<Record<string, unknown>> {
    this.logger.log('Fetching department statistics');
    return this.departmentsService.getStatistics();
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Get department by ID',
    description: 'Retrieves a specific department by its ID with populated references.',
  })
  @ApiParam({ name: 'id', description: 'Department ID' })
  @ApiOkResponse({
    description: 'Department retrieved successfully',
    type: DepartmentResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid department ID format' })
  @ApiNotFoundResponse({ description: 'Department not found' })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  async findOne(@Param('id') id: string): Promise<DepartmentResponseDto> {
    this.logger.log(`Fetching department: ${id}`);
    
    const department = await this.departmentsService.findOne(id);
    return this.transformToResponseDto(department);
  }

  @Patch(':id')
  @ApiOperation({ 
    summary: 'Update department',
    description: 'Updates an existing department. Only admins can update departments.',
  })
  @ApiParam({ name: 'id', description: 'Department ID' })
  @ApiOkResponse({
    description: 'Department updated successfully',
    type: DepartmentResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid input data or department ID format' })
  @ApiNotFoundResponse({ description: 'Department not found' })
  @ApiConflictResponse({ description: 'Department with this name already exists' })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  // @Roles(UserRole.ADMIN)
  async update(
    @Param('id') id: string,
    @Body(new ValidationPipe({ transform: true, whitelist: true })) 
    updateDepartmentDto: UpdateDepartmentDto,
    // @CurrentUser('id') userId?: Types.ObjectId,
  ): Promise<DepartmentResponseDto> {
    this.logger.log(`Updating department: ${id}`);
    
    const department = await this.departmentsService.update(
      id, 
      updateDepartmentDto,
      // userId,
    );
    
    return this.transformToResponseDto(department);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Deactivate department',
    description: 'Deactivates a department (soft delete). Only admins can deactivate departments.',
  })
  @ApiParam({ name: 'id', description: 'Department ID' })
  @ApiOkResponse({
    description: 'Department deactivated successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid department ID format' })
  @ApiNotFoundResponse({ description: 'Department not found' })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  // @Roles(UserRole.ADMIN)
  async remove(
    @Param('id') id: string,
    // @CurrentUser('id') userId?: Types.ObjectId,
  ): Promise<{ message: string }> {
    this.logger.log(`Deactivating department: ${id}`);
    
    return this.departmentsService.remove(
      id,
      // userId,
    );
  }

  @Post(':id/employees/:employeeId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Add employee to department',
    description: 'Adds an employee to a department. Only admins can manage department employees.',
  })
  @ApiParam({ name: 'id', description: 'Department ID' })
  @ApiParam({ name: 'employeeId', description: 'Employee ID' })
  @ApiOkResponse({
    description: 'Employee added to department successfully',
    type: DepartmentResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid ID format' })
  @ApiNotFoundResponse({ description: 'Department not found' })
  @ApiConflictResponse({ description: 'Employee is already in this department' })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  // @Roles(UserRole.ADMIN)
  async addEmployee(
    @Param('id') id: string,
    @Param('employeeId') employeeId: string,
  ): Promise<DepartmentResponseDto> {
    this.logger.log(`Adding employee ${employeeId} to department ${id}`);
    
    const department = await this.departmentsService.addEmployee(id, employeeId);
    return this.transformToResponseDto(department);
  }

  @Delete(':id/employees/:employeeId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Remove employee from department',
    description: 'Removes an employee from a department. Only admins can manage department employees.',
  })
  @ApiParam({ name: 'id', description: 'Department ID' })
  @ApiParam({ name: 'employeeId', description: 'Employee ID' })
  @ApiOkResponse({
    description: 'Employee removed from department successfully',
    type: DepartmentResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid ID format' })
  @ApiNotFoundResponse({ description: 'Department not found' })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  // @Roles(UserRole.ADMIN)
  async removeEmployee(
    @Param('id') id: string,
    @Param('employeeId') employeeId: string,
  ): Promise<DepartmentResponseDto> {
    this.logger.log(`Removing employee ${employeeId} from department ${id}`);
    
    const department = await this.departmentsService.removeEmployee(id, employeeId);
    return this.transformToResponseDto(department);
  }

  @Get('manager/:managerId')
  @ApiOperation({ 
    summary: 'Get departments by manager',
    description: 'Retrieves all departments managed by a specific user.',
  })
  @ApiParam({ name: 'managerId', description: 'Manager user ID' })
  @ApiOkResponse({
    description: 'Departments retrieved successfully',
    type: DepartmentResponseDto,
    isArray: true,
  })
  @ApiBadRequestResponse({ description: 'Invalid manager ID format' })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  async findByManager(
    @Param('managerId') managerId: string,
  ): Promise<DepartmentResponseDto[]> {
    this.logger.log(`Finding departments managed by user: ${managerId}`);
    
    const departments = await this.departmentsService.findByManager(managerId);
    return departments.map(dept => this.transformToResponseDto(dept));
  }

  private transformToResponseDto(department: DepartmentDocument): DepartmentResponseDto {
    return {
      id: department._id.toString(),
      name: department.name,
      description: department.description,
      isActive: department.isActive,
      manager: department.manager?.toString(),
      employees: department.employees?.map(emp => emp.toString()) || [],
      sheets: department.sheets?.map(sheet => sheet.toString()) || [],
      employeeCount: department.employeeCount,
      sheetCount: department.sheetCount,
      isManagerAssigned: department.isManagerAssigned,
      createdAt: department.createdAt,
      updatedAt: department.updatedAt,
      lastModifiedAt: department.lastModifiedAt,
      lastModifiedBy: department.lastModifiedBy?.toString(),
    };
  }
}
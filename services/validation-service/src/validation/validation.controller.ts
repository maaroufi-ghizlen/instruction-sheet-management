// services/validation-service/src/validation/validation.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Put,
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

import { ValidationService, PaginatedResult } from './validation.service';
import { CreateValidationDto } from './dto/create-validation.dto';
import { UpdateValidationDto } from './dto/update-validation.dto';
import { ValidationResponseDto } from './dto/validation-response.dto';
import { ValidationQueryDto } from './dto/validation-query.dto';
import { ValidationReviewDto } from './dto/validation-review.dto';
import { ValidationWorkflowDocument } from '../database/schemas/validation-workflow.schema';

// Import shared decorators and guards
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '@instruction-sheet/shared';
import { UserRole } from '@instruction-sheet/shared';

@ApiTags('Validation')
@Controller('validation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ValidationController {
  private readonly logger = new Logger(ValidationController.name);

  constructor(private readonly validationService: ValidationService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Create a new validation workflow',
    description: 'Creates a new validation workflow for a sheet. Only Admins can create validation workflows.',
  })
  @ApiCreatedResponse({
    description: 'Validation workflow created successfully',
    type: ValidationResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiConflictResponse({ description: 'Validation workflow for this sheet and stage already exists' })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  @Roles(UserRole.ADMIN)
  async create(
    @Body(new ValidationPipe({ transform: true, whitelist: true })) 
    createValidationDto: CreateValidationDto,
    @CurrentUser('id') userId: Types.ObjectId,
  ): Promise<ValidationResponseDto> {
    this.logger.log(`Creating validation workflow for sheet: ${createValidationDto.sheetId}`);
    
    const validation = await this.validationService.create(createValidationDto, userId);
    return this.transformToResponseDto(validation);
  }

  @Get('history')
  @ApiOperation({ 
    summary: 'Get validation history',
    description: 'Retrieves a paginated list of all validation workflows with optional filtering and sorting.',
  })
  @ApiOkResponse({
    description: 'Validation history retrieved successfully',
    type: ValidationResponseDto,
    isArray: true,
  })
  @ApiBadRequestResponse({ description: 'Invalid query parameters' })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  @ApiQuery({ name: 'sheetId', required: false, description: 'Filter by sheet ID' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by validation status' })
  @ApiQuery({ name: 'stage', required: false, description: 'Filter by validation stage' })
  @ApiQuery({ name: 'validatedBy', required: false, description: 'Filter by validator ID' })
  @ApiQuery({ name: 'assignedTo', required: false, description: 'Filter by assignee ID' })
  @ApiQuery({ name: 'isActive', required: false, description: 'Filter by active status' })
  @ApiQuery({ name: 'search', required: false, description: 'Search in notes' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (1-based)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Sort field' })
  @ApiQuery({ name: 'sortOrder', required: false, description: 'Sort order (asc/desc)' })
  @Roles(UserRole.ADMIN)
  async getHistory(
    @Query(new ValidationPipe({ transform: true, whitelist: true })) 
    query: ValidationQueryDto,
  ): Promise<{
    data: ValidationResponseDto[];
    pagination: PaginatedResult<ValidationWorkflowDocument>['pagination'];
  }> {
    this.logger.log('Fetching validation history with query', JSON.stringify(query));
    
    const result = await this.validationService.findAll(query);
    
    return {
      data: result.data.map(validation => this.transformToResponseDto(validation)),
      pagination: result.pagination,
    };
  }

  @Get('my-tasks')
  @ApiOperation({ 
    summary: 'Get current user\'s validation tasks',
    description: 'Retrieves all validation workflows assigned to the current user.',
  })
  @ApiOkResponse({
    description: 'User validation tasks retrieved successfully',
    type: ValidationResponseDto,
    isArray: true,
  })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @Roles(UserRole.IPDF, UserRole.IQP, UserRole.ADMIN)
  async getMyTasks(
    @CurrentUser('id') userId: Types.ObjectId,
  ): Promise<ValidationResponseDto[]> {
    this.logger.log(`Finding validation tasks for user: ${userId}`);
    
    const validations = await this.validationService.findByAssignee(userId.toString());
    return validations.map(validation => this.transformToResponseDto(validation));
  }

  @Get('statistics')
  @ApiOperation({ 
    summary: 'Get validation statistics',
    description: 'Retrieves statistical information about validation workflows.',
  })
  @ApiOkResponse({
    description: 'Statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalValidations: { type: 'number' },
        activeValidations: { type: 'number' },
        pendingValidations: { type: 'number' },
        inReviewValidations: { type: 'number' },
        validatedValidations: { type: 'number' },
        rejectedValidations: { type: 'number' },
        ipdfValidations: { type: 'number' },
        iqpValidations: { type: 'number' },
        stageStats: { type: 'array' },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  @Roles(UserRole.ADMIN)
  async getStatistics(): Promise<Record<string, unknown>> {
    this.logger.log('Fetching validation statistics');
    return this.validationService.getStatistics();
  }

  @Get('sheets/:sheetId')
  @ApiOperation({ 
    summary: 'Get validation status for a sheet',
    description: 'Retrieves all validation workflows for a specific sheet.',
  })
  @ApiParam({ name: 'sheetId', description: 'Sheet ID' })
  @ApiOkResponse({
    description: 'Sheet validation status retrieved successfully',
    type: ValidationResponseDto,
    isArray: true,
  })
  @ApiBadRequestResponse({ description: 'Invalid sheet ID format' })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  async getSheetValidationStatus(@Param('sheetId') sheetId: string): Promise<ValidationResponseDto[]> {
    this.logger.log(`Fetching validation status for sheet: ${sheetId}`);
    
    const validations = await this.validationService.findBySheetId(sheetId);
    return validations.map(validation => this.transformToResponseDto(validation));
  }

  @Post('sheets/:sheetId/review')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Review a sheet (IPDF validation)',
    description: 'Allows IPDF validators to approve or reject a sheet.',
  })
  @ApiParam({ name: 'sheetId', description: 'Sheet ID' })
  @ApiOkResponse({
    description: 'Sheet review completed successfully',
    type: ValidationResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid sheet ID format or review data' })
  @ApiNotFoundResponse({ description: 'No active validation workflow found' })
  @ApiConflictResponse({ description: 'Validation workflow is not in a reviewable state' })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiForbiddenResponse({ description: 'IPDF or Admin access required' })
  @Roles(UserRole.IPDF, UserRole.ADMIN)
  async reviewSheet(
    @Param('sheetId') sheetId: string,
    @Body(new ValidationPipe({ transform: true, whitelist: true })) 
    reviewDto: ValidationReviewDto,
    @CurrentUser('id') userId: Types.ObjectId,
    @CurrentUser('role') userRole: string,
  ): Promise<ValidationResponseDto> {
    this.logger.log(`Processing IPDF review for sheet: ${sheetId}`);
    
    const validation = await this.validationService.review(sheetId, reviewDto, userId, userRole);
    return this.transformToResponseDto(validation);
  }

  @Post('sheets/:sheetId/finalize')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Finalize sheet validation (IQP approval)',
    description: 'Allows IQP validators to give final approval or rejection to a sheet.',
  })
  @ApiParam({ name: 'sheetId', description: 'Sheet ID' })
  @ApiOkResponse({
    description: 'Sheet finalization completed successfully',
    type: ValidationResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid sheet ID format or review data' })
  @ApiNotFoundResponse({ description: 'No active validation workflow found' })
  @ApiConflictResponse({ description: 'IPDF validation must be completed first' })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiForbiddenResponse({ description: 'IQP or Admin access required' })
  @Roles(UserRole.IQP, UserRole.ADMIN)
  async finalizeSheet(
    @Param('sheetId') sheetId: string,
    @Body(new ValidationPipe({ transform: true, whitelist: true })) 
    reviewDto: ValidationReviewDto,
    @CurrentUser('id') userId: Types.ObjectId,
    @CurrentUser('role') userRole: string,
  ): Promise<ValidationResponseDto> {
    this.logger.log(`Processing IQP finalization for sheet: ${sheetId}`);
    
    const validation = await this.validationService.finalize(sheetId, reviewDto, userId, userRole);
    return this.transformToResponseDto(validation);
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Get validation workflow by ID',
    description: 'Retrieves a specific validation workflow by its ID with populated references.',
  })
  @ApiParam({ name: 'id', description: 'Validation workflow ID' })
  @ApiOkResponse({
    description: 'Validation workflow retrieved successfully',
    type: ValidationResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid validation workflow ID format' })
  @ApiNotFoundResponse({ description: 'Validation workflow not found' })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  async findOne(@Param('id') id: string): Promise<ValidationResponseDto> {
    this.logger.log(`Fetching validation workflow: ${id}`);
    
    const validation = await this.validationService.findOne(id);
    return this.transformToResponseDto(validation);
  }

  @Put(':id')
  @ApiOperation({ 
    summary: 'Update validation workflow',
    description: 'Updates an existing validation workflow. Only Admins can update validation workflows.',
  })
  @ApiParam({ name: 'id', description: 'Validation workflow ID' })
  @ApiOkResponse({
    description: 'Validation workflow updated successfully',
    type: ValidationResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid input data or validation workflow ID format' })
  @ApiNotFoundResponse({ description: 'Validation workflow not found' })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  @Roles(UserRole.ADMIN)
  async update(
    @Param('id') id: string,
    @Body(new ValidationPipe({ transform: true, whitelist: true })) 
    updateValidationDto: UpdateValidationDto,
    @CurrentUser('id') userId: Types.ObjectId,
  ): Promise<ValidationResponseDto> {
    this.logger.log(`Updating validation workflow: ${id}`);
    
    const validation = await this.validationService.update(id, updateValidationDto, userId);
    return this.transformToResponseDto(validation);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Deactivate validation workflow',
    description: 'Deactivates a validation workflow (soft delete). Only Admins can deactivate validation workflows.',
  })
  @ApiParam({ name: 'id', description: 'Validation workflow ID' })
  @ApiOkResponse({
    description: 'Validation workflow deactivated successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid validation workflow ID format' })
  @ApiNotFoundResponse({ description: 'Validation workflow not found' })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  @Roles(UserRole.ADMIN)
  async remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: Types.ObjectId,
  ): Promise<{ message: string }> {
    this.logger.log(`Deactivating validation workflow: ${id}`);
    
    return this.validationService.remove(id, userId);
  }

  @Get()
  @ApiOperation({ 
    summary: 'Get all validation workflows',
    description: 'Retrieves a paginated list of validation workflows with optional filtering.',
  })
  @ApiOkResponse({
    description: 'Validation workflows retrieved successfully',
    type: ValidationResponseDto,
    isArray: true,
  })
  @ApiBadRequestResponse({ description: 'Invalid query parameters' })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @Roles(UserRole.IPDF, UserRole.IQP, UserRole.ADMIN)
  async findAll(
    @Query(new ValidationPipe({ transform: true, whitelist: true })) 
    query: ValidationQueryDto,
  ): Promise<{
    data: ValidationResponseDto[];
    pagination: PaginatedResult<ValidationWorkflowDocument>['pagination'];
  }> {
    this.logger.log('Fetching validation workflows with query', JSON.stringify(query));
    
    const result = await this.validationService.findAll(query);
    
    return {
      data: result.data.map(validation => this.transformToResponseDto(validation)),
      pagination: result.pagination,
    };
  }

  private transformToResponseDto(validation: ValidationWorkflowDocument): ValidationResponseDto {
    return {
      id: validation._id.toString(),
      sheetId: validation.sheetId?.toString(),
      status: validation.status,
      validatedBy: validation.validatedBy?.toString(),
      stage: validation.stage,
      notes: validation.notes,
      validatedAt: validation.validatedAt,
      assignedTo: validation.assignedTo?.toString(),
      assignedAt: validation.assignedAt,
      dueDate: validation.dueDate,
      retryCount: validation.retryCount,
      isActive: validation.isActive,
      isPending: validation.isPending,
      isInReview: validation.isInReview,
      isValidated: validation.isValidated,
      isRejected: validation.isRejected,
      isIPDFStage: validation.isIPDFStage,
      isIQPStage: validation.isIQPStage,
      createdAt: validation.createdAt,
      updatedAt: validation.updatedAt,
      lastModifiedAt: validation.lastModifiedAt,
      lastModifiedBy: validation.lastModifiedBy?.toString(),
    };
  }
}
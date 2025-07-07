// services/sheet-service/src/sheets/sheets.controller.ts

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
  Patch,
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

import { SheetsService, PaginatedResult } from './sheets.service';
import { CreateSheetDto } from './dto/create-sheet.dto';
import { UpdateSheetDto } from './dto/update-sheet.dto';
import { SheetResponseDto } from './dto/sheet-response.dto';
import { SheetQueryDto } from './dto/sheet-query.dto';
import { SheetDocument } from '../database/schemas/sheet.schema';
import { SheetStatus } from '@instruction-sheet/shared'; 

// Import shared decorators and guards if available
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '@instruction-sheet/shared';
import { UserRole } from '@instruction-sheet/shared';

@ApiTags('Sheets')
@Controller('sheets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class SheetsController {
  private readonly logger = new Logger(SheetsController.name);

  constructor(private readonly sheetsService: SheetsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Create a new sheet',
    description: 'Creates a new instruction sheet in the system. Preparators and Admins can create sheets.',
  })
  @ApiCreatedResponse({
    description: 'Sheet created successfully',
    type: SheetResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiConflictResponse({ description: 'Sheet with this reference already exists' })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiForbiddenResponse({ description: 'Preparator or Admin access required' })
  @Roles(UserRole.PREPARATEUR, UserRole.ADMIN)
  async create(
    @Body(new ValidationPipe({ transform: true, whitelist: true })) 
    createSheetDto: CreateSheetDto,
    @CurrentUser('userId') userId: string,
  ): Promise<SheetResponseDto> {
    this.logger.log(`Creating sheet: ${createSheetDto.title}`);
    
    const sheet = await this.sheetsService.create(createSheetDto, new Types.ObjectId(userId));
    return this.transformToResponseDto(sheet);
  }

  @Get()
  @ApiOperation({ 
    summary: 'Get all sheets',
    description: 'Retrieves a paginated list of sheets with optional filtering and sorting.',
  })
  @ApiOkResponse({
    description: 'Sheets retrieved successfully',
    type: SheetResponseDto,
    isArray: true,
  })
  @ApiBadRequestResponse({ description: 'Invalid query parameters' })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiQuery({ name: 'search', required: false, description: 'Search term for title, reference, or description' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'department', required: false, description: 'Filter by department ID' })
  @ApiQuery({ name: 'uploadedBy', required: false, description: 'Filter by uploader ID' })
  @ApiQuery({ name: 'isActive', required: false, description: 'Filter by active status' })
  @ApiQuery({ name: 'tags', required: false, description: 'Filter by tags (comma-separated)' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (1-based)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Sort field' })
  @ApiQuery({ name: 'sortOrder', required: false, description: 'Sort order (asc/desc)' })
  async findAll(
    @Query(new ValidationPipe({ transform: true, whitelist: true })) 
    query: SheetQueryDto,
  ): Promise<{
    data: SheetResponseDto[];
    pagination: PaginatedResult<SheetDocument>['pagination'];
  }> {
    this.logger.log('Fetching sheets with query', JSON.stringify(query));
    
    const result = await this.sheetsService.findAll(query);
    
    return {
      data: result.data.map(sheet => this.transformToResponseDto(sheet)),
      pagination: result.pagination,
    };
  }

  @Get('statistics')
  @ApiOperation({ 
    summary: 'Get sheet statistics',
    description: 'Retrieves statistical information about sheets.',
  })
  @ApiOkResponse({
    description: 'Statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalSheets: { type: 'number' },
        activeSheets: { type: 'number' },
        pendingSheets: { type: 'number' },
        validatedSheets: { type: 'number' },
        rejectedSheets: { type: 'number' },
        totalFileSize: { type: 'number' },
        avgFileSize: { type: 'number' },
        departmentStats: { type: 'array' },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @Roles(UserRole.ADMIN)
  async getStatistics(): Promise<Record<string, unknown>> {
    this.logger.log('Fetching sheet statistics');
    return this.sheetsService.getStatistics();
  }

  @Get('reference/:reference')
  @ApiOperation({ 
    summary: 'Get sheet by reference',
    description: 'Retrieves a specific sheet by its reference number.',
  })
  @ApiParam({ name: 'reference', description: 'Sheet reference number' })
  @ApiOkResponse({
    description: 'Sheet retrieved successfully',
    type: SheetResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid reference format' })
  @ApiNotFoundResponse({ description: 'Sheet not found' })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  async findByReference(@Param('reference') reference: string): Promise<SheetResponseDto> {
    this.logger.log(`Fetching sheet by reference: ${reference}`);
    
    const sheet = await this.sheetsService.findByReference(reference);
    return this.transformToResponseDto(sheet);
  }

  @Get('department/:departmentId')
  @ApiOperation({ 
    summary: 'Get sheets by department',
    description: 'Retrieves all sheets belonging to a specific department.',
  })
  @ApiParam({ name: 'departmentId', description: 'Department ID' })
  @ApiOkResponse({
    description: 'Sheets retrieved successfully',
    type: SheetResponseDto,
    isArray: true,
  })
  @ApiBadRequestResponse({ description: 'Invalid department ID format' })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  async findByDepartment(
    @Param('departmentId') departmentId: string,
  ): Promise<SheetResponseDto[]> {
    this.logger.log(`Finding sheets for department: ${departmentId}`);
    
    const sheets = await this.sheetsService.findByDepartment(departmentId);
    return sheets.map(sheet => this.transformToResponseDto(sheet));
  }

  @Get('my-sheets')
  @ApiOperation({ 
    summary: 'Get current user\'s sheets',
    description: 'Retrieves all sheets uploaded by the current user.',
  })
  @ApiOkResponse({
    description: 'Sheets retrieved successfully',
    type: SheetResponseDto,
    isArray: true,
  })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  async findMySheets(
    @CurrentUser('userId') userId: string,
  ): Promise<SheetResponseDto[]> {
    this.logger.log(`Finding sheets uploaded by user: ${userId}`);
    
    const sheets = await this.sheetsService.findByUploader(userId);
    return sheets.map(sheet => this.transformToResponseDto(sheet));
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Get sheet by ID',
    description: 'Retrieves a specific sheet by its ID with populated references.',
  })
  @ApiParam({ name: 'id', description: 'Sheet ID' })
  @ApiOkResponse({
    description: 'Sheet retrieved successfully',
    type: SheetResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid sheet ID format' })
  @ApiNotFoundResponse({ description: 'Sheet not found' })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  async findOne(@Param('id') id: string): Promise<SheetResponseDto> {
    this.logger.log(`Fetching sheet: ${id}`);
    
    const sheet = await this.sheetsService.findOne(id);
    return this.transformToResponseDto(sheet);
  }

  @Put(':id')
  @ApiOperation({ 
    summary: 'Update sheet',
    description: 'Updates an existing sheet metadata or status.',
  })
  @ApiParam({ name: 'id', description: 'Sheet ID' })
  @ApiOkResponse({
    description: 'Sheet updated successfully',
    type: SheetResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid input data or sheet ID format' })
  @ApiNotFoundResponse({ description: 'Sheet not found' })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  @Roles(UserRole.PREPARATEUR, UserRole.IPDF, UserRole.IQP, UserRole.ADMIN)
  async update(
    @Param('id') id: string,
    @Body(new ValidationPipe({ transform: true, whitelist: true })) 
    updateSheetDto: UpdateSheetDto,
    @CurrentUser('userId') userId: string,
  ): Promise<SheetResponseDto> {
    this.logger.log(`Updating sheet: ${id}`);
    
    const sheet = await this.sheetsService.update(id, updateSheetDto, new Types.ObjectId(userId));
    return this.transformToResponseDto(sheet);
  }

  @Patch(':id/validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Validate or reject a sheet',
    description: 'Validates or rejects a sheet. Only IPDF, IQP, and Admin roles can validate sheets.',
  })
  @ApiParam({ name: 'id', description: 'Sheet ID' })
  @ApiOkResponse({
    description: 'Sheet validation updated successfully',
    type: SheetResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid sheet ID format or validation data' })
  @ApiNotFoundResponse({ description: 'Sheet not found' })
  @ApiConflictResponse({ description: 'Sheet has already been validated' })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiForbiddenResponse({ description: 'IPDF, IQP, or Admin access required' })
  @Roles(UserRole.IPDF, UserRole.IQP, UserRole.ADMIN)
  async validateSheet(
    @Param('id') id: string,
    @Body(new ValidationPipe({ transform: true, whitelist: true })) 
    body: { 
      status: SheetStatus.APPROVED | SheetStatus.REJECTED; 
      comments?: string; 
    },
    @CurrentUser('userId') userId: string,
  ): Promise<SheetResponseDto> {
    this.logger.log(`Validating sheet: ${id} with status: ${body.status}`);
    
    const sheet = await this.sheetsService.validateSheet(
      id, 
      body.status, 
      body.comments, 
      new Types.ObjectId(userId)
    );
    
    return this.transformToResponseDto(sheet);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Deactivate sheet',
    description: 'Deactivates a sheet (soft delete). Only the uploader or Admin can deactivate sheets.',
  })
  @ApiParam({ name: 'id', description: 'Sheet ID' })
  @ApiOkResponse({
    description: 'Sheet deactivated successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid sheet ID format' })
  @ApiNotFoundResponse({ description: 'Sheet not found' })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  @Roles(UserRole.PREPARATEUR, UserRole.ADMIN)
  async remove(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
  ): Promise<{ message: string }> {
    this.logger.log(`Deactivating sheet: ${id}`);
    
    return this.sheetsService.remove(id, new Types.ObjectId(userId));
  }

  // 🧪 TEST ROUTE - Auth Flow Validation
  @Get('test/me')
  @ApiOperation({ 
    summary: 'Test authentication',
    description: 'Test route to verify JWT authentication flow works correctly.',
  })
  @ApiOkResponse({
    description: 'Authentication successful',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        user: { type: 'object' },
        timestamp: { type: 'string' },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @UseGuards(JwtAuthGuard)
  async testAuth(@CurrentUser() user: any): Promise<{ message: string; user: any; timestamp: string }> {
    this.logger.log('🧪 Test route called - Auth working!', JSON.stringify(user));
    
    return {
      message: 'Authentication successful! JWT strategy is working.',
      user,
      timestamp: new Date().toISOString(),
    };
  }

  private transformToResponseDto(sheet: SheetDocument): SheetResponseDto {
    return {
      id: sheet._id.toString(),
      title: sheet.title,
      reference: sheet.reference,
      description: sheet.description,
      status: sheet.status,
      uploadedBy: sheet.uploadedBy?.toString(),
      department: sheet.department?.toString(),
      originalFileName: sheet.originalFileName,
      mimeType: sheet.mimeType,
      fileSize: sheet.fileSize,
      checksum: sheet.checksum,
      tags: sheet.tags || [],
      version: sheet.version,
      isActive: sheet.isActive,
      isValidated: sheet.isValidated,
      isPending: sheet.isPending,
      isRejected: sheet.isRejected,
      createdAt: sheet.createdAt,
      updatedAt: sheet.updatedAt,
      validatedAt: sheet.validatedAt,
      validatedBy: sheet.validatedBy?.toString(),
      validationComments: sheet.validationComments,
      lastModifiedAt: sheet.lastModifiedAt,
      lastModifiedBy: sheet.lastModifiedBy?.toString(),
    };
  }
}
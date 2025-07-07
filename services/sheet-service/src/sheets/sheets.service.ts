// services/sheet-service/src/sheets/sheets.service.ts

import { 
  Injectable, 
  NotFoundException, 
  ConflictException, 
  BadRequestException,
  Logger 
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SheetStatus } from '@instruction-sheet/shared';
import { Sheet, SheetDocument } from '../database/schemas/sheet.schema';
import { CreateSheetDto } from './dto/create-sheet.dto';
import { UpdateSheetDto } from './dto/update-sheet.dto';
import { SheetQueryDto } from './dto/sheet-query.dto';

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
export class SheetsService {
  private readonly logger = new Logger(SheetsService.name);

  constructor(
    @InjectModel(Sheet.name) 
    private readonly sheetModel: Model<SheetDocument>,
  ) {}

  async create(
    createSheetDto: CreateSheetDto,
    uploadedBy: Types.ObjectId,
  ): Promise<SheetDocument> {
    this.logger.log(`Creating new sheet: ${createSheetDto.title}`);

    try {
      // Check if sheet with the same reference already exists
      const existingSheet = await this.sheetModel.findOne({
        reference: createSheetDto.reference,
      });

      if (existingSheet) {
        throw new ConflictException('Sheet with this reference already exists');
      }

      // Create the sheet
      const sheet = new this.sheetModel({
        ...createSheetDto,
        uploadedBy,
        status: SheetStatus.DRAFT,
        lastModifiedAt: new Date(),
        lastModifiedBy: uploadedBy,
      });

      const savedSheet = await sheet.save();
      this.logger.log(`Sheet created successfully: ${savedSheet._id}`);
      
      return savedSheet;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(`Failed to create sheet: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to create sheet');
    }
  }

  async findAll(query: SheetQueryDto): Promise<PaginatedResult<SheetDocument>> {
    this.logger.log('Fetching sheets with pagination');

    try {
      const {
        search,
        status,
        department,
        uploadedBy,
        isActive,
        tags,
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = query;

      // Build filter object
      const filter: Record<string, unknown> = {};

      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: 'i' } },
          { reference: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ];
      }

      if (status) {
        filter.status = status;
      }

      if (department) {
        filter.department = department;
      }

      if (uploadedBy) {
        filter.uploadedBy = uploadedBy;
      }

      if (typeof isActive === 'boolean') {
        filter.isActive = isActive;
      }

      if (tags && tags.length > 0) {
        filter.tags = { $in: tags };
      }

      // Build sort object
      const sort: Record<string, 1 | -1> = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Execute queries
      const [data, total] = await Promise.all([
        this.sheetModel
          .find(filter)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .exec(),
        this.sheetModel.countDocuments(filter),
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
      this.logger.error(`Failed to fetch sheets: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to fetch sheets');
    }
  }

  async findOne(id: string, populate = true): Promise<SheetDocument> {
    this.logger.log(`Fetching sheet: ${id}`);

    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid sheet ID format');
    }

    try {
      let query = this.sheetModel.findById(id);
      
      // Note: Populate disabled - User and Department schemas not available in this service
      // if (populate) {
      //   query = query
      //     .populate('uploadedBy', 'firstName lastName email role')
      //     .populate('department', 'name description manager')
      //     .populate('validatedBy', 'firstName lastName email role');
      // }

      const sheet = await query.exec();

      if (!sheet) {
        throw new NotFoundException(`Sheet with ID ${id} not found`);
      }

      return sheet;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to fetch sheet ${id}: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to fetch sheet');
    }
  }

  async findByReference(reference: string): Promise<SheetDocument> {
    this.logger.log(`Fetching sheet by reference: ${reference}`);

    try {
      const sheet = await this.sheetModel
        .findOne({ reference: reference.toUpperCase() })
        .exec();

      if (!sheet) {
        throw new NotFoundException(`Sheet with reference ${reference} not found`);
      }

      return sheet;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to fetch sheet by reference ${reference}: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to fetch sheet by reference');
    }
  }

  async update(
    id: string,
    updateSheetDto: UpdateSheetDto,
    userId?: Types.ObjectId,
  ): Promise<SheetDocument> {
    this.logger.log(`Updating sheet: ${id}`);

    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid sheet ID format');
    }

    try {
      // Check if sheet exists
      const existingSheet = await this.sheetModel.findById(id);
      if (!existingSheet) {
        throw new NotFoundException(`Sheet with ID ${id} not found`);
      }

      // Prepare update data
      const updateData: Record<string, unknown> = {
        ...updateSheetDto,
        lastModifiedAt: new Date(),
        lastModifiedBy: userId,
      };

      // If status is being updated to APPROVED or REJECTED, add validation info
      if (updateSheetDto.status && updateSheetDto.status !== SheetStatus.DRAFT) {
        updateData.validatedAt = new Date();
        updateData.validatedBy = userId;
      }

      // Update the sheet
      const updatedSheet = await this.sheetModel.findByIdAndUpdate(
        id,
        updateData,
        { 
          new: true, 
          runValidators: true,
        },
      )
      .exec();

      this.logger.log(`Sheet updated successfully: ${id}`);
      return updatedSheet;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to update sheet ${id}: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to update sheet');
    }
  }

  async remove(id: string, userId?: Types.ObjectId): Promise<{ message: string }> {
    this.logger.log(`Deactivating sheet: ${id}`);

    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid sheet ID format');
    }

    try {
      const sheet = await this.sheetModel.findById(id);
      if (!sheet) {
        throw new NotFoundException(`Sheet with ID ${id} not found`);
      }

      // Soft delete by setting isActive to false
      await this.sheetModel.findByIdAndUpdate(
        id,
        {
          isActive: false,
          lastModifiedAt: new Date(),
          lastModifiedBy: userId,
        },
        { new: true },
      );

      this.logger.log(`Sheet deactivated successfully: ${id}`);
      return { message: 'Sheet deactivated successfully' };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to deactivate sheet ${id}: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to deactivate sheet');
    }
  }

  async validateSheet(
    id: string,
    status: SheetStatus.APPROVED | SheetStatus.REJECTED,
    comments?: string,
    validatorId?: Types.ObjectId,
  ): Promise<SheetDocument> {
    this.logger.log(`Validating sheet: ${id} with status: ${status}`);

    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid sheet ID format');
    }

    try {
      const sheet = await this.sheetModel.findById(id);
      if (!sheet) {
        throw new NotFoundException(`Sheet with ID ${id} not found`);
      }

      if (sheet.status !== SheetStatus.DRAFT && sheet.status !== SheetStatus.PENDING_IPDF && sheet.status !== SheetStatus.PENDING_IQP) {
        throw new ConflictException('Sheet has already been validated');
      }

      const updatedSheet = await this.sheetModel.findByIdAndUpdate(
        id,
        {
          status,
          validatedAt: new Date(),
          validatedBy: validatorId,
          validationComments: comments,
          lastModifiedAt: new Date(),
          lastModifiedBy: validatorId,
        },
        { new: true },
      )
      .exec();

      this.logger.log(`Sheet validation completed: ${id}`);
      return updatedSheet;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to validate sheet ${id}: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to validate sheet');
    }
  }

  async findByDepartment(departmentId: string): Promise<SheetDocument[]> {
    this.logger.log(`Finding sheets for department: ${departmentId}`);

    if (!Types.ObjectId.isValid(departmentId)) {
      throw new BadRequestException('Invalid department ID format');
    }

    try {
      const sheets = await this.sheetModel
        .find({ department: departmentId, isActive: true })
        .sort({ createdAt: -1 })
        .exec();

      return sheets;
    } catch (error) {
      this.logger.error(`Failed to find sheets by department: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to find sheets by department');
    }
  }

  async findByUploader(uploaderId: string): Promise<SheetDocument[]> {
    this.logger.log(`Finding sheets uploaded by user: ${uploaderId}`);

    if (!Types.ObjectId.isValid(uploaderId)) {
      throw new BadRequestException('Invalid uploader ID format');
    }

    try {
      const sheets = await this.sheetModel
        .find({ uploadedBy: uploaderId, isActive: true })
        .sort({ createdAt: -1 })
        .exec();

      return sheets;
    } catch (error) {
      this.logger.error(`Failed to find sheets by uploader: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to find sheets by uploader');
    }
  }

  async getStatistics(): Promise<Record<string, unknown>> {
    this.logger.log('Generating sheet statistics');

    try {
      const stats = await this.sheetModel.aggregate([
        {
          $group: {
            _id: null,
            totalSheets: { $sum: 1 },
            activeSheets: {
              $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] },
            },
            pendingSheets: {
              $sum: { 
                $cond: [
                  { 
                    $in: ['$status', [SheetStatus.DRAFT, SheetStatus.PENDING_IPDF, SheetStatus.PENDING_IQP]] 
                  }, 
                  1, 
                  0 
                ] 
              },
            },
            validatedSheets: {
              $sum: { $cond: [{ $eq: ['$status', SheetStatus.APPROVED] }, 1, 0] },
            },
            rejectedSheets: {
              $sum: { $cond: [{ $eq: ['$status', SheetStatus.REJECTED] }, 1, 0] },
            },
            totalFileSize: { $sum: '$fileSize' },
            avgFileSize: { $avg: '$fileSize' },
            maxFileSize: { $max: '$fileSize' },
            minFileSize: { $min: '$fileSize' },
          },
        },
      ]);

      // Get statistics by department
      const departmentStats = await this.sheetModel.aggregate([
        {
          $group: {
            _id: '$department',
            count: { $sum: 1 },
            pendingCount: {
              $sum: { 
                $cond: [
                  { 
                    $in: ['$status', [SheetStatus.DRAFT, SheetStatus.PENDING_IPDF, SheetStatus.PENDING_IQP]] 
                  }, 
                  1, 
                  0 
                ] 
              },
            },
            validatedCount: {
              $sum: { $cond: [{ $eq: ['$status', SheetStatus.APPROVED] }, 1, 0] },
            },
            rejectedCount: {
              $sum: { $cond: [{ $eq: ['$status', SheetStatus.REJECTED] }, 1, 0] },
            },
          },
        },
      ]);

      return {
        ...(stats[0] || {}),
        departmentStats,
      };
    } catch (error) {
      this.logger.error(`Failed to generate statistics: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to generate statistics');
    }
  }
}
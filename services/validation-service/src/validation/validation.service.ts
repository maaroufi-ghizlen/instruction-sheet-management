// services/validation-service/src/validation/validation.service.ts

import { 
  Injectable, 
  NotFoundException, 
  ConflictException, 
  BadRequestException,
  ForbiddenException,
  Logger 
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { 
  ValidationWorkflow, 
  ValidationWorkflowDocument, 
  ValidationStatus, 
  ValidationStage 
} from '../database/schemas/validation-workflow.schema';
import { CreateValidationDto } from './dto/create-validation.dto';
import { UpdateValidationDto } from './dto/update-validation.dto';
import { ValidationQueryDto } from './dto/validation-query.dto';
import { ValidationReviewDto, ReviewAction } from './dto/validation-review.dto';

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
export class ValidationService {
  private readonly logger = new Logger(ValidationService.name);

  constructor(
    @InjectModel(ValidationWorkflow.name) 
    private readonly validationModel: Model<ValidationWorkflowDocument>,
  ) {}

  async create(
    createValidationDto: CreateValidationDto,
    createdBy: Types.ObjectId,
  ): Promise<ValidationWorkflowDocument> {
    this.logger.log(`Creating validation workflow for sheet: ${createValidationDto.sheetId}`);

    try {
      // Check if validation for this sheet+stage already exists
      const existingValidation = await this.validationModel.findOne({
        sheetId: createValidationDto.sheetId,
        stage: createValidationDto.stage,
        isActive: true,
      });

      if (existingValidation) {
        throw new ConflictException(`Validation workflow for this sheet and stage already exists`);
      }

      // Create the validation workflow
      const validation = new this.validationModel({
        ...createValidationDto,
        status: ValidationStatus.PENDING,
        assignedAt: createValidationDto.assignedTo ? new Date() : undefined,
        lastModifiedAt: new Date(),
        lastModifiedBy: createdBy,
      });

      const savedValidation = await validation.save();
      this.logger.log(`Validation workflow created successfully: ${savedValidation._id}`);
      
      return savedValidation;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(`Failed to create validation workflow: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to create validation workflow');
    }
  }

  async findAll(query: ValidationQueryDto): Promise<PaginatedResult<ValidationWorkflowDocument>> {
    this.logger.log('Fetching validation workflows with pagination');

    try {
      const {
        sheetId,
        status,
        stage,
        validatedBy,
        assignedTo,
        isActive,
        search,
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = query;

      // Build filter object
      const filter: Record<string, unknown> = {};

      if (sheetId) {
        filter.sheetId = sheetId;
      }

      if (status) {
        filter.status = status;
      }

      if (stage) {
        filter.stage = stage;
      }

      if (validatedBy) {
        filter.validatedBy = validatedBy;
      }

      if (assignedTo) {
        filter.assignedTo = assignedTo;
      }

      if (typeof isActive === 'boolean') {
        filter.isActive = isActive;
      }

      if (search) {
        filter.notes = { $regex: search, $options: 'i' };
      }

      // Build sort object
      const sort: Record<string, 1 | -1> = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Execute queries
      const [data, total] = await Promise.all([
        this.validationModel
          .find(filter)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .populate('sheetId', 'title reference status')
          .populate('validatedBy', 'firstName lastName email role')
          .populate('assignedTo', 'firstName lastName email role')
          .exec(),
        this.validationModel.countDocuments(filter),
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
      this.logger.error(`Failed to fetch validation workflows: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to fetch validation workflows');
    }
  }

  async findOne(id: string, populate = true): Promise<ValidationWorkflowDocument> {
    this.logger.log(`Fetching validation workflow: ${id}`);

    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid validation workflow ID format');
    }

    try {
      let query = this.validationModel.findById(id);
      
      if (populate) {
        query = query
          .populate('sheetId', 'title reference status department uploadedBy')
          .populate('validatedBy', 'firstName lastName email role')
          .populate('assignedTo', 'firstName lastName email role');
      }

      const validation = await query.exec();

      if (!validation) {
        throw new NotFoundException(`Validation workflow with ID ${id} not found`);
      }

      return validation;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to fetch validation workflow ${id}: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to fetch validation workflow');
    }
  }

  async findBySheetId(sheetId: string): Promise<ValidationWorkflowDocument[]> {
    this.logger.log(`Fetching validation workflows for sheet: ${sheetId}`);

    if (!Types.ObjectId.isValid(sheetId)) {
      throw new BadRequestException('Invalid sheet ID format');
    }

    try {
      const validations = await this.validationModel
        .find({ sheetId, isActive: true })
        .populate('validatedBy', 'firstName lastName email role')
        .populate('assignedTo', 'firstName lastName email role')
        .sort({ stage: 1, createdAt: -1 })
        .exec();

      return validations;
    } catch (error) {
      this.logger.error(`Failed to fetch validations for sheet ${sheetId}: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to fetch validations for sheet');
    }
  }

  async update(
    id: string,
    updateValidationDto: UpdateValidationDto,
    userId?: Types.ObjectId,
  ): Promise<ValidationWorkflowDocument> {
    this.logger.log(`Updating validation workflow: ${id}`);

    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid validation workflow ID format');
    }

    try {
      // Check if validation exists
      const existingValidation = await this.validationModel.findById(id);
      if (!existingValidation) {
        throw new NotFoundException(`Validation workflow with ID ${id} not found`);
      }

      // Prepare update data
      const updateData: Record<string, unknown> = {
        ...updateValidationDto,
        lastModifiedAt: new Date(),
        lastModifiedBy: userId,
      };

      // If assigning to a new user, update assignedAt
      if (updateValidationDto.assignedTo && 
          updateValidationDto.assignedTo.toString() !== existingValidation.assignedTo?.toString()) {
        updateData.assignedAt = new Date();
      }

      // Update the validation
      const updatedValidation = await this.validationModel.findByIdAndUpdate(
        id,
        updateData,
        { 
          new: true, 
          runValidators: true,
        },
      )
      .populate('sheetId', 'title reference status')
      .populate('validatedBy', 'firstName lastName email role')
      .populate('assignedTo', 'firstName lastName email role')
      .exec();

      this.logger.log(`Validation workflow updated successfully: ${id}`);
      return updatedValidation;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to update validation workflow ${id}: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to update validation workflow');
    }
  }

  async review(
    sheetId: string,
    reviewDto: ValidationReviewDto,
    reviewerId: Types.ObjectId,
    userRole: string,
  ): Promise<ValidationWorkflowDocument> {
    this.logger.log(`Processing review for sheet: ${sheetId} by user: ${reviewerId}`);

    if (!Types.ObjectId.isValid(sheetId)) {
      throw new BadRequestException('Invalid sheet ID format');
    }

    try {
      // Determine the stage based on user role
      let stage: ValidationStage;
      if (userRole === 'IPDF') {
        stage = ValidationStage.IPDF;
      } else if (userRole === 'IQP') {
        stage = ValidationStage.IQP;
      } else {
        throw new ForbiddenException('Only IPDF and IQP roles can review sheets');
      }

      // Find the validation workflow for this sheet and stage
      const validation = await this.validationModel.findOne({
        sheetId,
        stage,
        isActive: true,
      });

      if (!validation) {
        throw new NotFoundException(`No active validation workflow found for sheet ${sheetId} at ${stage} stage`);
      }

      // Check if validation is in a reviewable state
      if (validation.status !== ValidationStatus.PENDING && validation.status !== ValidationStatus.IN_REVIEW) {
        throw new ConflictException('Validation workflow is not in a reviewable state');
      }

      // Determine the new status based on action
      const newStatus = reviewDto.action === ReviewAction.APPROVE 
        ? ValidationStatus.VALIDATED 
        : ValidationStatus.REJECTED;

      // Update the validation
      const updatedValidation = await this.validationModel.findByIdAndUpdate(
        validation._id,
        {
          status: newStatus,
          validatedBy: reviewerId,
          validatedAt: new Date(),
          notes: reviewDto.notes,
          lastModifiedAt: new Date(),
          lastModifiedBy: reviewerId,
        },
        { new: true },
      )
      .populate('sheetId', 'title reference status')
      .populate('validatedBy', 'firstName lastName email role')
      .populate('assignedTo', 'firstName lastName email role')
      .exec();

      this.logger.log(`Review completed for sheet: ${sheetId}, action: ${reviewDto.action}`);
      return updatedValidation;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException || 
          error instanceof ForbiddenException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to process review for sheet ${sheetId}: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to process review');
    }
  }

  async finalize(
    sheetId: string,
    reviewDto: ValidationReviewDto,
    reviewerId: Types.ObjectId,
    userRole: string,
  ): Promise<ValidationWorkflowDocument> {
    this.logger.log(`Processing final review for sheet: ${sheetId} by user: ${reviewerId}`);

    // Only IQP can finalize
    if (userRole !== 'IQP') {
      throw new ForbiddenException('Only IQP role can finalize sheet validation');
    }

    // Check if IPDF validation is completed
    const ipdfValidation = await this.validationModel.findOne({
      sheetId,
      stage: ValidationStage.IPDF,
      status: ValidationStatus.VALIDATED,
      isActive: true,
    });

    if (!ipdfValidation) {
      throw new BadRequestException('IPDF validation must be completed before IQP finalization');
    }

    // Process IQP review
    return this.review(sheetId, reviewDto, reviewerId, userRole);
  }

  async remove(id: string, userId?: Types.ObjectId): Promise<{ message: string }> {
    this.logger.log(`Deactivating validation workflow: ${id}`);

    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid validation workflow ID format');
    }

    try {
      const validation = await this.validationModel.findById(id);
      if (!validation) {
        throw new NotFoundException(`Validation workflow with ID ${id} not found`);
      }

      // Soft delete by setting isActive to false
      await this.validationModel.findByIdAndUpdate(
        id,
        {
          isActive: false,
          lastModifiedAt: new Date(),
          lastModifiedBy: userId,
        },
        { new: true },
      );

      this.logger.log(`Validation workflow deactivated successfully: ${id}`);
      return { message: 'Validation workflow deactivated successfully' };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to deactivate validation workflow ${id}: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to deactivate validation workflow');
    }
  }

  async findByAssignee(assigneeId: string): Promise<ValidationWorkflowDocument[]> {
    this.logger.log(`Finding validation workflows assigned to user: ${assigneeId}`);

    if (!Types.ObjectId.isValid(assigneeId)) {
      throw new BadRequestException('Invalid assignee ID format');
    }

    try {
      const validations = await this.validationModel
        .find({ 
          assignedTo: assigneeId, 
          isActive: true,
          status: { $in: [ValidationStatus.PENDING, ValidationStatus.IN_REVIEW] }
        })
        .populate('sheetId', 'title reference status department')
        .sort({ dueDate: 1, createdAt: -1 })
        .exec();

      return validations;
    } catch (error) {
      this.logger.error(`Failed to find validations by assignee: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to find validations by assignee');
    }
  }

  async getStatistics(): Promise<Record<string, unknown>> {
    this.logger.log('Generating validation statistics');

    try {
      const stats = await this.validationModel.aggregate([
        {
          $group: {
            _id: null,
            totalValidations: { $sum: 1 },
            activeValidations: {
              $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] },
            },
            pendingValidations: {
              $sum: { $cond: [{ $eq: ['$status', ValidationStatus.PENDING] }, 1, 0] },
            },
            inReviewValidations: {
              $sum: { $cond: [{ $eq: ['$status', ValidationStatus.IN_REVIEW] }, 1, 0] },
            },
            validatedValidations: {
              $sum: { $cond: [{ $eq: ['$status', ValidationStatus.VALIDATED] }, 1, 0] },
            },
            rejectedValidations: {
              $sum: { $cond: [{ $eq: ['$status', ValidationStatus.REJECTED] }, 1, 0] },
            },
            ipdfValidations: {
              $sum: { $cond: [{ $eq: ['$stage', ValidationStage.IPDF] }, 1, 0] },
            },
            iqpValidations: {
              $sum: { $cond: [{ $eq: ['$stage', ValidationStage.IQP] }, 1, 0] },
            },
            avgRetryCount: { $avg: '$retryCount' },
          },
        },
      ]);

      // Get statistics by stage
      const stageStats = await this.validationModel.aggregate([
        {
          $group: {
            _id: '$stage',
            count: { $sum: 1 },
            pendingCount: {
              $sum: { $cond: [{ $eq: ['$status', ValidationStatus.PENDING] }, 1, 0] },
            },
            validatedCount: {
              $sum: { $cond: [{ $eq: ['$status', ValidationStatus.VALIDATED] }, 1, 0] },
            },
            rejectedCount: {
              $sum: { $cond: [{ $eq: ['$status', ValidationStatus.REJECTED] }, 1, 0] },
            },
          },
        },
      ]);

      return {
        ...(stats[0] || {}),
        stageStats,
      };
    } catch (error) {
      this.logger.error(`Failed to generate statistics: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to generate statistics');
    }
  }
}
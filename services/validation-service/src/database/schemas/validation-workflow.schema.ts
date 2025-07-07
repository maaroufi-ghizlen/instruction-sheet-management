// services/validation-service/src/database/schemas/validation-workflow.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// Validation status enum
export enum ValidationStatus {
  PENDING = 'PENDING',
  IN_REVIEW = 'IN_REVIEW',
  VALIDATED = 'VALIDATED',
  REJECTED = 'REJECTED',
}

// Validation stage enum
export enum ValidationStage {
  IPDF = 'IPDF',
  IQP = 'IQP',
}

// Define ValidationWorkflowDocument interface with proper method signatures
export interface ValidationWorkflowDocument extends ValidationWorkflow, Document {
  _id: Types.ObjectId;
  readonly isPending: boolean;
  readonly isInReview: boolean;
  readonly isValidated: boolean;
  readonly isRejected: boolean;
  readonly isIPDFStage: boolean;
  readonly isIQPStage: boolean;
  createdAt: Date;
  updatedAt: Date;
  toJSON(): Record<string, unknown>;
}

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc: Document, ret: Record<string, unknown>) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class ValidationWorkflow {
  @Prop({
    type: Types.ObjectId,
    ref: 'Sheet',
    required: true,
  })
  sheetId: Types.ObjectId;

  @Prop({
    type: String,
    enum: ValidationStatus,
    required: true,
    default: ValidationStatus.PENDING,
  })
  status: ValidationStatus;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: false,
  })
  validatedBy: Types.ObjectId;

  @Prop({
    type: String,
    enum: ValidationStage,
    required: true,
  })
  stage: ValidationStage;

  @Prop({
    required: false,
    trim: true,
    maxlength: 1000,
  })
  notes: string;

  @Prop({
    type: Date,
    required: false,
  })
  validatedAt: Date;

  // Additional metadata fields
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: false,
  })
  assignedTo: Types.ObjectId;

  @Prop({
    type: Date,
    required: false,
  })
  assignedAt: Date;

  @Prop({
    type: Date,
    required: false,
  })
  dueDate: Date;

  @Prop({
    default: 0,
  })
  retryCount: number;

  @Prop({
    default: true,
  })
  isActive: boolean;

  @Prop({ type: Date })
  lastModifiedAt: Date;

  @Prop({ type: Types.ObjectId })
  lastModifiedBy: Types.ObjectId;

  // Virtual for checking if validation is pending
  get isPending(): boolean {
    return this.status === ValidationStatus.PENDING;
  }

  // Virtual for checking if validation is in review
  get isInReview(): boolean {
    return this.status === ValidationStatus.IN_REVIEW;
  }

  // Virtual for checking if validation is completed (validated)
  get isValidated(): boolean {
    return this.status === ValidationStatus.VALIDATED;
  }

  // Virtual for checking if validation is rejected
  get isRejected(): boolean {
    return this.status === ValidationStatus.REJECTED;
  }

  // Virtual for checking if this is IPDF stage
  get isIPDFStage(): boolean {
    return this.stage === ValidationStage.IPDF;
  }

  // Virtual for checking if this is IQP stage
  get isIQPStage(): boolean {
    return this.stage === ValidationStage.IQP;
  }
}

export const ValidationWorkflowSchema = SchemaFactory.createForClass(ValidationWorkflow);

// Add indexes for performance
ValidationWorkflowSchema.index({ sheetId: 1 });
ValidationWorkflowSchema.index({ status: 1 });
ValidationWorkflowSchema.index({ stage: 1 });
ValidationWorkflowSchema.index({ validatedBy: 1 });
ValidationWorkflowSchema.index({ assignedTo: 1 });
ValidationWorkflowSchema.index({ createdAt: -1 });
ValidationWorkflowSchema.index({ updatedAt: -1 });
ValidationWorkflowSchema.index({ validatedAt: -1 });
ValidationWorkflowSchema.index({ isActive: 1 });

// Add compound indexes for common queries
ValidationWorkflowSchema.index({ sheetId: 1, stage: 1 });
ValidationWorkflowSchema.index({ status: 1, stage: 1 });
ValidationWorkflowSchema.index({ assignedTo: 1, status: 1 });
ValidationWorkflowSchema.index({ isActive: 1, status: 1 });
ValidationWorkflowSchema.index({ sheetId: 1, isActive: 1 });

// Add unique compound index to prevent duplicate validations for same sheet+stage
ValidationWorkflowSchema.index({ sheetId: 1, stage: 1, isActive: 1 }, { unique: true });

// Add virtuals
ValidationWorkflowSchema.virtual('isPending').get(function() {
  return this.status === ValidationStatus.PENDING;
});

ValidationWorkflowSchema.virtual('isInReview').get(function() {
  return this.status === ValidationStatus.IN_REVIEW;
});

ValidationWorkflowSchema.virtual('isValidated').get(function() {
  return this.status === ValidationStatus.VALIDATED;
});

ValidationWorkflowSchema.virtual('isRejected').get(function() {
  return this.status === ValidationStatus.REJECTED;
});

ValidationWorkflowSchema.virtual('isIPDFStage').get(function() {
  return this.stage === ValidationStage.IPDF;
});

ValidationWorkflowSchema.virtual('isIQPStage').get(function() {
  return this.stage === ValidationStage.IQP;
});

// Add population virtuals for references
ValidationWorkflowSchema.virtual('sheetDetails', {
  ref: 'Sheet',
  localField: 'sheetId',
  foreignField: '_id',
  justOne: true,
});

ValidationWorkflowSchema.virtual('validatorDetails', {
  ref: 'User',
  localField: 'validatedBy',
  foreignField: '_id',
  justOne: true,
});

ValidationWorkflowSchema.virtual('assigneeDetails', {
  ref: 'User',
  localField: 'assignedTo',
  foreignField: '_id',
  justOne: true,
});

// Ensure virtual fields are serialized
ValidationWorkflowSchema.set('toJSON', { virtuals: true });
ValidationWorkflowSchema.set('toObject', { virtuals: true });
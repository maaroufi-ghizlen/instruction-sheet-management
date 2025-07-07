// services/sheet-service/src/database/schemas/sheet.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { SheetStatus } from '@instruction-sheet/shared';

// Define SheetDocument interface with proper method signatures
export interface SheetDocument extends Sheet, Document {
  _id: Types.ObjectId;
  readonly isValidated: boolean;
  readonly isPending: boolean;
  readonly isRejected: boolean;
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
      // Don't expose filePath directly in JSON response for security
      delete ret.filePath;
      return ret;
    },
  },
})
export class Sheet {
  @Prop({
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 200,
  })
  title: string;

  @Prop({
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
    minlength: 3,
    maxlength: 50,
  })
  reference: string;

  @Prop({
    required: true,
    trim: true,
    maxlength: 1000,
  })
  description: string;

  @Prop({
    required: true,
    select: false, // Don't include in default queries for security
  })
  filePath: string;

  @Prop({
    required: true,
    select: false, // Don't include in default queries for security
  })
  encryptionIv: string;

  @Prop({
    type: String,
    enum: SheetStatus,
    required: true,
    default: SheetStatus.DRAFT,
  })
  status: SheetStatus;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  uploadedBy: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Department',
    required: true,
  })
  department: Types.ObjectId;

  // Additional fields for file metadata
  @Prop({
    required: true,
  })
  originalFileName: string;

  @Prop({
    required: true,
    default: 'application/pdf',
  })
  mimeType: string;

  @Prop({
    required: true,
    min: 0,
  })
  fileSize: number;

  @Prop({
    required: false,
  })
  checksum: string;

  @Prop({
    type: [String],
    default: [],
  })
  tags: string[];

  @Prop({
    default: 1,
    min: 1,
  })
  version: number;

  @Prop({ 
    default: true 
  })
  isActive: boolean;

  @Prop({ type: Date })
  lastModifiedAt: Date;

  @Prop({ type: Types.ObjectId })
  lastModifiedBy: Types.ObjectId;

  @Prop({ type: Date })
  validatedAt: Date;

  @Prop({ type: Types.ObjectId })
  validatedBy: Types.ObjectId;

  @Prop({
    trim: true,
    maxlength: 500,
  })
  validationComments: string;

  // Virtual for checking if sheet is validated
  get isValidated(): boolean {
    return this.status === SheetStatus.APPROVED;
  }

  // Virtual for checking if sheet is pending
  get isPending(): boolean {
    return this.status === SheetStatus.DRAFT || this.status === SheetStatus.PENDING_IPDF || this.status === SheetStatus.PENDING_IQP;
  }

  // Virtual for checking if sheet is rejected
  get isRejected(): boolean {
    return this.status === SheetStatus.REJECTED;
  }
}

export const SheetSchema = SchemaFactory.createForClass(Sheet);

// Add indexes for performance
SheetSchema.index({ reference: 1 }, { unique: true });
SheetSchema.index({ title: 'text', description: 'text' }); // Text search
SheetSchema.index({ status: 1 });
SheetSchema.index({ uploadedBy: 1 });
SheetSchema.index({ department: 1 });
SheetSchema.index({ createdAt: -1 });
SheetSchema.index({ updatedAt: -1 });
SheetSchema.index({ isActive: 1 });

// Add compound indexes for common queries
SheetSchema.index({ department: 1, status: 1 });
SheetSchema.index({ uploadedBy: 1, status: 1 });
SheetSchema.index({ isActive: 1, status: 1 });
SheetSchema.index({ department: 1, isActive: 1 });

// Add virtuals
SheetSchema.virtual('isValidated').get(function() {
  return this.status === SheetStatus.APPROVED;
});

SheetSchema.virtual('isPending').get(function() {
  return this.status === SheetStatus.DRAFT || this.status === SheetStatus.PENDING_IPDF || this.status === SheetStatus.PENDING_IQP;
});

SheetSchema.virtual('isRejected').get(function() {
  return this.status === SheetStatus.REJECTED;
});

// Add population virtuals for references
SheetSchema.virtual('uploaderDetails', {
  ref: 'User',
  localField: 'uploadedBy',
  foreignField: '_id',
  justOne: true,
});

SheetSchema.virtual('departmentDetails', {
  ref: 'Department',
  localField: 'department',
  foreignField: '_id',
  justOne: true,
});

SheetSchema.virtual('validatorDetails', {
  ref: 'User',
  localField: 'validatedBy',
  foreignField: '_id',
  justOne: true,
});

// Ensure virtual fields are serialized
SheetSchema.set('toJSON', { virtuals: true });
SheetSchema.set('toObject', { virtuals: true });
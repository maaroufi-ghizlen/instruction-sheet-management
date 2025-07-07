// services/department-service/src/database/schemas/department.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// Define DepartmentDocument interface with proper method signatures
export interface DepartmentDocument extends Department, Document {
  _id: Types.ObjectId;
  readonly employeeCount: number;
  readonly sheetCount: number;
  readonly isManagerAssigned: boolean;
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
export class Department {
  @Prop({
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 100,
  })
  name: string;

  @Prop({
    required: true,
    trim: true,
    maxlength: 500,
  })
  description: string;

  @Prop({ 
    default: true 
  })
  isActive: boolean;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: false,
  })
  manager: Types.ObjectId;

  @Prop({
    type: [{ type: Types.ObjectId, ref: 'User' }],
    default: [],
  })
  employees: Types.ObjectId[];

  @Prop({
    type: [{ type: Types.ObjectId, ref: 'Sheet' }],
    default: [],
  })
  sheets: Types.ObjectId[];

  @Prop({ type: Date })
  lastModifiedAt: Date;

  @Prop({ type: Types.ObjectId })
  lastModifiedBy: Types.ObjectId;

  // Virtual for employee count
  get employeeCount(): number {
    return this.employees?.length || 0;
  }

  // Virtual for sheet count
  get sheetCount(): number {
    return this.sheets?.length || 0;
  }

  // Virtual for checking if manager is assigned
  get isManagerAssigned(): boolean {
    return !!this.manager;
  }
}

export const DepartmentSchema = SchemaFactory.createForClass(Department);

// Add indexes for performance
DepartmentSchema.index({ name: 1 }, { unique: true });
DepartmentSchema.index({ isActive: 1 });
DepartmentSchema.index({ manager: 1 });
DepartmentSchema.index({ createdAt: -1 });
DepartmentSchema.index({ updatedAt: -1 });

// Add compound indexes for common queries
DepartmentSchema.index({ isActive: 1, name: 1 });
DepartmentSchema.index({ manager: 1, isActive: 1 });

// Add virtuals
DepartmentSchema.virtual('employeeCount').get(function() {
  return this.employees?.length || 0;
});

DepartmentSchema.virtual('sheetCount').get(function() {
  return this.sheets?.length || 0;
});

DepartmentSchema.virtual('isManagerAssigned').get(function() {
  return !!this.manager;
});

// Add population virtuals for references
DepartmentSchema.virtual('managerDetails', {
  ref: 'User',
  localField: 'manager',
  foreignField: '_id',
  justOne: true,
});

DepartmentSchema.virtual('employeeDetails', {
  ref: 'User',
  localField: 'employees',
  foreignField: '_id',
});

DepartmentSchema.virtual('sheetDetails', {
  ref: 'Sheet',
  localField: 'sheets',
  foreignField: '_id',
});

// Ensure virtual fields are serialized
DepartmentSchema.set('toJSON', { virtuals: true });
DepartmentSchema.set('toObject', { virtuals: true });
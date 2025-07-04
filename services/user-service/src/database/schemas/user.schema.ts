// services/user-service/src/database/schemas/user.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { UserRole } from '@instruction-sheet/shared';

// Define UserDocument interface with proper method signatures
export interface UserDocument extends User, Document {
  _id: Types.ObjectId;
  readonly isLocked: boolean;
  readonly fullName: string;
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
      delete ret.passwordHash;
      delete ret.refreshToken;
      delete ret.twoFactorSecret;
      return ret;
    },
  },
})
export class User {
  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  })
  email: string;

  @Prop({ required: true, select: false })
  passwordHash: string;

  @Prop({ required: true, trim: true })
  firstName: string;

  @Prop({ required: true, trim: true })
  lastName: string;

  @Prop({
    type: String,
    enum: UserRole,
    required: true,
    default: UserRole.END_USER,
  })
  role: UserRole;

  @Prop({
    type: Types.ObjectId,
    required: true,
  })
  departmentId: Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Date })
  lastLoginAt: Date;

  @Prop({ select: false })
  refreshToken: string;

  @Prop({ select: false })
  twoFactorSecret: string;

  @Prop({ default: false })
  isTwoFactorEnabled: boolean;

  @Prop({ default: 0 })
  loginAttempts: number;

  @Prop({ type: Date })
  lockedUntil: Date;

  @Prop({ type: Date })
  passwordChangedAt: Date;

  @Prop({ type: Date })
  lastModifiedAt: Date;

  @Prop({ type: Types.ObjectId })
  lastModifiedBy: Types.ObjectId;

  // Virtual for full name
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  // Virtual for checking if account is locked
  get isLocked(): boolean {
    return !!(this.lockedUntil && this.lockedUntil > new Date());
  }
}

export const UserSchema = SchemaFactory.createForClass(User);

// Add indexes (avoiding duplicates)
// Email index is already created by unique: true in @Prop
UserSchema.index({ role: 1 });
UserSchema.index({ departmentId: 1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ lastName: 1, firstName: 1 });

// Add compound indexes for common queries
UserSchema.index({ departmentId: 1, role: 1 });
UserSchema.index({ isActive: 1, role: 1 });

// Add virtuals
UserSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

UserSchema.virtual('isLocked').get(function() {
  return !!(this.lockedUntil && this.lockedUntil > new Date());
});
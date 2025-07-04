// services/auth-service/src/database/schemas/user.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { UserRole } from '@instruction-sheet/shared';

// Define UserDocument interface with proper method signatures
export interface UserDocument extends User, Document {
  _id: Types.ObjectId;
  incLoginAttempts(): Promise<void>;
  resetLoginAttempts(): Promise<void>;
  readonly isLocked: boolean;
  readonly fullName: string;
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
    // REMOVED: index: true (to avoid duplicate with unique)
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
    // REMOVED: index: true (will be added via schema.index() only)
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

// Add indexes ONLY via schema.index() to avoid duplicates
// Note: email index is automatic due to unique: true in @Prop
UserSchema.index({ role: 1 });
UserSchema.index({ departmentId: 1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ createdAt: -1 });

// Add virtual for fullName
UserSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Add virtual for isLocked
UserSchema.virtual('isLocked').get(function() {
  return !!(this.lockedUntil && this.lockedUntil > new Date());
});

// Add instance methods with proper typing
UserSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockedUntil && this.lockedUntil < Date.now()) {
    return this.updateOne({
      $set: {
        loginAttempts: 1,
      },
      $unset: {
        lockedUntil: 1,
      },
    });
  }
  
  const updates: { $inc: { loginAttempts: number }; $set?: { lockedUntil: number } } = { 
    $inc: { loginAttempts: 1 } 
  };
  
  // If we're locking the account after 5 attempts, set lockUntil to 2 hours from now
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = {
      lockedUntil: Date.now() + 2 * 60 * 60 * 1000, // 2 hours
    };
  }
  
  return this.updateOne(updates);
};

UserSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: {
      loginAttempts: 1,
      lockedUntil: 1,
    },
  });
};
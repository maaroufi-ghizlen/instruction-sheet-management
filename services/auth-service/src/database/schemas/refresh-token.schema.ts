// services/auth-service/src/database/schemas/refresh-token.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export interface RefreshTokenDocument extends RefreshToken, Document {
  readonly isExpired: boolean;
  readonly isValid: boolean;
}

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class RefreshToken {
  @Prop({ required: true, unique: true, index: true })
  token: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  userId: Types.ObjectId;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ default: false })
  isRevoked: boolean;

  @Prop({ trim: true })
  userAgent: string;

  @Prop({ trim: true })
  ipAddress: string;

  @Prop({ type: Date })
  lastUsedAt: Date;

  // Virtual for checking if token is expired
  get isExpired(): boolean {
    return this.expiresAt < new Date();
  }

  // Virtual for checking if token is valid
  get isValid(): boolean {
    return !this.isRevoked && !this.isExpired;
  }
}

export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken);

// Add indexes
RefreshTokenSchema.index({ token: 1 });
RefreshTokenSchema.index({ userId: 1 });
RefreshTokenSchema.index({ expiresAt: 1 });
RefreshTokenSchema.index({ isRevoked: 1 });
RefreshTokenSchema.index({ createdAt: -1 });

// Add compound indexes
RefreshTokenSchema.index({ userId: 1, isRevoked: 1 });
RefreshTokenSchema.index({ token: 1, isRevoked: 1 });

// Add TTL index for automatic cleanup
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Add virtuals
RefreshTokenSchema.virtual('isExpired').get(function() {
  return this.expiresAt < new Date();
});

RefreshTokenSchema.virtual('isValid').get(function() {
  return !this.isRevoked && !this.isExpired;
});
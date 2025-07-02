// services/auth-service/src/database/schemas/refresh-token.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export interface RefreshTokenDocument extends RefreshToken, Document {
  _id: Types.ObjectId;
  readonly isValid: boolean;
  toJSON(): Record<string, unknown>;
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
  @Prop({ required: true, unique: true })
  token: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  userId: Types.ObjectId;

  @Prop({ required: true, index: true })
  expiresAt: Date;

  @Prop({ default: false, index: true })
  isRevoked: boolean;

  @Prop()
  ipAddress: string;

  @Prop()
  userAgent: string;

  @Prop({ type: Date })
  revokedAt: Date;

  @Prop()
  revokedByIp: string;

  @Prop()
  replacedByToken: string;

  // Virtual for checking if token is expired
  get isExpired(): boolean {
    return Date.now() >= this.expiresAt.getTime();
  }

  // Virtual for checking if token is active (not expired and not revoked)
  get isValid(): boolean {
    return !this.isExpired && !this.isRevoked;
  }
}

export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken);

// Add indexes
RefreshTokenSchema.index({ token: 1 });
RefreshTokenSchema.index({ userId: 1 });
RefreshTokenSchema.index({ expiresAt: 1 });
RefreshTokenSchema.index({ isRevoked: 1 });
RefreshTokenSchema.index({ createdAt: -1 });

// Add virtual for isExpired
RefreshTokenSchema.virtual('isExpired').get(function() {
  return Date.now() >= this.expiresAt.getTime();
});

// Add virtual for isValid
RefreshTokenSchema.virtual('isValid').get(function() {
  return !this.isExpired && !this.isRevoked;
});

// Create TTL index for automatic cleanup of expired tokens
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
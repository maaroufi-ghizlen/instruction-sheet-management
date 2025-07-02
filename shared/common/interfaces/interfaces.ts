// shared/common/interfaces.ts

import { UserRole, SheetStatus, ValidationStage, WorkflowStatus, AuditAction } from '../enums/enums';


export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  departmentId: string;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  managerId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Sheet {
  id: string;
  title: string;
  description?: string;
  reference: string;
  status: SheetStatus;
  uploadedBy: string;
  departmentId: string;
  filePath: string;
  createdAt: Date;
  updatedAt: Date;
}
export interface BaseEntity {
  _id?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface User extends BaseEntity {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  departmentId: string;
  isActive: boolean;
  lastLoginAt?: Date;
  refreshToken?: string;
  twoFactorSecret?: string;
  isTwoFactorEnabled: boolean;
}

export interface Department extends BaseEntity {
  name: string;
  description?: string;
  managerId: string;
  isActive: boolean;
}

export interface InstructionSheet extends BaseEntity {
  title: string;
  description?: string;
  referenceNumber: string;
  status: SheetStatus;
  version: number;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  departmentId: string;
  validationWorkflowId?: string;
  encryptionKey: string;
  checksum: string;
  tags: string[];
  expiresAt?: Date;
}

export interface ValidationWorkflow extends BaseEntity {
  sheetId: string;
  currentStage: ValidationStage;
  status: WorkflowStatus;
  ipdfValidatorId?: string;
  ipdfValidatedAt?: Date;
  ipdfComments?: string;
  iqpValidatorId?: string;
  iqpValidatedAt?: Date;
  iqpComments?: string;
  rejectionReason?: string;
}

export interface QRRecord extends BaseEntity {
  sheetId: string;
  qrCode: string;
  qrImageUrl: string;
  accessCount: number;
  lastAccessedAt?: Date;
  isActive: boolean;
  expiresAt?: Date;
}

export interface AuditLog extends BaseEntity {
  action: AuditAction;
  actorId: string;
  entityType: string;
  entityId: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
  service: string;
  metadata?: Record<string, any>;
}
// shared/common/enums/enums.ts

export enum UserRole {
  ADMIN = 'admin',
  PREPARATEUR = 'preparateur',
  IPDF = 'ipdf',
  IQP = 'iqp',
  END_USER = 'end_user'
}

export enum SheetStatus {
  DRAFT = 'draft',
  PENDING_IPDF = 'pending_ipdf',
  PENDING_IQP = 'pending_iqp',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ARCHIVED = 'archived'
}

export enum ValidationStage {
  UPLOAD = 'upload',
  IPDF_REVIEW = 'ipdf_review',
  IQP_REVIEW = 'iqp_review',
  COMPLETED = 'completed'
}

export enum WorkflowStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LOGIN = 'login',
  LOGOUT = 'logout',
  UPLOAD = 'upload',
  VALIDATE = 'validate',
  APPROVE = 'approve',
  REJECT = 'reject',
  DOWNLOAD = 'download',
  QR_GENERATE = 'qr_generate',
  QR_SCAN = 'qr_scan'
}
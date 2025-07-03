"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditAction = exports.WorkflowStatus = exports.ValidationStage = exports.SheetStatus = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "admin";
    UserRole["PREPARATEUR"] = "preparateur";
    UserRole["IPDF"] = "ipdf";
    UserRole["IQP"] = "iqp";
    UserRole["END_USER"] = "end_user";
})(UserRole || (exports.UserRole = UserRole = {}));
var SheetStatus;
(function (SheetStatus) {
    SheetStatus["DRAFT"] = "draft";
    SheetStatus["PENDING_IPDF"] = "pending_ipdf";
    SheetStatus["PENDING_IQP"] = "pending_iqp";
    SheetStatus["APPROVED"] = "approved";
    SheetStatus["REJECTED"] = "rejected";
    SheetStatus["ARCHIVED"] = "archived";
})(SheetStatus || (exports.SheetStatus = SheetStatus = {}));
var ValidationStage;
(function (ValidationStage) {
    ValidationStage["UPLOAD"] = "upload";
    ValidationStage["IPDF_REVIEW"] = "ipdf_review";
    ValidationStage["IQP_REVIEW"] = "iqp_review";
    ValidationStage["COMPLETED"] = "completed";
})(ValidationStage || (exports.ValidationStage = ValidationStage = {}));
var WorkflowStatus;
(function (WorkflowStatus) {
    WorkflowStatus["PENDING"] = "pending";
    WorkflowStatus["IN_PROGRESS"] = "in_progress";
    WorkflowStatus["APPROVED"] = "approved";
    WorkflowStatus["REJECTED"] = "rejected";
})(WorkflowStatus || (exports.WorkflowStatus = WorkflowStatus = {}));
var AuditAction;
(function (AuditAction) {
    AuditAction["CREATE"] = "create";
    AuditAction["UPDATE"] = "update";
    AuditAction["DELETE"] = "delete";
    AuditAction["LOGIN"] = "login";
    AuditAction["LOGOUT"] = "logout";
    AuditAction["UPLOAD"] = "upload";
    AuditAction["VALIDATE"] = "validate";
    AuditAction["APPROVE"] = "approve";
    AuditAction["REJECT"] = "reject";
    AuditAction["DOWNLOAD"] = "download";
    AuditAction["QR_GENERATE"] = "qr_generate";
    AuditAction["QR_SCAN"] = "qr_scan";
})(AuditAction || (exports.AuditAction = AuditAction = {}));
//# sourceMappingURL=enums.js.map
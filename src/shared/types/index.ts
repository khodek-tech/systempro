/**
 * Centralized type exports
 */

// Base types
export type {
  RoleType,
  WorkplaceType,
  DayOpeningHours,
  StoreOpeningHours,
  EmployeeWorkingHours,
  Store,
  Role,
  User,
} from './base.types';

// Attendance types
export type { AttendanceRecord } from './attendance.types';

// Sales types
export type { ExtraRow, SalesFormData, CollectionFormData } from './sales.types';

// Absence types
export type {
  AbsenceType,
  AbsenceFormData,
  AbsenceRequestStatus,
  AbsenceRequest,
} from './absence.types';

// Presence types
export type { PresenceStatus, PresenceRecord } from './presence.types';

// Task types
export type {
  TaskPriority,
  TaskStatus,
  TaskRepeat,
  TaskAssigneeType,
  TaskAttachment,
  TaskComment,
  Task,
  TaskType,
} from './task.types';

// Module types
export type {
  ModuleDefinition,
  ApprovalRoleMapping,
  ViewRoleMapping,
  ModuleConfig,
} from './module.types';

// Chat types
export type {
  ChatGroupType,
  ChatReactionType,
  ChatAttachment,
  ChatReaction,
  ChatMessage,
  ChatReadStatus,
  ChatGroup,
  ChatGroupSummary,
  ChatGroupPaginationState,
  ChatSearchResult,
} from './chat.types';

// Pohoda types
export type { PohodaSyncLog, PohodaSyncLogDetail } from './pohoda.types';

// Motivation types
export type {
  MotivationSettings,
  MotivationProduct,
} from './motivation.types';

// Link preview types
export type { LinkPreview } from './link-preview.types';

// Prevodka types
export type {
  PrevodkaStav,
  PrevodkaPolozka,
  Prevodka,
} from './prevodka.types';

// Email types
export type {
  EmailFolderType,
  EmailAddress,
  EmailAttachmentMeta,
  EmailAccount,
  EmailAccountAccess,
  EmailFolder,
  EmailMessage,
  EmailRuleCondition,
  EmailRuleAction,
  EmailRule,
  EmailSyncLog,
  EmailComposeData,
} from './email.types';

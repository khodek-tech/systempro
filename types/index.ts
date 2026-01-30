// Role types - 8 available roles
export type RoleType =
  | 'prodavac'
  | 'skladnik'
  | 'administrator'
  | 'vedouci-sklad'
  | 'obsluha-eshop'
  | 'obchodnik'
  | 'vedouci-velkoobchod'
  | 'majitel';

// Workplace types
export type WorkplaceType = 'store' | 'role';

// Store interface
export interface Store {
  id: string;
  name: string;
  address: string;
  active: boolean;
  openingHours?: StoreOpeningHours;
}

// Role interface
export interface Role {
  id: string;
  name: string;
  type: RoleType;
  active: boolean;
}

// User interface
export interface User {
  id: string;
  username: string;
  fullName: string;
  roleIds: string[];
  storeIds: string[];
  defaultRoleId?: string;
  defaultStoreId?: string;
  active: boolean;
  startsWithShortWeek?: boolean;
  workingHours?: StoreOpeningHours;  // Vlastní pracovní doba zaměstnance
}

// Attendance record with new workplace structure
export interface AttendanceRecord {
  date: string;
  store: string;
  workplaceType: WorkplaceType;
  workplaceId: string;
  workplaceName: string;
  user: string;
  in: string;
  out: string;
  abs: string;
  hrs: string;
  absNote: string;
  cash: number;
  card: number;
  partner: number;
  flows: string;
  saleNote: string;
  collected: string | false;
}

export interface ExtraRow {
  id: string;
  amount: number;
  note: string;
}

export interface SalesFormData {
  cash: number;
  card: number;
  partner: number;
  incomes: ExtraRow[];
  expenses: ExtraRow[];
}

export type AbsenceType = 'Dovolená' | 'Nemoc / Neschopenka' | 'Lékař' | 'Neplacené volno';

export interface AbsenceFormData {
  type: AbsenceType;
  dateFrom: string;
  dateTo: string;
  timeFrom?: string;
  timeTo?: string;
  note: string;
}

export interface CollectionFormData {
  driverName: string;
  amount: number;
  period: string;
}

export type AbsenceRequestStatus = 'pending' | 'approved' | 'rejected';

export interface AbsenceRequest {
  id: string;
  userId: string;
  type: AbsenceType;
  dateFrom: string;
  dateTo: string;
  timeFrom?: string;
  timeTo?: string;
  note: string;
  status: AbsenceRequestStatus;
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
  seenByUser?: boolean;
}

// Opening hours types
export interface DayOpeningHours {
  open: string;    // "09:00"
  close: string;   // "18:00"
  closed: boolean;
}

export interface StoreOpeningHours {
  sameAllWeek: boolean;
  default?: DayOpeningHours;
  monday?: DayOpeningHours;
  tuesday?: DayOpeningHours;
  wednesday?: DayOpeningHours;
  thursday?: DayOpeningHours;
  friday?: DayOpeningHours;
  saturday?: DayOpeningHours;
  sunday?: DayOpeningHours;
}

// Module system types
export interface ModuleDefinition {
  id: string;
  name: string;
  description: string;
  component: string;
  icon: string;
}

export interface ApprovalRoleMapping {
  approverRoleId: string;
  subordinateRoleIds: string[];
}

export interface ViewRoleMapping {
  viewerRoleId: string;
  visibleRoleIds: string[];
}

export interface ModuleConfig {
  moduleId: string;
  roleIds: string[];
  order: number;
  column: 'left' | 'right' | 'full' | 'top' | 'header' | 'sidebar';
  enabled: boolean;
  approvalMappings?: ApprovalRoleMapping[];
  viewMappings?: ViewRoleMapping[];
}

// Presence module types
export type PresenceStatus = 'present' | 'absent' | 'excused';

export interface PresenceRecord {
  userId: string;
  userName: string;
  status: PresenceStatus;
  absenceType?: AbsenceType;
  storeName?: string;
}

// Task module types
export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskStatus =
  | 'new'
  | 'in-progress'
  | 'delegated'
  | 'pending-review'
  | 'pending-approval'
  | 'returned'
  | 'approved';
export type TaskRepeat = 'none' | 'daily' | 'weekly' | 'monthly';
export type TaskAssigneeType = 'employee' | 'store';

export interface TaskAttachment {
  id: string;
  fileName: string;
  fileType: string;
  fileUrl: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  text: string;
  attachments: TaskAttachment[];
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  createdBy: string;
  createdAt: string;
  assigneeType: TaskAssigneeType;
  assigneeId: string;
  deadline: string;
  repeat: TaskRepeat;
  repeatSourceId?: string;
  completedBy?: string;
  completedAt?: string;
  approvedAt?: string;
  returnedAt?: string;
  returnReason?: string;
  seenByAssignee?: boolean;
  seenByCreator?: boolean;
  seenByDelegatee?: boolean;
  comments: TaskComment[];
  // Delegation fields (only one level allowed)
  delegatedTo?: string;
  delegatedBy?: string;
  delegatedAt?: string;
}

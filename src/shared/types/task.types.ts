/**
 * Task module types
 */

export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskStatus =
  | 'new'
  | 'in-progress'
  | 'delegated'
  | 'pending-review'
  | 'pending-approval'
  | 'returned'
  | 'approved';
export type TaskRepeat = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
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

/**
 * Tasks module helper functions
 *
 * Contains task visibility, permission, and utility functions.
 */

import { Task, TaskPriority, TaskStatus, RoleType, User, Store } from '@/shared/types';
import { useModulesStore } from '@/core/stores/modules-store';
import { getUsers, getRoles } from '@/core/stores/store-helpers';

// Helper to get module config
const getModuleConfig = () => useModulesStore.getState().getModuleConfig('tasks');

/**
 * Get view mappings for tasks module
 * Returns a map of viewer role IDs to visible role IDs
 */
export function getTaskViewMappings(): Record<string, string[]> {
  const config = getModuleConfig();
  const mappings: Record<string, string[]> = {};

  if (!config?.viewMappings) return mappings;

  for (const mapping of config.viewMappings) {
    mappings[mapping.viewerRoleId] = mapping.visibleRoleIds;
  }

  return mappings;
}

/**
 * Get user's primary role ID (first role in their roleIds array)
 */
export function getUserPrimaryRoleId(userId: string): string | null {
  const user = getUsers().find((u) => u.id === userId);
  if (!user || user.roleIds.length === 0) return null;
  return user.roleIds[0];
}

/**
 * Get user's primary role type
 */
export function getUserPrimaryRoleType(userId: string): RoleType | null {
  const roleId = getUserPrimaryRoleId(userId);
  if (!roleId) return null;

  const role = getRoles().find((r) => r.id === roleId);
  return role?.type || null;
}

/**
 * Check if a viewer can view tasks of a target user
 * Based on viewMappings configuration
 */
export function canViewTasksOfUser(viewerId: string, targetId: string): boolean {
  // User can always view their own tasks
  if (viewerId === targetId) return true;

  const viewerRoleId = getUserPrimaryRoleId(viewerId);
  const targetRoleId = getUserPrimaryRoleId(targetId);

  if (!viewerRoleId || !targetRoleId) return false;

  const mappings = getTaskViewMappings();
  const visibleRoles = mappings[viewerRoleId] || [];

  return visibleRoles.includes(targetRoleId);
}

/**
 * Check if a user can approve a task
 * Only the task creator can approve it
 */
export function canApproveTask(approverId: string, task: Task): boolean {
  return task.createdBy === approverId && task.status === 'pending-approval';
}

/**
 * Check if a user can return a task for revision
 * Only the task creator can return it
 */
export function canReturnTask(approverId: string, task: Task): boolean {
  return task.createdBy === approverId && task.status === 'pending-approval';
}

/**
 * Check if a user can start working on a task
 * @deprecated Tlačítko "Začít pracovat" bylo odstraněno - workflow zjednodušen
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function canStartTask(userId: string, task: Task): boolean {
  return false;
}

/**
 * Check if a user can submit a task for approval
 * Assignee can submit a task that is new, in progress, or returned
 */
export function canSubmitForApproval(userId: string, task: Task): boolean {
  if (!isUserAssignedToTask(userId, task)) return false;
  return task.status === 'new' || task.status === 'in-progress' || task.status === 'returned';
}

/**
 * Check if a user is assigned to a task
 * Either directly (employee) or through their store (store assignee)
 */
export function isUserAssignedToTask(userId: string, task: Task): boolean {
  if (task.assigneeType === 'employee') {
    return task.assigneeId === userId;
  }

  // For store assignment, check if user works at that store
  const user = getUsers().find((u) => u.id === userId);
  if (!user) return false;

  return user.storeIds.includes(task.assigneeId);
}

/**
 * Get status configuration (label, colors)
 */
export function getTaskStatusConfig(status: TaskStatus): {
  label: string;
  bgColor: string;
  textColor: string;
} {
  const configs: Record<TaskStatus, { label: string; bgColor: string; textColor: string }> = {
    new: {
      label: 'Nový',
      bgColor: 'bg-blue-500',
      textColor: 'text-white',
    },
    'in-progress': {
      label: 'Rozpracovaný',
      bgColor: 'bg-yellow-500',
      textColor: 'text-white',
    },
    delegated: {
      label: 'Delegováno',
      bgColor: 'bg-purple-500',
      textColor: 'text-white',
    },
    'pending-review': {
      label: 'Čeká na kontrolu',
      bgColor: 'bg-indigo-500',
      textColor: 'text-white',
    },
    'pending-approval': {
      label: 'Čeká na schválení',
      bgColor: 'bg-orange-500',
      textColor: 'text-white',
    },
    returned: {
      label: 'Vráceno',
      bgColor: 'bg-red-500',
      textColor: 'text-white',
    },
    approved: {
      label: 'Schváleno',
      bgColor: 'bg-green-500',
      textColor: 'text-white',
    },
  };

  return configs[status];
}

/**
 * Get priority configuration (label, colors)
 */
export function getTaskPriorityConfig(priority: TaskPriority): {
  label: string;
  bgColor: string;
  textColor: string;
} {
  const configs: Record<TaskPriority, { label: string; bgColor: string; textColor: string }> = {
    high: {
      label: 'Vysoká',
      bgColor: 'bg-red-100',
      textColor: 'text-red-700',
    },
    medium: {
      label: 'Střední',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-700',
    },
    low: {
      label: 'Nízká',
      bgColor: 'bg-slate-100',
      textColor: 'text-slate-600',
    },
  };

  return configs[priority];
}

/**
 * Check if deadline is approaching (less than 24 hours)
 */
export function isDeadlineApproaching(deadline: string): boolean {
  const deadlineDate = new Date(deadline);
  const now = new Date();
  const diffMs = deadlineDate.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  return diffHours > 0 && diffHours < 24;
}

/**
 * Check if deadline is overdue
 */
export function isDeadlineOverdue(deadline: string): boolean {
  const deadlineDate = new Date(deadline);
  const now = new Date();

  return deadlineDate < now;
}

/**
 * Get repeat label
 */
export function getRepeatLabel(repeat: Task['repeat']): string {
  const labels: Record<Task['repeat'], string> = {
    none: '',
    daily: 'Denně',
    weekly: 'Týdně',
    monthly: 'Měsíčně',
  };

  return labels[repeat];
}

/**
 * Get assignee name for display
 */
export function getAssigneeName(task: Task): string {
  if (task.assigneeType === 'employee') {
    const user = getUsers().find((u) => u.id === task.assigneeId);
    return user?.fullName || 'Neznámý uživatel';
  }

  // For store, we need to get store name from stores store
  // This will be handled in the component
  return task.assigneeId;
}

/**
 * Get assignee display name - resolves both employee and store assignees
 * @param task The task to get assignee name for
 * @param users Array of users
 * @param stores Array of stores
 * @returns Display name for the assignee
 */
export function getAssigneeDisplayName(task: Task, users: User[], stores: Store[]): string {
  if (task.assigneeType === 'employee') {
    const user = users.find((u) => u.id === task.assigneeId);
    return user?.fullName || 'Neznámý uživatel';
  }

  // For store assignee
  const store = stores.find((s) => s.id === task.assigneeId);
  return store?.name || 'Neznámá prodejna';
}

/**
 * Check if a user can delegate a task
 * - Only assignee can delegate
 * - Task must be new, in-progress, or returned
 * - Task must not already be delegated (only one level allowed)
 */
export function canDelegateTask(userId: string, task: Task): boolean {
  if (!isUserAssignedToTask(userId, task)) return false;
  // Allow delegation from new, in-progress, or returned status
  if (task.status !== 'new' && task.status !== 'in-progress' && task.status !== 'returned') return false;
  if (task.delegatedTo) return false; // Already delegated
  return true;
}

/**
 * Check if a user can return task to delegator
 * - User must be the delegatee
 * - Task must be in 'delegated' status
 */
export function canReturnToDelegator(userId: string, task: Task): boolean {
  if (task.delegatedTo !== userId) return false;
  if (task.status !== 'delegated') return false;
  return true;
}

/**
 * Check if a user can approve delegation and forward to creator
 * - User must be the delegator (original assignee)
 * - Task must be in 'pending-review' status
 */
export function canApproveDelegation(userId: string, task: Task): boolean {
  if (task.delegatedBy !== userId) return false;
  if (task.status !== 'pending-review') return false;
  return true;
}

/**
 * Check if a user can return task to delegatee for rework
 * - User must be the delegator
 * - Task must be in 'pending-review' status
 */
export function canReturnToDelegatee(userId: string, task: Task): boolean {
  if (task.delegatedBy !== userId) return false;
  if (task.status !== 'pending-review') return false;
  return true;
}

/**
 * Check if user is currently responsible for the task
 * Returns true if user should act on the task
 */
export function isCurrentResponsible(userId: string, task: Task): boolean {
  switch (task.status) {
    case 'new':
    case 'in-progress':
    case 'returned':
      // Assignee is responsible (unless delegated)
      if (task.delegatedTo) {
        return task.delegatedTo === userId;
      }
      return isUserAssignedToTask(userId, task);
    case 'delegated':
      // Delegatee is responsible
      return task.delegatedTo === userId;
    case 'pending-review':
      // Delegator is responsible
      return task.delegatedBy === userId;
    case 'pending-approval':
      // Creator is responsible
      return task.createdBy === userId;
    case 'approved':
      return false;
    default:
      return false;
  }
}

/**
 * Get the name of the person currently responsible for the task
 */
export function getCurrentResponsibleName(task: Task): string {
  switch (task.status) {
    case 'new':
    case 'in-progress':
    case 'returned':
      if (task.delegatedTo) {
        const delegatee = getUsers().find((u) => u.id === task.delegatedTo);
        return delegatee?.fullName || 'Neznámý uživatel';
      }
      return getAssigneeName(task);
    case 'delegated':
      const delegatee = getUsers().find((u) => u.id === task.delegatedTo);
      return delegatee?.fullName || 'Neznámý uživatel';
    case 'pending-review':
      const delegator = getUsers().find((u) => u.id === task.delegatedBy);
      return delegator?.fullName || 'Neznámý uživatel';
    case 'pending-approval':
      const creator = getUsers().find((u) => u.id === task.createdBy);
      return creator?.fullName || 'Neznámý uživatel';
    case 'approved':
      return '';
    default:
      return '';
  }
}

/**
 * Get delegatee name for display
 */
export function getDelegateeName(task: Task): string | null {
  if (!task.delegatedTo) return null;
  const user = getUsers().find((u) => u.id === task.delegatedTo);
  return user?.fullName || 'Neznámý uživatel';
}

/**
 * @deprecated Import from '@/features/tasks' instead
 */
export {
  getTaskViewMappings,
  getUserPrimaryRoleId,
  getUserPrimaryRoleType,
  canViewTasksOfUser,
  canApproveTask,
  canReturnTask,
  canStartTask,
  canSubmitForApproval,
  isUserAssignedToTask,
  getTaskStatusConfig,
  getTaskPriorityConfig,
  isDeadlineApproaching,
  isDeadlineOverdue,
  getRepeatLabel,
  getAssigneeName,
  getAssigneeDisplayName,
  canDelegateTask,
  canReturnToDelegator,
  canApproveDelegation,
  canReturnToDelegatee,
  isCurrentResponsible,
  getCurrentResponsibleName,
  getDelegateeName,
} from '@/features/tasks/tasks-helpers';

'use client';

import { Clock, MessageSquare, User, Building2, RotateCcw, UserPlus, Users, PauseCircle } from 'lucide-react';
import { Task } from '@/types';
import { useTasksStore } from '@/stores/tasks-store';
import { useUsersStore } from '@/stores/users-store';
import { useStoresStore } from '@/stores/stores-store';
import { useAuthStore } from '@/stores/auth-store';
import {
  getTaskStatusConfig,
  getTaskPriorityConfig,
  isDeadlineApproaching,
  isDeadlineOverdue,
  getRepeatLabel,
  getDelegateeName,
} from '@/lib/tasks-helpers';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
  const { openTaskDetail, activeTab } = useTasksStore();
  const { users } = useUsersStore();
  const { stores } = useStoresStore();
  const { currentUser } = useAuthStore();

  const statusConfig = getTaskStatusConfig(task.status);
  const priorityConfig = getTaskPriorityConfig(task.priority);

  const deadline = new Date(task.deadline);
  const isApproaching = isDeadlineApproaching(task.deadline);
  const isOverdue = isDeadlineOverdue(task.deadline) && task.status !== 'approved';
  const repeatLabel = getRepeatLabel(task.repeat);

  // Get creator name
  const creator = users.find((u) => u.id === task.createdBy);
  const creatorName = creator?.fullName || 'Neznámý uživatel';

  // Get assignee name
  let assigneeName = '';
  if (task.assigneeType === 'employee') {
    const user = users.find((u) => u.id === task.assigneeId);
    assigneeName = user?.fullName || 'Neznámý uživatel';
  } else {
    const store = stores.find((s) => s.id === task.assigneeId);
    assigneeName = store?.name || 'Neznámá prodejna';
  }

  // Determine what to show based on context
  const isMyTask = currentUser && (
    (task.assigneeType === 'employee' && task.assigneeId === currentUser.id) ||
    (task.assigneeType === 'store' && currentUser.storeIds.includes(task.assigneeId))
  );
  const iCreatedIt = currentUser && task.createdBy === currentUser.id;
  const isDelegatedToMe = currentUser && task.delegatedTo === currentUser.id;
  const isDelegatedByMe = currentUser && task.delegatedBy === currentUser.id;

  // Get delegatee name if delegated
  const delegateeName = getDelegateeName(task);

  // Check if task is unread for current user
  const isUnread = currentUser && (
    (isMyTask && task.seenByAssignee === false) ||
    (iCreatedIt && task.seenByCreator === false) ||
    (isDelegatedToMe && task.seenByDelegatee === false) ||
    (isDelegatedByMe && task.status === 'pending-review' && task.seenByAssignee === false)
  );

  // Format deadline
  const formatDeadline = (date: Date) => {
    return date.toLocaleDateString('cs-CZ', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <button
      onClick={() => openTaskDetail(task.id)}
      className={cn(
        "w-full text-left border rounded-xl p-5 hover:shadow-md transition-all duration-300 hover:-translate-y-1 active:scale-[0.99]",
        isUnread
          ? "bg-slate-100 border-slate-300"
          : "bg-white border-slate-200"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left side - Main content */}
        <div className="flex-1 min-w-0">
          {/* Title and badges */}
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <h3 className={cn("text-base text-slate-800 truncate", isUnread ? "font-bold" : "font-semibold")}>{task.title}</h3>
            <span className={cn('px-2 py-0.5 rounded-md text-xs font-semibold', statusConfig.bgColor, statusConfig.textColor)}>
              {statusConfig.label}
            </span>
            <span className={cn('px-2 py-0.5 rounded-md text-xs font-semibold', priorityConfig.bgColor, priorityConfig.textColor)}>
              {priorityConfig.label}
            </span>
            {repeatLabel && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-100 text-blue-700">
                <RotateCcw className="w-3 h-3" />
                {repeatLabel}
              </span>
            )}
            {task.repeatPaused && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-orange-100 text-orange-700">
                <PauseCircle className="w-3 h-3" />
                Pozastaveno
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-sm text-slate-500 line-clamp-2 mb-3">{task.description}</p>

          {/* Meta info */}
          <div className="flex items-center gap-4 text-xs text-slate-400">
            {/* Show creator in "Moje úkoly" tab, show assignee in "Vytvořené mnou", show both in "Všechny" */}
            {(activeTab === 'my-tasks' || activeTab === 'all') && !iCreatedIt && (
              <div className="flex items-center gap-1.5">
                <UserPlus className="w-3.5 h-3.5" />
                <span className="font-medium text-slate-600">Od: {creatorName}</span>
              </div>
            )}
            {(activeTab === 'created-by-me' || activeTab === 'all') && !isMyTask && !isDelegatedToMe && (
              <div className="flex items-center gap-1.5">
                {task.assigneeType === 'employee' ? (
                  <User className="w-3.5 h-3.5" />
                ) : (
                  <Building2 className="w-3.5 h-3.5" />
                )}
                <span className="font-medium text-slate-600">Pro: {assigneeName}</span>
              </div>
            )}

            {/* Show delegation info */}
            {delegateeName && (
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-purple-500" />
                <span className="font-medium text-purple-600">Delegováno: {delegateeName}</span>
              </div>
            )}

            {/* Deadline */}
            <div
              className={cn(
                'flex items-center gap-1.5',
                isOverdue && 'text-red-500',
                isApproaching && !isOverdue && 'text-orange-500'
              )}
            >
              <Clock className="w-3.5 h-3.5" />
              <span className={cn('font-medium', isOverdue ? 'text-red-600' : isApproaching ? 'text-orange-600' : 'text-slate-600')}>
                {formatDeadline(deadline)}
                {isOverdue && ' (po termínu)'}
                {isApproaching && !isOverdue && ' (blíží se)'}
              </span>
            </div>

            {/* Comments count */}
            {task.comments.length > 0 && (
              <div className="flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                <span className="font-medium text-slate-600">{task.comments.length}</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </button>
  );
}

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Task, TaskStatus, TaskPriority, TaskComment, TaskAttachment, ViewRoleMapping } from '@/shared/types';
import { MOCK_TASKS } from '@/lib/mock-data';
import { STORAGE_KEYS } from '@/lib/constants';
import {
  canViewTasksOfUser,
  isUserAssignedToTask,
  getUserPrimaryRoleId,
} from './tasks-helpers';

type TaskTab = 'my-tasks' | 'created-by-me' | 'all';

interface TasksState {
  tasks: Task[];
  tasksViewMode: 'card' | 'view';
  activeTab: TaskTab;
  selectedTaskId: string | null;
  isFormModalOpen: boolean;
  editingTaskId: string | null;
  statusFilter: TaskStatus | 'all';
  priorityFilter: TaskPriority | 'all';
}

interface TasksActions {
  // View mode actions
  openTasksView: () => void;
  closeTasksView: () => void;
  setActiveTab: (tab: TaskTab) => void;

  // Detail modal actions
  openTaskDetail: (taskId: string) => void;
  closeTaskDetail: () => void;

  // Form modal actions
  openFormModal: (taskId?: string) => void;
  closeFormModal: () => void;

  // CRUD actions
  createTask: (task: Omit<Task, 'id' | 'createdAt' | 'comments' | 'status'>) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;

  // Workflow actions
  startTask: (taskId: string, userId: string) => { success: boolean; error?: string };
  submitForApproval: (taskId: string, userId: string) => { success: boolean; error?: string };
  approveTask: (taskId: string, approverId: string) => { success: boolean; error?: string };
  returnTask: (taskId: string, approverId: string, reason?: string) => { success: boolean; error?: string };

  // Delegation actions
  delegateTask: (taskId: string, delegatorId: string, delegateeId: string) => { success: boolean; error?: string };
  returnToDelegator: (taskId: string, delegateeId: string) => { success: boolean; error?: string };
  approveDelegation: (taskId: string, delegatorId: string) => { success: boolean; error?: string };
  returnToDelegatee: (taskId: string, delegatorId: string, reason?: string) => { success: boolean; error?: string };

  // Comment actions
  addComment: (taskId: string, userId: string, text: string, attachments?: TaskAttachment[]) => void;

  // Getters
  getTaskById: (taskId: string) => Task | undefined;
  getMyTasks: (userId: string) => Task[];
  getTasksICreated: (userId: string) => Task[];
  getVisibleTasks: (userId: string) => Task[];
  getFilteredTasks: (userId: string) => Task[];

  // Notification methods
  getUnseenTasksCount: (userId: string) => number;
  getUnresolvedTasksCount: (userId: string) => number;
  markTaskAsSeen: (taskId: string, userId: string) => void;

  // Filter actions
  setStatusFilter: (status: TaskStatus | 'all') => void;
  setPriorityFilter: (priority: TaskPriority | 'all') => void;

  // Repeating tasks
  checkAndCreateRepeatingTasks: () => void;
}

export const useTasksStore = create<TasksState & TasksActions>()(
  persist(
    (set, get) => ({
      // Initial state
      tasks: MOCK_TASKS,
      tasksViewMode: 'card',
      activeTab: 'my-tasks',
      selectedTaskId: null,
      isFormModalOpen: false,
      editingTaskId: null,
      statusFilter: 'all',
      priorityFilter: 'all',

      // View mode actions
      openTasksView: () => set({ tasksViewMode: 'view' }),
      closeTasksView: () => set({ tasksViewMode: 'card', selectedTaskId: null, isFormModalOpen: false }),
      setActiveTab: (tab) => set({ activeTab: tab }),

      // Detail modal actions
      openTaskDetail: (taskId) => set({ selectedTaskId: taskId }),
      closeTaskDetail: () => set({ selectedTaskId: null }),

      // Form modal actions
      openFormModal: (taskId) => set({ isFormModalOpen: true, editingTaskId: taskId || null }),
      closeFormModal: () => set({ isFormModalOpen: false, editingTaskId: null }),

      // CRUD actions
      createTask: (taskData) => {
        const newTask: Task = {
          ...taskData,
          id: `task-${crypto.randomUUID()}`,
          createdAt: new Date().toISOString(),
          status: 'new',
          comments: [],
          seenByAssignee: false,
          seenByCreator: true,
        };

        set((state) => ({
          tasks: [...state.tasks, newTask],
          isFormModalOpen: false,
          editingTaskId: null,
          activeTab: 'created-by-me',
        }));
      },

      updateTask: (taskId, updates) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId ? { ...t, ...updates } : t
          ),
        }));
      },

      deleteTask: (taskId) => {
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== taskId),
          selectedTaskId: state.selectedTaskId === taskId ? null : state.selectedTaskId,
        }));
      },

      // Workflow actions
      startTask: (taskId, userId) => {
        const task = get().tasks.find((t) => t.id === taskId);
        if (!task) {
          return { success: false, error: 'Úkol nenalezen' };
        }

        if (!isUserAssignedToTask(userId, task)) {
          return { success: false, error: 'Nejste přiřazeni k tomuto úkolu' };
        }

        if (task.status !== 'new' && task.status !== 'returned') {
          return { success: false, error: 'Tento úkol nelze začít' };
        }

        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? { ...t, status: 'in-progress' as TaskStatus, seenByCreator: false }
              : t
          ),
        }));

        return { success: true };
      },

      submitForApproval: (taskId, userId) => {
        const task = get().tasks.find((t) => t.id === taskId);
        if (!task) {
          return { success: false, error: 'Úkol nenalezen' };
        }

        if (!isUserAssignedToTask(userId, task)) {
          return { success: false, error: 'Nejste přiřazeni k tomuto úkolu' };
        }

        // Allow submission from new, in-progress, or returned status
        if (task.status !== 'new' && task.status !== 'in-progress' && task.status !== 'returned') {
          return { success: false, error: 'Tento úkol nelze odeslat ke schválení' };
        }

        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  status: 'pending-approval' as TaskStatus,
                  completedBy: userId,
                  completedAt: new Date().toISOString(),
                  seenByCreator: false,
                }
              : t
          ),
        }));

        return { success: true };
      },

      approveTask: (taskId, approverId) => {
        const task = get().tasks.find((t) => t.id === taskId);
        if (!task) {
          return { success: false, error: 'Úkol nenalezen' };
        }

        if (task.createdBy !== approverId) {
          return { success: false, error: 'Nemáte oprávnění schvalovat tento úkol' };
        }

        if (task.status !== 'pending-approval') {
          return { success: false, error: 'Tento úkol nelze schválit' };
        }

        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  status: 'approved' as TaskStatus,
                  approvedAt: new Date().toISOString(),
                  seenByAssignee: false,
                }
              : t
          ),
        }));

        return { success: true };
      },

      returnTask: (taskId, approverId, reason) => {
        const task = get().tasks.find((t) => t.id === taskId);
        if (!task) {
          return { success: false, error: 'Úkol nenalezen' };
        }

        if (task.createdBy !== approverId) {
          return { success: false, error: 'Nemáte oprávnění vrátit tento úkol' };
        }

        if (task.status !== 'pending-approval') {
          return { success: false, error: 'Tento úkol nelze vrátit' };
        }

        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  status: 'returned' as TaskStatus,
                  returnedAt: new Date().toISOString(),
                  returnReason: reason || undefined,
                  seenByAssignee: false,
                }
              : t
          ),
        }));

        return { success: true };
      },

      // Delegation actions
      delegateTask: (taskId, delegatorId, delegateeId) => {
        const task = get().tasks.find((t) => t.id === taskId);
        if (!task) {
          return { success: false, error: 'Úkol nenalezen' };
        }

        if (!isUserAssignedToTask(delegatorId, task)) {
          return { success: false, error: 'Nejste přiřazeni k tomuto úkolu' };
        }

        // Allow delegation from new, in-progress, or returned status
        if (task.status !== 'new' && task.status !== 'in-progress' && task.status !== 'returned') {
          return { success: false, error: 'Tento úkol nelze delegovat' };
        }

        if (task.delegatedTo) {
          return { success: false, error: 'Úkol je již delegován' };
        }

        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  status: 'delegated' as TaskStatus,
                  delegatedTo: delegateeId,
                  delegatedBy: delegatorId,
                  delegatedAt: new Date().toISOString(),
                  seenByDelegatee: false,
                  seenByAssignee: true,
                }
              : t
          ),
        }));

        return { success: true };
      },

      returnToDelegator: (taskId, delegateeId) => {
        const task = get().tasks.find((t) => t.id === taskId);
        if (!task) {
          return { success: false, error: 'Úkol nenalezen' };
        }

        if (task.delegatedTo !== delegateeId) {
          return { success: false, error: 'Nejste delegovanou osobou' };
        }

        if (task.status !== 'delegated') {
          return { success: false, error: 'Tento úkol nelze vrátit delegujícímu' };
        }

        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  status: 'pending-review' as TaskStatus,
                  completedBy: delegateeId,
                  completedAt: new Date().toISOString(),
                  seenByAssignee: false,
                }
              : t
          ),
        }));

        return { success: true };
      },

      approveDelegation: (taskId, delegatorId) => {
        const task = get().tasks.find((t) => t.id === taskId);
        if (!task) {
          return { success: false, error: 'Úkol nenalezen' };
        }

        if (task.delegatedBy !== delegatorId) {
          return { success: false, error: 'Nejste delegujícím' };
        }

        if (task.status !== 'pending-review') {
          return { success: false, error: 'Tento úkol nelze schválit' };
        }

        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  status: 'pending-approval' as TaskStatus,
                  seenByCreator: false,
                }
              : t
          ),
        }));

        return { success: true };
      },

      returnToDelegatee: (taskId, delegatorId, reason) => {
        const task = get().tasks.find((t) => t.id === taskId);
        if (!task) {
          return { success: false, error: 'Úkol nenalezen' };
        }

        if (task.delegatedBy !== delegatorId) {
          return { success: false, error: 'Nejste delegujícím' };
        }

        if (task.status !== 'pending-review') {
          return { success: false, error: 'Tento úkol nelze vrátit delegovanému' };
        }

        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  status: 'delegated' as TaskStatus,
                  returnReason: reason || undefined,
                  returnedAt: new Date().toISOString(),
                  seenByDelegatee: false,
                }
              : t
          ),
        }));

        return { success: true };
      },

      // Comment actions
      addComment: (taskId, userId, text, attachments = []) => {
        const newComment: TaskComment = {
          id: `comment-${crypto.randomUUID()}`,
          taskId,
          userId,
          text,
          attachments,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          tasks: state.tasks.map((t) => {
            if (t.id !== taskId) return t;

            // Mark task as unseen for the other party
            const isCreator = t.createdBy === userId;
            return {
              ...t,
              comments: [...t.comments, newComment],
              seenByAssignee: isCreator ? false : t.seenByAssignee,
              seenByCreator: isCreator ? t.seenByCreator : false,
            };
          }),
        }));
      },

      // Getters
      getTaskById: (taskId) => {
        return get().tasks.find((t) => t.id === taskId);
      },

      getMyTasks: (userId) => {
        const { tasks, statusFilter, priorityFilter } = get();

        return tasks
          .filter((t) => {
            // Tasks assigned to me OR delegated to me
            const isAssigned = isUserAssignedToTask(userId, t);
            const isDelegatedToMe = t.delegatedTo === userId;
            const isDelegatedByMe = t.delegatedBy === userId && t.status === 'pending-review';

            if (!isAssigned && !isDelegatedToMe && !isDelegatedByMe) return false;

            // Hide approved tasks from "Moje úkoly" - show only in "Všechny"
            if (t.status === 'approved') return false;

            // Status filter
            if (statusFilter !== 'all' && t.status !== statusFilter) return false;

            // Priority filter
            if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;

            return true;
          })
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      },

      getTasksICreated: (userId) => {
        const { tasks, statusFilter, priorityFilter } = get();

        return tasks
          .filter((t) => {
            // Tasks I created
            if (t.createdBy !== userId) return false;

            // Hide approved tasks from "Vytvořené mnou" - show only in "Všechny"
            if (t.status === 'approved') return false;

            // Status filter
            if (statusFilter !== 'all' && t.status !== statusFilter) return false;

            // Priority filter
            if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;

            return true;
          })
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      },

      getVisibleTasks: (userId) => {
        const { tasks, statusFilter, priorityFilter } = get();
        const viewerRoleId = getUserPrimaryRoleId(userId);

        // If no role, only show own tasks
        if (!viewerRoleId) {
          return get().getMyTasks(userId);
        }

        return tasks
          .filter((t) => {
            // Can view if: assigned to me, I created it, or I can view the assignee's tasks
            const isMyTask = isUserAssignedToTask(userId, t);
            const iCreatedIt = t.createdBy === userId;

            // For employee assignee, check viewMappings
            let canViewAssignee = false;
            if (t.assigneeType === 'employee') {
              canViewAssignee = canViewTasksOfUser(userId, t.assigneeId);
            }

            // For store assignee, we need to check if any user at that store is visible
            // For simplicity, managers can see store tasks if they have view access to any role
            if (t.assigneeType === 'store' && !isMyTask && !iCreatedIt) {
              // Allow if user has any view mappings configured
              const config = useModulesStoreRef().getModuleConfig('tasks');
              const viewMapping = config?.viewMappings?.find((m: ViewRoleMapping) => m.viewerRoleId === viewerRoleId);
              canViewAssignee = (viewMapping?.visibleRoleIds.length || 0) > 0;
            }

            if (!isMyTask && !iCreatedIt && !canViewAssignee) return false;

            // Status filter
            if (statusFilter !== 'all' && t.status !== statusFilter) return false;

            // Priority filter
            if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;

            return true;
          })
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      },

      getFilteredTasks: (userId) => {
        const { activeTab } = get();

        switch (activeTab) {
          case 'my-tasks':
            return get().getMyTasks(userId);
          case 'created-by-me':
            return get().getTasksICreated(userId);
          case 'all':
            return get().getVisibleTasks(userId);
          default:
            return [];
        }
      },

      // Notification methods
      getUnseenTasksCount: (userId) => {
        const { tasks } = get();

        return tasks.filter((t) => {
          // Check if user is assignee and task is unseen by assignee
          const isAssignee = isUserAssignedToTask(userId, t);
          if (isAssignee && t.seenByAssignee === false) return true;

          // Check if user is creator and task is unseen by creator
          if (t.createdBy === userId && t.seenByCreator === false) return true;

          // Check if user is delegatee and task is unseen by delegatee
          if (t.delegatedTo === userId && t.seenByDelegatee === false) return true;

          // Check if user is delegator and task in pending-review is unseen
          if (t.delegatedBy === userId && t.status === 'pending-review' && t.seenByAssignee === false) return true;

          return false;
        }).length;
      },

      getUnresolvedTasksCount: (userId) => {
        const { tasks } = get();

        // Počet úkolů v "Moje úkoly" (bez approved)
        const myTasksCount = tasks.filter((t) => {
          const isAssigned = isUserAssignedToTask(userId, t);
          const isDelegatedToMe = t.delegatedTo === userId;
          const isDelegatedByMe = t.delegatedBy === userId && t.status === 'pending-review';

          if (!isAssigned && !isDelegatedToMe && !isDelegatedByMe) return false;
          if (t.status === 'approved') return false;

          return true;
        }).length;

        // Počet úkolů v "Vytvořené mnou" (bez approved, bez duplicit z myTasks)
        const createdByMeCount = tasks.filter((t) => {
          if (t.createdBy !== userId) return false;
          if (t.status === 'approved') return false;

          // Vyloučit duplicity - úkoly které už jsou v "Moje úkoly"
          const isAssigned = isUserAssignedToTask(userId, t);
          const isDelegatedToMe = t.delegatedTo === userId;
          const isDelegatedByMe = t.delegatedBy === userId && t.status === 'pending-review';

          if (isAssigned || isDelegatedToMe || isDelegatedByMe) return false;

          return true;
        }).length;

        return myTasksCount + createdByMeCount;
      },

      markTaskAsSeen: (taskId, userId) => {
        set((state) => ({
          tasks: state.tasks.map((t) => {
            if (t.id !== taskId) return t;

            const isAssignee = isUserAssignedToTask(userId, t);
            const isCreator = t.createdBy === userId;
            const isDelegatee = t.delegatedTo === userId;
            const isDelegator = t.delegatedBy === userId;

            return {
              ...t,
              seenByAssignee: (isAssignee || isDelegator) ? true : t.seenByAssignee,
              seenByCreator: isCreator ? true : t.seenByCreator,
              seenByDelegatee: isDelegatee ? true : t.seenByDelegatee,
            };
          }),
        }));
      },

      // Filter actions
      setStatusFilter: (status) => set({ statusFilter: status }),
      setPriorityFilter: (priority) => set({ priorityFilter: priority }),

      // Repeating tasks
      checkAndCreateRepeatingTasks: () => {
        const { tasks } = get();
        const now = new Date();
        const newTasks: Task[] = [];

        tasks.forEach((task) => {
          // Only check approved repeating tasks
          if (task.status !== 'approved' || task.repeat === 'none') return;

          const approvedAt = task.approvedAt ? new Date(task.approvedAt) : null;
          if (!approvedAt) return;

          let shouldCreate = false;
          const taskDeadline = new Date(task.deadline);
          let newDeadlineTime = taskDeadline.getTime();

          switch (task.repeat) {
            case 'daily':
              // Check if at least 1 day has passed
              const daysSinceApproval = (now.getTime() - approvedAt.getTime()) / (1000 * 60 * 60 * 24);
              if (daysSinceApproval >= 1) {
                shouldCreate = true;
                newDeadlineTime = taskDeadline.getTime() + (1000 * 60 * 60 * 24);
              }
              break;
            case 'weekly':
              // Check if at least 7 days have passed
              const weeksSinceApproval = (now.getTime() - approvedAt.getTime()) / (1000 * 60 * 60 * 24 * 7);
              if (weeksSinceApproval >= 1) {
                shouldCreate = true;
                newDeadlineTime = taskDeadline.getTime() + (1000 * 60 * 60 * 24 * 7);
              }
              break;
            case 'monthly':
              // Check if at least 30 days have passed
              const monthsSinceApproval = (now.getTime() - approvedAt.getTime()) / (1000 * 60 * 60 * 24 * 30);
              if (monthsSinceApproval >= 1) {
                shouldCreate = true;
                const newDeadlineDate = new Date(taskDeadline);
                newDeadlineDate.setMonth(newDeadlineDate.getMonth() + 1);
                newDeadlineTime = newDeadlineDate.getTime();
              }
              break;
          }

          // Check if we already created a task from this source
          const existingRepeat = tasks.find(
            (t) => t.repeatSourceId === task.id && t.status !== 'approved'
          );

          if (shouldCreate && !existingRepeat) {
            const newTask: Task = {
              id: `task-${crypto.randomUUID()}`,
              title: task.title,
              description: task.description,
              priority: task.priority,
              status: 'new',
              createdBy: task.createdBy,
              createdAt: new Date().toISOString(),
              assigneeType: task.assigneeType,
              assigneeId: task.assigneeId,
              deadline: new Date(newDeadlineTime).toISOString(),
              repeat: task.repeat,
              repeatSourceId: task.id,
              seenByAssignee: false,
              seenByCreator: true,
              comments: [],
            };

            newTasks.push(newTask);
          }
        });

        if (newTasks.length > 0) {
          set((state) => ({
            tasks: [...state.tasks, ...newTasks],
          }));
        }
      },
    }),
    {
      name: STORAGE_KEYS.TASKS,
      partialize: (state) => ({
        tasks: state.tasks,
      }),
    }
  )
);

// Helper to get modules store without circular dependency
const useModulesStoreRef = () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useModulesStore } = require('@/core/stores/modules-store');
  return useModulesStore.getState();
};

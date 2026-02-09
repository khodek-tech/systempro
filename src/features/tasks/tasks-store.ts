import { create } from 'zustand';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { Task, TaskStatus, TaskPriority, TaskComment, TaskAttachment, ViewRoleMapping } from '@/shared/types';
import { createClient } from '@/lib/supabase/client';
import { mapDbToTask, mapDbToTaskComment, mapTaskToDb, mapTaskCommentToDb } from '@/lib/supabase/mappers';

import { toast } from 'sonner';
import {
  canViewTasksOfUser,
  isUserAssignedToTask,
  getUserPrimaryRoleId,
} from './tasks-helpers';

type TaskTab = 'my-tasks' | 'created-by-me' | 'all';

interface TasksState {
  tasks: Task[];
  _loaded: boolean;
  _loading: boolean;
  tasksViewMode: 'card' | 'view';
  activeTab: TaskTab;
  selectedTaskId: string | null;
  isFormModalOpen: boolean;
  editingTaskId: string | null;
  statusFilter: TaskStatus | 'all';
  priorityFilter: TaskPriority | 'all';
  _realtimeChannel: RealtimeChannel | null;
  _autoSyncInterval: ReturnType<typeof setInterval> | null;
}

interface TasksActions {
  // Fetch
  fetchTasks: () => Promise<void>;

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
  createTask: (task: Omit<Task, 'id' | 'createdAt' | 'comments' | 'status'>) => Promise<{ success: boolean; error?: string }>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<{ success: boolean; error?: string }>;
  deleteTask: (taskId: string) => Promise<{ success: boolean; error?: string }>;

  // Workflow actions
  startTask: (taskId: string, userId: string) => Promise<{ success: boolean; error?: string }>;
  submitForApproval: (taskId: string, userId: string) => Promise<{ success: boolean; error?: string }>;
  approveTask: (taskId: string, approverId: string) => Promise<{ success: boolean; error?: string }>;
  returnTask: (taskId: string, approverId: string, reason?: string) => Promise<{ success: boolean; error?: string }>;

  // Delegation actions
  delegateTask: (taskId: string, delegatorId: string, delegateeId: string) => Promise<{ success: boolean; error?: string }>;
  returnToDelegator: (taskId: string, delegateeId: string) => Promise<{ success: boolean; error?: string }>;
  approveDelegation: (taskId: string, delegatorId: string) => Promise<{ success: boolean; error?: string }>;
  returnToDelegatee: (taskId: string, delegatorId: string, reason?: string) => Promise<{ success: boolean; error?: string }>;

  // Comment actions
  addComment: (taskId: string, userId: string, text: string, attachments?: TaskAttachment[]) => Promise<{ success: boolean; error?: string }>;

  // Getters
  getTaskById: (taskId: string) => Task | undefined;
  getMyTasks: (userId: string) => Task[];
  getTasksICreated: (userId: string) => Task[];
  getVisibleTasks: (userId: string) => Task[];
  getFilteredTasks: (userId: string) => Task[];

  // Notification methods
  getUnseenTasksCount: (userId: string) => number;
  getUnresolvedTasksCount: (userId: string) => number;
  markTaskAsSeen: (taskId: string, userId: string) => Promise<void>;

  // Filter actions
  setStatusFilter: (status: TaskStatus | 'all') => void;
  setPriorityFilter: (priority: TaskPriority | 'all') => void;

  // Realtime
  subscribeRealtime: () => void;
  unsubscribeRealtime: () => void;

  // Auto-sync
  startAutoSync: () => void;
  stopAutoSync: () => void;

  // Repeating tasks
  checkAndCreateRepeatingTasks: () => Promise<void>;
}

async function updateTaskInDb(taskId: string, updates: Partial<Task>): Promise<boolean> {
  const dbData = mapTaskToDb({ ...updates, id: taskId });
  delete dbData.id;

  const supabase = createClient();
  const { error } = await supabase.from('ukoly').update(dbData).eq('id', taskId);
  if (error) {
    console.error('Failed to update task:', error);
    toast.error('Nepodařilo se uložit úkol');
    return false;
  }
  return true;
}

export const useTasksStore = create<TasksState & TasksActions>()((set, get) => ({
  // Initial state
  tasks: [],
  _loaded: false,
  _loading: false,
  tasksViewMode: 'card',
  activeTab: 'my-tasks',
  selectedTaskId: null,
  isFormModalOpen: false,
  editingTaskId: null,
  statusFilter: 'all',
  priorityFilter: 'all',
  _realtimeChannel: null,
  _autoSyncInterval: null,

  // Fetch
  fetchTasks: async () => {
    set({ _loading: true });
    const supabase = createClient();

    const [tasksResult, commentsResult] = await Promise.all([
      supabase.from('ukoly').select('*'),
      supabase.from('komentare_ukolu').select('*'),
    ]);

    if (!tasksResult.error && tasksResult.data) {
      const comments = commentsResult.data?.map(mapDbToTaskComment) ?? [];
      const tasks = tasksResult.data.map((row) => {
        const taskComments = comments.filter((c) => c.taskId === row.id);
        return mapDbToTask(row, taskComments);
      });
      set({ tasks, _loaded: true, _loading: false });
    } else {
      console.error('Failed to fetch tasks:', tasksResult.error);
      set({ _loading: false });
    }
  },

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
  createTask: async (taskData) => {
    const newId = `task-${crypto.randomUUID()}`;
    const newTask: Task = {
      ...taskData,
      id: newId,
      createdAt: new Date().toISOString(),
      status: 'new',
      comments: [],
      seenByAssignee: false,
      seenByCreator: true,
    };

    const dbData = mapTaskToDb(newTask);
    const supabase = createClient();
    const { error } = await supabase.from('ukoly').insert(dbData);
    if (error) {
      console.error('Failed to create task:', error);
      toast.error('Nepodařilo se vytvořit úkol');
      return { success: false, error: error.message };
    }

    set((state) => ({
      tasks: [...state.tasks, newTask],
      isFormModalOpen: false,
      editingTaskId: null,
      activeTab: 'created-by-me',
    }));
    return { success: true };
  },

  updateTask: async (taskId, updates) => {
    const ok = await updateTaskInDb(taskId, updates);
    if (!ok) return { success: false, error: 'Chyba při ukládání' };

    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, ...updates } : t
      ),
    }));
    return { success: true };
  },

  deleteTask: async (taskId) => {
    const supabase = createClient();
    // Delete comments first due to FK
    const { error: commentsError } = await supabase.from('komentare_ukolu').delete().eq('id_ukolu', taskId);
    if (commentsError) {
      console.error('Failed to delete task comments:', commentsError);
      toast.error('Nepodařilo se smazat komentáře úkolu');
      return { success: false, error: commentsError.message };
    }
    const { error } = await supabase.from('ukoly').delete().eq('id', taskId);
    if (error) {
      console.error('Failed to delete task:', error);
      toast.error('Nepodařilo se smazat úkol');
      return { success: false, error: error.message };
    }

    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== taskId),
      selectedTaskId: state.selectedTaskId === taskId ? null : state.selectedTaskId,
    }));
    return { success: true };
  },

  // Workflow actions
  startTask: async (taskId, userId) => {
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

    const updates: Partial<Task> = { status: 'in-progress', seenByCreator: false };
    const ok = await updateTaskInDb(taskId, updates);
    if (!ok) return { success: false, error: 'Chyba při ukládání' };

    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, ...updates } : t
      ),
    }));

    return { success: true };
  },

  submitForApproval: async (taskId, userId) => {
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) {
      return { success: false, error: 'Úkol nenalezen' };
    }

    if (!isUserAssignedToTask(userId, task)) {
      return { success: false, error: 'Nejste přiřazeni k tomuto úkolu' };
    }

    if (task.status !== 'new' && task.status !== 'in-progress' && task.status !== 'returned') {
      return { success: false, error: 'Tento úkol nelze odeslat ke schválení' };
    }

    const updates: Partial<Task> = {
      status: 'pending-approval',
      completedBy: userId,
      completedAt: new Date().toISOString(),
      seenByCreator: false,
    };
    const ok = await updateTaskInDb(taskId, updates);
    if (!ok) return { success: false, error: 'Chyba při ukládání' };

    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, ...updates } : t
      ),
    }));

    return { success: true };
  },

  approveTask: async (taskId, approverId) => {
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

    const updates: Partial<Task> = {
      status: 'approved',
      approvedAt: new Date().toISOString(),
      seenByAssignee: false,
    };
    const ok = await updateTaskInDb(taskId, updates);
    if (!ok) return { success: false, error: 'Chyba při ukládání' };

    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, ...updates } : t
      ),
    }));

    return { success: true };
  },

  returnTask: async (taskId, approverId, reason) => {
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

    const updates: Partial<Task> = {
      status: 'returned',
      returnedAt: new Date().toISOString(),
      returnReason: reason || undefined,
      seenByAssignee: false,
    };
    const ok = await updateTaskInDb(taskId, updates);
    if (!ok) return { success: false, error: 'Chyba při ukládání' };

    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, ...updates } : t
      ),
    }));

    return { success: true };
  },

  // Delegation actions
  delegateTask: async (taskId, delegatorId, delegateeId) => {
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) {
      return { success: false, error: 'Úkol nenalezen' };
    }

    if (!isUserAssignedToTask(delegatorId, task)) {
      return { success: false, error: 'Nejste přiřazeni k tomuto úkolu' };
    }

    if (task.status !== 'new' && task.status !== 'in-progress' && task.status !== 'returned') {
      return { success: false, error: 'Tento úkol nelze delegovat' };
    }

    if (task.delegatedTo) {
      return { success: false, error: 'Úkol je již delegován' };
    }

    const updates: Partial<Task> = {
      status: 'delegated',
      delegatedTo: delegateeId,
      delegatedBy: delegatorId,
      delegatedAt: new Date().toISOString(),
      seenByDelegatee: false,
      seenByAssignee: true,
    };
    const ok = await updateTaskInDb(taskId, updates);
    if (!ok) return { success: false, error: 'Chyba při ukládání' };

    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, ...updates } : t
      ),
    }));

    return { success: true };
  },

  returnToDelegator: async (taskId, delegateeId) => {
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

    const updates: Partial<Task> = {
      status: 'pending-review',
      completedBy: delegateeId,
      completedAt: new Date().toISOString(),
      seenByAssignee: false,
    };
    const ok = await updateTaskInDb(taskId, updates);
    if (!ok) return { success: false, error: 'Chyba při ukládání' };

    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, ...updates } : t
      ),
    }));

    return { success: true };
  },

  approveDelegation: async (taskId, delegatorId) => {
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

    const updates: Partial<Task> = {
      status: 'pending-approval',
      seenByCreator: false,
    };
    const ok = await updateTaskInDb(taskId, updates);
    if (!ok) return { success: false, error: 'Chyba při ukládání' };

    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, ...updates } : t
      ),
    }));

    return { success: true };
  },

  returnToDelegatee: async (taskId, delegatorId, reason) => {
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

    const updates: Partial<Task> = {
      status: 'delegated',
      returnReason: reason || undefined,
      returnedAt: new Date().toISOString(),
      seenByDelegatee: false,
    };
    const ok = await updateTaskInDb(taskId, updates);
    if (!ok) return { success: false, error: 'Chyba při ukládání' };

    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, ...updates } : t
      ),
    }));

    return { success: true };
  },

  // Comment actions
  addComment: async (taskId, userId, text, attachments = []) => {
    const newComment: TaskComment = {
      id: `comment-${crypto.randomUUID()}`,
      taskId,
      userId,
      text,
      attachments,
      createdAt: new Date().toISOString(),
    };

    const dbData = mapTaskCommentToDb(newComment);
    const supabase = createClient();
    const { error } = await supabase.from('komentare_ukolu').insert(dbData);
    if (error) {
      console.error('Failed to add comment:', error);
      toast.error('Nepodařilo se přidat komentář');
      return { success: false, error: error.message };
    }

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

    // Also update seen flags in DB
    const task = get().tasks.find((t) => t.id === taskId);
    if (task) {
      const isCreator = task.createdBy === userId;
      const seenUpdates: Record<string, boolean> = {};
      if (isCreator) {
        seenUpdates.precteno_prirazenym = false;
      } else {
        seenUpdates.precteno_zadavatelem = false;
      }
      const { error: seenError } = await supabase.from('ukoly').update(seenUpdates).eq('id', taskId);
      if (seenError) {
        console.error('Failed to update seen flags after comment:', seenError);
      }
    }
    return { success: true };
  },

  // Getters
  getTaskById: (taskId) => {
    return get().tasks.find((t) => t.id === taskId);
  },

  getMyTasks: (userId) => {
    const { tasks, statusFilter, priorityFilter } = get();

    return tasks
      .filter((t) => {
        const isAssigned = isUserAssignedToTask(userId, t);
        const isDelegatedToMe = t.delegatedTo === userId;
        const isDelegatedByMe = t.delegatedBy === userId && t.status === 'pending-review';
        const isPendingMyApproval = t.createdBy === userId && t.status === 'pending-approval';

        if (!isAssigned && !isDelegatedToMe && !isDelegatedByMe && !isPendingMyApproval) return false;

        // Hide approved tasks from "Moje úkoly"
        if (t.status === 'approved') return false;

        if (statusFilter !== 'all' && t.status !== statusFilter) return false;
        if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;

        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getTasksICreated: (userId) => {
    const { tasks, statusFilter, priorityFilter } = get();

    return tasks
      .filter((t) => {
        if (t.createdBy !== userId) return false;
        if (t.status === 'approved') return false;

        if (statusFilter !== 'all' && t.status !== statusFilter) return false;
        if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;

        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getVisibleTasks: (userId) => {
    const { tasks, statusFilter, priorityFilter } = get();
    const viewerRoleId = getUserPrimaryRoleId(userId);

    if (!viewerRoleId) {
      return get().getMyTasks(userId);
    }

    return tasks
      .filter((t) => {
        const isMyTask = isUserAssignedToTask(userId, t);
        const iCreatedIt = t.createdBy === userId;

        let canViewAssignee = false;
        if (t.assigneeType === 'employee') {
          canViewAssignee = canViewTasksOfUser(userId, t.assigneeId);
        }

        if (t.assigneeType === 'store' && !isMyTask && !iCreatedIt) {
          const config = useModulesStoreRef().getModuleConfig('tasks');
          const viewMapping = config?.viewMappings?.find((m: ViewRoleMapping) => m.viewerRoleId === viewerRoleId);
          canViewAssignee = (viewMapping?.visibleRoleIds.length || 0) > 0;
        }

        if (!isMyTask && !iCreatedIt && !canViewAssignee) return false;

        if (statusFilter !== 'all' && t.status !== statusFilter) return false;
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
      const isAssignee = isUserAssignedToTask(userId, t);
      if (isAssignee && t.seenByAssignee === false) return true;

      if (t.createdBy === userId && t.seenByCreator === false) return true;

      if (t.delegatedTo === userId && t.seenByDelegatee === false) return true;

      if (t.delegatedBy === userId && t.status === 'pending-review' && t.seenByAssignee === false) return true;

      return false;
    }).length;
  },

  getUnresolvedTasksCount: (userId) => {
    const { tasks } = get();

    const myTasksCount = tasks.filter((t) => {
      const isAssigned = isUserAssignedToTask(userId, t);
      const isDelegatedToMe = t.delegatedTo === userId;
      const isDelegatedByMe = t.delegatedBy === userId && t.status === 'pending-review';

      if (!isAssigned && !isDelegatedToMe && !isDelegatedByMe) return false;
      if (t.status === 'approved') return false;

      return true;
    }).length;

    const createdByMeCount = tasks.filter((t) => {
      if (t.createdBy !== userId) return false;
      if (t.status === 'approved') return false;

      const isAssigned = isUserAssignedToTask(userId, t);
      const isDelegatedToMe = t.delegatedTo === userId;
      const isDelegatedByMe = t.delegatedBy === userId && t.status === 'pending-review';

      if (isAssigned || isDelegatedToMe || isDelegatedByMe) return false;

      return true;
    }).length;

    return myTasksCount + createdByMeCount;
  },

  markTaskAsSeen: async (taskId, userId) => {
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) return;

    const isAssignee = isUserAssignedToTask(userId, task);
    const isCreator = task.createdBy === userId;
    const isDelegatee = task.delegatedTo === userId;
    const isDelegator = task.delegatedBy === userId;

    const localUpdates: Partial<Task> = {};
    const dbUpdates: Record<string, boolean> = {};

    if (isAssignee || isDelegator) {
      localUpdates.seenByAssignee = true;
      dbUpdates.precteno_prirazenym = true;
    }
    if (isCreator) {
      localUpdates.seenByCreator = true;
      dbUpdates.precteno_zadavatelem = true;
    }
    if (isDelegatee) {
      localUpdates.seenByDelegatee = true;
      dbUpdates.precteno_delegovanym = true;
    }

    if (Object.keys(dbUpdates).length > 0) {
      const supabase = createClient();
      const { error } = await supabase.from('ukoly').update(dbUpdates).eq('id', taskId);
      if (error) {
        console.error('Failed to mark task as seen:', error);
      }
    }

    set((state) => ({
      tasks: state.tasks.map((t) => {
        if (t.id !== taskId) return t;
        return { ...t, ...localUpdates };
      }),
    }));
  },

  // Filter actions
  setStatusFilter: (status) => set({ statusFilter: status }),
  setPriorityFilter: (priority) => set({ priorityFilter: priority }),

  // Realtime
  subscribeRealtime: () => {
    get()._realtimeChannel?.unsubscribe();

    const supabase = createClient();

    const channel = supabase
      .channel('tasks-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ukoly',
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          if (payload.eventType === 'INSERT') {
            const comments = get().tasks.find((t) => t.id === payload.new.id)?.comments ?? [];
            const newTask = mapDbToTask(payload.new, comments);
            const exists = get().tasks.some((t) => t.id === newTask.id);
            if (!exists) {
              set({ tasks: [...get().tasks, newTask] });
            }
          } else if (payload.eventType === 'UPDATE') {
            const existingTask = get().tasks.find((t) => t.id === payload.new.id);
            const comments = existingTask?.comments ?? [];
            const updated = mapDbToTask(payload.new, comments);
            set({
              tasks: get().tasks.map((t) =>
                t.id === updated.id ? { ...t, ...updated, comments: t.comments } : t,
              ),
            });
          } else if (payload.eventType === 'DELETE') {
            const oldId = payload.old?.id;
            if (oldId) {
              set({ tasks: get().tasks.filter((t) => t.id !== oldId) });
            }
          }
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'komentare_ukolu',
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          const newComment = mapDbToTaskComment(payload.new);
          set({
            tasks: get().tasks.map((t) => {
              if (t.id !== newComment.taskId) return t;
              const exists = t.comments.some((c) => c.id === newComment.id);
              if (exists) return t;
              return { ...t, comments: [...t.comments, newComment] };
            }),
          });
        },
      )
      .subscribe((status, err) => {
        if (err) console.error('[tasks-realtime]', status, err);
        // Re-fetch tasks after reconnect to catch missed events
        if (status === 'SUBSCRIBED' && get()._loaded) {
          get().fetchTasks();
        }
      });

    set({ _realtimeChannel: channel });
  },

  unsubscribeRealtime: () => {
    get()._realtimeChannel?.unsubscribe();
    set({ _realtimeChannel: null });
  },

  // Auto-sync
  startAutoSync: () => {
    const existing = get()._autoSyncInterval;
    if (existing) clearInterval(existing);

    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        get().fetchTasks();
        get().checkAndCreateRepeatingTasks();
      }
    }, 30_000);

    set({ _autoSyncInterval: interval });
  },

  stopAutoSync: () => {
    const interval = get()._autoSyncInterval;
    if (interval) clearInterval(interval);
    set({ _autoSyncInterval: null });
  },

  // Repeating tasks
  checkAndCreateRepeatingTasks: async () => {
    const { tasks } = get();
    const now = new Date();
    const newTasks: Task[] = [];

    tasks.forEach((task) => {
      if (task.status !== 'approved' || task.repeat === 'none') return;

      const approvedAt = task.approvedAt ? new Date(task.approvedAt) : null;
      if (!approvedAt) return;

      let shouldCreate = false;
      const taskDeadline = new Date(task.deadline);
      let newDeadlineTime = taskDeadline.getTime();

      switch (task.repeat) {
        case 'daily': {
          const daysSinceApproval = (now.getTime() - approvedAt.getTime()) / (1000 * 60 * 60 * 24);
          if (daysSinceApproval >= 1) {
            shouldCreate = true;
            newDeadlineTime = taskDeadline.getTime() + (1000 * 60 * 60 * 24);
          }
          break;
        }
        case 'weekly': {
          const weeksSinceApproval = (now.getTime() - approvedAt.getTime()) / (1000 * 60 * 60 * 24 * 7);
          if (weeksSinceApproval >= 1) {
            shouldCreate = true;
            newDeadlineTime = taskDeadline.getTime() + (1000 * 60 * 60 * 24 * 7);
          }
          break;
        }
        case 'monthly': {
          const monthsSinceApproval = (now.getTime() - approvedAt.getTime()) / (1000 * 60 * 60 * 24 * 30);
          if (monthsSinceApproval >= 1) {
            shouldCreate = true;
            const newDeadlineDate = new Date(taskDeadline);
            newDeadlineDate.setMonth(newDeadlineDate.getMonth() + 1);
            newDeadlineTime = newDeadlineDate.getTime();
          }
          break;
        }
        case 'yearly': {
          const yearsSinceApproval = (now.getTime() - approvedAt.getTime()) / (1000 * 60 * 60 * 24 * 365);
          if (yearsSinceApproval >= 1) {
            shouldCreate = true;
            const newDeadlineDate = new Date(taskDeadline);
            newDeadlineDate.setFullYear(newDeadlineDate.getFullYear() + 1);
            newDeadlineTime = newDeadlineDate.getTime();
          }
          break;
        }
      }

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
      const supabase = createClient();
      const dbRows = newTasks.map((t) => mapTaskToDb(t));
      const { error } = await supabase.from('ukoly').insert(dbRows);
      if (error) {
        console.error('Failed to create repeating tasks:', error);
        return;
      }

      set((state) => ({
        tasks: [...state.tasks, ...newTasks],
      }));
    }
  },
}));

// Helper to get modules store without circular dependency
const useModulesStoreRef = () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useModulesStore } = require('@/core/stores/modules-store');
  return useModulesStore.getState();
};

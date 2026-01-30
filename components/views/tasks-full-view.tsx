'use client';

import { ArrowLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TaskCard } from '@/components/shared/task-card';
import { TaskDetailModal } from '@/components/shared/task-detail-modal';
import { TaskFormModal } from '@/components/shared/task-form-modal';
import { useTasksStore } from '@/stores/tasks-store';
import { useAuthStore } from '@/stores/auth-store';
import { TaskStatus, TaskPriority } from '@/types';
import { cn } from '@/lib/utils';

const STATUS_OPTIONS: { value: TaskStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Všechny stavy' },
  { value: 'new', label: 'Nový' },
  { value: 'in-progress', label: 'Rozpracovaný' },
  { value: 'pending-approval', label: 'Čeká na schválení' },
  { value: 'returned', label: 'Vráceno' },
  { value: 'approved', label: 'Schváleno' },
];

const PRIORITY_OPTIONS: { value: TaskPriority | 'all'; label: string }[] = [
  { value: 'all', label: 'Všechny priority' },
  { value: 'high', label: 'Vysoká' },
  { value: 'medium', label: 'Střední' },
  { value: 'low', label: 'Nízká' },
];

const TABS = [
  { id: 'my-tasks' as const, label: 'Moje úkoly' },
  { id: 'created-by-me' as const, label: 'Vytvořené mnou' },
  { id: 'all' as const, label: 'Všechny' },
];

export function TasksFullView() {
  const {
    activeTab,
    statusFilter,
    priorityFilter,
    selectedTaskId,
    isFormModalOpen,
    closeTasksView,
    setActiveTab,
    setStatusFilter,
    setPriorityFilter,
    getFilteredTasks,
    openFormModal,
  } = useTasksStore();
  const { currentUser } = useAuthStore();

  const tasks = currentUser ? getFilteredTasks(currentUser.id) : [];

  return (
    <main className="flex-1 p-6 overflow-y-auto bg-slate-50">
      <div className="space-y-6 pb-16 animate-in fade-in duration-300">
        {/* Header with back button and filters */}
        <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <Button
            onClick={closeTasksView}
            variant="outline"
            className="px-4 py-2 rounded-lg text-xs font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zpět
          </Button>

          <h1 className="text-xl font-bold text-slate-800">Úkoly</h1>

          <div className="flex items-center space-x-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as TaskStatus | 'all')}
              className="bg-slate-50 font-medium text-xs rounded-lg px-3 py-2 outline-none border border-slate-200"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | 'all')}
              className="bg-slate-50 font-medium text-xs rounded-lg px-3 py-2 outline-none border border-slate-200"
            >
              {PRIORITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <Button
              onClick={() => openFormModal()}
              className="bg-violet-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-violet-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nový úkol
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all',
                activeTab === tab.id
                  ? 'bg-violet-100 text-violet-700'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Task list */}
        <div className="space-y-4">
          {tasks.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
              <p className="text-slate-500 font-medium">Žádné úkoly k zobrazení</p>
            </div>
          ) : (
            tasks.map((task) => <TaskCard key={task.id} task={task} />)
          )}
        </div>
      </div>

      {/* Modals */}
      {selectedTaskId && <TaskDetailModal />}
      {isFormModalOpen && <TaskFormModal />}
    </main>
  );
}

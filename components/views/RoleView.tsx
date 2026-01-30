'use client';

import { ReactNode } from 'react';
import { ModuleRenderer } from '@/components/ModuleRenderer';
import { AbsenceFullView } from '@/components/views/absence-full-view';
import { ApprovalFullView } from '@/components/views/approval-full-view';
import { ShiftsFullView } from '@/components/views/shifts-full-view';
import { TasksFullView } from '@/components/views/tasks-full-view';
import { useAbsenceStore } from '@/stores/absence-store';
import { useShiftsStore } from '@/stores/shifts-store';
import { useTasksStore } from '@/stores/tasks-store';

interface RoleViewProps {
  /**
   * Whether to show fullscreen absence view when absenceViewMode === 'view'
   */
  showAbsenceFullView?: boolean;
  /**
   * Whether to show fullscreen approval view when approvalViewMode === 'view'
   */
  showApprovalFullView?: boolean;
  /**
   * Whether to show fullscreen shifts view when shiftsViewMode === 'view'
   */
  showShiftsFullView?: boolean;
  /**
   * Whether to show fullscreen tasks view when tasksViewMode === 'view'
   */
  showTasksFullView?: boolean;
  /**
   * Optional custom content to render instead of ModuleRenderer
   */
  customContent?: ReactNode;
  /**
   * Whether to use warehouse mode for ModuleRenderer (no bg-slate-50, no mt-6)
   */
  isWarehouse?: boolean;
  /**
   * Additional class names for the main element
   */
  className?: string;
}

/**
 * Generic role view component that handles fullscreen views for absence and approval.
 * Use this instead of creating separate view components for each role.
 *
 * @example
 * // Simple view with absence fullscreen
 * <RoleView showAbsenceFullView />
 *
 * // View with both absence and approval fullscreen
 * <RoleView showAbsenceFullView showApprovalFullView />
 *
 * // Approval only (like Majitel)
 * <RoleView showApprovalFullView />
 *
 * // Custom content with warehouse mode
 * <RoleView isWarehouse customContent={<WarehouseContent />} />
 */
export function RoleView({
  showAbsenceFullView = false,
  showApprovalFullView = false,
  showShiftsFullView = false,
  showTasksFullView = false,
  customContent,
  isWarehouse = false,
  className = '',
}: RoleViewProps) {
  const { absenceViewMode, approvalViewMode } = useAbsenceStore();
  const { shiftsViewMode } = useShiftsStore();
  const { tasksViewMode } = useTasksStore();

  // Fullscreen tasks view has priority
  if (showTasksFullView && tasksViewMode === 'view') {
    return <TasksFullView />;
  }

  // Fullscreen approval view
  if (showApprovalFullView && approvalViewMode === 'view') {
    return <ApprovalFullView />;
  }

  // Fullscreen absence view
  if (showAbsenceFullView && absenceViewMode === 'view') {
    return <AbsenceFullView />;
  }

  // Fullscreen shifts view
  if (showShiftsFullView && shiftsViewMode === 'view') {
    return <ShiftsFullView />;
  }

  // Custom content or default ModuleRenderer
  const content = customContent ?? <ModuleRenderer isWarehouse={isWarehouse} />;

  // Base classes for main element
  const baseClasses = 'flex-1 flex flex-col items-center p-8 relative overflow-y-auto';
  const bgClass = isWarehouse ? '' : 'bg-slate-50';
  const containerClass = isWarehouse ? 'w-full px-6' : 'w-full mt-6 px-6';

  return (
    <main className={`${baseClasses} ${bgClass} ${className}`.trim()}>
      <div className={containerClass}>{content}</div>
    </main>
  );
}

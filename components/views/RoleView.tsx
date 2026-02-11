'use client';

import { ReactNode } from 'react';
import { ModuleRenderer } from '@/components/ModuleRenderer';
import { AbsenceFullView } from '@/components/views/absence-full-view';
import { ApprovalFullView } from '@/components/views/approval-full-view';
import { ShiftsFullView } from '@/components/views/shifts-full-view';
import { TasksFullView } from '@/components/views/tasks-full-view';
import { ChatFullView } from '@/components/views/chat-full-view';
import { EmailFullView } from '@/components/views/email-full-view';
import { PresenceFullView } from '@/components/views/presence-full-view';
import { ManualFullView } from '@/components/views/manual-full-view';
import { useAbsenceStore } from '@/stores/absence-store';
import { useShiftsStore } from '@/stores/shifts-store';
import { useTasksStore } from '@/stores/tasks-store';
import { useChatStore } from '@/stores/chat-store';
import { useEmailStore } from '@/stores/email-store';
import { useManualStore } from '@/stores/manual-store';
import { usePresenceStore } from '@/stores/presence-store';

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
   * Whether to show fullscreen chat view when chatViewMode === 'view'
   */
  showChatFullView?: boolean;
  /**
   * Whether to show fullscreen email view when emailViewMode === 'view'
   */
  showEmailFullView?: boolean;
  /**
   * Whether to show fullscreen presence view when presenceViewMode === 'view'
   */
  showPresenceFullView?: boolean;
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
  showChatFullView = false,
  showEmailFullView = false,
  showPresenceFullView = false,
  customContent,
  isWarehouse = false,
  className = '',
}: RoleViewProps) {
  const { absenceViewMode, approvalViewMode } = useAbsenceStore();
  const { shiftsViewMode } = useShiftsStore();
  const { tasksViewMode } = useTasksStore();
  const { chatViewMode } = useChatStore();
  const { emailViewMode } = useEmailStore();
  const { manualViewMode } = useManualStore();
  const { presenceViewMode } = usePresenceStore();

  // Fullscreen manual view has highest priority
  if (manualViewMode === 'view') {
    return <ManualFullView />;
  }

  // Fullscreen email view
  if (showEmailFullView && emailViewMode === 'view') {
    return <EmailFullView />;
  }

  // Fullscreen chat view has priority
  if (showChatFullView && chatViewMode === 'view') {
    return <ChatFullView />;
  }

  // Fullscreen tasks view
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

  // Fullscreen presence view
  if (showPresenceFullView && presenceViewMode === 'view') {
    return <PresenceFullView />;
  }

  // Custom content or default ModuleRenderer
  const content = customContent ?? <ModuleRenderer isWarehouse={isWarehouse} />;

  // Base classes for main element
  const baseClasses = 'flex-1 flex flex-col items-center p-8 relative overflow-y-auto lg:overflow-hidden';
  const bgClass = isWarehouse ? '' : 'bg-slate-50';
  const containerClass = isWarehouse ? 'w-full px-6' : 'w-full mt-6 px-6';

  return (
    <main className={`${baseClasses} ${bgClass} ${className}`.trim()}>
      <div className={containerClass}>{content}</div>
    </main>
  );
}

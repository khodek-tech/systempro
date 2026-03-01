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
import { PickingView } from '@/components/prevodky/PickingView';
import { EshopProduktyFullView } from '@/components/views/eshop-produkty-full-view';
import { EshopEshopyFullView } from '@/components/views/eshop-eshopy-full-view';
import { EshopObjednavkyFullView } from '@/components/views/eshop-objednavky-full-view';
import { usePrevodkyStore } from '@/stores/prevodky-store';
import { useEshopProduktyStore } from '@/stores/eshop-produkty-store';
import { useEshopEshopyStore } from '@/stores/eshop-eshopy-store';
import { useEshopObjednavkyStore } from '@/stores/eshop-objednavky-store';
import { EshopPageBuilderFullView } from '@/components/views/eshop-page-builder-full-view';
import { EshopBlogFullView } from '@/components/views/eshop-blog-full-view';
import { EshopDashboardFullView } from '@/components/views/eshop-dashboard-full-view';
import { useEshopPageBuilderStore } from '@/stores/eshop-page-builder-store';
import { useEshopBlogStore } from '@/stores/eshop-blog-store';
import { useEshopDashboardStore } from '@/stores/eshop-dashboard-store';

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
   * Whether to show fullscreen eshop produkty view when produktyViewMode === 'view'
   */
  showEshopProduktyFullView?: boolean;
  /**
   * Whether to show fullscreen eshop eshopy view when eshopyViewMode === 'view'
   */
  showEshopEshopyFullView?: boolean;
  /**
   * Whether to show fullscreen eshop objednavky view when objednavkyViewMode === 'view'
   */
  showEshopObjednavkyFullView?: boolean;
  /**
   * Whether to show fullscreen page builder view when pageBuilderViewMode === 'view'
   */
  showEshopPageBuilderFullView?: boolean;
  /**
   * Whether to show fullscreen blog view when blogViewMode === 'view'
   */
  showEshopBlogFullView?: boolean;
  /**
   * Whether to show fullscreen dashboard view when dashboardViewMode === 'view'
   */
  showEshopDashboardFullView?: boolean;
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
  showEshopProduktyFullView = false,
  showEshopEshopyFullView = false,
  showEshopObjednavkyFullView = false,
  showEshopPageBuilderFullView = false,
  showEshopBlogFullView = false,
  showEshopDashboardFullView = false,
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
  const { pickingPrevodkaId } = usePrevodkyStore();
  const { produktyViewMode } = useEshopProduktyStore();
  const { eshopyViewMode } = useEshopEshopyStore();
  const { objednavkyViewMode } = useEshopObjednavkyStore();
  const { pageBuilderViewMode } = useEshopPageBuilderStore();
  const { blogViewMode } = useEshopBlogStore();
  const { dashboardViewMode } = useEshopDashboardStore();

  // Fullscreen picking view has highest priority (above all)
  if (pickingPrevodkaId) {
    return <PickingView />;
  }

  // Fullscreen manual view has highest priority
  if (manualViewMode === 'view') {
    return <ManualFullView />;
  }

  // Fullscreen dashboard view
  if (showEshopDashboardFullView && dashboardViewMode === 'view') {
    return <EshopDashboardFullView />;
  }

  // Fullscreen blog view
  if (showEshopBlogFullView && blogViewMode === 'view') {
    return <EshopBlogFullView />;
  }

  // Fullscreen page builder view
  if (showEshopPageBuilderFullView && pageBuilderViewMode === 'view') {
    return <EshopPageBuilderFullView />;
  }

  // Fullscreen eshop objednavky view
  if (showEshopObjednavkyFullView && objednavkyViewMode === 'view') {
    return <EshopObjednavkyFullView />;
  }

  // Fullscreen eshop eshopy view
  if (showEshopEshopyFullView && eshopyViewMode === 'view') {
    return <EshopEshopyFullView />;
  }

  // Fullscreen eshop produkty view
  if (showEshopProduktyFullView && produktyViewMode === 'view') {
    return <EshopProduktyFullView />;
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

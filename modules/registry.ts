import { ComponentType } from 'react';
import { CashInfoModule } from './CashInfoModule';
import { SalesModule } from './SalesModule';
import { CollectModule } from './CollectModule';
import { AbsenceReportModule } from './AbsenceReportModule';
import { AbsenceApprovalModule } from './AbsenceApprovalModule';
import { TasksModule } from './TasksModule';
import { KpiDashboardModule } from './KpiDashboardModule';
import { ReportsModule } from './ReportsModule';
import { PlaceholderModule } from './PlaceholderModule';

// Registry mapping component names to actual React components
export const MODULE_REGISTRY: Record<string, ComponentType> = {
  CashInfoModule,
  SalesModule,
  CollectModule,
  AbsenceReportModule,
  AbsenceApprovalModule,
  TasksModule,
  KpiDashboardModule,
  ReportsModule,
  PlaceholderModule,
};

// Helper to get component by name
export function getModuleComponent(componentName: string): ComponentType | null {
  return MODULE_REGISTRY[componentName] || null;
}

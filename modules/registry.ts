/**
 * Module Registry
 *
 * HOW TO ADD A NEW MODULE:
 * ========================
 *
 * 1. Create the module component:
 *    - Create `modules/YourModule.tsx`
 *    - Export a React component (e.g., `export function YourModule() { ... }`)
 *
 * 2. Register the component here:
 *    - Import: `import { YourModule } from './YourModule';`
 *    - Add to MODULE_REGISTRY: `YourModule,`
 *
 * 3. Export from index (optional but recommended):
 *    - Add to `modules/index.ts`: `export { YourModule } from './YourModule';`
 *
 * 4. Define the module in config/default-modules.ts:
 *    - Add to DEFAULT_MODULE_DEFINITIONS: { id, name, description, component, icon }
 *    - Add to DEFAULT_MODULE_CONFIGS: { moduleId, roleIds, order, column, enabled }
 *
 * 5. Column types:
 *    - 'top': Full-width banner at the top
 *    - 'left': Left column in grid layout
 *    - 'right': Right column in grid layout
 *    - 'full': Full-width module
 *    - 'header': Special handling in header.tsx (not rendered by ModuleRenderer)
 *
 * 6. For header modules (column: 'header'):
 *    - Requires custom handling in `components/header.tsx`
 *    - Registration in MODULE_REGISTRY is optional
 *
 * IMPORTANT: After adding a new module, clear localStorage if testing locally
 * to ensure the new module config is picked up.
 */

import { ComponentType } from 'react';
import { CashInfoModule } from './CashInfoModule';
import { SalesModule } from './SalesModule';
import { CollectModule } from './CollectModule';
import { AbsenceReportModule } from './AbsenceReportModule';
import { AbsenceApprovalModule } from './AbsenceApprovalModule';
import { TasksModule } from './TasksModule';
import { KpiDashboardModule } from './KpiDashboardModule';
import { ReportsModule } from './ReportsModule';
import { ShiftsModule } from './ShiftsModule';
import { PresenceModule } from './PresenceModule';
import { ChatModule } from './ChatModule';
import { EmailModule } from './EmailModule';
import { MotivationModule } from './MotivationModule';

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
  ShiftsModule,
  PresenceModule,
  ChatModule,
  EmailModule,
  MotivationModule,
};

// Helper to get component by name
export function getModuleComponent(componentName: string): ComponentType | null {
  return MODULE_REGISTRY[componentName] || null;
}

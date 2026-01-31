import { ModuleDefinition, ModuleConfig } from '@/types';

// Default module definitions
export const DEFAULT_MODULE_DEFINITIONS: ModuleDefinition[] = [
  {
    id: 'cash-info',
    name: 'Stav pokladny',
    description: 'Přehled hotovosti k odevzdání a provozní základna',
    component: 'CashInfoModule',
    icon: 'Info',
  },
  {
    id: 'sales',
    name: 'Tržby',
    description: 'Evidence denních tržeb',
    component: 'SalesModule',
    icon: 'Wallet',
  },
  {
    id: 'collect',
    name: 'Odvody',
    description: 'Evidence odvodů hotovosti',
    component: 'CollectModule',
    icon: 'Send',
  },
  {
    id: 'absence-report',
    name: 'Absence',
    description: 'Hlášení nepřítomnosti',
    component: 'AbsenceReportModule',
    icon: 'Umbrella',
  },
  {
    id: 'absence-approval',
    name: 'Schvalování',
    description: 'Schvalování žádostí o absenci',
    component: 'AbsenceApprovalModule',
    icon: 'ClipboardCheck',
  },
  {
    id: 'tasks',
    name: 'Úkoly',
    description: 'Seznam úkolů',
    component: 'TasksModule',
    icon: 'CheckSquare',
  },
  {
    id: 'kpi-dashboard',
    name: 'KPI Dashboard',
    description: 'Přehled klíčových ukazatelů',
    component: 'KpiDashboardModule',
    icon: 'ChartColumnIncreasing',
  },
  {
    id: 'reports',
    name: 'Tržba a Docházka',
    description: 'Reporty tržeb a docházky',
    component: 'ReportsModule',
    icon: 'ChartColumnIncreasing',
  },
  {
    id: 'attendance',
    name: 'Docházka',
    description: 'Evidence příchodů a odchodů zaměstnanců',
    component: 'HeaderAttendance',
    icon: 'Clock',
  },
  {
    id: 'shifts',
    name: 'Směny',
    description: 'Plánování a přehled směn',
    component: 'ShiftsModule',
    icon: 'Calendar',
  },
  {
    id: 'presence',
    name: 'Přítomnost',
    description: 'Přehled přítomnosti zaměstnanců na směně',
    component: 'PresenceModule',
    icon: 'Users',
  },
  {
    id: 'chat',
    name: 'Chat',
    description: 'Skupinové konverzace',
    component: 'ChatModule',
    icon: 'MessageCircle',
  },
];

// Default module configuration
// role-1: Prodavač
// role-2: Administrátor
// role-3: Skladník
// role-4: Vedoucí skladu
// role-5: Obsluha e-shopu
// role-6: Obchodník
// role-7: Vedoucí velkoobchodu
// role-8: Majitel
export const DEFAULT_MODULE_CONFIGS: ModuleConfig[] = [
  {
    moduleId: 'cash-info',
    roleIds: ['role-1'],
    order: 0,
    column: 'top',
    enabled: true,
  },
  {
    moduleId: 'sales',
    roleIds: ['role-1'],
    order: 1,
    column: 'left',
    enabled: true,
  },
  {
    moduleId: 'collect',
    roleIds: ['role-1'],
    order: 2,
    column: 'left',
    enabled: true,
  },
  {
    moduleId: 'absence-report',
    roleIds: ['role-1', 'role-3', 'role-4', 'role-5', 'role-6', 'role-7'],
    order: 3,
    column: 'left',
    enabled: true,
  },
  {
    moduleId: 'absence-approval',
    roleIds: ['role-2', 'role-4', 'role-7', 'role-8'],
    order: 4,
    column: 'left',
    enabled: true,
    approvalMappings: [
      { approverRoleId: 'role-4', subordinateRoleIds: ['role-3', 'role-5'] },
      { approverRoleId: 'role-7', subordinateRoleIds: ['role-1', 'role-6'] },
      { approverRoleId: 'role-2', subordinateRoleIds: ['role-4', 'role-7'] },
      { approverRoleId: 'role-8', subordinateRoleIds: ['role-2', 'role-4', 'role-7', 'role-1', 'role-3', 'role-5', 'role-6'] },
    ],
  },
  {
    moduleId: 'tasks',
    roleIds: ['role-1', 'role-3', 'role-4', 'role-5', 'role-6', 'role-7', 'role-2', 'role-8'],
    order: 5,
    column: 'left',
    enabled: true,
    viewMappings: [
      { viewerRoleId: 'role-4', visibleRoleIds: ['role-3', 'role-5'] },
      { viewerRoleId: 'role-7', visibleRoleIds: ['role-1', 'role-6'] },
      { viewerRoleId: 'role-2', visibleRoleIds: ['role-1', 'role-3', 'role-4', 'role-5', 'role-6', 'role-7'] },
      { viewerRoleId: 'role-8', visibleRoleIds: ['role-1', 'role-2', 'role-3', 'role-4', 'role-5', 'role-6', 'role-7'] },
    ],
  },
  {
    moduleId: 'kpi-dashboard',
    roleIds: ['role-2', 'role-8'],
    order: 0,
    column: 'top',
    enabled: true,
  },
  {
    moduleId: 'reports',
    roleIds: ['role-2'],
    order: 1,
    column: 'left',
    enabled: true,
  },
  {
    moduleId: 'attendance',
    roleIds: ['role-1', 'role-3', 'role-4', 'role-5', 'role-6', 'role-7'],
    order: 0,
    column: 'header',
    enabled: true,
  },
  {
    moduleId: 'shifts',
    roleIds: ['role-1', 'role-3', 'role-5', 'role-6'],
    order: 6,
    column: 'left',
    enabled: true,
    viewMappings: [
      { viewerRoleId: 'role-7', visibleRoleIds: ['role-1', 'role-6'] },
      { viewerRoleId: 'role-8', visibleRoleIds: ['role-1', 'role-3', 'role-4', 'role-5', 'role-6', 'role-7'] },
    ],
  },
  {
    moduleId: 'presence',
    roleIds: ['role-4', 'role-7', 'role-2', 'role-8'],
    order: 3,
    column: 'sidebar',
    enabled: true,
    viewMappings: [
      { viewerRoleId: 'role-4', visibleRoleIds: ['role-3', 'role-5'] },
      { viewerRoleId: 'role-7', visibleRoleIds: ['role-1', 'role-6'] },
      { viewerRoleId: 'role-2', visibleRoleIds: ['role-4', 'role-7'] },
      { viewerRoleId: 'role-8', visibleRoleIds: ['role-1', 'role-2', 'role-3', 'role-4', 'role-5', 'role-6', 'role-7'] },
    ],
  },
  {
    moduleId: 'chat',
    roleIds: ['role-1', 'role-2', 'role-3', 'role-4', 'role-5', 'role-6', 'role-7', 'role-8'],
    order: 7,
    column: 'left',
    enabled: true,
  },
];

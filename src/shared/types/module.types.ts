/**
 * Module system types
 */

export interface ModuleDefinition {
  id: string;
  name: string;
  description: string;
  component: string;
  icon: string;
}

export interface ApprovalRoleMapping {
  approverRoleId: string;
  subordinateRoleIds: string[];
}

export interface ViewRoleMapping {
  viewerRoleId: string;
  visibleRoleIds: string[];
}

export interface ModuleConfig {
  moduleId: string;
  roleIds: string[];
  order: number;
  column: 'left' | 'right' | 'full' | 'top' | 'header' | 'sidebar';
  enabled: boolean;
  approvalMappings?: ApprovalRoleMapping[];
  viewMappings?: ViewRoleMapping[];
}

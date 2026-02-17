/**
 * Absence module helper functions
 *
 * Contains approval hierarchy logic and permission checking utilities.
 */

import { useModulesStore } from '@/core/stores/modules-store';
import { getUsers, getRoles } from '@/core/stores/store-helpers';

// Helper to get module config
const getModuleConfig = () => useModulesStore.getState().getModuleConfig('absence-approval');

/**
 * Get dynamic approval hierarchy from module configuration
 * Returns a map of role types to their subordinate role types.
 * Dynamically built from all existing roles — works with any custom role.
 */
export function getApprovalHierarchy(): Record<string, string[]> {
  const config = getModuleConfig();
  const roles = getRoles();

  // Initialize hierarchy with all existing role types
  const hierarchy: Record<string, string[]> = {};
  for (const role of roles) {
    hierarchy[role.type] = [];
  }

  if (!config?.approvalMappings) return hierarchy;

  for (const mapping of config.approvalMappings) {
    const approverRole = roles.find((r) => r.id === mapping.approverRoleId);
    if (!approverRole) continue;

    const subordinateTypes: string[] = [];
    for (const subRoleId of mapping.subordinateRoleIds) {
      const subRole = roles.find((r) => r.id === subRoleId);
      if (subRole) {
        subordinateTypes.push(subRole.type);
      }
    }

    hierarchy[approverRole.type] = subordinateTypes;
  }

  return hierarchy;
}

/**
 * Get user's primary role type (first role in their roleIds array)
 */
export function getUserPrimaryRoleType(userId: string): string | null {
  const user = getUsers().find((u) => u.id === userId);
  if (!user || user.roleIds.length === 0) return null;

  const role = getRoles().find((r) => r.id === user.roleIds[0]);
  return role?.type || null;
}

/**
 * Check if an approver can approve requests from a user with given role type
 */
export function canApproveUser(approverRoleType: string, userRoleType: string): boolean {
  const hierarchy = getApprovalHierarchy();
  const subordinates = hierarchy[approverRoleType] || [];
  return subordinates.includes(userRoleType);
}

/**
 * Validate that an approver has permission to approve/reject a specific request
 */
export function validateApproverPermission(
  approverId: string,
  requestUserId: string
): { valid: boolean; error?: string } {
  const approver = getUsers().find((u) => u.id === approverId);
  if (!approver) {
    return { valid: false, error: 'Schvalovatel nenalezen' };
  }

  const approverRole = getRoles().find((r) => r.id === approver.roleIds[0]);
  if (!approverRole) {
    return { valid: false, error: 'Role schvalovatele nenalezena' };
  }

  const userRoleType = getUserPrimaryRoleType(requestUserId);
  if (!userRoleType || !canApproveUser(approverRole.type, userRoleType)) {
    return { valid: false, error: 'Nemáte oprávnění pro tuto žádost' };
  }

  return { valid: true };
}

/**
 * Filter and sort requests for approval view
 */
export function filterRequestsForApproval<T extends { userId: string; status: string; createdAt: string }>(
  requests: T[],
  approverId: string,
  roleType: string,
  statusFilter: string = 'all'
): T[] {
  return requests
    .filter((request) => {
      // Exclude own requests
      if (request.userId === approverId) return false;

      // Filter by status if specified
      if (statusFilter !== 'all' && request.status !== statusFilter) return false;

      // Check if user is a subordinate
      const userRoleType = getUserPrimaryRoleType(request.userId);
      if (!userRoleType) return false;

      return canApproveUser(roleType, userRoleType);
    })
    .sort((a, b) => {
      // Pending first, then by date
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
}

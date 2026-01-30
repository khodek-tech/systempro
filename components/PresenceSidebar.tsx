'use client';

import { useAuthStore } from '@/stores/auth-store';
import { useModulesStore } from '@/stores/modules-store';
import { useAdminStore } from '@/stores/admin-store';
import { PresenceModule } from '@/modules/PresenceModule';

export function PresenceSidebar() {
  const { activeRoleId } = useAuthStore();
  const { getModuleConfig } = useModulesStore();
  const { subView } = useAdminStore();

  if (!activeRoleId) return null;

  const presenceConfig = getModuleConfig('presence');

  // Zobrazit pouze pokud:
  // 1. Modul je aktivní
  // 2. Má column: 'sidebar'
  // 3. Role má přístup
  // 4. Jsme na hlavní stránce (ne v nastavení/reportech)
  if (!presenceConfig?.enabled) return null;
  if (presenceConfig.column !== 'sidebar') return null;
  if (!presenceConfig.roleIds.includes(activeRoleId)) return null;
  if (subView !== 'main') return null;

  return (
    <aside className="w-64 flex-shrink-0 sticky top-0 h-[calc(100vh-5rem)] p-4 bg-slate-50 border-r border-slate-200 overflow-y-auto">
      <PresenceModule />
    </aside>
  );
}

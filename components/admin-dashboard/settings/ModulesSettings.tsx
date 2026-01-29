'use client';

import { useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { useModulesStore } from '@/stores/modules-store';
import { useRolesStore } from '@/stores/roles-store';
import { cn } from '@/lib/utils';

export function ModulesSettings() {
  const {
    definitions,
    configs,
    toggleRoleAccess,
    setModuleColumn,
    toggleModuleEnabled,
    toggleSubordinateRole,
    getSubordinatesForApprover,
  } = useModulesStore();
  const { roles } = useRolesStore();

  const [expandedApprover, setExpandedApprover] = useState<{
    moduleId: string;
    roleId: string;
  } | null>(null);

  const activeRoles = roles.filter((r) => r.active);

  const isApprovalModule = (moduleId: string) => moduleId === 'absence-approval';

  const handleRoleClick = (moduleId: string, roleId: string, hasRole: boolean) => {
    if (isApprovalModule(moduleId) && hasRole) {
      if (expandedApprover?.moduleId === moduleId && expandedApprover?.roleId === roleId) {
        setExpandedApprover(null);
      } else {
        setExpandedApprover({ moduleId, roleId });
      }
    } else {
      toggleRoleAccess(moduleId, roleId);
      if (expandedApprover?.moduleId === moduleId && expandedApprover?.roleId === roleId) {
        setExpandedApprover(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Konfigurace modulů</h2>
          <p className="text-sm text-slate-500 mt-1">
            Přiřaďte moduly k rolím a nastavte jejich zobrazení
          </p>
        </div>
      </div>

      {/* Modules list */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Modul
              </th>
              <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Pozice
              </th>
              <th className="text-center px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Aktivní
              </th>
              <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Role
              </th>
            </tr>
          </thead>
          <tbody>
            {definitions.map((module) => {
              const config = configs.find((c) => c.moduleId === module.id);
              if (!config) return null;

              const isExpanded =
                expandedApprover?.moduleId === module.id && isApprovalModule(module.id);
              const expandedRole = isExpanded
                ? activeRoles.find((r) => r.id === expandedApprover?.roleId)
                : null;

              return (
                <tr
                  key={module.id}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors"
                >
                  {/* Module name and description */}
                  <td className="px-6 py-4">
                    <div className="text-left">
                      <div className="font-semibold text-slate-800">{module.name}</div>
                      <div className="text-sm text-slate-500">{module.description}</div>
                    </div>
                  </td>

                  {/* Column position */}
                  <td className="px-6 py-4">
                    <select
                      value={config.column}
                      onChange={(e) =>
                        setModuleColumn(
                          module.id,
                          e.target.value as 'left' | 'right' | 'full' | 'top'
                        )
                      }
                      className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium outline-none cursor-pointer focus:border-blue-300"
                    >
                      <option value="top">Horní banner</option>
                      <option value="left">Levý sloupec</option>
                      <option value="right">Pravý sloupec</option>
                      <option value="full">Plná šířka</option>
                    </select>
                  </td>

                  {/* Enabled toggle */}
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => toggleModuleEnabled(module.id)}
                      className={cn(
                        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                        config.enabled ? 'bg-green-500' : 'bg-slate-300'
                      )}
                    >
                      <span
                        className={cn(
                          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                          config.enabled ? 'translate-x-6' : 'translate-x-1'
                        )}
                      />
                    </button>
                  </td>

                  {/* Roles */}
                  <td className="px-6 py-4">
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {activeRoles.map((role) => {
                          const hasRole = config.roleIds.includes(role.id);
                          const isApproval = isApprovalModule(module.id);
                          const isCurrentExpanded =
                            expandedApprover?.moduleId === module.id &&
                            expandedApprover?.roleId === role.id;

                          return (
                            <button
                              key={role.id}
                              onClick={() => handleRoleClick(module.id, role.id, hasRole)}
                              className={cn(
                                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1',
                                hasRole
                                  ? isCurrentExpanded
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                  : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600'
                              )}
                            >
                              {role.name}
                              {isApproval && hasRole && (
                                <ChevronDown
                                  className={cn(
                                    'w-3 h-3 transition-transform',
                                    isCurrentExpanded && 'rotate-180'
                                  )}
                                />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Approval subordinates panel */}
                      {isExpanded && expandedRole && (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mt-2">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-semibold text-slate-700">
                              {expandedRole.name} schvaluje žádosti od:
                            </span>
                            <button
                              onClick={() => setExpandedApprover(null)}
                              className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {activeRoles
                              .filter((r) => r.id !== expandedRole.id)
                              .map((subordinateRole) => {
                                const subordinates = getSubordinatesForApprover(
                                  module.id,
                                  expandedRole.id
                                );
                                const isSubordinate = subordinates.includes(subordinateRole.id);

                                return (
                                  <button
                                    key={subordinateRole.id}
                                    onClick={() =>
                                      toggleSubordinateRole(
                                        module.id,
                                        expandedRole.id,
                                        subordinateRole.id
                                      )
                                    }
                                    className={cn(
                                      'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                                      isSubordinate
                                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                        : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                                    )}
                                  >
                                    {subordinateRole.name}
                                  </button>
                                );
                              })}
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Info note */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm text-blue-700">
          <strong>Tip:</strong> Změny se projeví okamžitě. Kliknutím na roli přidáte/odeberete
          přístup k modulu pro danou roli. U modulu Schvalování klikněte na aktivní roli pro
          konfiguraci, koho může schvalovat.
        </p>
      </div>
    </div>
  );
}

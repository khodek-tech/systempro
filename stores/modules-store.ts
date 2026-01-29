import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ModuleDefinition, ModuleConfig } from '@/types';
import { DEFAULT_MODULE_DEFINITIONS, DEFAULT_MODULE_CONFIGS } from '@/config/default-modules';
import { STORAGE_KEYS } from '@/lib/constants';

interface ModulesState {
  definitions: ModuleDefinition[];
  configs: ModuleConfig[];
}

interface ModulesActions {
  updateModuleConfig: (moduleId: string, config: Partial<ModuleConfig>) => void;
  toggleRoleAccess: (moduleId: string, roleId: string) => void;
  setModuleColumn: (moduleId: string, column: 'left' | 'right' | 'full' | 'top') => void;
  toggleModuleEnabled: (moduleId: string) => void;
  getModulesForRole: (roleId: string) => (ModuleDefinition & ModuleConfig)[];
  getModuleDefinition: (moduleId: string) => ModuleDefinition | undefined;
  getModuleConfig: (moduleId: string) => ModuleConfig | undefined;
  toggleSubordinateRole: (moduleId: string, approverRoleId: string, subordinateRoleId: string) => void;
  getSubordinatesForApprover: (moduleId: string, approverRoleId: string) => string[];
  toggleViewableRole: (moduleId: string, viewerRoleId: string, visibleRoleId: string) => void;
  getVisibleRolesForViewer: (moduleId: string, viewerRoleId: string) => string[];
}

export const useModulesStore = create<ModulesState & ModulesActions>()(
  persist(
    (set, get) => ({
      // Initial state
      definitions: DEFAULT_MODULE_DEFINITIONS,
      configs: DEFAULT_MODULE_CONFIGS,

      // Actions
      updateModuleConfig: (moduleId, config) => {
        set((state) => ({
          configs: state.configs.map((c) =>
            c.moduleId === moduleId ? { ...c, ...config } : c
          ),
        }));
      },

      toggleRoleAccess: (moduleId, roleId) => {
        set((state) => ({
          configs: state.configs.map((c) => {
            if (c.moduleId !== moduleId) return c;

            const hasRole = c.roleIds.includes(roleId);
            return {
              ...c,
              roleIds: hasRole
                ? c.roleIds.filter((id) => id !== roleId)
                : [...c.roleIds, roleId],
            };
          }),
        }));
      },

      setModuleColumn: (moduleId, column) => {
        set((state) => ({
          configs: state.configs.map((c) =>
            c.moduleId === moduleId ? { ...c, column } : c
          ),
        }));
      },

      toggleModuleEnabled: (moduleId) => {
        set((state) => ({
          configs: state.configs.map((c) =>
            c.moduleId === moduleId ? { ...c, enabled: !c.enabled } : c
          ),
        }));
      },

      getModulesForRole: (roleId) => {
        const { definitions, configs } = get();

        return configs
          .filter((c) => c.enabled && c.roleIds.includes(roleId))
          .sort((a, b) => a.order - b.order)
          .map((config) => {
            const definition = definitions.find((d) => d.id === config.moduleId);
            if (!definition) return null;
            return { ...definition, ...config };
          })
          .filter((m): m is ModuleDefinition & ModuleConfig => m !== null);
      },

      getModuleDefinition: (moduleId) => {
        return get().definitions.find((d) => d.id === moduleId);
      },

      getModuleConfig: (moduleId) => {
        return get().configs.find((c) => c.moduleId === moduleId);
      },

      toggleSubordinateRole: (moduleId, approverRoleId, subordinateRoleId) => {
        set((state) => ({
          configs: state.configs.map((c) => {
            if (c.moduleId !== moduleId) return c;

            const mappings = c.approvalMappings || [];
            const approverMapping = mappings.find((m) => m.approverRoleId === approverRoleId);

            if (!approverMapping) {
              return {
                ...c,
                approvalMappings: [
                  ...mappings,
                  { approverRoleId, subordinateRoleIds: [subordinateRoleId] },
                ],
              };
            }

            const hasSubordinate = approverMapping.subordinateRoleIds.includes(subordinateRoleId);
            const updatedMappings = mappings.map((m) => {
              if (m.approverRoleId !== approverRoleId) return m;
              return {
                ...m,
                subordinateRoleIds: hasSubordinate
                  ? m.subordinateRoleIds.filter((id) => id !== subordinateRoleId)
                  : [...m.subordinateRoleIds, subordinateRoleId],
              };
            });

            return { ...c, approvalMappings: updatedMappings };
          }),
        }));
      },

      getSubordinatesForApprover: (moduleId, approverRoleId) => {
        const config = get().configs.find((c) => c.moduleId === moduleId);
        if (!config?.approvalMappings) return [];

        const mapping = config.approvalMappings.find((m) => m.approverRoleId === approverRoleId);
        return mapping?.subordinateRoleIds || [];
      },

      toggleViewableRole: (moduleId, viewerRoleId, visibleRoleId) => {
        set((state) => ({
          configs: state.configs.map((c) => {
            if (c.moduleId !== moduleId) return c;

            const mappings = c.viewMappings || [];
            const viewerMapping = mappings.find((m) => m.viewerRoleId === viewerRoleId);

            if (!viewerMapping) {
              return {
                ...c,
                viewMappings: [
                  ...mappings,
                  { viewerRoleId, visibleRoleIds: [visibleRoleId] },
                ],
              };
            }

            const hasVisible = viewerMapping.visibleRoleIds.includes(visibleRoleId);
            const updatedMappings = mappings.map((m) => {
              if (m.viewerRoleId !== viewerRoleId) return m;
              return {
                ...m,
                visibleRoleIds: hasVisible
                  ? m.visibleRoleIds.filter((id) => id !== visibleRoleId)
                  : [...m.visibleRoleIds, visibleRoleId],
              };
            });

            return { ...c, viewMappings: updatedMappings };
          }),
        }));
      },

      getVisibleRolesForViewer: (moduleId, viewerRoleId) => {
        const config = get().configs.find((c) => c.moduleId === moduleId);
        if (!config?.viewMappings) return [];

        const mapping = config.viewMappings.find((m) => m.viewerRoleId === viewerRoleId);
        return mapping?.visibleRoleIds || [];
      },
    }),
    {
      name: STORAGE_KEYS.MODULES,
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Synchronizace nových definic modulů
          const missingDefs = DEFAULT_MODULE_DEFINITIONS.filter(
            (def) => !state.definitions.find((d) => d.id === def.id)
          );
          if (missingDefs.length > 0) {
            state.definitions = [...state.definitions, ...missingDefs];
          }

          // Synchronizace nových konfigurací modulů
          const missingConfigs = DEFAULT_MODULE_CONFIGS.filter(
            (cfg) => !state.configs.find((c) => c.moduleId === cfg.moduleId)
          );
          if (missingConfigs.length > 0) {
            state.configs = [...state.configs, ...missingConfigs];
          }

          // Migrace: změnit kpi-dashboard z 'full' na 'top'
          state.configs = state.configs.map((cfg) => {
            if (cfg.moduleId === 'kpi-dashboard' && cfg.column === 'full') {
              return { ...cfg, column: 'top' as const };
            }
            return cfg;
          });

          // Migrace: přidat approvalMappings do absence-approval pokud chybí
          state.configs = state.configs.map((cfg) => {
            if (cfg.moduleId === 'absence-approval' && !cfg.approvalMappings) {
              const defaultConfig = DEFAULT_MODULE_CONFIGS.find(
                (c) => c.moduleId === 'absence-approval'
              );
              return {
                ...cfg,
                approvalMappings: defaultConfig?.approvalMappings || [],
              };
            }
            return cfg;
          });

          // Migrace: přidat viewMappings do shifts pokud chybí
          state.configs = state.configs.map((cfg) => {
            if (cfg.moduleId === 'shifts' && !cfg.viewMappings) {
              const defaultConfig = DEFAULT_MODULE_CONFIGS.find(
                (c) => c.moduleId === 'shifts'
              );
              return {
                ...cfg,
                viewMappings: defaultConfig?.viewMappings || [],
              };
            }
            return cfg;
          });

        }
      },
    }
  )
);

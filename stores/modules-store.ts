import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ModuleDefinition, ModuleConfig } from '@/types';
import { DEFAULT_MODULE_DEFINITIONS, DEFAULT_MODULE_CONFIGS } from '@/config/default-modules';

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
    }),
    {
      name: 'systempro-modules',
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
        }
      },
    }
  )
);

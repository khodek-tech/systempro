import { create } from 'zustand';
import { ModuleDefinition, ModuleConfig } from '@/shared/types';
import { toast } from 'sonner';
import { DEFAULT_MODULE_DEFINITIONS, DEFAULT_MODULE_CONFIGS } from '@/config/default-modules';
import { createClient } from '@/lib/supabase/client';
import { mapDbToModuleDefinition, mapDbToModuleConfig, mapModuleConfigToDb } from '@/lib/supabase/mappers';

interface ModulesState {
  definitions: ModuleDefinition[];
  configs: ModuleConfig[];
  _loaded: boolean;
  _loading: boolean;
}

interface ModulesActions {
  fetchModules: () => Promise<void>;
  updateModuleConfig: (moduleId: string, config: Partial<ModuleConfig>) => Promise<void>;
  toggleRoleAccess: (moduleId: string, roleId: string) => Promise<void>;
  setModuleColumn: (moduleId: string, column: 'left' | 'right' | 'full' | 'top' | 'sidebar') => Promise<void>;
  toggleModuleEnabled: (moduleId: string) => Promise<void>;
  getModulesForRole: (roleId: string) => (ModuleDefinition & ModuleConfig)[];
  getModuleDefinition: (moduleId: string) => ModuleDefinition | undefined;
  getModuleConfig: (moduleId: string) => ModuleConfig | undefined;
  toggleSubordinateRole: (moduleId: string, approverRoleId: string, subordinateRoleId: string) => Promise<void>;
  getSubordinatesForApprover: (moduleId: string, approverRoleId: string) => string[];
  toggleViewableRole: (moduleId: string, viewerRoleId: string, visibleRoleId: string) => Promise<void>;
  getVisibleRolesForViewer: (moduleId: string, viewerRoleId: string) => string[];
}

export const useModulesStore = create<ModulesState & ModulesActions>()((set, get) => ({
  // Initial state - use defaults as fallback
  definitions: DEFAULT_MODULE_DEFINITIONS,
  configs: DEFAULT_MODULE_CONFIGS,
  _loaded: false,
  _loading: false,

  fetchModules: async () => {
    set({ _loading: true });
    const supabase = createClient();

    const [defsResult, configsResult] = await Promise.all([
      supabase.from('definice_modulu').select('*'),
      supabase.from('konfigurace_modulu').select('*'),
    ]);

    if (!defsResult.error && defsResult.data && !configsResult.error && configsResult.data) {
      let definitions = defsResult.data.map(mapDbToModuleDefinition);
      let configs = configsResult.data.map(mapDbToModuleConfig);

      // Synchronize missing definitions from defaults
      const missingDefs = DEFAULT_MODULE_DEFINITIONS.filter(
        (def) => !definitions.find((d) => d.id === def.id)
      );
      if (missingDefs.length > 0) {
        definitions = [...definitions, ...missingDefs];
      }

      // Synchronize missing configs from defaults
      const missingConfigs = DEFAULT_MODULE_CONFIGS.filter(
        (cfg) => !configs.find((c) => c.moduleId === cfg.moduleId)
      );
      if (missingConfigs.length > 0) {
        configs = [...configs, ...missingConfigs];
      }

      set({ definitions, configs, _loaded: true, _loading: false });
    } else {
      console.error('Failed to fetch modules:', defsResult.error, configsResult.error);
      set({ _loading: false });
    }
  },

  // Actions
  updateModuleConfig: async (moduleId, config) => {
    const dbData = mapModuleConfigToDb({ ...config, moduleId });

    const supabase = createClient();
    const { error } = await supabase.from('konfigurace_modulu').update(dbData).eq('id_modulu', moduleId);
    if (error) {
      console.error('Failed to update module config:', error);
      toast.error('Nepodařilo se uložit nastavení modulu');
      return;
    }

    set((state) => ({
      configs: state.configs.map((c) =>
        c.moduleId === moduleId ? { ...c, ...config } : c
      ),
    }));
  },

  toggleRoleAccess: async (moduleId, roleId) => {
    const config = get().configs.find((c) => c.moduleId === moduleId);
    if (!config) return;

    const hasRole = config.roleIds.includes(roleId);
    const newRoleIds = hasRole
      ? config.roleIds.filter((id) => id !== roleId)
      : [...config.roleIds, roleId];

    const supabase = createClient();
    const { error } = await supabase.from('konfigurace_modulu').update({ id_roli: newRoleIds }).eq('id_modulu', moduleId);
    if (error) {
      console.error('Failed to toggle role access:', error);
      toast.error('Nepodařilo se změnit přístup role');
      return;
    }

    set((state) => ({
      configs: state.configs.map((c) => {
        if (c.moduleId !== moduleId) return c;
        return { ...c, roleIds: newRoleIds };
      }),
    }));
  },

  setModuleColumn: async (moduleId, column) => {
    const supabase = createClient();
    const { error } = await supabase.from('konfigurace_modulu').update({ sloupec: column }).eq('id_modulu', moduleId);
    if (error) {
      console.error('Failed to set module column:', error);
      toast.error('Nepodařilo se změnit pozici modulu');
      return;
    }

    set((state) => ({
      configs: state.configs.map((c) =>
        c.moduleId === moduleId ? { ...c, column } : c
      ),
    }));
  },

  toggleModuleEnabled: async (moduleId) => {
    const config = get().configs.find((c) => c.moduleId === moduleId);
    if (!config) return;

    const newEnabled = !config.enabled;
    const supabase = createClient();
    const { error } = await supabase.from('konfigurace_modulu').update({ aktivni: newEnabled }).eq('id_modulu', moduleId);
    if (error) {
      console.error('Failed to toggle module enabled:', error);
      toast.error('Nepodařilo se změnit stav modulu');
      return;
    }

    set((state) => ({
      configs: state.configs.map((c) =>
        c.moduleId === moduleId ? { ...c, enabled: newEnabled } : c
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

  toggleSubordinateRole: async (moduleId, approverRoleId, subordinateRoleId) => {
    const config = get().configs.find((c) => c.moduleId === moduleId);
    if (!config) return;

    const mappings = config.approvalMappings || [];
    const approverMapping = mappings.find((m) => m.approverRoleId === approverRoleId);

    let updatedMappings;
    if (!approverMapping) {
      updatedMappings = [
        ...mappings,
        { approverRoleId, subordinateRoleIds: [subordinateRoleId] },
      ];
    } else {
      const hasSubordinate = approverMapping.subordinateRoleIds.includes(subordinateRoleId);
      updatedMappings = mappings.map((m) => {
        if (m.approverRoleId !== approverRoleId) return m;
        return {
          ...m,
          subordinateRoleIds: hasSubordinate
            ? m.subordinateRoleIds.filter((id) => id !== subordinateRoleId)
            : [...m.subordinateRoleIds, subordinateRoleId],
        };
      });
    }

    const supabase = createClient();
    const { error } = await supabase.from('konfigurace_modulu').update({ mapovani_schvalovani: updatedMappings }).eq('id_modulu', moduleId);
    if (error) {
      console.error('Failed to toggle subordinate role:', error);
      toast.error('Nepodařilo se změnit nastavení schvalování');
      return;
    }

    set((state) => ({
      configs: state.configs.map((c) =>
        c.moduleId === moduleId ? { ...c, approvalMappings: updatedMappings } : c
      ),
    }));
  },

  getSubordinatesForApprover: (moduleId, approverRoleId) => {
    const config = get().configs.find((c) => c.moduleId === moduleId);
    if (!config?.approvalMappings) return [];

    const mapping = config.approvalMappings.find((m) => m.approverRoleId === approverRoleId);
    return mapping?.subordinateRoleIds || [];
  },

  toggleViewableRole: async (moduleId, viewerRoleId, visibleRoleId) => {
    const config = get().configs.find((c) => c.moduleId === moduleId);
    if (!config) return;

    const mappings = config.viewMappings || [];
    const viewerMapping = mappings.find((m) => m.viewerRoleId === viewerRoleId);

    let updatedMappings;
    if (!viewerMapping) {
      updatedMappings = [
        ...mappings,
        { viewerRoleId, visibleRoleIds: [visibleRoleId] },
      ];
    } else {
      const hasVisible = viewerMapping.visibleRoleIds.includes(visibleRoleId);
      updatedMappings = mappings.map((m) => {
        if (m.viewerRoleId !== viewerRoleId) return m;
        return {
          ...m,
          visibleRoleIds: hasVisible
            ? m.visibleRoleIds.filter((id) => id !== visibleRoleId)
            : [...m.visibleRoleIds, visibleRoleId],
        };
      });
    }

    const supabase = createClient();
    const { error } = await supabase.from('konfigurace_modulu').update({ mapovani_zobrazeni: updatedMappings }).eq('id_modulu', moduleId);
    if (error) {
      console.error('Failed to toggle viewable role:', error);
      toast.error('Nepodařilo se změnit nastavení zobrazení');
      return;
    }

    set((state) => ({
      configs: state.configs.map((c) =>
        c.moduleId === moduleId ? { ...c, viewMappings: updatedMappings } : c
      ),
    }));
  },

  getVisibleRolesForViewer: (moduleId, viewerRoleId) => {
    const config = get().configs.find((c) => c.moduleId === moduleId);
    if (!config?.viewMappings) return [];

    const mapping = config.viewMappings.find((m) => m.viewerRoleId === viewerRoleId);
    return mapping?.visibleRoleIds || [];
  },
}));

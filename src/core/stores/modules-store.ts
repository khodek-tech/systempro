import { create } from 'zustand';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { ModuleDefinition, ModuleConfig } from '@/shared/types';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { DEFAULT_MODULE_DEFINITIONS, DEFAULT_MODULE_CONFIGS } from '@/config/default-modules';
import { createClient } from '@/lib/supabase/client';
import { mapDbToModuleDefinition, mapDbToModuleConfig, mapModuleConfigToDb } from '@/lib/supabase/mappers';

interface ModulesState {
  definitions: ModuleDefinition[];
  configs: ModuleConfig[];
  _loaded: boolean;
  _loading: boolean;
  _realtimeChannel: RealtimeChannel | null;
}

interface ModulesActions {
  fetchModules: () => Promise<void>;
  updateModuleConfig: (moduleId: string, config: Partial<ModuleConfig>) => Promise<void>;
  toggleRoleAccess: (moduleId: string, roleId: string) => Promise<void>;
  setModuleColumn: (moduleId: string, column: 'left' | 'right' | 'full' | 'top' | 'sidebar') => Promise<void>;
  toggleModuleEnabled: (moduleId: string) => Promise<void>;
  // Realtime
  subscribeRealtime: () => void;
  unsubscribeRealtime: () => void;

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
  _realtimeChannel: null,

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

      // Synchronize missing definitions from defaults → persist to DB
      const missingDefs = DEFAULT_MODULE_DEFINITIONS.filter(
        (def) => !definitions.find((d) => d.id === def.id)
      );
      if (missingDefs.length > 0) {
        const dbDefs = missingDefs.map((d) => ({
          id: d.id,
          nazev: d.name,
          popis: d.description,
          komponenta: d.component,
          ikona: d.icon,
        }));
        await supabase.from('definice_modulu').upsert(dbDefs, { onConflict: 'id' });
        definitions = [...definitions, ...missingDefs];
      }

      // Synchronize missing configs from defaults → persist to DB
      const missingConfigs = DEFAULT_MODULE_CONFIGS.filter(
        (cfg) => !configs.find((c) => c.moduleId === cfg.moduleId)
      );
      if (missingConfigs.length > 0) {
        const dbConfigs = missingConfigs.map((c) => mapModuleConfigToDb(c));
        await supabase.from('konfigurace_modulu').upsert(dbConfigs, { onConflict: 'id_modulu' });
        configs = [...configs, ...missingConfigs];
      }

      set({ definitions, configs, _loaded: true, _loading: false });
    } else {
      logger.error('Failed to fetch modules');
      set({ _loading: false });
    }
  },

  // Actions
  updateModuleConfig: async (moduleId, config) => {
    const dbData = mapModuleConfigToDb({ ...config, moduleId });

    const supabase = createClient();
    const { error } = await supabase.from('konfigurace_modulu').update(dbData).eq('id_modulu', moduleId);
    if (error) {
      logger.error('Failed to update module config');
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
      logger.error('Failed to toggle role access');
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
      logger.error('Failed to set module column');
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
      logger.error('Failed to toggle module enabled');
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
      logger.error('Failed to toggle subordinate role');
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
      logger.error('Failed to toggle viewable role');
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

  // Realtime
  subscribeRealtime: () => {
    get()._realtimeChannel?.unsubscribe();

    const supabase = createClient();

    const channel = supabase
      .channel('modules-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'definice_modulu',
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          if (payload.eventType === 'INSERT') {
            const newDef = mapDbToModuleDefinition(payload.new);
            const exists = get().definitions.some((d) => d.id === newDef.id);
            if (!exists) {
              set({ definitions: [...get().definitions, newDef] });
            }
          } else if (payload.eventType === 'UPDATE') {
            const updated = mapDbToModuleDefinition(payload.new);
            set({
              definitions: get().definitions.map((d) => (d.id === updated.id ? updated : d)),
            });
          } else if (payload.eventType === 'DELETE') {
            const oldId = payload.old?.id;
            if (oldId) {
              set({ definitions: get().definitions.filter((d) => d.id !== oldId) });
            }
          }
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'konfigurace_modulu',
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          if (payload.eventType === 'INSERT') {
            const newConfig = mapDbToModuleConfig(payload.new);
            const exists = get().configs.some((c) => c.moduleId === newConfig.moduleId);
            if (!exists) {
              set({ configs: [...get().configs, newConfig] });
            }
          } else if (payload.eventType === 'UPDATE') {
            const updated = mapDbToModuleConfig(payload.new);
            set({
              configs: get().configs.map((c) => (c.moduleId === updated.moduleId ? updated : c)),
            });
          } else if (payload.eventType === 'DELETE') {
            const oldId = payload.old?.id_modulu;
            if (oldId) {
              set({ configs: get().configs.filter((c) => c.moduleId !== oldId) });
            }
          }
        },
      )
      .subscribe((status, err) => {
        if (err) logger.error(`[modules-realtime] ${status}:`, err);
        if (status === 'SUBSCRIBED' && get()._loaded) {
          get().fetchModules();
        }
      });

    set({ _realtimeChannel: channel });
  },

  unsubscribeRealtime: () => {
    get()._realtimeChannel?.unsubscribe();
    set({ _realtimeChannel: null });
  },
}));

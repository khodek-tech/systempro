'use client';

import { useModulesStore } from '@/stores/modules-store';
import { useAdminStore } from '@/admin/admin-store';
import { ModuleSettingsCard } from './ModuleSettingsCard';
import { ModuleSettingsDetail } from './ModuleSettingsDetail';

export function ModulesSettings() {
  const { definitions, configs } = useModulesStore();
  const { selectedModuleId, selectModule } = useAdminStore();

  if (selectedModuleId) {
    return <ModuleSettingsDetail moduleId={selectedModuleId} onBack={() => selectModule(null)} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-800">Konfigurace modulu</h2>
        <p className="text-sm text-slate-500 mt-1">
          Kliknete na modul pro jeho nastaveni
        </p>
      </div>

      {/* Modules grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {definitions.map((module) => {
          const config = configs.find((c) => c.moduleId === module.id);
          return (
            <ModuleSettingsCard
              key={module.id}
              module={module}
              config={config}
              onClick={() => selectModule(module.id)}
            />
          );
        })}
      </div>

      {/* Info note */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm text-blue-700">
          <strong>Tip:</strong> Kliknete na kartu modulu pro zobrazeni detailniho nastaveni.
          Zelena tecka znamena aktivni modul, seda neaktivni.
        </p>
      </div>
    </div>
  );
}

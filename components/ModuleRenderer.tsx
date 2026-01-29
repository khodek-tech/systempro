'use client';

import { useAuthStore } from '@/stores/auth-store';
import { useModulesStore } from '@/stores/modules-store';
import { getModuleComponent } from '@/modules/registry';
import { ModuleErrorBoundary } from './ModuleErrorBoundary';

interface ModuleRendererProps {
  isWarehouse?: boolean;
}

export function ModuleRenderer({ isWarehouse }: ModuleRendererProps) {
  const { activeRoleId } = useAuthStore();
  const { getModulesForRole } = useModulesStore();

  if (!activeRoleId) {
    return null;
  }

  const modules = getModulesForRole(activeRoleId);

  // Warehouse mode for prodavač - no sales modules
  const filteredModules = isWarehouse
    ? modules.filter((m) => m.id !== 'sales' && m.id !== 'collect')
    : modules;

  if (filteredModules.length === 0) {
    return null;
  }

  // Separate modules by column type
  const topModules = filteredModules.filter((m) => m.column === 'top');
  const leftModules = filteredModules.filter((m) => m.column === 'left');
  const rightModules = filteredModules.filter((m) => m.column === 'right');
  const fullModules = filteredModules.filter((m) => m.column === 'full');

  // If all modules are in "left" column, use grid layout
  const allInLeft = rightModules.length === 0 && fullModules.length === 0;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-10">
      {/* Top banner modules */}
      {topModules.map((module) => {
        const Component = getModuleComponent(module.component);
        if (!Component) return null;
        return (
          <ModuleErrorBoundary key={module.id} moduleName={module.name}>
            <Component />
          </ModuleErrorBoundary>
        );
      })}

      {/* Full width modules */}
      {fullModules.map((module) => {
        const Component = getModuleComponent(module.component);
        if (!Component) return null;
        return (
          <ModuleErrorBoundary key={module.id} moduleName={module.name}>
            <Component />
          </ModuleErrorBoundary>
        );
      })}

      {/* Grid layout for left/right modules */}
      {(leftModules.length > 0 || rightModules.length > 0) && (
        <div
          className={
            allInLeft
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10'
              : 'grid grid-cols-1 lg:grid-cols-2 gap-10'
          }
        >
          {/* Left column */}
          {allInLeft ? (
            leftModules.map((module) => {
              const Component = getModuleComponent(module.component);
              if (!Component) return null;
              return (
                <ModuleErrorBoundary key={module.id} moduleName={module.name}>
                  <Component />
                </ModuleErrorBoundary>
              );
            })
          ) : (
            <div className="space-y-6">
              {leftModules.map((module) => {
                const Component = getModuleComponent(module.component);
                if (!Component) return null;
                return (
                  <ModuleErrorBoundary key={module.id} moduleName={module.name}>
                    <Component />
                  </ModuleErrorBoundary>
                );
              })}
            </div>
          )}

          {/* Right column */}
          {rightModules.length > 0 && (
            <div className="space-y-6">
              {rightModules.map((module) => {
                const Component = getModuleComponent(module.component);
                if (!Component) return null;
                return (
                  <ModuleErrorBoundary key={module.id} moduleName={module.name}>
                    <Component />
                  </ModuleErrorBoundary>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { ArrowLeft, Settings, X } from 'lucide-react';
import { useModulesStore } from '@/stores/modules-store';
import { useRolesStore } from '@/stores/roles-store';
import { cn } from '@/lib/utils';
import { ChatGroupsSettings } from './ChatGroupsSettings';
import {
  Info,
  Wallet,
  Send,
  Umbrella,
  ClipboardCheck,
  CheckSquare,
  ChartColumnIncreasing,
  Clock,
  Calendar,
  Users,
} from 'lucide-react';

interface ModuleSettingsDetailProps {
  moduleId: string;
  onBack: () => void;
}

const iconMap: Record<string, React.ElementType> = {
  Info,
  Wallet,
  Send,
  Umbrella,
  ClipboardCheck,
  CheckSquare,
  ChartColumnIncreasing,
  Clock,
  Calendar,
  Users,
};

const colorSchemes: Record<string, { bg: string; text: string }> = {
  'cash-info': { bg: 'bg-blue-50', text: 'text-blue-500' },
  'sales': { bg: 'bg-emerald-50', text: 'text-emerald-500' },
  'collect': { bg: 'bg-purple-50', text: 'text-purple-500' },
  'absence-report': { bg: 'bg-orange-50', text: 'text-orange-500' },
  'absence-approval': { bg: 'bg-teal-50', text: 'text-teal-500' },
  'tasks': { bg: 'bg-violet-50', text: 'text-violet-500' },
  'kpi-dashboard': { bg: 'bg-indigo-50', text: 'text-indigo-500' },
  'reports': { bg: 'bg-cyan-50', text: 'text-cyan-500' },
  'attendance': { bg: 'bg-amber-50', text: 'text-amber-500' },
  'shifts': { bg: 'bg-blue-50', text: 'text-blue-500' },
  'presence': { bg: 'bg-sky-50', text: 'text-sky-500' },
};

export function ModuleSettingsDetail({ moduleId, onBack }: ModuleSettingsDetailProps) {
  const {
    definitions,
    configs,
    toggleRoleAccess,
    setModuleColumn,
    toggleModuleEnabled,
    toggleSubordinateRole,
    getSubordinatesForApprover,
    toggleViewableRole,
    getVisibleRolesForViewer,
  } = useModulesStore();
  const { roles } = useRolesStore();

  const [expandedApprover, setExpandedApprover] = useState<string | null>(null);
  const [expandedViewer, setExpandedViewer] = useState<string | null>(null);

  const moduleDef = definitions.find((d) => d.id === moduleId);
  const config = configs.find((c) => c.moduleId === moduleId);
  const activeRoles = roles.filter((r) => r.active);

  if (!moduleDef || !config) {
    return (
      <div className="text-center py-10">
        <p className="text-slate-500">Modul nebyl nalezen</p>
        <button
          onClick={onBack}
          className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
        >
          Zpět na seznam
        </button>
      </div>
    );
  }

  const IconComponent = iconMap[moduleDef.icon] || Info;
  const colors = colorSchemes[moduleDef.id] || { bg: 'bg-slate-50', text: 'text-slate-500' };

  const isApprovalModule = moduleId === 'absence-approval';
  const isViewModule = moduleId === 'shifts' || moduleId === 'presence' || moduleId === 'tasks';

  const handleRoleClick = (roleId: string) => {
    toggleRoleAccess(moduleId, roleId);
    if (expandedApprover === roleId) {
      setExpandedApprover(null);
    }
  };

  const handleSettingsClick = (roleId: string) => {
    if (expandedApprover === roleId) {
      setExpandedApprover(null);
    } else {
      setExpandedApprover(roleId);
      setExpandedViewer(null);
    }
  };

  const handleViewSettingsClick = (roleId: string) => {
    if (expandedViewer === roleId) {
      setExpandedViewer(null);
    } else {
      setExpandedViewer(roleId);
      setExpandedApprover(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-4">
          <div
            className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center',
              colors.bg
            )}
          >
            <IconComponent className={cn('w-6 h-6', colors.text)} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">{moduleDef.name}</h2>
            <p className="text-sm text-slate-500">{moduleDef.description}</p>
          </div>
        </div>
      </div>

      {/* Settings card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
        {/* Position select */}
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-slate-700">Pozice</label>
          <select
            value={config.column}
            onChange={(e) =>
              setModuleColumn(
                moduleId,
                e.target.value as 'left' | 'right' | 'full' | 'top'
              )
            }
            className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm font-medium outline-none cursor-pointer focus:border-blue-300"
          >
            <option value="top">Horni banner</option>
            <option value="left">Levy sloupec</option>
            <option value="right">Pravy sloupec</option>
            <option value="full">Plna sirka</option>
            <option value="sidebar">Postrani panel</option>
            <option value="header">Hlavicka</option>
          </select>
        </div>

        {/* Enabled toggle */}
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-slate-700">Aktivni</label>
          <button
            onClick={() => toggleModuleEnabled(moduleId)}
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
        </div>

        {/* Roles */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-slate-700">Role s pristupem</label>
          <div className="flex flex-wrap gap-2">
            {activeRoles.map((role) => {
              const hasRole = config.roleIds.includes(role.id);
              const isApprovalCurrentExpanded = expandedApprover === role.id;
              const isViewCurrentExpanded = expandedViewer === role.id;

              return (
                <div key={role.id} className="flex items-center gap-1">
                  <button
                    onClick={() => handleRoleClick(role.id)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                      hasRole
                        ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                        : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600'
                    )}
                  >
                    {role.name}
                  </button>
                  {isApprovalModule && hasRole && (
                    <button
                      onClick={() => handleSettingsClick(role.id)}
                      className={cn(
                        'p-1.5 rounded-lg transition-all',
                        isApprovalCurrentExpanded
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700'
                      )}
                      title="Nastavit podrizene role"
                    >
                      <Settings className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {isViewModule && hasRole && (
                    <button
                      onClick={() => handleViewSettingsClick(role.id)}
                      className={cn(
                        'p-1.5 rounded-lg transition-all',
                        isViewCurrentExpanded
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700'
                      )}
                      title="Nastavit viditelnost"
                    >
                      <Settings className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Approval subordinates panel */}
          {isApprovalModule && expandedApprover && (
            <ApprovalPanel
              moduleId={moduleId}
              approverRoleId={expandedApprover}
              activeRoles={activeRoles}
              getSubordinatesForApprover={getSubordinatesForApprover}
              toggleSubordinateRole={toggleSubordinateRole}
              onClose={() => setExpandedApprover(null)}
            />
          )}

          {/* View roles panel */}
          {isViewModule && expandedViewer && (
            <ViewPanel
              moduleId={moduleId}
              viewerRoleId={expandedViewer}
              activeRoles={activeRoles}
              getVisibleRolesForViewer={getVisibleRolesForViewer}
              toggleViewableRole={toggleViewableRole}
              onClose={() => setExpandedViewer(null)}
            />
          )}
        </div>
      </div>

      {/* Chat groups settings - only for chat module */}
      {moduleId === 'chat' && (
        <div className="mt-8 pt-8 border-t border-slate-200">
          <ChatGroupsSettings />
        </div>
      )}
    </div>
  );
}

interface ApprovalPanelProps {
  moduleId: string;
  approverRoleId: string;
  activeRoles: { id: string; name: string }[];
  getSubordinatesForApprover: (moduleId: string, approverRoleId: string) => string[];
  toggleSubordinateRole: (moduleId: string, approverRoleId: string, subordinateRoleId: string) => void;
  onClose: () => void;
}

function ApprovalPanel({
  moduleId,
  approverRoleId,
  activeRoles,
  getSubordinatesForApprover,
  toggleSubordinateRole,
  onClose,
}: ApprovalPanelProps) {
  const approverRole = activeRoles.find((r) => r.id === approverRoleId);
  if (!approverRole) return null;

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mt-2">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-slate-700">
          {approverRole.name} schvaluje zadosti od:
        </span>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {activeRoles
          .filter((r) => r.id !== approverRoleId)
          .map((subordinateRole) => {
            const subordinates = getSubordinatesForApprover(moduleId, approverRoleId);
            const isSubordinate = subordinates.includes(subordinateRole.id);

            return (
              <button
                key={subordinateRole.id}
                onClick={() => toggleSubordinateRole(moduleId, approverRoleId, subordinateRole.id)}
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
  );
}

interface ViewPanelProps {
  moduleId: string;
  viewerRoleId: string;
  activeRoles: { id: string; name: string }[];
  getVisibleRolesForViewer: (moduleId: string, viewerRoleId: string) => string[];
  toggleViewableRole: (moduleId: string, viewerRoleId: string, visibleRoleId: string) => void;
  onClose: () => void;
}

function ViewPanel({
  moduleId,
  viewerRoleId,
  activeRoles,
  getVisibleRolesForViewer,
  toggleViewableRole,
  onClose,
}: ViewPanelProps) {
  const viewerRole = activeRoles.find((r) => r.id === viewerRoleId);
  if (!viewerRole) return null;

  const getModuleLabel = () => {
    if (moduleId === 'tasks') return 'ukoly';
    if (moduleId === 'presence') return 'pritomnost';
    return 'smeny';
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mt-2">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-slate-700">
          {viewerRole.name} vidi {getModuleLabel()} od:
        </span>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {activeRoles
          .filter((r) => r.id !== viewerRoleId)
          .map((visibleRole) => {
            const visibleRoles = getVisibleRolesForViewer(moduleId, viewerRoleId);
            const isVisible = visibleRoles.includes(visibleRole.id);

            return (
              <button
                key={visibleRole.id}
                onClick={() => toggleViewableRole(moduleId, viewerRoleId, visibleRole.id)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                  isVisible
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                )}
              >
                {visibleRole.name}
              </button>
            );
          })}
      </div>
    </div>
  );
}

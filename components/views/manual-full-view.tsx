'use client';

import { ArrowLeft, Search, ChevronDown, ChevronRight, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FaqList, TipsList, StepsList } from '@/lib/markdown-parser';
import { useManualStore } from '@/stores/manual-store';
import { useAuthStore } from '@/stores/auth-store';
import {
  getModulesForRole,
  getRoleIntro,
  getModuleContent,
  getModuleName,
  filterModulesBySearch,
} from '@/features/manual/manual-content';
import { cn } from '@/lib/utils';

export function ManualFullView() {
  const {
    expandedSections,
    searchQuery,
    closeManualView,
    toggleSection,
    setSearchQuery,
  } = useManualStore();

  const { activeRoleId } = useAuthStore();

  // Get modules for current role
  const roleModules = activeRoleId ? getModulesForRole(activeRoleId) : [];
  const filteredModules = filterModulesBySearch(roleModules, searchQuery);
  const roleIntro = activeRoleId ? getRoleIntro(activeRoleId) : null;

  // Check if search is active
  const isSearching = searchQuery.trim().length > 0;

  return (
    <main className="flex-1 p-6 overflow-y-auto bg-slate-50">
      <div className="space-y-6 pb-16 animate-in fade-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <Button
            onClick={closeManualView}
            variant="outline"
            className="px-4 py-2 rounded-lg text-xs font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zpět
          </Button>

          <div className="flex items-center space-x-2">
            <HelpCircle className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl font-bold text-slate-800">Nápověda</h1>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Hledat v nápovědě..."
              className="bg-slate-50 pl-9 pr-4 py-2 rounded-lg text-sm font-medium text-slate-700 outline-none border border-slate-200 w-64 focus:border-blue-300"
            />
          </div>
        </div>

        {/* Role intro section (hidden when searching) */}
        {!isSearching && roleIntro && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800 mb-2">
                {roleIntro.title}
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                {roleIntro.intro}
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Workflow */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3">
                  Váš typický pracovní den
                </h3>
                <StepsList items={roleIntro.workflow} />
              </div>

              {/* Principles */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3">
                  Důležité zásady
                </h3>
                <ul className="space-y-2">
                  {roleIntro.principles.map((principle, index) => (
                    <li
                      key={index}
                      className="flex items-start text-sm text-slate-600"
                    >
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                      {principle}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Contact */}
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-sm text-slate-600">
                  <span className="font-semibold">Potřebujete pomoct?</span>{' '}
                  Kontaktujte: {roleIntro.contact}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Module sections */}
        <div className="space-y-3">
          {filteredModules.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
              <p className="text-slate-500 font-medium">
                {isSearching
                  ? 'Žádné výsledky pro zadaný dotaz'
                  : 'Žádné moduly k zobrazení'}
              </p>
            </div>
          ) : (
            filteredModules.map((moduleId) => (
              <ModuleSection
                key={moduleId}
                moduleId={moduleId}
                isExpanded={expandedSections.includes(moduleId) || isSearching}
                onToggle={() => toggleSection(moduleId)}
                forceExpanded={isSearching}
              />
            ))
          )}
        </div>
      </div>
    </main>
  );
}

interface ModuleSectionProps {
  moduleId: string;
  isExpanded: boolean;
  onToggle: () => void;
  forceExpanded?: boolean;
}

function ModuleSection({
  moduleId,
  isExpanded,
  onToggle,
  forceExpanded = false,
}: ModuleSectionProps) {
  const moduleName = getModuleName(moduleId);
  const content = getModuleContent(moduleId);

  const expanded = forceExpanded || isExpanded;

  if (!content) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      {/* Header - clickable to expand/collapse */}
      <button
        onClick={onToggle}
        disabled={forceExpanded}
        className={cn(
          'w-full flex items-center justify-between p-4 text-left transition-colors',
          !forceExpanded && 'hover:bg-slate-50',
          forceExpanded && 'cursor-default'
        )}
      >
        <div className="flex items-center space-x-3">
          {!forceExpanded && (
            expanded ? (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-slate-400" />
            )
          )}
          <div>
            <h3 className="text-base font-semibold text-slate-800">
              {moduleName}
            </h3>
            <p className="text-sm text-slate-500 mt-0.5">{content.description}</p>
          </div>
        </div>
      </button>

      {/* Content - shown when expanded */}
      {expanded && (
        <div className="px-6 pb-6 space-y-6 border-t border-slate-100 pt-4">
          {/* Purpose */}
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-2">
              K čemu slouží
            </h4>
            <p className="text-sm text-slate-600 leading-relaxed">
              {content.purpose}
            </p>
          </div>

          {/* How to use */}
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-3">
              Jak používat
            </h4>
            <StepsList items={content.howToUse} />
          </div>

          {/* FAQ */}
          {content.faq.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3">
                Časté otázky
              </h4>
              <FaqList items={content.faq} />
            </div>
          )}

          {/* Tips */}
          {content.tips.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Tipy</h4>
              <TipsList items={content.tips} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

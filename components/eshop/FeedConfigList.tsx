'use client';

import { useState } from 'react';
import { Search, Plus, Pencil, Trash2, Upload, FileText, FileCode, History } from 'lucide-react';
import { useEshopFeedStore } from '@/features/eshop/eshop-feed-store';
import { FeedConfigFormModal } from './FeedConfigFormModal';
import { FeedImportModal } from './FeedImportModal';
import { FeedLogList } from './FeedLogList';

export function FeedConfigList() {
  const {
    feedSearchQuery,
    setFeedSearch,
    isFeedFormOpen,
    openFeedForm,
    closeFeedForm,
    editingFeedId,
    isImportModalOpen,
    openImportModal,
    getFilteredFeedConfigs,
    getLogsForFeed,
    deleteFeedConfig,
  } = useEshopFeedStore();

  const [showLogs, setShowLogs] = useState(false);
  const [logsForFeedId, setLogsForFeedId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const feedConfigs = getFilteredFeedConfigs();

  const handleDelete = async (id: number) => {
    if (deleting) return;
    setDeleting(id);
    await deleteFeedConfig(id);
    setDeleting(null);
  };

  const handleShowLogs = (feedId: number) => {
    setLogsForFeedId(feedId);
    setShowLogs(true);
  };

  if (showLogs && logsForFeedId !== null) {
    return (
      <FeedLogList
        feedId={logsForFeedId}
        onBack={() => { setShowLogs(false); setLogsForFeedId(null); }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={feedSearchQuery}
            onChange={(e) => setFeedSearch(e.target.value)}
            placeholder="Hledat feed..."
            className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-sm font-medium outline-none focus:border-emerald-400"
          />
        </div>

        <button
          onClick={() => openFeedForm()}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-emerald-700 active:scale-[0.98] transition-all ml-auto"
        >
          <Plus className="w-4 h-4" />
          Nový feed
        </button>
      </div>

      {/* Table */}
      {feedConfigs.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Zatím žádné feed konfigurace</p>
          <p className="text-sm text-slate-400 mt-1">
            Vytvořte první konfiguraci pro import produktů z CSV nebo XML
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Název
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Typ
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Oddělovač
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Importů
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Poslední import
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Stav
                </th>
                <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Akce
                </th>
              </tr>
            </thead>
            <tbody>
              {feedConfigs.map((fc) => {
                const logs = getLogsForFeed(fc.id);
                const lastLog = logs[0];
                return (
                  <tr
                    key={fc.id}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <span className="text-sm font-semibold text-slate-800">{fc.name}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600">
                        {fc.type === 'csv' ? (
                          <FileText className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <FileCode className="w-3.5 h-3.5 text-blue-500" />
                        )}
                        {fc.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm font-medium text-slate-600">
                      {fc.type === 'csv' ? (
                        <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">{fc.delimiter}</code>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-sm font-medium text-slate-600">
                      {logs.length}
                    </td>
                    <td className="px-5 py-3 text-sm font-medium text-slate-500">
                      {fc.lastSync
                        ? new Date(fc.lastSync).toLocaleDateString('cs-CZ', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'}
                    </td>
                    <td className="px-5 py-3">
                      {lastLog ? (
                        <StatusBadge status={lastLog.status} />
                      ) : (
                        <span className="text-xs font-medium text-slate-400">Nový</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openImportModal(fc.id)}
                          className="p-2 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                          title="Importovat"
                        >
                          <Upload className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleShowLogs(fc.id)}
                          className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Historie importů"
                        >
                          <History className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openFeedForm(fc.id)}
                          className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Upravit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(fc.id)}
                          disabled={deleting === fc.id}
                          className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                          title="Smazat"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      {isFeedFormOpen && (
        <FeedConfigFormModal
          editingId={editingFeedId}
          onClose={closeFeedForm}
        />
      )}
      {isImportModalOpen && <FeedImportModal />}
    </div>
  );
}

// =============================================================================
// STATUS BADGE
// =============================================================================

function StatusBadge({ status }: { status: string }) {
  const config = {
    success: { bg: 'bg-green-50', text: 'text-green-700', label: 'Úspěch' },
    error: { bg: 'bg-red-50', text: 'text-red-700', label: 'Chyba' },
    partial: { bg: 'bg-orange-50', text: 'text-orange-700', label: 'Částečný' },
  }[status] ?? { bg: 'bg-slate-50', text: 'text-slate-600', label: status };

  return (
    <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-semibold ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
}

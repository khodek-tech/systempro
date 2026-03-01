'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { useEshopFeedStore } from '@/features/eshop/eshop-feed-store';
import type { FeedType } from '@/shared/types';

interface FeedConfigFormModalProps {
  editingId: number | null;
  onClose: () => void;
}

export function FeedConfigFormModal({ editingId, onClose }: FeedConfigFormModalProps) {
  const { feedConfigs, createFeedConfig, updateFeedConfig } = useEshopFeedStore();
  const existing = editingId ? feedConfigs.find((fc) => fc.id === editingId) : null;

  const [name, setName] = useState(existing?.name ?? '');
  const [type, setType] = useState<FeedType>(existing?.type ?? 'csv');
  const [delimiter, setDelimiter] = useState(existing?.delimiter ?? ';');
  const [encoding, setEncoding] = useState(existing?.encoding ?? 'utf-8');
  const [saving, setSaving] = useState(false);

  const isValid = name.trim().length > 0;

  const handleSubmit = async () => {
    if (!isValid || saving) return;
    setSaving(true);

    if (existing) {
      await updateFeedConfig(existing.id, {
        name: name.trim(),
        type,
        delimiter,
        encoding,
      });
    } else {
      await createFeedConfig({
        name: name.trim(),
        type,
        delimiter,
        encoding,
        mapping: {},
        autoSync: false,
        syncInterval: 'daily',
        active: true,
      });
    }

    setSaving(false);
    onClose();
  };

  const mappingEntries = existing?.mapping ? Object.entries(existing.mapping) : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md max-h-[90vh] flex flex-col animate-in slide-in-from-top-2 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-800">
            {existing ? 'Upravit feed' : 'Nový feed'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
              Název *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Např. Dodavatel XY - hlavní feed"
              className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium outline-none focus:border-emerald-300 w-full"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
              Typ souboru
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as FeedType)}
              className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold outline-none cursor-pointer focus:border-emerald-300 w-full"
            >
              <option value="csv">CSV</option>
              <option value="xml">XML</option>
            </select>
          </div>

          {/* Delimiter (CSV only) */}
          {type === 'csv' && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                Oddělovač
              </label>
              <select
                value={delimiter}
                onChange={(e) => setDelimiter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold outline-none cursor-pointer focus:border-emerald-300 w-full"
              >
                <option value=";">Středník (;)</option>
                <option value=",">Čárka (,)</option>
                <option value="\t">Tabulátor</option>
                <option value="|">Svislítko (|)</option>
              </select>
            </div>
          )}

          {/* Encoding */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
              Kódování
            </label>
            <select
              value={encoding}
              onChange={(e) => setEncoding(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold outline-none cursor-pointer focus:border-emerald-300 w-full"
            >
              <option value="utf-8">UTF-8</option>
              <option value="windows-1250">Windows-1250</option>
              <option value="iso-8859-2">ISO-8859-2</option>
            </select>
          </div>

          {/* Saved mapping preview */}
          {existing && mappingEntries.length > 0 && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                Uložené mapování
              </label>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
                {mappingEntries.map(([feedCol, dbField]) => (
                  <div key={feedCol} className="flex items-center gap-2 text-xs font-medium">
                    <span className="text-slate-600">{feedCol}</span>
                    <span className="text-slate-400">→</span>
                    <span className="text-emerald-600">{dbField}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Mapování se upravuje při importu
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-8 py-5 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Zrušit
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !isValid}
            className="px-6 py-2 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Ukládám...' : existing ? 'Uložit' : 'Vytvořit'}
          </button>
        </div>
      </div>
    </div>
  );
}

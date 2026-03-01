'use client';

import { useState } from 'react';
import { X, Check, Sparkles } from 'lucide-react';

interface AiTextField {
  key: string;
  label: string;
  original: string;
  generated: string;
  multiline?: boolean;
}

interface AiPreviewModalProps {
  title: string;
  fields: AiTextField[];
  usage?: { inputTokens: number; outputTokens: number; durationMs: number };
  onApply: (selectedFields: Record<string, string>) => void;
  onReject: () => void;
}

export function AiPreviewModal({ title, fields, usage, onApply, onReject }: AiPreviewModalProps) {
  const [selected, setSelected] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const f of fields) {
      initial[f.key] = true;
    }
    return initial;
  });

  const [editedValues, setEditedValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const f of fields) {
      initial[f.key] = f.generated;
    }
    return initial;
  });

  const allSelected = fields.every((f) => selected[f.key]);
  const anySelected = fields.some((f) => selected[f.key]);

  const toggleAll = () => {
    const newVal = !allSelected;
    const updated: Record<string, boolean> = {};
    for (const f of fields) {
      updated[f.key] = newVal;
    }
    setSelected(updated);
  };

  const handleApply = () => {
    const result: Record<string, string> = {};
    for (const f of fields) {
      if (selected[f.key]) {
        result[f.key] = editedValues[f.key];
      }
    }
    onApply(result);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-[900px] max-h-[90vh] flex flex-col animate-in slide-in-from-top-2 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">AI Přetextování</h2>
              <p className="text-xs text-slate-400">{title}</p>
            </div>
          </div>
          <button onClick={onReject} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Select all */}
          <div className="flex items-center justify-between">
            <button
              onClick={toggleAll}
              className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
            >
              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${allSelected ? 'bg-purple-600 border-purple-600' : 'border-slate-300'}`}>
                {allSelected && <Check className="w-3 h-3 text-white" />}
              </div>
              Vybrat vše
            </button>
            {usage && (
              <span className="text-xs text-slate-400">
                {usage.inputTokens + usage.outputTokens} tokenů · {(usage.durationMs / 1000).toFixed(1)}s
              </span>
            )}
          </div>

          {/* Fields */}
          {fields.map((field) => (
            <div key={field.key} className="border border-slate-200 rounded-xl overflow-hidden">
              {/* Field header */}
              <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border-b border-slate-200">
                <button
                  onClick={() => setSelected((s) => ({ ...s, [field.key]: !s[field.key] }))}
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${selected[field.key] ? 'bg-purple-600 border-purple-600' : 'border-slate-300'}`}
                >
                  {selected[field.key] && <Check className="w-3 h-3 text-white" />}
                </button>
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{field.label}</span>
              </div>

              {/* Side by side */}
              <div className="grid grid-cols-2 divide-x divide-slate-200">
                {/* Original */}
                <div className="p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">Původní</p>
                  {field.multiline ? (
                    <div
                      className="text-sm text-slate-500 leading-relaxed max-h-40 overflow-y-auto prose prose-sm prose-slate"
                      dangerouslySetInnerHTML={{ __html: field.original || '<span class="text-slate-300 italic">prázdné</span>' }}
                    />
                  ) : (
                    <p className="text-sm text-slate-500 leading-relaxed">
                      {field.original || <span className="text-slate-300 italic">prázdné</span>}
                    </p>
                  )}
                </div>

                {/* Generated */}
                <div className={`p-3 transition-colors ${selected[field.key] ? 'bg-emerald-50/50' : ''}`}>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600 mb-1.5">Vygenerované</p>
                  {field.multiline ? (
                    <textarea
                      value={editedValues[field.key]}
                      onChange={(e) => setEditedValues((s) => ({ ...s, [field.key]: e.target.value }))}
                      className="w-full text-sm text-slate-700 leading-relaxed bg-transparent outline-none resize-none min-h-[100px]"
                      rows={6}
                    />
                  ) : (
                    <input
                      type="text"
                      value={editedValues[field.key]}
                      onChange={(e) => setEditedValues((s) => ({ ...s, [field.key]: e.target.value }))}
                      className="w-full text-sm text-slate-700 font-medium bg-transparent outline-none"
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200">
          <button
            onClick={onReject}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Odmítnout
          </button>
          <button
            onClick={handleApply}
            disabled={!anySelected}
            className="flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            Přijmout vybrané
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import { Trash2, ChevronUp, ChevronDown } from 'lucide-react';

interface VyhodyPolozka {
  ikona: string;
  nadpis: string;
  popis: string;
}

interface VyhodyFormProps {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}

const inputClass =
  'bg-slate-50 border border-slate-200 rounded-xl p-4 text-base font-medium outline-none focus:border-orange-300 w-full';
const labelClass = 'text-sm font-medium text-slate-500';

function getPolozky(config: Record<string, unknown>): VyhodyPolozka[] {
  const raw = config.polozky;
  if (Array.isArray(raw)) {
    return raw as VyhodyPolozka[];
  }
  return [];
}

export function VyhodyForm({ config, onChange }: VyhodyFormProps) {
  const polozky = getPolozky(config);

  const updatePolozky = (updated: VyhodyPolozka[]) => {
    onChange({ ...config, polozky: updated });
  };

  const updateItem = (index: number, key: keyof VyhodyPolozka, value: string) => {
    const updated = [...polozky];
    updated[index] = { ...updated[index], [key]: value };
    updatePolozky(updated);
  };

  const addItem = () => {
    updatePolozky([...polozky, { ikona: '', nadpis: '', popis: '' }]);
  };

  const removeItem = (index: number) => {
    updatePolozky(polozky.filter((_, i) => i !== index));
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= polozky.length) return;
    const updated = [...polozky];
    [updated[index], updated[target]] = [updated[target], updated[index]];
    updatePolozky(updated);
  };

  return (
    <div className="space-y-4">
      {polozky.map((item, index) => (
        <div key={index} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Položka {index + 1}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => moveItem(index, 'up')}
                disabled={index === 0}
                className="p-1.5 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronUp className="w-4 h-4 text-slate-500" />
              </button>
              <button
                type="button"
                onClick={() => moveItem(index, 'down')}
                disabled={index === polozky.length - 1}
                className="p-1.5 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronDown className="w-4 h-4 text-slate-500" />
              </button>
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            </div>
          </div>

          <div>
            <label className={labelClass}>Ikona</label>
            <input
              type="text"
              value={item.ikona}
              onChange={(e) => updateItem(index, 'ikona', e.target.value)}
              className={inputClass}
              placeholder="truck, shield, headphones..."
            />
          </div>

          <div>
            <label className={labelClass}>Nadpis</label>
            <input
              type="text"
              value={item.nadpis}
              onChange={(e) => updateItem(index, 'nadpis', e.target.value)}
              className={inputClass}
              placeholder="Doprava zdarma"
            />
          </div>

          <div>
            <label className={labelClass}>Popis</label>
            <input
              type="text"
              value={item.popis}
              onChange={(e) => updateItem(index, 'popis', e.target.value)}
              className={inputClass}
              placeholder="Nad 1 000 Kč doprava zdarma"
            />
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addItem}
        className="w-full bg-slate-100 text-slate-700 px-4 py-3 rounded-xl font-medium hover:bg-slate-200 transition-all duration-200"
      >
        + Přidat položku
      </button>
    </div>
  );
}

'use client';

import { Trash2 } from 'lucide-react';

interface FaqPolozka {
  otazka: string;
  odpoved: string;
}

interface FaqFormProps {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}

const inputClass =
  'bg-slate-50 border border-slate-200 rounded-xl p-4 text-base font-medium outline-none focus:border-orange-300 w-full';
const labelClass = 'text-sm font-medium text-slate-500';

function getPolozky(config: Record<string, unknown>): FaqPolozka[] {
  const raw = config.polozky;
  if (Array.isArray(raw)) {
    return raw as FaqPolozka[];
  }
  return [];
}

export function FaqForm({ config, onChange }: FaqFormProps) {
  const nadpis = (config.nadpis as string) ?? '';
  const polozky = getPolozky(config);

  const update = (key: string, value: unknown) => {
    onChange({ ...config, [key]: value });
  };

  const updatePolozky = (updated: FaqPolozka[]) => {
    update('polozky', updated);
  };

  const updateItem = (index: number, key: keyof FaqPolozka, value: string) => {
    const updated = [...polozky];
    updated[index] = { ...updated[index], [key]: value };
    updatePolozky(updated);
  };

  const addItem = () => {
    updatePolozky([...polozky, { otazka: '', odpoved: '' }]);
  };

  const removeItem = (index: number) => {
    updatePolozky(polozky.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div>
        <label className={labelClass}>Nadpis sekce</label>
        <input
          type="text"
          value={nadpis}
          onChange={(e) => update('nadpis', e.target.value)}
          className={inputClass}
          placeholder="Často kladené dotazy"
        />
      </div>

      {polozky.map((item, index) => (
        <div key={index} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Otázka {index + 1}
            </span>
            <button
              type="button"
              onClick={() => removeItem(index)}
              className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </button>
          </div>

          <div>
            <label className={labelClass}>Otázka</label>
            <input
              type="text"
              value={item.otazka}
              onChange={(e) => updateItem(index, 'otazka', e.target.value)}
              className={inputClass}
              placeholder="Jak dlouho trvá doručení?"
            />
          </div>

          <div>
            <label className={labelClass}>Odpověď</label>
            <textarea
              value={item.odpoved}
              onChange={(e) => updateItem(index, 'odpoved', e.target.value)}
              className={inputClass + ' resize-none'}
              rows={3}
              placeholder="Odpověď na otázku..."
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

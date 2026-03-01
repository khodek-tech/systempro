'use client';

import { Trash2 } from 'lucide-react';

interface RecenzePolozka {
  jmeno: string;
  text: string;
  hodnoceni: number;
}

interface RecenzeFormProps {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}

const inputClass =
  'bg-slate-50 border border-slate-200 rounded-xl p-4 text-base font-medium outline-none focus:border-orange-300 w-full';
const labelClass = 'text-sm font-medium text-slate-500';

function getPolozky(config: Record<string, unknown>): RecenzePolozka[] {
  const raw = config.polozky;
  if (Array.isArray(raw)) {
    return raw as RecenzePolozka[];
  }
  return [];
}

export function RecenzeForm({ config, onChange }: RecenzeFormProps) {
  const nadpis = (config.nadpis as string) ?? '';
  const polozky = getPolozky(config);

  const update = (key: string, value: unknown) => {
    onChange({ ...config, [key]: value });
  };

  const updatePolozky = (updated: RecenzePolozka[]) => {
    update('polozky', updated);
  };

  const updateItem = (index: number, key: keyof RecenzePolozka, value: string | number) => {
    const updated = [...polozky];
    updated[index] = { ...updated[index], [key]: value };
    updatePolozky(updated);
  };

  const addItem = () => {
    updatePolozky([...polozky, { jmeno: '', text: '', hodnoceni: 5 }]);
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
          placeholder="Co říkají naši zákazníci"
        />
      </div>

      {polozky.map((item, index) => (
        <div key={index} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Recenze {index + 1}
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
            <label className={labelClass}>Jméno</label>
            <input
              type="text"
              value={item.jmeno}
              onChange={(e) => updateItem(index, 'jmeno', e.target.value)}
              className={inputClass}
              placeholder="Jan Novák"
            />
          </div>

          <div>
            <label className={labelClass}>Text recenze</label>
            <textarea
              value={item.text}
              onChange={(e) => updateItem(index, 'text', e.target.value)}
              className={inputClass + ' resize-none'}
              rows={3}
              placeholder="Skvělá zkušenost s nákupem..."
            />
          </div>

          <div>
            <label className={labelClass}>Hodnocení (1-5)</label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={item.hodnoceni}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  const clamped = Math.max(1, Math.min(5, isNaN(val) ? 5 : val));
                  updateItem(index, 'hodnoceni', clamped);
                }}
                className={inputClass + ' max-w-[100px]'}
                min={1}
                max={5}
              />
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => updateItem(index, 'hodnoceni', star)}
                    className="text-xl transition-colors"
                  >
                    <span className={star <= (item.hodnoceni ?? 5) ? 'text-amber-400' : 'text-slate-300'}>
                      ★
                    </span>
                  </button>
                ))}
              </div>
            </div>
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

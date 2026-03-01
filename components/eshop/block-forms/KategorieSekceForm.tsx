'use client';

interface KategorieSekceFormProps {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}

const inputClass =
  'bg-slate-50 border border-slate-200 rounded-xl p-4 text-base font-medium outline-none focus:border-orange-300 w-full';
const labelClass = 'text-sm font-medium text-slate-500';

export function KategorieSekceForm({ config, onChange }: KategorieSekceFormProps) {
  const nadpis = (config.nadpis as string) ?? '';

  return (
    <div className="space-y-4">
      <div>
        <label className={labelClass}>Nadpis</label>
        <input
          type="text"
          value={nadpis}
          onChange={(e) => onChange({ ...config, nadpis: e.target.value })}
          className={inputClass}
          placeholder="Procházejte kategorie"
        />
      </div>
    </div>
  );
}

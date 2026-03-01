'use client';

interface TextBlokFormProps {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}

const inputClass =
  'bg-slate-50 border border-slate-200 rounded-xl p-4 text-base font-medium outline-none focus:border-orange-300 w-full';
const labelClass = 'text-sm font-medium text-slate-500';

const ZAROVNANI_OPTIONS = [
  { value: 'left', label: 'Vlevo' },
  { value: 'center', label: 'Na střed' },
  { value: 'right', label: 'Vpravo' },
];

export function TextBlokForm({ config, onChange }: TextBlokFormProps) {
  const obsah = (config.obsah as string) ?? '';
  const zarovnani = (config.zarovnani as string) ?? 'left';

  const update = (key: string, value: string) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className={labelClass}>Obsah</label>
        <textarea
          value={obsah}
          onChange={(e) => update('obsah', e.target.value)}
          className={inputClass + ' resize-none'}
          rows={6}
          placeholder="Textový obsah bloku..."
        />
      </div>

      <div>
        <label className={labelClass}>Zarovnání</label>
        <select
          value={zarovnani}
          onChange={(e) => update('zarovnani', e.target.value)}
          className={inputClass + ' cursor-pointer'}
        >
          {ZAROVNANI_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

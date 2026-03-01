'use client';

interface HeroBannerFormProps {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}

const inputClass =
  'bg-slate-50 border border-slate-200 rounded-xl p-4 text-base font-medium outline-none focus:border-orange-300 w-full';
const labelClass = 'text-sm font-medium text-slate-500';

const VYSKA_OPTIONS = [
  { value: '400px', label: '400 px' },
  { value: '500px', label: '500 px' },
  { value: '600px', label: '600 px' },
];

export function HeroBannerForm({ config, onChange }: HeroBannerFormProps) {
  const nadpis = (config.nadpis as string) ?? '';
  const podnadpis = (config.podnadpis as string) ?? '';
  const obrazekUrl = (config.obrazek_url as string) ?? '';
  const tlacitkoText = (config.tlacitko_text as string) ?? '';
  const tlacitkoUrl = (config.tlacitko_url as string) ?? '';
  const vyska = (config.vyska as string) ?? '500px';

  const update = (key: string, value: string) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className={labelClass}>Nadpis</label>
        <input
          type="text"
          value={nadpis}
          onChange={(e) => update('nadpis', e.target.value)}
          className={inputClass}
          placeholder="Hlavní nadpis banneru"
        />
      </div>

      <div>
        <label className={labelClass}>Podnadpis</label>
        <input
          type="text"
          value={podnadpis}
          onChange={(e) => update('podnadpis', e.target.value)}
          className={inputClass}
          placeholder="Doplňkový text pod nadpisem"
        />
      </div>

      <div>
        <label className={labelClass}>URL obrázku</label>
        <input
          type="text"
          value={obrazekUrl}
          onChange={(e) => update('obrazek_url', e.target.value)}
          className={inputClass}
          placeholder="https://example.com/banner.jpg"
        />
      </div>

      <div>
        <label className={labelClass}>Text tlačítka</label>
        <input
          type="text"
          value={tlacitkoText}
          onChange={(e) => update('tlacitko_text', e.target.value)}
          className={inputClass}
          placeholder="Zobrazit nabídku"
        />
      </div>

      <div>
        <label className={labelClass}>Odkaz tlačítka</label>
        <input
          type="text"
          value={tlacitkoUrl}
          onChange={(e) => update('tlacitko_url', e.target.value)}
          className={inputClass}
          placeholder="/kategorie/novinky"
        />
      </div>

      <div>
        <label className={labelClass}>Výška banneru</label>
        <select
          value={vyska}
          onChange={(e) => update('vyska', e.target.value)}
          className={inputClass + ' cursor-pointer'}
        >
          {VYSKA_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

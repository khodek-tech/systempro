'use client';

interface ProduktCarouselFormProps {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}

const inputClass =
  'bg-slate-50 border border-slate-200 rounded-xl p-4 text-base font-medium outline-none focus:border-orange-300 w-full';
const labelClass = 'text-sm font-medium text-slate-500';

export function ProduktCarouselForm({ config, onChange }: ProduktCarouselFormProps) {
  const nadpis = (config.nadpis as string) ?? '';
  const pocetProduktu = (config.pocet_produktu as number) ?? 8;
  const autoplay = (config.autoplay as boolean) ?? false;
  const rychlost = (config.rychlost as number) ?? 3000;

  const update = (key: string, value: string | number | boolean) => {
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
          placeholder="Nejprodávanější produkty"
        />
      </div>

      <div>
        <label className={labelClass}>Počet produktů</label>
        <input
          type="number"
          value={pocetProduktu}
          onChange={(e) => update('pocet_produktu', parseInt(e.target.value, 10) || 8)}
          className={inputClass}
          min={1}
          max={24}
        />
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="autoplay-toggle"
          checked={autoplay}
          onChange={(e) => update('autoplay', e.target.checked)}
          className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
        />
        <label htmlFor="autoplay-toggle" className="text-sm font-medium text-slate-600 cursor-pointer">
          Automatické přehrávání
        </label>
      </div>

      <div>
        <label className={labelClass}>Rychlost přehrávání (ms)</label>
        <input
          type="number"
          value={rychlost}
          onChange={(e) => update('rychlost', parseInt(e.target.value, 10) || 3000)}
          className={inputClass}
          min={1000}
          max={10000}
          step={500}
        />
      </div>
    </div>
  );
}

'use client';

interface ProduktGridFormProps {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}

const inputClass =
  'bg-slate-50 border border-slate-200 rounded-xl p-4 text-base font-medium outline-none focus:border-orange-300 w-full';
const labelClass = 'text-sm font-medium text-slate-500';

export function ProduktGridForm({ config, onChange }: ProduktGridFormProps) {
  const nadpis = (config.nadpis as string) ?? '';
  const popis = (config.popis as string) ?? '';
  const pocetProduktu = (config.pocet_produktu as number) ?? 4;

  const update = (key: string, value: string | number) => {
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
          placeholder="Doporučené produkty"
        />
      </div>

      <div>
        <label className={labelClass}>Popis</label>
        <input
          type="text"
          value={popis}
          onChange={(e) => update('popis', e.target.value)}
          className={inputClass}
          placeholder="Krátký popis sekce"
        />
      </div>

      <div>
        <label className={labelClass}>Počet produktů</label>
        <input
          type="number"
          value={pocetProduktu}
          onChange={(e) => update('pocet_produktu', parseInt(e.target.value, 10) || 4)}
          className={inputClass}
          min={1}
          max={24}
        />
      </div>
    </div>
  );
}

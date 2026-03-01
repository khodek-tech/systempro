'use client';

interface NewsletterFormProps {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}

const inputClass =
  'bg-slate-50 border border-slate-200 rounded-xl p-4 text-base font-medium outline-none focus:border-orange-300 w-full';
const labelClass = 'text-sm font-medium text-slate-500';

export function NewsletterForm({ config, onChange }: NewsletterFormProps) {
  const nadpis = (config.nadpis as string) ?? '';
  const popis = (config.popis as string) ?? '';
  const tlacitkoText = (config.tlacitko_text as string) ?? 'Odebírat';

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
          placeholder="Přihlaste se k odběru novinek"
        />
      </div>

      <div>
        <label className={labelClass}>Popis</label>
        <input
          type="text"
          value={popis}
          onChange={(e) => update('popis', e.target.value)}
          className={inputClass}
          placeholder="Získejte slevy a novinky přímo do emailu"
        />
      </div>

      <div>
        <label className={labelClass}>Text tlačítka</label>
        <input
          type="text"
          value={tlacitkoText}
          onChange={(e) => update('tlacitko_text', e.target.value)}
          className={inputClass}
          placeholder="Odebírat"
        />
      </div>
    </div>
  );
}

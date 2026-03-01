'use client';

interface BannerFormProps {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}

const inputClass =
  'bg-slate-50 border border-slate-200 rounded-xl p-4 text-base font-medium outline-none focus:border-orange-300 w-full';
const labelClass = 'text-sm font-medium text-slate-500';

export function BannerForm({ config, onChange }: BannerFormProps) {
  const text = (config.text as string) ?? '';
  const odkazText = (config.odkaz_text as string) ?? '';
  const odkazUrl = (config.odkaz_url as string) ?? '';
  const barvaPozadi = (config.barva_pozadi as string) ?? '#3B82F6';
  const barvaTextu = (config.barva_textu as string) ?? '#FFFFFF';

  const update = (key: string, value: string) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className={labelClass}>Text</label>
        <input
          type="text"
          value={text}
          onChange={(e) => update('text', e.target.value)}
          className={inputClass}
          placeholder="Sleva 20 % na všechny produkty!"
        />
      </div>

      <div>
        <label className={labelClass}>Text odkazu</label>
        <input
          type="text"
          value={odkazText}
          onChange={(e) => update('odkaz_text', e.target.value)}
          className={inputClass}
          placeholder="Zobrazit akci"
        />
      </div>

      <div>
        <label className={labelClass}>URL odkazu</label>
        <input
          type="text"
          value={odkazUrl}
          onChange={(e) => update('odkaz_url', e.target.value)}
          className={inputClass}
          placeholder="/akce/sleva-20"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Barva pozadí</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={barvaPozadi}
              onChange={(e) => update('barva_pozadi', e.target.value)}
              className="w-12 h-12 rounded-lg border border-slate-200 cursor-pointer p-1"
            />
            <input
              type="text"
              value={barvaPozadi}
              onChange={(e) => update('barva_pozadi', e.target.value)}
              className={inputClass}
              placeholder="#3B82F6"
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Barva textu</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={barvaTextu}
              onChange={(e) => update('barva_textu', e.target.value)}
              className="w-12 h-12 rounded-lg border border-slate-200 cursor-pointer p-1"
            />
            <input
              type="text"
              value={barvaTextu}
              onChange={(e) => update('barva_textu', e.target.value)}
              className={inputClass}
              placeholder="#FFFFFF"
            />
          </div>
        </div>
      </div>

      {/* Preview */}
      <div>
        <label className={labelClass}>Náhled</label>
        <div
          className="rounded-xl p-4 text-center font-medium transition-all duration-300"
          style={{ backgroundColor: barvaPozadi, color: barvaTextu }}
        >
          {text || 'Náhled banneru'}
          {odkazText && (
            <span className="ml-2 underline">{odkazText}</span>
          )}
        </div>
      </div>
    </div>
  );
}

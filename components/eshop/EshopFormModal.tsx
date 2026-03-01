'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { useEshopEshopyStore } from '@/stores/eshop-eshopy-store';
import { generateSlug } from '@/features/eshop/eshop-produkty-helpers';

type Section = 'basic' | 'design' | 'ai' | 'contact' | 'seo' | 'legal';

const SECTIONS: { id: Section; label: string }[] = [
  { id: 'basic', label: 'Základní' },
  { id: 'design', label: 'Design' },
  { id: 'ai', label: 'AI' },
  { id: 'contact', label: 'Kontakt' },
  { id: 'seo', label: 'SEO' },
  { id: 'legal', label: 'Právní' },
];

export function EshopFormModal() {
  const { editingEshopId, closeEshopForm, createEshop, updateEshop, eshops } = useEshopEshopyStore();
  const existing = editingEshopId ? eshops.find((e) => e.id === editingEshopId) : null;

  const [section, setSection] = useState<Section>('basic');
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState(existing?.name ?? '');
  const [domain, setDomain] = useState(existing?.domain ?? '');
  const [slug, setSlug] = useState(existing?.slug ?? '');
  const [active, setActive] = useState(existing?.active ?? true);

  // Design
  const [primaryColor, setPrimaryColor] = useState(existing?.primaryColor ?? '#3B82F6');
  const [secondaryColor, setSecondaryColor] = useState(existing?.secondaryColor ?? '#1E293B');
  const [font, setFont] = useState(existing?.font ?? 'Inter');
  const [logoUrl, setLogoUrl] = useState(existing?.logoUrl ?? '');
  const [faviconUrl, setFaviconUrl] = useState(existing?.faviconUrl ?? '');

  // AI
  const [toneOfVoice, setToneOfVoice] = useState(existing?.toneOfVoice ?? '');
  const [targetAudience, setTargetAudience] = useState(existing?.targetAudience ?? '');
  const [aiInstructions, setAiInstructions] = useState(existing?.aiInstructions ?? '');

  // Contact
  const [contactEmail, setContactEmail] = useState(existing?.contactEmail ?? '');
  const [contactPhone, setContactPhone] = useState(existing?.contactPhone ?? '');
  const [companyName, setCompanyName] = useState(existing?.companyName ?? '');
  const [companyAddress, setCompanyAddress] = useState(existing?.companyAddress ?? '');
  const [ico, setIco] = useState(existing?.ico ?? '');
  const [dic, setDic] = useState(existing?.dic ?? '');

  // SEO
  const [seoTitleTemplate, setSeoTitleTemplate] = useState(existing?.seoTitleTemplate ?? '');
  const [seoDescriptionTemplate, setSeoDescriptionTemplate] = useState(existing?.seoDescriptionTemplate ?? '');

  // Legal
  const [termsAndConditions, setTermsAndConditions] = useState(existing?.termsAndConditions ?? '');
  const [gdprText, setGdprText] = useState(existing?.gdprText ?? '');

  const handleNameChange = (val: string) => {
    setName(val);
    if (!existing) {
      setSlug(generateSlug(val));
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || !domain.trim() || !slug.trim()) return;
    setSaving(true);

    const data = {
      name: name.trim(),
      domain: domain.trim(),
      slug: slug.trim(),
      active,
      primaryColor,
      secondaryColor,
      font,
      logoUrl: logoUrl || undefined,
      faviconUrl: faviconUrl || undefined,
      toneOfVoice: toneOfVoice || undefined,
      targetAudience: targetAudience || undefined,
      aiInstructions: aiInstructions || undefined,
      contactEmail: contactEmail || undefined,
      contactPhone: contactPhone || undefined,
      companyName: companyName || undefined,
      companyAddress: companyAddress || undefined,
      ico: ico || undefined,
      dic: dic || undefined,
      seoTitleTemplate: seoTitleTemplate || undefined,
      seoDescriptionTemplate: seoDescriptionTemplate || undefined,
      termsAndConditions: termsAndConditions || undefined,
      gdprText: gdprText || undefined,
    };

    if (editingEshopId) {
      await updateEshop(editingEshopId, data);
    } else {
      await createEshop(data as Parameters<typeof createEshop>[0]);
    }
    setSaving(false);
  };

  const inputClass = 'bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium outline-none focus:border-emerald-300 w-full';
  const textareaClass = 'bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium outline-none resize-none focus:border-emerald-300 w-full';
  const labelClass = 'text-xs font-semibold uppercase tracking-wide text-slate-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-[900px] max-h-[90vh] flex flex-col animate-in slide-in-from-top-2 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-800">
            {existing ? 'Upravit e-shop' : 'Nový e-shop'}
          </h2>
          <button onClick={closeEshopForm} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Section tabs */}
        <div className="flex items-center gap-1 px-8 pt-4 pb-2">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                section === s.id
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-4 space-y-4">
          {section === 'basic' && (
            <>
              <div>
                <label className={labelClass}>Název *</label>
                <input type="text" value={name} onChange={(e) => handleNameChange(e.target.value)} className={inputClass} placeholder="Můj e-shop" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Doména *</label>
                  <input type="text" value={domain} onChange={(e) => setDomain(e.target.value)} className={inputClass} placeholder="shop.cz" />
                </div>
                <div>
                  <label className={labelClass}>Slug *</label>
                  <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} className={inputClass} placeholder="muj-eshop" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className={labelClass}>Aktivní</label>
                <button
                  onClick={() => setActive(!active)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${active ? 'bg-emerald-500' : 'bg-slate-300'}`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${active ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </>
          )}

          {section === 'design' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Primární barva</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer" />
                    <input type="text" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Sekundární barva</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer" />
                    <input type="text" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className={inputClass} />
                  </div>
                </div>
              </div>
              <div>
                <label className={labelClass}>Font</label>
                <select value={font} onChange={(e) => setFont(e.target.value)} className={inputClass}>
                  <option value="Inter">Inter</option>
                  <option value="Roboto">Roboto</option>
                  <option value="Open Sans">Open Sans</option>
                  <option value="Poppins">Poppins</option>
                  <option value="Montserrat">Montserrat</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Logo URL</label>
                  <input type="text" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} className={inputClass} placeholder="https://..." />
                </div>
                <div>
                  <label className={labelClass}>Favicon URL</label>
                  <input type="text" value={faviconUrl} onChange={(e) => setFaviconUrl(e.target.value)} className={inputClass} placeholder="https://..." />
                </div>
              </div>
            </>
          )}

          {section === 'ai' && (
            <>
              <div>
                <label className={labelClass}>Tón hlasu</label>
                <textarea value={toneOfVoice} onChange={(e) => setToneOfVoice(e.target.value)} className={textareaClass} rows={3} placeholder="Neformální, přátelský, mladistvý..." />
              </div>
              <div>
                <label className={labelClass}>Cílová skupina</label>
                <textarea value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} className={textareaClass} rows={3} placeholder="Mladí dospělí 18-35 let..." />
              </div>
              <div>
                <label className={labelClass}>AI instrukce</label>
                <textarea value={aiInstructions} onChange={(e) => setAiInstructions(e.target.value)} className={textareaClass} rows={6} placeholder="Specifické instrukce pro Claude při generování popisů produktů..." />
              </div>
            </>
          )}

          {section === 'contact' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>E-mail</label>
                  <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className={inputClass} placeholder="info@shop.cz" />
                </div>
                <div>
                  <label className={labelClass}>Telefon</label>
                  <input type="text" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} className={inputClass} placeholder="+420..." />
                </div>
              </div>
              <div>
                <label className={labelClass}>Název firmy</label>
                <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Adresa firmy</label>
                <textarea value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} className={textareaClass} rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>IČO</label>
                  <input type="text" value={ico} onChange={(e) => setIco(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>DIČ</label>
                  <input type="text" value={dic} onChange={(e) => setDic(e.target.value)} className={inputClass} />
                </div>
              </div>
            </>
          )}

          {section === 'seo' && (
            <>
              <div>
                <label className={labelClass}>SEO Title šablona</label>
                <input type="text" value={seoTitleTemplate} onChange={(e) => setSeoTitleTemplate(e.target.value)} className={inputClass} placeholder="{nazev} | {eshop}" />
                <p className="text-xs text-slate-400 mt-1">Proměnné: {'{nazev}'}, {'{kategorie}'}, {'{eshop}'}</p>
              </div>
              <div>
                <label className={labelClass}>SEO Description šablona</label>
                <textarea value={seoDescriptionTemplate} onChange={(e) => setSeoDescriptionTemplate(e.target.value)} className={textareaClass} rows={3} placeholder="Nakupte {nazev} za skvělé ceny na {eshop}..." />
              </div>
            </>
          )}

          {section === 'legal' && (
            <>
              <div>
                <label className={labelClass}>Obchodní podmínky</label>
                <textarea value={termsAndConditions} onChange={(e) => setTermsAndConditions(e.target.value)} className={textareaClass} rows={10} />
              </div>
              <div>
                <label className={labelClass}>GDPR text</label>
                <textarea value={gdprText} onChange={(e) => setGdprText(e.target.value)} className={textareaClass} rows={10} />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-8 py-5 border-t border-slate-200">
          <button onClick={closeEshopForm} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
            Zrušit
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !name.trim() || !domain.trim() || !slug.trim()}
            className="px-6 py-2 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Ukládám...' : existing ? 'Uložit' : 'Vytvořit'}
          </button>
        </div>
      </div>
    </div>
  );
}

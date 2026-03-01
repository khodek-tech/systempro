'use client';

import { useState, useMemo } from 'react';
import { X } from 'lucide-react';
import { useEshopPageBuilderStore } from '@/stores/eshop-page-builder-store';
import { HeroBannerForm } from './block-forms/HeroBannerForm';
import { ProduktGridForm } from './block-forms/ProduktGridForm';
import { ProduktCarouselForm } from './block-forms/ProduktCarouselForm';
import { TextBlokForm } from './block-forms/TextBlokForm';
import { KategorieSekceForm } from './block-forms/KategorieSekceForm';
import { NewsletterForm } from './block-forms/NewsletterForm';
import { VyhodyForm } from './block-forms/VyhodyForm';
import { BannerForm } from './block-forms/BannerForm';
import { FaqForm } from './block-forms/FaqForm';
import { RecenzeForm } from './block-forms/RecenzeForm';

function JsonFallbackForm({ config, onChange }: { config: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const [text, setText] = useState(JSON.stringify(config, null, 2));
  const [isValid, setIsValid] = useState(true);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-500">Konfigurace (JSON)</label>
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          try {
            const parsed = JSON.parse(e.target.value);
            onChange(parsed);
            setIsValid(true);
          } catch {
            setIsValid(false);
          }
        }}
        rows={12}
        className={`w-full bg-slate-50 border rounded-xl p-4 text-sm font-mono outline-none resize-none ${
          isValid ? 'border-slate-200 focus:border-orange-300' : 'border-red-300'
        }`}
      />
      {!isValid && <p className="text-xs text-red-500">Neplatný JSON</p>}
    </div>
  );
}

function getFormForBlockType(slug: string, config: Record<string, unknown>, onChange: (c: Record<string, unknown>) => void) {
  switch (slug) {
    case 'hero_banner':
      return <HeroBannerForm config={config} onChange={onChange} />;
    case 'produkt_grid':
      return <ProduktGridForm config={config} onChange={onChange} />;
    case 'produkt_carousel':
      return <ProduktCarouselForm config={config} onChange={onChange} />;
    case 'text_blok':
      return <TextBlokForm config={config} onChange={onChange} />;
    case 'kategorie_sekce':
      return <KategorieSekceForm config={config} onChange={onChange} />;
    case 'newsletter':
      return <NewsletterForm config={config} onChange={onChange} />;
    case 'vyhody':
      return <VyhodyForm config={config} onChange={onChange} />;
    case 'banner':
      return <BannerForm config={config} onChange={onChange} />;
    case 'faq':
      return <FaqForm config={config} onChange={onChange} />;
    case 'recenze':
      return <RecenzeForm config={config} onChange={onChange} />;
    default:
      return <JsonFallbackForm config={config} onChange={onChange} />;
  }
}

export function BlockEditorModal() {
  const { editingBlockId, pageBlocks, blockTypes, closeBlockEditor, updatePageBlock } = useEshopPageBuilderStore();
  const block = pageBlocks.find((b) => b.id === editingBlockId);
  const blockType = block ? blockTypes.find((t) => t.id === block.blockTypeId) : undefined;

  const initialConfig = useMemo(() => (block ? { ...block.config } : {}), [block]);
  const [config, setConfig] = useState<Record<string, unknown>>(initialConfig);
  const [saving, setSaving] = useState(false);

  // Reset config when block changes
  const [prevBlockId, setPrevBlockId] = useState(editingBlockId);
  if (editingBlockId !== prevBlockId) {
    setPrevBlockId(editingBlockId);
    if (block) setConfig({ ...block.config });
  }

  if (!block || !blockType) return null;

  const handleSave = async () => {
    setSaving(true);
    await updatePageBlock(block.id, { config });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={closeBlockEditor}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white rounded-2xl w-full max-w-[900px] max-h-[90vh] flex flex-col shadow-lg animate-in fade-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">
            Upravit: {blockType.name}
          </h2>
          <button
            onClick={closeBlockEditor}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {getFormForBlockType(blockType.slug, config, setConfig)}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-100">
          <button
            onClick={closeBlockEditor}
            className="px-4 py-2.5 rounded-lg font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Zrušit
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 rounded-lg font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 active:scale-[0.98]"
          >
            {saving ? 'Ukládám...' : 'Uložit'}
          </button>
        </div>
      </div>
    </div>
  );
}

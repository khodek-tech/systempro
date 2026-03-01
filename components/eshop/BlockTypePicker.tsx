'use client';

import { X, ImageIcon, Grid3x3, GalleryHorizontal, Type, FolderTree, Mail, CheckCircle, Megaphone, HelpCircle, Star } from 'lucide-react';
import { useEshopPageBuilderStore } from '@/stores/eshop-page-builder-store';

const BLOCK_TYPE_ICONS: Record<string, React.ReactNode> = {
  hero_banner: <ImageIcon className="w-8 h-8" />,
  produkt_grid: <Grid3x3 className="w-8 h-8" />,
  produkt_carousel: <GalleryHorizontal className="w-8 h-8" />,
  text_blok: <Type className="w-8 h-8" />,
  kategorie_sekce: <FolderTree className="w-8 h-8" />,
  newsletter: <Mail className="w-8 h-8" />,
  vyhody: <CheckCircle className="w-8 h-8" />,
  banner: <Megaphone className="w-8 h-8" />,
  faq: <HelpCircle className="w-8 h-8" />,
  recenze: <Star className="w-8 h-8" />,
};

export function BlockTypePicker() {
  const { blockTypes, selectedShopId, selectedPage, closeBlockTypePicker, createPageBlock, openBlockEditor } = useEshopPageBuilderStore();

  if (!selectedShopId) return null;

  const handleSelect = async (blockTypeId: number) => {
    const blockType = blockTypes.find((t) => t.id === blockTypeId);
    if (!blockType) return;

    const result = await createPageBlock({
      shopId: selectedShopId,
      page: selectedPage,
      blockTypeId,
      config: blockType.defaultConfig ?? {},
    });

    if (result.success && result.blockId) {
      openBlockEditor(result.blockId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={closeBlockTypePicker}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white rounded-2xl w-full max-w-[700px] max-h-[90vh] flex flex-col shadow-lg animate-in fade-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">Přidat blok</h2>
          <button
            onClick={closeBlockTypePicker}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 gap-4">
            {blockTypes.map((bt) => (
              <button
                key={bt.id}
                onClick={() => handleSelect(bt.id)}
                className="flex items-start gap-4 p-4 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all text-left group"
              >
                <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-slate-100 group-hover:bg-emerald-100 flex items-center justify-center text-slate-500 group-hover:text-emerald-600 transition-colors">
                  {BLOCK_TYPE_ICONS[bt.slug] ?? <Grid3x3 className="w-8 h-8" />}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-slate-800 group-hover:text-emerald-700 transition-colors">
                    {bt.name}
                  </div>
                  {bt.description && (
                    <div className="text-sm text-slate-500 mt-0.5 line-clamp-2">
                      {bt.description}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

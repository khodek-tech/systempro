'use client';

import { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { useEshopProduktyStore } from '@/stores/eshop-produkty-store';
import { generateSlug } from '@/features/eshop/eshop-produkty-helpers';

interface Props {
  productId: number;
}

export function ProductVariantsSection({ productId }: Props) {
  const {
    getVariantsForProduct,
    getAttributesForVariant,
    attributeTypes,
    getValuesForAttributeType,
    createVariant,
    updateVariant,
    deleteVariant,
    setVariantAttribute,
    removeVariantAttribute,
  } = useEshopProduktyStore();

  const variants = getVariantsForProduct(productId);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSku, setNewSku] = useState('');
  const [newPrice, setNewPrice] = useState('');

  const toggleExpanded = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddVariant = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    await createVariant({
      productId,
      name: newName.trim(),
      slug: generateSlug(newName.trim()),
      sku: newSku || undefined,
      basePrice: Number(newPrice) || 0,
      stock: 0,
      active: true,
    });
    setNewName('');
    setNewSku('');
    setNewPrice('');
    setAdding(false);
  };

  const handleDeleteVariant = async (id: number, name: string) => {
    if (!confirm(`Smazat variantu "${name}"?`)) return;
    await deleteVariant(id);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-800">Varianty ({variants.length})</h3>
      </div>

      {/* Existing variants */}
      {variants.map((variant) => {
        const isExpanded = expandedIds.has(variant.id);
        const attrs = getAttributesForVariant(variant.id);

        return (
          <div key={variant.id} className="border border-slate-200 rounded-xl overflow-hidden">
            {/* Variant header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-slate-50/50">
              <button onClick={() => toggleExpanded(variant.id)} className="text-slate-400">
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
              <span className="flex-1 text-sm font-semibold text-slate-800">{variant.name}</span>
              {variant.sku && <span className="text-xs font-mono text-slate-400">{variant.sku}</span>}
              <span className="text-sm font-bold text-slate-700">{variant.basePrice} Kč</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${variant.active ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                {variant.active ? 'Aktivní' : 'Neaktivní'}
              </span>
              <button
                onClick={() => handleDeleteVariant(variant.id, variant.name)}
                className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Expanded detail */}
            {isExpanded && (
              <div className="px-4 py-4 space-y-4 border-t border-slate-100">
                {/* Inline edit fields */}
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Název</label>
                    <input
                      type="text"
                      value={variant.name}
                      onChange={(e) => updateVariant(variant.id, { name: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium outline-none focus:border-orange-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">SKU</label>
                    <input
                      type="text"
                      value={variant.sku ?? ''}
                      onChange={(e) => updateVariant(variant.id, { sku: e.target.value || undefined })}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium outline-none focus:border-orange-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Cena (Kč)</label>
                    <input
                      type="number"
                      value={variant.basePrice}
                      onChange={(e) => updateVariant(variant.id, { basePrice: Number(e.target.value) })}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:border-orange-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Sklad</label>
                    <input
                      type="number"
                      value={variant.stock}
                      onChange={(e) => updateVariant(variant.id, { stock: Number(e.target.value) })}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium outline-none focus:border-orange-300"
                    />
                  </div>
                </div>

                {/* Attribute selectors */}
                {attributeTypes.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-2">Atributy</label>
                    <div className="flex flex-wrap gap-3">
                      {attributeTypes.map((attrType) => {
                        const values = getValuesForAttributeType(attrType.id);
                        const currentAttr = attrs.find((a) => a.attribute.id === attrType.id);

                        return (
                          <div key={attrType.id} className="flex-1 min-w-[140px]">
                            <label className="block text-xs text-slate-400 mb-1">{attrType.name}</label>
                            <select
                              value={currentAttr?.value.id ?? ''}
                              onChange={async (e) => {
                                const valueId = Number(e.target.value);
                                if (valueId) {
                                  await setVariantAttribute(variant.id, valueId);
                                } else if (currentAttr) {
                                  await removeVariantAttribute(variant.id, currentAttr.value.id);
                                }
                              }}
                              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium outline-none cursor-pointer"
                            >
                              <option value="">—</option>
                              {values.map((v) => (
                                <option key={v.id} value={v.id}>{v.value}</option>
                              ))}
                            </select>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Active toggle */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={variant.active}
                    onChange={(e) => updateVariant(variant.id, { active: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-300 text-emerald-600"
                  />
                  <span className="text-sm text-slate-600">Aktivní</span>
                </label>
              </div>
            )}
          </div>
        );
      })}

      {/* Add new variant */}
      <div className="border border-dashed border-slate-300 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Název varianty..."
            className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium outline-none focus:border-emerald-400"
          />
          <input
            type="text"
            value={newSku}
            onChange={(e) => setNewSku(e.target.value)}
            placeholder="SKU"
            className="w-28 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium outline-none focus:border-emerald-400"
          />
          <input
            type="number"
            value={newPrice}
            onChange={(e) => setNewPrice(e.target.value)}
            placeholder="Cena"
            className="w-24 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium outline-none focus:border-emerald-400"
          />
          <button
            onClick={handleAddVariant}
            disabled={adding || !newName.trim()}
            className="flex items-center gap-1.5 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Přidat
          </button>
        </div>
      </div>
    </div>
  );
}

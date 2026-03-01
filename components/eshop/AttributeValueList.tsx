'use client';

import { useState } from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { useEshopProduktyStore } from '@/stores/eshop-produkty-store';
import { generateSlug } from '@/features/eshop/eshop-produkty-helpers';
import type { AttributeDisplayType } from '@/shared/types';

interface Props {
  attributeTypeId: number;
  displayType: AttributeDisplayType;
}

export function AttributeValueList({ attributeTypeId, displayType }: Props) {
  const { getValuesForAttributeType, createAttributeValue, updateAttributeValue, deleteAttributeValue } = useEshopProduktyStore();
  const values = getValuesForAttributeType(attributeTypeId);

  const [newValue, setNewValue] = useState('');
  const [newHexColor, setNewHexColor] = useState('#000000');
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!newValue.trim()) return;
    setAdding(true);
    await createAttributeValue({
      attributeTypeId,
      value: newValue.trim(),
      slug: generateSlug(newValue.trim()),
      hexColor: displayType === 'color_swatch' ? newHexColor : undefined,
      order: values.length,
    });
    setNewValue('');
    setAdding(false);
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Smazat hodnotu "${name}"?`)) return;
    await deleteAttributeValue(id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="space-y-2">
      {/* Existing values */}
      {values.map((val) => (
        <div key={val.id} className="flex items-center gap-3 group">
          <GripVertical className="w-4 h-4 text-slate-300 cursor-grab" />

          {displayType === 'color_swatch' && (
            <input
              type="color"
              value={val.hexColor ?? '#000000'}
              onChange={(e) => updateAttributeValue(val.id, { hexColor: e.target.value })}
              className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer"
            />
          )}

          <input
            type="text"
            value={val.value}
            onChange={(e) => updateAttributeValue(val.id, { value: e.target.value })}
            className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium outline-none focus:border-orange-300"
          />

          <span className="text-xs text-slate-400 w-24 truncate">{val.slug}</span>

          <button
            onClick={() => handleDelete(val.id, val.value)}
            className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}

      {/* Add new value */}
      <div className="flex items-center gap-3 pt-1">
        <div className="w-4" />

        {displayType === 'color_swatch' && (
          <input
            type="color"
            value={newHexColor}
            onChange={(e) => setNewHexColor(e.target.value)}
            className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer"
          />
        )}

        <input
          type="text"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Nová hodnota..."
          className="flex-1 bg-white border border-dashed border-slate-300 rounded-lg px-3 py-2 text-sm font-medium outline-none focus:border-emerald-400"
        />

        <button
          onClick={handleAdd}
          disabled={adding || !newValue.trim()}
          className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          Přidat
        </button>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Plus, ChevronDown, ChevronRight, Pencil, Trash2, Palette, List, ToggleLeft } from 'lucide-react';
import { useEshopProduktyStore } from '@/stores/eshop-produkty-store';
import { AttributeTypeFormModal } from './AttributeTypeFormModal';
import { AttributeValueList } from './AttributeValueList';

const DISPLAY_TYPE_LABELS: Record<string, { label: string; icon: typeof Palette }> = {
  color_swatch: { label: 'Barvy', icon: Palette },
  dropdown: { label: 'Dropdown', icon: List },
  buttons: { label: 'Tlačítka', icon: ToggleLeft },
};

export function AttributeTypeList() {
  const {
    attributeTypes,
    isAttributeTypeFormOpen,
    editingAttributeTypeId,
    openAttributeTypeForm,
    closeAttributeTypeForm,
    deleteAttributeType,
  } = useEshopProduktyStore();

  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const toggleExpanded = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Opravdu smazat typ atributu "${name}" a všechny jeho hodnoty?`)) return;
    await deleteAttributeType(id);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">Typy atributů</h2>
        <button
          onClick={() => openAttributeTypeForm()}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-emerald-700 active:scale-[0.98] transition-all"
        >
          <Plus className="w-4 h-4" />
          Nový typ atributu
        </button>
      </div>

      {/* List */}
      {attributeTypes.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <Tags className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Zatím žádné typy atributů</p>
          <p className="text-sm text-slate-400 mt-1">Vytvořte např. &quot;Barva&quot;, &quot;Nikotinová síla&quot; nebo &quot;Odpor&quot;</p>
        </div>
      ) : (
        <div className="space-y-2">
          {attributeTypes.map((attrType) => {
            const isExpanded = expandedIds.has(attrType.id);
            const displayInfo = DISPLAY_TYPE_LABELS[attrType.displayType] ?? DISPLAY_TYPE_LABELS.dropdown;
            const Icon = displayInfo.icon;

            return (
              <div key={attrType.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center gap-3 px-5 py-4">
                  <button
                    onClick={() => toggleExpanded(attrType.id)}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  </button>

                  <div className="flex-1 flex items-center gap-3 cursor-pointer" onClick={() => toggleExpanded(attrType.id)}>
                    <span className="text-base font-semibold text-slate-800">{attrType.name}</span>
                    <span className="text-xs font-medium text-slate-400">({attrType.slug})</span>
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-xs font-medium text-slate-500">
                      <Icon className="w-3 h-3" />
                      {displayInfo.label}
                    </span>
                    {attrType.expandInCategory && (
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 text-xs font-medium text-blue-600">
                        Rozbaleno v kategorii
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openAttributeTypeForm(attrType.id)}
                      className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(attrType.id, attrType.name)}
                      className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Values */}
                {isExpanded && (
                  <div className="border-t border-slate-100 px-5 py-4 bg-slate-50/50">
                    <AttributeValueList attributeTypeId={attrType.id} displayType={attrType.displayType} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {isAttributeTypeFormOpen && (
        <AttributeTypeFormModal
          editingId={editingAttributeTypeId}
          onClose={closeAttributeTypeForm}
        />
      )}
    </div>
  );
}

// Exported icon for empty state
function Tags(props: React.SVGProps<SVGSVGElement> & { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m15 5 6.3 6.3a2.4 2.4 0 0 1 0 3.4L17 19" />
      <path d="M9.586 5.586A2 2 0 0 0 8.172 5H3a1 1 0 0 0-1 1v5.172a2 2 0 0 0 .586 1.414L8.29 18.29a2.426 2.426 0 0 0 3.42 0l3.58-3.58a2.426 2.426 0 0 0 0-3.42z" />
      <circle cx="6.5" cy="9.5" r=".5" fill="currentColor" />
    </svg>
  );
}

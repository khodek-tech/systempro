'use client';

import { useState } from 'react';
import { Plus, ChevronDown, ChevronRight, Pencil, Trash2, FolderOpen, Folder } from 'lucide-react';
import { useEshopProduktyStore } from '@/stores/eshop-produkty-store';
import { CategoryFormModal } from './CategoryFormModal';
import type { CategoryTreeNode } from '@/features/eshop/eshop-produkty-helpers';

export function CategoryTree() {
  const {
    getCategoryTree,
    isCategoryFormOpen,
    editingCategoryId,
    openCategoryForm,
    closeCategoryForm,
    deleteCategory,
  } = useEshopProduktyStore();

  const tree = getCategoryTree();
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
    if (!confirm(`Opravdu smazat kategorii "${name}"?`)) return;
    await deleteCategory(id);
  };

  const renderNode = (node: CategoryTreeNode) => {
    const isExpanded = expandedIds.has(node.id);
    const hasChildren = node.children.length > 0;

    return (
      <div key={node.id}>
        <div
          className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-slate-50 group transition-colors"
          style={{ paddingLeft: `${12 + node.level * 24}px` }}
        >
          {hasChildren ? (
            <button
              onClick={() => toggleExpanded(node.id)}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          ) : (
            <span className="w-4" />
          )}

          {isExpanded && hasChildren ? (
            <FolderOpen className="w-4 h-4 text-amber-500" />
          ) : (
            <Folder className="w-4 h-4 text-slate-400" />
          )}

          <span className="flex-1 text-sm font-medium text-slate-700">{node.name}</span>
          <span className="text-xs text-slate-400">{node.slug}</span>

          {!node.active && (
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-xs font-medium text-slate-400">
              Neaktivní
            </span>
          )}

          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => openCategoryForm(node.id)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              title="Upravit"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleDelete(node.id, node.name)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Smazat"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => openCategoryForm()} // Opens form with parent pre-filled in CategoryFormModal
              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
              title="Přidat podkategorii"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {isExpanded && hasChildren && (
          <div>{node.children.map(renderNode)}</div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">Kategorie</h2>
        <button
          onClick={() => openCategoryForm()}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-emerald-700 active:scale-[0.98] transition-all"
        >
          <Plus className="w-4 h-4" />
          Nová kategorie
        </button>
      </div>

      {/* Tree */}
      {tree.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <Folder className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Zatím žádné kategorie</p>
          <p className="text-sm text-slate-400 mt-1">Vytvořte kategorie pro organizaci produktů</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl py-2">
          {tree.map(renderNode)}
        </div>
      )}

      {/* Modal */}
      {isCategoryFormOpen && (
        <CategoryFormModal
          editingId={editingCategoryId}
          onClose={closeCategoryForm}
        />
      )}
    </div>
  );
}

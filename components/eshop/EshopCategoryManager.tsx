'use client';

import { useState } from 'react';
import { ChevronRight, ChevronDown, Check, Pencil, Minus } from 'lucide-react';
import { useEshopEshopyStore } from '@/stores/eshop-eshopy-store';
import { useEshopProduktyStore } from '@/stores/eshop-produkty-store';
import { EshopCategoryFormModal } from './EshopCategoryFormModal';
import type { CategoryTreeNode } from '@/features/eshop/eshop-produkty-helpers';

export function EshopCategoryManager() {
  const {
    selectedShopId,
    getShopCategoriesForShop,
    assignCategoryToShop,
    removeCategoryFromShop,
    isShopCategoryFormOpen,
    editingShopCategoryId,
    openShopCategoryForm,
  } = useEshopEshopyStore();

  const { getCategoryTree } = useEshopProduktyStore();
  const tree = getCategoryTree();
  const shopCats = selectedShopId ? getShopCategoriesForShop(selectedShopId) : [];
  const shopCatMap = new Map(shopCats.map((sc) => [sc.categoryId, sc]));

  if (!selectedShopId) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Přiřaďte globální kategorie k tomuto e-shopu. U přiřazených kategorií můžete nastavit override názvu, popisu a SEO.
        </p>
        <span className="text-xs font-semibold text-slate-400">
          Přiřazeno: {shopCats.length}
        </span>
      </div>

      <div className="shadow-sm border border-slate-200 bg-white rounded-xl overflow-hidden">
        {tree.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">
            Žádné kategorie. Vytvořte je v modulu E-shop Produkty.
          </div>
        ) : (
          <div className="p-4 space-y-1">
            {tree.map((node) => (
              <CategoryNode
                key={node.id}
                node={node}
                shopCatMap={shopCatMap}
                shopId={selectedShopId}
                onAssign={assignCategoryToShop}
                onRemove={removeCategoryFromShop}
                onEdit={openShopCategoryForm}
                depth={0}
              />
            ))}
          </div>
        )}
      </div>

      {isShopCategoryFormOpen && editingShopCategoryId != null && (
        <EshopCategoryFormModal shopCategoryId={editingShopCategoryId} />
      )}
    </div>
  );
}

interface CategoryNodeProps {
  node: CategoryTreeNode;
  shopCatMap: Map<number, { id: number; nameOverride?: string; active: boolean }>;
  shopId: number;
  onAssign: (shopId: number, categoryId: number) => Promise<{ success: boolean }>;
  onRemove: (shopCategoryId: number) => Promise<{ success: boolean }>;
  onEdit: (shopCategoryId: number) => void;
  depth: number;
}

function CategoryNode({ node, shopCatMap, shopId, onAssign, onRemove, onEdit, depth }: CategoryNodeProps) {
  const [expanded, setExpanded] = useState(true);
  const shopCat = shopCatMap.get(node.id);
  const isAssigned = !!shopCat;
  const hasChildren = node.children.length > 0;

  const handleToggleAssign = async () => {
    if (isAssigned && shopCat) {
      await onRemove(shopCat.id);
    } else {
      await onAssign(shopId, node.id);
    }
  };

  return (
    <div>
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
          isAssigned ? 'bg-emerald-50/50' : 'hover:bg-slate-50'
        }`}
        style={{ paddingLeft: `${depth * 24 + 12}px` }}
      >
        {/* Expand toggle */}
        {hasChildren ? (
          <button onClick={() => setExpanded(!expanded)} className="p-0.5 rounded hover:bg-slate-200 transition-colors">
            {expanded ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </button>
        ) : (
          <div className="w-5" />
        )}

        {/* Assignment toggle */}
        <button
          onClick={handleToggleAssign}
          className={`w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0 ${
            isAssigned ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 hover:border-emerald-400'
          }`}
        >
          {isAssigned ? <Check className="w-3 h-3 text-white" /> : <Minus className="w-3 h-3 text-slate-300" />}
        </button>

        {/* Name */}
        <div className="flex-1 min-w-0">
          <span className={`text-sm font-medium ${isAssigned ? 'text-slate-800' : 'text-slate-500'}`}>
            {node.name}
          </span>
          {shopCat?.nameOverride && (
            <span className="text-xs text-emerald-600 ml-2">→ {shopCat.nameOverride}</span>
          )}
        </div>

        {/* Edit button (only if assigned) */}
        {isAssigned && shopCat && (
          <button
            onClick={() => onEdit(shopCat.id)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="Upravit override"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Active indicator */}
        {isAssigned && shopCat && (
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
            shopCat.active ? 'text-green-600 bg-green-50' : 'text-slate-400 bg-slate-100'
          }`}>
            {shopCat.active ? 'ON' : 'OFF'}
          </span>
        )}
      </div>

      {/* Children */}
      {hasChildren && expanded && (
        <div>
          {node.children.map((child) => (
            <CategoryNode
              key={child.id}
              node={child}
              shopCatMap={shopCatMap}
              shopId={shopId}
              onAssign={onAssign}
              onRemove={onRemove}
              onEdit={onEdit}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

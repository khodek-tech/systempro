'use client';

import { useEshopProduktyStore } from '@/stores/eshop-produkty-store';
import { flattenCategoryTree } from '@/features/eshop/eshop-produkty-helpers';

interface Props {
  productId: number;
}

export function ProductCategoryPicker({ productId }: Props) {
  const {
    getCategoryTree,
    productCategories,
    assignProductToCategory,
    removeProductFromCategory,
  } = useEshopProduktyStore();

  const flatTree = flattenCategoryTree(getCategoryTree());
  const assignedCatIds = new Set(
    productCategories.filter((pc) => pc.productId === productId).map((pc) => pc.categoryId),
  );

  const handleToggle = async (categoryId: number) => {
    if (assignedCatIds.has(categoryId)) {
      await removeProductFromCategory(productId, categoryId);
    } else {
      await assignProductToCategory(productId, categoryId);
    }
  };

  if (flatTree.length === 0) {
    return (
      <p className="text-sm text-slate-400 italic">
        Zatím žádné kategorie. Vytvořte je v záložce Kategorie.
      </p>
    );
  }

  return (
    <div className="space-y-1 max-h-48 overflow-y-auto">
      {flatTree.map((cat) => (
        <label
          key={cat.id}
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
          style={{ paddingLeft: `${8 + cat.level * 20}px` }}
        >
          <input
            type="checkbox"
            checked={assignedCatIds.has(cat.id)}
            onChange={() => handleToggle(cat.id)}
            className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
          <span className={`text-sm font-medium ${cat.active ? 'text-slate-700' : 'text-slate-400'}`}>
            {cat.name}
          </span>
        </label>
      ))}
    </div>
  );
}

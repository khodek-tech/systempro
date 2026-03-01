'use client';

import { Plus, Search, Package, Pencil, Trash2 } from 'lucide-react';
import { useEshopProduktyStore } from '@/stores/eshop-produkty-store';
import { ProductFormModal } from './ProductFormModal';

export function ProductList() {
  const {
    getFilteredProducts,
    productSearchQuery,
    productActiveFilter,
    isProductFormOpen,
    editingProductId,
    setProductSearch,
    setProductActiveFilter,
    openProductForm,
    closeProductForm,
    deleteProduct,
    getVariantsForProduct,
    getCategoriesForProduct,
  } = useEshopProduktyStore();

  const products = getFilteredProducts();

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Opravdu smazat produkt "${name}" a všechny jeho varianty?`)) return;
    await deleteProduct(id);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={productSearchQuery}
            onChange={(e) => setProductSearch(e.target.value)}
            placeholder="Hledat produkt (název, SKU, značka, EAN)..."
            className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-sm font-medium outline-none focus:border-emerald-400"
          />
        </div>

        <select
          value={productActiveFilter}
          onChange={(e) => setProductActiveFilter(e.target.value as 'all' | 'active' | 'inactive')}
          className="bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-medium outline-none cursor-pointer"
        >
          <option value="all">Všechny</option>
          <option value="active">Aktivní</option>
          <option value="inactive">Neaktivní</option>
        </select>

        <button
          onClick={() => openProductForm()}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-emerald-700 active:scale-[0.98] transition-all ml-auto"
        >
          <Plus className="w-4 h-4" />
          Nový produkt
        </button>
      </div>

      {/* Table */}
      {products.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Zatím žádné produkty</p>
          <p className="text-sm text-slate-400 mt-1">Přidejte první produkt nebo importujte z feedu</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Název</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">SKU</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Značka</th>
                <th className="text-center px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Sklad</th>
                <th className="text-center px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Varianty</th>
                <th className="text-center px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Kategorie</th>
                <th className="text-center px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Stav</th>
                <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Akce</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const variants = getVariantsForProduct(product.id);
                const cats = getCategoriesForProduct(product.id);
                const lowStock = product.stock <= product.minStock;

                return (
                  <tr
                    key={product.id}
                    className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                    onClick={() => openProductForm(product.id)}
                  >
                    <td className="px-5 py-3">
                      <span className="text-sm font-semibold text-slate-800">{product.name}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-sm font-medium text-slate-500 font-mono">{product.sku || '—'}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-sm font-medium text-slate-500">{product.brand || '—'}</span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={`text-sm font-bold ${lowStock ? 'text-red-600' : 'text-slate-700'}`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className="text-sm font-medium text-slate-500">{variants.length}</span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className="text-sm font-medium text-slate-500">{cats.length}</span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                          product.active
                            ? 'bg-green-50 text-green-600'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {product.active ? 'Aktivní' : 'Neaktivní'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => openProductForm(product.id)}
                          className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id, product.name)}
                          className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {isProductFormOpen && (
        <ProductFormModal
          editingId={editingProductId}
          onClose={closeProductForm}
        />
      )}
    </div>
  );
}

'use client';

import { ArrowLeft, Package, FolderTree, Tags, FileUp, Star } from 'lucide-react';
import { useEshopProduktyStore } from '@/stores/eshop-produkty-store';
import { ProductList } from '@/components/eshop/ProductList';
import { CategoryTree } from '@/components/eshop/CategoryTree';
import { AttributeTypeList } from '@/components/eshop/AttributeTypeList';
import { FeedConfigList } from '@/components/eshop/FeedConfigList';
import { ReviewList } from '@/components/eshop/ReviewList';

const TABS = [
  { id: 'products' as const, label: 'Produkty', icon: Package },
  { id: 'categories' as const, label: 'Kategorie', icon: FolderTree },
  { id: 'attributes' as const, label: 'Atributy', icon: Tags },
  { id: 'feeds' as const, label: 'Feedy', icon: FileUp },
  { id: 'reviews' as const, label: 'Recenze', icon: Star },
];

export function EshopProduktyFullView() {
  const { activeTab, setActiveTab, closeProduktyView } = useEshopProduktyStore();

  return (
    <main className="flex-1 flex flex-col bg-slate-50 overflow-hidden animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 bg-white border-b border-slate-200 overflow-x-auto">
        <button
          onClick={closeProduktyView}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          Zpět
        </button>
        <h1 className="text-xl font-bold text-slate-800 shrink-0">E-shop Produkty</h1>

        {/* Tabs */}
        <div className="flex items-center gap-1 ml-4 bg-slate-100 rounded-lg p-1 shrink-0">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  isActive
                    ? 'bg-white text-emerald-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'products' && <ProductList />}
        {activeTab === 'categories' && <CategoryTree />}
        {activeTab === 'attributes' && <AttributeTypeList />}
        {activeTab === 'feeds' && <FeedConfigList />}
        {activeTab === 'reviews' && <ReviewList />}
      </div>
    </main>
  );
}

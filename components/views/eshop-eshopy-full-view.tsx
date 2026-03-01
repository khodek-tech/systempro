'use client';

import { ArrowLeft, Store, Package, FolderTree, ArrowRightLeft, Truck, Sparkles, X } from 'lucide-react';
import { useEshopEshopyStore } from '@/stores/eshop-eshopy-store';
import { EshopList } from '@/components/eshop/EshopList';
import { EshopProductManager } from '@/components/eshop/EshopProductManager';
import { EshopCategoryManager } from '@/components/eshop/EshopCategoryManager';
import { EshopRedirectList } from '@/components/eshop/EshopRedirectList';
import { ShippingPaymentManager } from '@/components/eshop/ShippingPaymentManager';
import { AiConfigPanel } from '@/components/eshop/AiConfigPanel';

const TABS = [
  { id: 'eshopy' as const, label: 'E-shopy', icon: Store },
  { id: 'produkty' as const, label: 'Produkty', icon: Package },
  { id: 'kategorie' as const, label: 'Kategorie', icon: FolderTree },
  { id: 'presmerovani' as const, label: 'Přesměrování', icon: ArrowRightLeft },
  { id: 'doprava-platby' as const, label: 'Doprava & Platby', icon: Truck },
  { id: 'ai' as const, label: 'AI', icon: Sparkles },
];

function NoShopSelected() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
      <Store className="w-12 h-12 text-slate-300 mx-auto mb-3" />
      <p className="text-slate-500 font-medium">Vyberte e-shop</p>
      <p className="text-sm text-slate-400 mt-1">Klikněte na e-shop v záložce E-shopy</p>
    </div>
  );
}

export function EshopEshopyFullView() {
  const { activeTab, setActiveTab, closeEshopyView, selectedShopId, eshops, selectShop } = useEshopEshopyStore();
  const selectedShop = eshops.find((e) => e.id === selectedShopId);

  return (
    <main className="flex-1 flex flex-col bg-slate-50 overflow-hidden animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4 bg-white border-b border-slate-200">
        <button
          onClick={closeEshopyView}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Zpět
        </button>
        <h1 className="text-xl font-bold text-slate-800">E-shop E-shopy</h1>

        {/* Tabs */}
        <div className="flex items-center gap-1 ml-6 bg-slate-100 rounded-lg p-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
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

        {/* Selected shop indicator */}
        {selectedShop && activeTab !== 'eshopy' && (
          <div className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-200">
            <div
              className="w-3 h-3 rounded-full border border-slate-200"
              style={{ backgroundColor: selectedShop.primaryColor }}
            />
            <span className="text-sm font-semibold text-emerald-700">{selectedShop.name}</span>
            <button
              onClick={() => selectShop(null)}
              className="p-0.5 rounded hover:bg-emerald-100 transition-colors"
            >
              <X className="w-3.5 h-3.5 text-emerald-500" />
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'eshopy' && <EshopList />}
        {activeTab === 'produkty' && (selectedShopId ? <EshopProductManager /> : <NoShopSelected />)}
        {activeTab === 'kategorie' && (selectedShopId ? <EshopCategoryManager /> : <NoShopSelected />)}
        {activeTab === 'presmerovani' && (selectedShopId ? <EshopRedirectList /> : <NoShopSelected />)}
        {activeTab === 'doprava-platby' && (selectedShopId ? <ShippingPaymentManager /> : <NoShopSelected />)}
        {activeTab === 'ai' && <AiConfigPanel />}
      </div>
    </main>
  );
}

'use client';

import { ArrowLeft, ClipboardList, Users, X } from 'lucide-react';
import { useEshopObjednavkyStore } from '@/stores/eshop-objednavky-store';
import { useEshopEshopyStore } from '@/stores/eshop-eshopy-store';
import { OrderList } from '@/components/eshop/OrderList';
import { OrderDetail } from '@/components/eshop/OrderDetail';
import { CustomerList } from '@/components/eshop/CustomerList';

const TABS = [
  { id: 'objednavky' as const, label: 'Objednávky', icon: ClipboardList },
  { id: 'zakaznici' as const, label: 'Zákazníci', icon: Users },
];

export function EshopObjednavkyFullView() {
  const { activeTab, setActiveTab, closeObjednavkyView, selectedShopId, selectShop, selectedOrderId } = useEshopObjednavkyStore();
  const { eshops } = useEshopEshopyStore();
  const selectedShop = eshops.find((e) => e.id === selectedShopId);

  return (
    <main className="flex-1 flex flex-col bg-slate-50 overflow-hidden animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4 bg-white border-b border-slate-200">
        <button
          onClick={closeObjednavkyView}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Zpět
        </button>
        <h1 className="text-xl font-bold text-slate-800">E-shop Objednávky</h1>

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

        {/* Shop filter */}
        <div className="ml-auto flex items-center gap-3">
          <select
            value={selectedShopId ?? ''}
            onChange={(e) => selectShop(e.target.value ? Number(e.target.value) : null)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium outline-none focus:border-emerald-300"
          >
            <option value="">Všechny e-shopy</option>
            {eshops.map((shop) => (
              <option key={shop.id} value={shop.id}>{shop.name}</option>
            ))}
          </select>
          {selectedShop && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-200">
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
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'objednavky' && (
          <div className={`grid ${selectedOrderId ? 'grid-cols-[minmax(0,1fr)_420px]' : 'grid-cols-1'} gap-6`}>
            <OrderList />
            {selectedOrderId && <OrderDetail />}
          </div>
        )}
        {activeTab === 'zakaznici' && <CustomerList />}
      </div>
    </main>
  );
}

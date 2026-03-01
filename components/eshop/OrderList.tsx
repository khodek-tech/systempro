'use client';

import { useState } from 'react';
import { Search, Package, Upload, Check } from 'lucide-react';
import { useEshopObjednavkyStore } from '@/stores/eshop-objednavky-store';
import { useEshopEshopyStore } from '@/stores/eshop-eshopy-store';
import { OrderStatusBadge } from './OrderStatusBadge';
import type { OrderStatus } from '@/shared/types';

const STATUS_TABS: { value: OrderStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Všechny' },
  { value: 'nova', label: 'Nové' },
  { value: 'zaplacena', label: 'Zaplacené' },
  { value: 'expedovana', label: 'Expedované' },
  { value: 'dorucena', label: 'Doručené' },
  { value: 'zrusena', label: 'Zrušené' },
];

function formatPrice(price: number): string {
  return new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', minimumFractionDigits: 0 }).format(price);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function OrderList() {
  const {
    getFilteredOrders,
    orderSearchQuery,
    setOrderSearch,
    orderStatusFilter,
    setOrderStatusFilter,
    getOrderCountByStatus,
    selectOrder,
    selectedOrderId,
    getCustomerById,
    exportToPohoda,
  } = useEshopObjednavkyStore();
  const { eshops } = useEshopEshopyStore();

  const [bulkExporting, setBulkExporting] = useState(false);

  const orders = getFilteredOrders();
  const counts = getOrderCountByStatus();
  const unexportedOrders = orders.filter((o) => !o.pohodaExported);

  const handleBulkExport = async () => {
    if (unexportedOrders.length === 0) return;
    setBulkExporting(true);
    await exportToPohoda(unexportedOrders.map((o) => o.id));
    setBulkExporting(false);
  };

  return (
    <div className="space-y-4">
      {/* Search + Status filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Hledat číslo objednávky..."
            value={orderSearchQuery}
            onChange={(e) => setOrderSearch(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm font-medium outline-none focus:border-emerald-300 w-full"
          />
        </div>
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
          {STATUS_TABS.map((tab) => {
            const isActive = orderStatusFilter === tab.value;
            const count = counts[tab.value] ?? 0;
            return (
              <button
                key={tab.value}
                onClick={() => setOrderStatusFilter(tab.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 ${
                  isActive ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.label}
                {count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {unexportedOrders.length > 0 && (
          <button
            onClick={handleBulkExport}
            disabled={bulkExporting}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 shrink-0"
          >
            <Upload className="w-3.5 h-3.5" />
            {bulkExporting ? 'Exportuji...' : `Export do Pohody (${unexportedOrders.length})`}
          </button>
        )}
      </div>

      {/* Table */}
      <div className="shadow-sm border border-slate-200 bg-white rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50">
              <th className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500 px-4 py-3">Objednávka</th>
              <th className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500 px-4 py-3">Zákazník</th>
              <th className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500 px-4 py-3">E-shop</th>
              <th className="text-center text-xs font-semibold uppercase tracking-wide text-slate-500 px-4 py-3">Stav</th>
              <th className="text-right text-xs font-semibold uppercase tracking-wide text-slate-500 px-4 py-3">Cena</th>
              <th className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500 px-4 py-3">Datum</th>
              <th className="text-center text-xs font-semibold uppercase tracking-wide text-slate-500 px-4 py-3 w-16">Pohoda</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12">
                  <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">
                    {orderSearchQuery || orderStatusFilter !== 'all' ? 'Žádné objednávky nenalezeny' : 'Zatím žádné objednávky'}
                  </p>
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const customer = order.customerId ? getCustomerById(order.customerId) : null;
                const shop = eshops.find((e) => e.id === order.shopId);
                const isSelected = selectedOrderId === order.id;
                return (
                  <tr
                    key={order.id}
                    onClick={() => selectOrder(order.id)}
                    className={`border-b border-slate-100 cursor-pointer transition-colors ${
                      isSelected ? 'bg-emerald-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="px-4 py-3">
                      <span className="text-sm font-bold text-slate-800">{order.orderNumber}</span>
                    </td>
                    <td className="px-4 py-3">
                      {customer ? (
                        <div>
                          <p className="text-sm font-medium text-slate-700">
                            {[customer.firstName, customer.lastName].filter(Boolean).join(' ') || customer.email}
                          </p>
                          {(customer.firstName || customer.lastName) && (
                            <p className="text-xs text-slate-400">{customer.email}</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Host</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-500">{shop?.name ?? `#${order.shopId}`}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-bold text-slate-900">{formatPrice(order.totalPrice)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-400">{formatDate(order.createdAt)}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {order.pohodaExported ? (
                        <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

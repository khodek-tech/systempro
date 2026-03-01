'use client';

import { Search, Users } from 'lucide-react';
import { useEshopObjednavkyStore } from '@/stores/eshop-objednavky-store';
import { useEshopEshopyStore } from '@/stores/eshop-eshopy-store';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function CustomerList() {
  const {
    getFilteredCustomers,
    customerSearchQuery,
    setCustomerSearch,
    getOrderCountForCustomer,
  } = useEshopObjednavkyStore();
  const { eshops } = useEshopEshopyStore();

  const customers = getFilteredCustomers();

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Hledat zákazníka..."
          value={customerSearchQuery}
          onChange={(e) => setCustomerSearch(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm font-medium outline-none focus:border-emerald-300 w-full"
        />
      </div>

      {/* Table */}
      <div className="shadow-sm border border-slate-200 bg-white rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50">
              <th className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500 px-4 py-3">E-mail</th>
              <th className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500 px-4 py-3">Jméno</th>
              <th className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500 px-4 py-3">Telefon</th>
              <th className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500 px-4 py-3">E-shop</th>
              <th className="text-center text-xs font-semibold uppercase tracking-wide text-slate-500 px-4 py-3">Objednávky</th>
              <th className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500 px-4 py-3">Registrace</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12">
                  <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">
                    {customerSearchQuery ? 'Žádní zákazníci nenalezeni' : 'Zatím žádní zákazníci'}
                  </p>
                </td>
              </tr>
            ) : (
              customers.map((customer) => {
                const shop = eshops.find((e) => e.id === customer.shopId);
                const orderCount = getOrderCountForCustomer(customer.id);
                return (
                  <tr key={customer.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-slate-700">{customer.email}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-slate-600">
                        {[customer.firstName, customer.lastName].filter(Boolean).join(' ') || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-slate-500">{customer.phone ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-500">{shop?.name ?? `#${customer.shopId}`}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {orderCount > 0 ? (
                        <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                          {orderCount}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-300">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-400">{formatDate(customer.createdAt)}</span>
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

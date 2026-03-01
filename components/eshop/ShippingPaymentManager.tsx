'use client';

import { Plus, Pencil, Trash2, Truck, CreditCard } from 'lucide-react';
import { useEshopEshopyStore } from '@/stores/eshop-eshopy-store';
import { ShippingFormModal } from './ShippingFormModal';
import { PaymentFormModal } from './PaymentFormModal';

function formatPrice(price: number): string {
  return `${price} Kč`;
}

export function ShippingPaymentManager() {
  const {
    selectedShopId,
    getShippingsForShop,
    getPaymentsForShop,
    openShippingForm,
    deleteShipping,
    openPaymentForm,
    deletePayment,
    isShippingFormOpen,
    isPaymentFormOpen,
  } = useEshopEshopyStore();

  if (!selectedShopId) return null;

  const shippings = getShippingsForShop(selectedShopId);
  const payments = getPaymentsForShop(selectedShopId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Doprava */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-semibold text-slate-800">Doprava</h3>
          </div>
          <button
            onClick={() => openShippingForm()}
            className="flex items-center gap-2 bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-semibold text-sm hover:bg-emerald-700 active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4" />
            Přidat
          </button>
        </div>

        <div className="shadow-sm border border-slate-200 bg-white rounded-xl overflow-hidden">
          {shippings.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">Zatím žádné způsoby dopravy</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {shippings.map((shipping) => (
                <div key={shipping.id} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-800 truncate">{shipping.name}</p>
                      {!shipping.active && (
                        <span className="inline-flex px-2 py-0.5 rounded text-xs font-bold bg-red-50 text-red-600">Neaktivní</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {formatPrice(shipping.price)}
                      {shipping.freeFrom ? ` · Zdarma od ${formatPrice(shipping.freeFrom)}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openShippingForm(shipping.id)}
                      className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      title="Upravit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Opravdu smazat dopravu?')) {
                          deleteShipping(shipping.id);
                        }
                      }}
                      className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Smazat"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Platby */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-semibold text-slate-800">Platby</h3>
          </div>
          <button
            onClick={() => openPaymentForm()}
            className="flex items-center gap-2 bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-semibold text-sm hover:bg-emerald-700 active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4" />
            Přidat
          </button>
        </div>

        <div className="shadow-sm border border-slate-200 bg-white rounded-xl overflow-hidden">
          {payments.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">Zatím žádné způsoby platby</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-800 truncate">{payment.name}</p>
                      {!payment.active && (
                        <span className="inline-flex px-2 py-0.5 rounded text-xs font-bold bg-red-50 text-red-600">Neaktivní</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {payment.price > 0 ? `Příplatek ${formatPrice(payment.price)}` : 'Bez příplatku'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openPaymentForm(payment.id)}
                      className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      title="Upravit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Opravdu smazat platbu?')) {
                          deletePayment(payment.id);
                        }
                      }}
                      className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Smazat"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {isShippingFormOpen && <ShippingFormModal />}
      {isPaymentFormOpen && <PaymentFormModal />}
    </div>
  );
}

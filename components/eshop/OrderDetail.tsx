'use client';

import { useState } from 'react';
import { X, ArrowRight, Pencil, Save, Truck, CreditCard, MapPin, FileText, Clock, Package, Upload, Check } from 'lucide-react';
import { useEshopObjednavkyStore } from '@/stores/eshop-objednavky-store';
import { useUsersStore } from '@/stores/users-store';
import type { OrderStatus } from '@/shared/types';
import { OrderStatusBadge } from './OrderStatusBadge';
import { OrderStatusChangeModal } from './OrderStatusChangeModal';

function formatPrice(price: number): string {
  return new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', minimumFractionDigits: 0 }).format(price);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function AddressBlock({ title, icon: Icon, address }: { title: string; icon: typeof MapPin; address?: Record<string, string> }) {
  if (!address) return null;
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-slate-400" />
        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h4>
      </div>
      <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-600 space-y-0.5">
        {(address.firstName || address.lastName) && (
          <p className="font-medium text-slate-800">{[address.firstName, address.lastName].filter(Boolean).join(' ')}</p>
        )}
        {address.street && <p>{address.street}</p>}
        {(address.city || address.zip) && <p>{[address.zip, address.city].filter(Boolean).join(' ')}</p>}
        {address.country && address.country !== 'CZ' && <p>{address.country}</p>}
      </div>
    </div>
  );
}

export function OrderDetail() {
  const {
    selectedOrderId,
    selectOrder,
    getOrderById,
    getOrderItemsForOrder,
    getOrderHistoryForOrder,
    getCustomerById,
    openStatusChange,
    isStatusChangeOpen,
    updateOrder,
    exportToPohoda,
  } = useEshopObjednavkyStore();
  const { users } = useUsersStore();

  const [editingNote, setEditingNote] = useState(false);
  const [internalNote, setInternalNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [exporting, setExporting] = useState(false);

  const order = selectedOrderId ? getOrderById(selectedOrderId) : null;
  if (!order) return null;

  const items = getOrderItemsForOrder(order.id);
  const history = getOrderHistoryForOrder(order.id);
  const customer = order.customerId ? getCustomerById(order.customerId) : null;

  const handleSaveNote = async () => {
    setSavingNote(true);
    await updateOrder(order.id, { internalNote: internalNote.trim() || undefined });
    setSavingNote(false);
    setEditingNote(false);
  };

  const itemsTotal = items.reduce((sum, item) => sum + item.total, 0);

  const handleExportPohoda = async () => {
    setExporting(true);
    await exportToPohoda([order.id]);
    setExporting(false);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden animate-in slide-in-from-right-2 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold text-slate-800">{order.orderNumber}</h3>
          <OrderStatusBadge status={order.status} />
          {order.pohodaExported && (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              <Check className="w-3 h-3" />
              Pohoda
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!order.pohodaExported && (
            <button
              onClick={handleExportPohoda}
              disabled={exporting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5" />
              {exporting ? 'Exportuji...' : 'Pohoda'}
            </button>
          )}
          <button
            onClick={openStatusChange}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98] transition-all"
          >
            Změnit stav
          </button>
          <button onClick={() => selectOrder(null)} className="p-2 rounded-lg hover:bg-slate-200 transition-colors">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>

      <div className="p-5 space-y-5 max-h-[calc(100vh-16rem)] overflow-y-auto">
        {/* Customer info */}
        {customer && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Zákazník</h4>
            <div className="bg-slate-50 rounded-lg p-3 text-sm">
              <p className="font-medium text-slate-800">
                {[customer.firstName, customer.lastName].filter(Boolean).join(' ') || 'Bez jména'}
              </p>
              <p className="text-slate-500">{customer.email}</p>
              {customer.phone && <p className="text-slate-500">{customer.phone}</p>}
            </div>
          </div>
        )}

        {/* Addresses */}
        <div className="grid grid-cols-2 gap-4">
          <AddressBlock title="Fakturační adresa" icon={FileText} address={order.billingAddress} />
          <AddressBlock title="Dodací adresa" icon={MapPin} address={order.shippingAddress} />
        </div>

        {/* Items */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-4 h-4 text-slate-400" />
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Položky ({items.length})</h4>
          </div>
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500">Produkt</th>
                  <th className="text-center px-3 py-2 text-xs font-semibold text-slate-500">Ks</th>
                  <th className="text-right px-3 py-2 text-xs font-semibold text-slate-500">Cena</th>
                  <th className="text-right px-3 py-2 text-xs font-semibold text-slate-500">Celkem</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-t border-slate-100">
                    <td className="px-3 py-2 font-medium text-slate-700">{item.name}</td>
                    <td className="px-3 py-2 text-center text-slate-500">{item.quantity}</td>
                    <td className="px-3 py-2 text-right text-slate-500">{formatPrice(item.price)}</td>
                    <td className="px-3 py-2 text-right font-semibold text-slate-800">{formatPrice(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals */}
        <div className="bg-slate-50 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-slate-500">
              <Package className="w-4 h-4" />
              <span>Položky</span>
            </div>
            <span className="font-medium text-slate-700">{formatPrice(itemsTotal)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-slate-500">
              <Truck className="w-4 h-4" />
              <span>Doprava ({order.shippingType ?? '—'})</span>
            </div>
            <span className="font-medium text-slate-700">{formatPrice(order.shippingPrice)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-slate-500">
              <CreditCard className="w-4 h-4" />
              <span>Platba ({order.paymentType ?? '—'})</span>
            </div>
            <span className="font-medium text-slate-700">{formatPrice(order.paymentPrice)}</span>
          </div>
          <div className="border-t border-slate-200 pt-2 flex items-center justify-between">
            <span className="text-sm font-bold text-slate-800">Celkem</span>
            <span className="text-lg font-bold text-slate-900">{formatPrice(order.totalPrice)}</span>
          </div>
        </div>

        {/* Internal note */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Interní poznámka</h4>
            {!editingNote && (
              <button
                onClick={() => { setEditingNote(true); setInternalNote(order.internalNote ?? ''); }}
                className="p-1 rounded hover:bg-slate-100 transition-colors"
              >
                <Pencil className="w-3.5 h-3.5 text-slate-400" />
              </button>
            )}
          </div>
          {editingNote ? (
            <div className="space-y-2">
              <textarea
                value={internalNote}
                onChange={(e) => setInternalNote(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm w-full outline-none focus:border-emerald-300 resize-none"
                rows={3}
              />
              <div className="flex justify-end gap-2">
                <button onClick={() => setEditingNote(false)} className="px-3 py-1 rounded text-xs font-medium text-slate-500 hover:bg-slate-100">
                  Zrušit
                </button>
                <button
                  onClick={handleSaveNote}
                  disabled={savingNote}
                  className="flex items-center gap-1 px-3 py-1 rounded text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  <Save className="w-3 h-3" />
                  Uložit
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500 bg-slate-50 rounded-lg p-3">
              {order.internalNote || 'Žádná poznámka'}
            </p>
          )}
        </div>

        {/* Customer note */}
        {order.note && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Poznámka zákazníka</h4>
            <p className="text-sm text-slate-600 bg-amber-50 rounded-lg p-3 border border-amber-200">{order.note}</p>
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Historie stavů</h4>
            </div>
            <div className="space-y-2">
              {history.map((h) => {
                const changedByUser = h.changedBy ? users.find((u) => u.id === String(h.changedBy)) : null;
                return (
                  <div key={h.id} className="flex items-start gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {h.statusFrom && (
                          <>
                            <OrderStatusBadge status={h.statusFrom as OrderStatus} />
                            <ArrowRight className="w-3 h-3 text-slate-300" />
                          </>
                        )}
                        <OrderStatusBadge status={h.statusTo as OrderStatus} />
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                        <span>{formatDate(h.createdAt)}</span>
                        {changedByUser && <span>· {changedByUser.fullName}</span>}
                      </div>
                      {h.note && <p className="text-xs text-slate-500 mt-1">{h.note}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Status change modal */}
      {isStatusChangeOpen && <OrderStatusChangeModal />}
    </div>
  );
}

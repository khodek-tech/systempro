'use client';

import { useEffect, useState } from 'react';
import { Star, Check, Trash2, Search, Filter } from 'lucide-react';
import { useEshopProduktyStore } from '@/stores/eshop-produkty-store';
import { useEshopEshopyStore } from '@/stores/eshop-eshopy-store';

export function ReviewList() {
  const { reviews, reviewsLoading, fetchReviews, approveReview, deleteReview, products } = useEshopProduktyStore();
  const { eshops } = useEshopEshopyStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved'>('all');

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const filtered = reviews.filter((r) => {
    if (statusFilter === 'pending' && r.approved) return false;
    if (statusFilter === 'approved' && !r.approved) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const product = products.find((p) => p.id === r.productId);
      return (
        r.name.toLowerCase().includes(q) ||
        r.text?.toLowerCase().includes(q) ||
        product?.name.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const pendingCount = reviews.filter((r) => !r.approved).length;

  if (reviewsLoading && reviews.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-6 h-6 border-2 border-slate-300 border-t-blue-600 rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-slate-800">
            Recenze ({reviews.length})
          </h2>
          {pendingCount > 0 && (
            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
              {pendingCount} ke schválení
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Status filter */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
            {(['all', 'pending', 'approved'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  statusFilter === s
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {s === 'all' ? 'Vše' : s === 'pending' ? 'Čekající' : 'Schválené'}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Hledat..."
              className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 outline-none focus:border-blue-300 w-48"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Filter className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p>Žádné recenze k zobrazení</p>
        </div>
      ) : (
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500 px-4 py-3">
                  Produkt
                </th>
                <th className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500 px-4 py-3">
                  Autor
                </th>
                <th className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500 px-4 py-3">
                  Hodnocení
                </th>
                <th className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500 px-4 py-3">
                  Text
                </th>
                <th className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500 px-4 py-3">
                  E-shop
                </th>
                <th className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500 px-4 py-3">
                  Stav
                </th>
                <th className="text-right text-xs font-semibold uppercase tracking-wide text-slate-500 px-4 py-3">
                  Akce
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((review) => {
                const product = products.find((p) => p.id === review.productId);
                const shop = eshops.find((e) => e.id === review.shopId);

                return (
                  <tr key={review.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-slate-800 max-w-[180px] truncate">
                      {product?.name || `#${review.productId}`}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-slate-700">{review.name}</p>
                      {review.email && (
                        <p className="text-xs text-slate-400">{review.email}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < review.rating ? 'text-amber-400' : 'text-slate-300'
                            }`}
                            fill={i < review.rating ? 'currentColor' : 'none'}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 max-w-[250px] truncate">
                      {review.text || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {shop?.name || `#${review.shopId}`}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-bold rounded-full ${
                        review.approved
                          ? 'bg-green-100 text-green-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {review.approved ? 'Schváleno' : 'Čeká'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {!review.approved && (
                          <button
                            onClick={() => approveReview(review.id)}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Schválit"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteReview(review.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Smazat"
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
    </div>
  );
}

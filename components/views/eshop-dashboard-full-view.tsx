'use client';

import { useEffect } from 'react';
import { ArrowLeft, TrendingUp, ShoppingCart, Users, Package, AlertTriangle, RefreshCw } from 'lucide-react';
import { useEshopDashboardStore } from '@/stores/eshop-dashboard-store';
import type { DashboardPeriod } from '@/stores/eshop-dashboard-store';
import { useEshopEshopyStore } from '@/stores/eshop-eshopy-store';

const PERIODS: { value: DashboardPeriod; label: string }[] = [
  { value: '7d', label: '7 dní' },
  { value: '30d', label: '30 dní' },
  { value: '90d', label: '90 dní' },
  { value: '365d', label: 'Rok' },
];

const STATUS_LABELS: Record<string, string> = {
  nova: 'Nová',
  zaplacena: 'Zaplacená',
  expedovana: 'Expedovaná',
  dorucena: 'Doručená',
  zrusena: 'Zrušená',
};

const STATUS_COLORS: Record<string, string> = {
  nova: 'bg-blue-500',
  zaplacena: 'bg-emerald-500',
  expedovana: 'bg-amber-500',
  dorucena: 'bg-green-600',
  zrusena: 'bg-red-500',
};

function formatPrice(value: number): string {
  return new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short' });
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

// Simple bar chart component (no recharts dependency)
function RevenueChart({ data }: { data: { date: string; revenue: number }[] }) {
  if (!data.length) return <p className="text-sm text-slate-400 text-center py-8">Žádná data</p>;

  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);

  return (
    <div className="flex items-end gap-1 h-40">
      {data.map((day, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-0">
          <div className="w-full flex justify-center">
            <div
              className="w-full max-w-[32px] bg-indigo-400 hover:bg-indigo-500 rounded-t transition-all duration-300"
              style={{ height: `${Math.max((day.revenue / maxRevenue) * 130, 2)}px` }}
              title={`${formatDate(day.date)}: ${formatPrice(day.revenue)}`}
            />
          </div>
          {data.length <= 14 && (
            <span className="text-[10px] text-slate-400 truncate w-full text-center">{formatDate(day.date)}</span>
          )}
        </div>
      ))}
    </div>
  );
}

// Status pie as horizontal bar
function StatusBar({ data }: { data: Record<string, number> }) {
  const total = Object.values(data).reduce((sum, v) => sum + v, 0);
  if (!total) return <p className="text-sm text-slate-400 text-center py-4">Žádné objednávky</p>;

  return (
    <div className="space-y-2">
      <div className="flex h-4 rounded-full overflow-hidden bg-slate-100">
        {Object.entries(data).map(([status, count]) => (
          <div
            key={status}
            className={`${STATUS_COLORS[status] ?? 'bg-slate-400'} transition-all duration-300`}
            style={{ width: `${(count / total) * 100}%` }}
            title={`${STATUS_LABELS[status] ?? status}: ${count}`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        {Object.entries(data).map(([status, count]) => (
          <div key={status} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full ${STATUS_COLORS[status] ?? 'bg-slate-400'}`} />
            <span className="text-xs text-slate-500">{STATUS_LABELS[status] ?? status}</span>
            <span className="text-xs font-bold text-slate-700">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function EshopDashboardFullView() {
  const { stats, _loading, selectedShopId, period, setSelectedShopId, setPeriod, fetchDashboardStats, closeDashboardView } = useEshopDashboardStore();
  const eshopy = useEshopEshopyStore((s) => s.eshops);

  // Auto-select first shop if none selected
  useEffect(() => {
    if (!selectedShopId && eshopy.length > 0) {
      setSelectedShopId(eshopy[0].id);
    }
  }, [selectedShopId, eshopy, setSelectedShopId]);

  const handleBack = () => {
    closeDashboardView();
  };

  return (
    <div className="animate-in fade-in duration-300 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={handleBack} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </button>
          <h1 className="text-2xl font-bold text-slate-800">E-shop Dashboard</h1>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedShopId ?? ''}
            onChange={(e) => setSelectedShopId(Number(e.target.value) || null)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold outline-none focus:border-indigo-300 cursor-pointer"
          >
            {eshopy.map((shop) => (
              <option key={shop.id} value={shop.id}>{shop.name}</option>
            ))}
          </select>
          <div className="flex bg-slate-100 rounded-lg p-0.5">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  period === p.value ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <button onClick={fetchDashboardStats} disabled={_loading} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <RefreshCw className={`w-4 h-4 text-slate-400 ${_loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {_loading && !stats ? (
        <div className="flex justify-center py-20">
          <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
        </div>
      ) : stats ? (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-indigo-50 w-10 h-10 rounded-xl flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-indigo-500" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Objednávky</span>
              </div>
              <p className="text-3xl font-extrabold tracking-tight text-slate-900">{stats.totalOrders}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-emerald-50 w-10 h-10 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tržby</span>
              </div>
              <p className="text-3xl font-extrabold tracking-tight text-slate-900">{formatPrice(stats.totalRevenue)}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-amber-50 w-10 h-10 rounded-xl flex items-center justify-center">
                  <Package className="w-5 h-5 text-amber-500" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Prům. objednávka</span>
              </div>
              <p className="text-3xl font-extrabold tracking-tight text-slate-900">{formatPrice(stats.avgOrderValue)}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-purple-50 w-10 h-10 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-500" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Noví zákazníci</span>
              </div>
              <p className="text-3xl font-extrabold tracking-tight text-slate-900">{stats.newCustomers}</p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-3 gap-4">
            {/* Revenue Chart */}
            <div className="col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">Tržby za období</h3>
              <RevenueChart data={stats.revenueByDay} />
            </div>
            {/* Order Status */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">Stavy objednávek</h3>
              <StatusBar data={stats.ordersByStatus} />
            </div>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-3 gap-4">
            {/* Top Products */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">Nejprodávanější produkty</h3>
              {stats.topProducts.length > 0 ? (
                <div className="space-y-2">
                  {stats.topProducts.slice(0, 8).map((p, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-bold text-slate-400 w-5">{i + 1}.</span>
                        <span className="text-sm font-medium text-slate-600 truncate">{p.name}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-2">
                        <span className="text-xs text-slate-400">{p.quantity}x</span>
                        <span className="text-sm font-bold text-slate-800">{formatPrice(p.revenue)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 text-center py-4">Žádné prodeje</p>
              )}
            </div>

            {/* Recent Orders */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">Poslední objednávky</h3>
              {stats.recentOrders.length > 0 ? (
                <div className="space-y-2">
                  {stats.recentOrders.slice(0, 8).map((o) => (
                    <div key={o.id} className="flex items-center justify-between py-1.5">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-700">{o.orderNumber}</p>
                        <p className="text-xs text-slate-400">{formatDateTime(o.createdAt)}</p>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <p className="text-sm font-bold text-slate-800">{formatPrice(o.totalPrice)}</p>
                        <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full text-white ${STATUS_COLORS[o.status] ?? 'bg-slate-400'}`}>
                          {STATUS_LABELS[o.status] ?? o.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 text-center py-4">Žádné objednávky</p>
              )}
            </div>

            {/* Low Stock */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
                <AlertTriangle className="w-4 h-4 text-amber-500 inline mr-1.5" />
                Nízký sklad
              </h3>
              {stats.lowStockProducts.length > 0 ? (
                <div className="space-y-2">
                  {stats.lowStockProducts.map((p) => (
                    <div key={p.id} className="flex items-center justify-between py-1.5">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-600 truncate">{p.name}</p>
                        <p className="text-xs text-slate-400">{p.sku}</p>
                      </div>
                      <span className={`text-sm font-bold shrink-0 ml-2 ${p.stock === 0 ? 'text-red-600' : 'text-amber-600'}`}>
                        {p.stock} ks
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 text-center py-4">Všechny produkty mají dostatek</p>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-20 text-slate-400">
          <p className="text-lg">Vyberte e-shop pro zobrazení statistik</p>
        </div>
      )}
    </div>
  );
}

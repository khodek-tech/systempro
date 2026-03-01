'use client';

import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';

// =============================================================================
// TYPES
// =============================================================================

export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  newCustomers: number;
  ordersByStatus: Record<string, number>;
  revenueByDay: { date: string; revenue: number }[];
  topProducts: { name: string; quantity: number; revenue: number }[];
  recentOrders: {
    id: number;
    orderNumber: string;
    status: string;
    totalPrice: number;
    createdAt: string;
    customerEmail: string;
  }[];
  lowStockProducts: { id: number; name: string; stock: number; sku: string }[];
}

export type DashboardPeriod = '7d' | '30d' | '90d' | '365d';

interface EshopDashboardState {
  stats: DashboardStats | null;
  _loading: boolean;
  selectedShopId: number | null;
  period: DashboardPeriod;
  dashboardViewMode: 'card' | 'view';
}

interface EshopDashboardActions {
  fetchDashboardStats: () => Promise<void>;
  setSelectedShopId: (shopId: number | null) => void;
  setPeriod: (period: DashboardPeriod) => void;
  openDashboardView: () => void;
  closeDashboardView: () => void;
}

// =============================================================================
// STORE
// =============================================================================

const periodToDays: Record<DashboardPeriod, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
  '365d': 365,
};

export const useEshopDashboardStore = create<EshopDashboardState & EshopDashboardActions>()((set, get) => ({
  stats: null,
  _loading: false,
  selectedShopId: null,
  period: '30d',
  dashboardViewMode: 'card',

  fetchDashboardStats: async () => {
    const { selectedShopId, period } = get();
    if (!selectedShopId) {
      set({ stats: null });
      return;
    }

    set({ _loading: true });
    const supabase = createClient();
    const days = periodToDays[period];
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const to = new Date().toISOString();

    const { data, error } = await supabase.rpc('eshop_dashboard_stats', {
      p_eshop_id: selectedShopId,
      p_from: from,
      p_to: to,
    });

    if (error) {
      logger.error('Failed to fetch dashboard stats:', error.message);
      set({ _loading: false });
      return;
    }

    set({
      stats: data as DashboardStats,
      _loading: false,
    });
  },

  setSelectedShopId: (shopId) => {
    set({ selectedShopId: shopId });
    if (shopId) {
      get().fetchDashboardStats();
    }
  },

  setPeriod: (period) => {
    set({ period });
    get().fetchDashboardStats();
  },

  openDashboardView: () => {
    set({ dashboardViewMode: 'view' });
    get().fetchDashboardStats();
  },

  closeDashboardView: () => set({ dashboardViewMode: 'card', stats: null }),
}));

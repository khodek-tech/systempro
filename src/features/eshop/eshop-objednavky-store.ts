'use client';

import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type {
  Order,
  OrderItem,
  OrderHistory,
  OrderStatus,
  Customer,
  CustomerAddress,
} from '@/shared/types';
import {
  mapDbToOrder,
  mapDbToOrderItem,
  mapDbToOrderHistory,
  mapDbToCustomer,
  mapDbToCustomerAddress,
  mapOrderToDb,
  mapOrderHistoryToDb,
} from '@/lib/supabase/mappers';

// =============================================================================
// TYPES
// =============================================================================

type ObjednavkyTab = 'objednavky' | 'zakaznici';

interface EshopObjednavkyState {
  // Data
  orders: Order[];
  orderItems: OrderItem[];
  orderHistory: OrderHistory[];
  customers: Customer[];
  customerAddresses: CustomerAddress[];

  // Loading
  _loaded: boolean;
  _loading: boolean;

  // View
  objednavkyViewMode: 'card' | 'view';
  activeTab: ObjednavkyTab;

  // Selected e-shop filter
  selectedShopId: number | null;

  // Orders tab UI
  orderSearchQuery: string;
  orderStatusFilter: OrderStatus | 'all';
  selectedOrderId: number | null;
  isStatusChangeOpen: boolean;

  // Customers tab UI
  customerSearchQuery: string;

  // Realtime
  _realtimeChannel: RealtimeChannel | null;
}

interface EshopObjednavkyActions {
  // Fetch
  fetchObjednavkyData: () => Promise<void>;

  // View
  openObjednavkyView: () => void;
  closeObjednavkyView: () => void;
  setActiveTab: (tab: ObjednavkyTab) => void;
  selectShop: (shopId: number | null) => void;

  // Orders
  selectOrder: (orderId: number | null) => void;
  updateOrderStatus: (orderId: number, newStatus: OrderStatus, note?: string, changedBy?: number, sendEmail?: boolean) => Promise<{ success: boolean; error?: string }>;
  updateOrder: (orderId: number, updates: Partial<Order>) => Promise<{ success: boolean; error?: string }>;
  sendOrderEmail: (orderId: number, type: 'potvrzeni_objednavky' | 'zmena_stavu' | 'odeslani', newStatus?: string, note?: string) => Promise<{ success: boolean; error?: string }>;
  exportToPohoda: (orderIds: number[]) => Promise<{ success: boolean; error?: string; results?: { orderNumber: string; success: boolean; error?: string }[] }>;
  openStatusChange: () => void;
  closeStatusChange: () => void;
  setOrderSearch: (query: string) => void;
  setOrderStatusFilter: (status: OrderStatus | 'all') => void;
  setCustomerSearch: (query: string) => void;

  // Getters
  getFilteredOrders: () => Order[];
  getOrderById: (id: number) => Order | undefined;
  getOrderItemsForOrder: (orderId: number) => OrderItem[];
  getOrderHistoryForOrder: (orderId: number) => OrderHistory[];
  getCustomerById: (id: number) => Customer | undefined;
  getCustomerAddresses: (customerId: number) => CustomerAddress[];
  getFilteredCustomers: () => Customer[];
  getOrderCountForCustomer: (customerId: number) => number;
  getOrderCountByStatus: () => Record<string, number>;

  // Realtime
  subscribeRealtime: () => void;
  unsubscribeRealtime: () => void;
}

// =============================================================================
// STORE
// =============================================================================

export const useEshopObjednavkyStore = create<EshopObjednavkyState & EshopObjednavkyActions>()((set, get) => ({
  // Initial state
  orders: [],
  orderItems: [],
  orderHistory: [],
  customers: [],
  customerAddresses: [],
  _loaded: false,
  _loading: false,
  objednavkyViewMode: 'card',
  activeTab: 'objednavky',
  selectedShopId: null,
  orderSearchQuery: '',
  orderStatusFilter: 'all',
  selectedOrderId: null,
  isStatusChangeOpen: false,
  customerSearchQuery: '',
  _realtimeChannel: null,

  // ===========================================================================
  // FETCH
  // ===========================================================================

  fetchObjednavkyData: async () => {
    set({ _loading: true });
    const supabase = createClient();

    const [ordersRes, itemsRes, historyRes, customersRes, addressesRes] = await Promise.all([
      supabase.from('objednavky').select('*').order('vytvoreno', { ascending: false }),
      supabase.from('objednavky_polozky').select('*'),
      supabase.from('objednavky_historie').select('*').order('vytvoreno', { ascending: false }),
      supabase.from('zakaznici').select('*'),
      supabase.from('zakaznici_adresy').select('*'),
    ]);

    if (ordersRes.error) {
      logger.error('Failed to fetch objednavky data');
      set({ _loading: false });
      return;
    }

    set({
      orders: ordersRes.data?.map(mapDbToOrder) ?? [],
      orderItems: itemsRes.data?.map(mapDbToOrderItem) ?? [],
      orderHistory: historyRes.data?.map(mapDbToOrderHistory) ?? [],
      customers: customersRes.data?.map(mapDbToCustomer) ?? [],
      customerAddresses: addressesRes.data?.map(mapDbToCustomerAddress) ?? [],
      _loaded: true,
      _loading: false,
    });
  },

  // ===========================================================================
  // VIEW
  // ===========================================================================

  openObjednavkyView: () => set({ objednavkyViewMode: 'view' }),
  closeObjednavkyView: () => set({ objednavkyViewMode: 'card', selectedOrderId: null, activeTab: 'objednavky' }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  selectShop: (shopId) => set({ selectedShopId: shopId }),

  // ===========================================================================
  // ORDERS
  // ===========================================================================

  selectOrder: (orderId) => set({ selectedOrderId: orderId }),

  updateOrderStatus: async (orderId, newStatus, note, changedBy, sendEmail) => {
    const { orders } = get();
    const order = orders.find((o) => o.id === orderId);
    if (!order) return { success: false, error: 'Objednávka nenalezena' };

    const supabase = createClient();

    // Update order status
    const dbData = mapOrderToDb({ status: newStatus });
    const { error: updateError } = await supabase.from('objednavky').update(dbData).eq('id', orderId);
    if (updateError) {
      toast.error('Nepodařilo se změnit stav objednávky');
      return { success: false, error: updateError.message };
    }

    // Insert history record
    const historyData = mapOrderHistoryToDb({
      orderId,
      statusFrom: order.status,
      statusTo: newStatus,
      note,
      changedBy,
    });
    const { data: historyRow } = await supabase.from('objednavky_historie').insert(historyData).select('*').single();

    set((s) => ({
      orders: s.orders.map((o) => o.id === orderId ? { ...o, status: newStatus, updatedAt: new Date().toISOString() } : o),
      orderHistory: historyRow ? [mapDbToOrderHistory(historyRow), ...s.orderHistory] : s.orderHistory,
      isStatusChangeOpen: false,
    }));
    toast.success('Stav objednávky změněn');

    // Send email notification if requested
    if (sendEmail) {
      const emailType = newStatus === 'expedovana' ? 'odeslani' : 'zmena_stavu';
      get().sendOrderEmail(orderId, emailType, newStatus, note);
    }

    return { success: true };
  },

  sendOrderEmail: async (orderId, type, newStatus, note) => {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

      const res = await fetch(`${supabaseUrl}/functions/v1/send-order-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token || ''}`,
        },
        body: JSON.stringify({ type, orderId, newStatus, note }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(`Email se nepodařilo odeslat: ${data.error || 'Neznámá chyba'}`);
        return { success: false, error: data.error };
      }
      toast.success('Email zákazníkovi odeslán');
      return { success: true };
    } catch {
      toast.error('Chyba při odesílání emailu');
      return { success: false, error: 'Chyba připojení' };
    }
  },

  exportToPohoda: async (orderIds) => {
    const { orders, orderItems } = get();
    // Get Pohoda credentials from store
    const { usePohodaStore } = await import('@/features/pohoda/pohoda-store');
    const { credentials } = usePohodaStore.getState();

    if (!credentials.url || !credentials.username || !credentials.password || !credentials.ico) {
      toast.error('Pohoda není nakonfigurovaná. Nastavte přístup v Nastavení → Pohoda.');
      return { success: false, error: 'Pohoda není nakonfigurovaná' };
    }

    // Build order data for API
    const ordersToExport = orderIds
      .map((id) => orders.find((o) => o.id === id))
      .filter((o): o is Order => !!o && !o.pohodaExported);

    if (ordersToExport.length === 0) {
      toast.error('Žádné objednávky k exportu (možná již byly exportovány)');
      return { success: false, error: 'Žádné objednávky k exportu' };
    }

    const payload = {
      ...credentials,
      orders: ordersToExport.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        totalPrice: o.totalPrice,
        shippingPrice: o.shippingPrice,
        paymentPrice: o.paymentPrice,
        shippingType: o.shippingType ?? null,
        paymentType: o.paymentType ?? null,
        note: o.note ?? null,
        createdAt: o.createdAt,
        billingAddress: o.billingAddress ?? null,
        items: orderItems
          .filter((i) => i.orderId === o.id)
          .map((i) => ({ name: i.name, quantity: i.quantity, price: i.price })),
      })),
    };

    try {
      const res = await fetch('/api/pohoda/export-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(`Export selhal: ${data.error || 'Neznámá chyba'}`);
        return { success: false, error: data.error, results: data.results };
      }

      // Mark successfully exported orders in DB
      const supabase = createClient();
      const successIds = ordersToExport
        .filter((_, i) => data.results?.[i]?.success)
        .map((o) => o.id);

      if (successIds.length > 0) {
        await supabase.from('objednavky').update({ pohoda_export: true }).in('id', successIds);
        set((s) => ({
          orders: s.orders.map((o) => successIds.includes(o.id) ? { ...o, pohodaExported: true } : o),
        }));
      }

      if (data.totalFailed > 0) {
        toast.warning(`Exportováno ${data.totalExported}/${ordersToExport.length} objednávek. ${data.totalFailed} selhalo.`);
      } else {
        toast.success(`Exportováno ${data.totalExported} objednávek do Pohody`);
      }
      return { success: true, results: data.results };
    } catch {
      toast.error('Chyba při připojení k serveru');
      return { success: false, error: 'Chyba připojení' };
    }
  },

  updateOrder: async (orderId, updates) => {
    const dbData = mapOrderToDb(updates);
    delete dbData.id;
    const supabase = createClient();
    const { error } = await supabase.from('objednavky').update(dbData).eq('id', orderId);
    if (error) {
      toast.error('Nepodařilo se uložit objednávku');
      return { success: false, error: error.message };
    }
    set((s) => ({
      orders: s.orders.map((o) => o.id === orderId ? { ...o, ...updates, updatedAt: new Date().toISOString() } : o),
    }));
    toast.success('Objednávka uložena');
    return { success: true };
  },

  openStatusChange: () => set({ isStatusChangeOpen: true }),
  closeStatusChange: () => set({ isStatusChangeOpen: false }),
  setOrderSearch: (query) => set({ orderSearchQuery: query }),
  setOrderStatusFilter: (status) => set({ orderStatusFilter: status }),
  setCustomerSearch: (query) => set({ customerSearchQuery: query }),

  // ===========================================================================
  // GETTERS
  // ===========================================================================

  getFilteredOrders: () => {
    const { orders, selectedShopId, orderSearchQuery, orderStatusFilter } = get();
    let filtered = orders;
    if (selectedShopId) {
      filtered = filtered.filter((o) => o.shopId === selectedShopId);
    }
    if (orderStatusFilter !== 'all') {
      filtered = filtered.filter((o) => o.status === orderStatusFilter);
    }
    if (orderSearchQuery) {
      const q = orderSearchQuery.toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          String(o.totalPrice).includes(q) ||
          o.trackingNumber?.toLowerCase().includes(q)
      );
    }
    return filtered;
  },

  getOrderById: (id) => get().orders.find((o) => o.id === id),

  getOrderItemsForOrder: (orderId) => get().orderItems.filter((i) => i.orderId === orderId),

  getOrderHistoryForOrder: (orderId) =>
    get().orderHistory.filter((h) => h.orderId === orderId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),

  getCustomerById: (id) => get().customers.find((c) => c.id === id),

  getCustomerAddresses: (customerId) => get().customerAddresses.filter((a) => a.customerId === customerId),

  getFilteredCustomers: () => {
    const { customers, selectedShopId, customerSearchQuery } = get();
    let filtered = customers;
    if (selectedShopId) {
      filtered = filtered.filter((c) => c.shopId === selectedShopId);
    }
    if (customerSearchQuery) {
      const q = customerSearchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.email.toLowerCase().includes(q) ||
          c.firstName?.toLowerCase().includes(q) ||
          c.lastName?.toLowerCase().includes(q) ||
          c.phone?.toLowerCase().includes(q)
      );
    }
    return filtered;
  },

  getOrderCountForCustomer: (customerId) => get().orders.filter((o) => o.customerId === customerId).length,

  getOrderCountByStatus: () => {
    const { orders, selectedShopId } = get();
    const filtered = selectedShopId ? orders.filter((o) => o.shopId === selectedShopId) : orders;
    const counts: Record<string, number> = { all: filtered.length };
    for (const o of filtered) {
      counts[o.status] = (counts[o.status] ?? 0) + 1;
    }
    return counts;
  },

  // ===========================================================================
  // REALTIME
  // ===========================================================================

  subscribeRealtime: () => {
    get()._realtimeChannel?.unsubscribe();
    const supabase = createClient();

    const channel = supabase
      .channel('eshop-objednavky-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'objednavky' }, () => {
        get().fetchObjednavkyData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'objednavky_polozky' }, () => {
        get().fetchObjednavkyData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'objednavky_historie' }, () => {
        get().fetchObjednavkyData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'zakaznici' }, () => {
        get().fetchObjednavkyData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'zakaznici_adresy' }, () => {
        get().fetchObjednavkyData();
      })
      .subscribe((status, err) => {
        if (err) logger.error(`[eshop-objednavky-realtime] ${status}:`, err);
      });

    set({ _realtimeChannel: channel });
  },

  unsubscribeRealtime: () => {
    get()._realtimeChannel?.unsubscribe();
    set({ _realtimeChannel: null });
  },
}));

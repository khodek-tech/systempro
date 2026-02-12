'use client';

import { useEffect } from 'react';
import { CashMonitor } from '@/components/cash-monitor';
import { useSalesStore } from '@/stores/sales-store';
import { useAuthStore } from '@/stores/auth-store';

export function CashInfoModule() {
  const activeStoreId = useAuthStore((state) => state.activeStoreId);
  const { cashToCollect, fetchCashToCollect } = useSalesStore();

  useEffect(() => {
    if (activeStoreId) {
      fetchCashToCollect(activeStoreId);
    }
  }, [activeStoreId, fetchCashToCollect]);

  return <CashMonitor cashToCollect={cashToCollect} />;
}

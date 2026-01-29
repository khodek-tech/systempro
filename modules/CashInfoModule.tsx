'use client';

import { CashMonitor } from '@/components/cash-monitor';
import { useSalesStore } from '@/stores/sales-store';

export function CashInfoModule() {
  const { cashToCollect } = useSalesStore();
  return <CashMonitor cashToCollect={cashToCollect} />;
}

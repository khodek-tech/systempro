'use client';

import type { OrderStatus } from '@/shared/types';

const STATUS_CONFIG: Record<OrderStatus, { label: string; className: string }> = {
  nova: { label: 'Nová', className: 'bg-blue-50 text-blue-700' },
  zaplacena: { label: 'Zaplacená', className: 'bg-green-50 text-green-700' },
  expedovana: { label: 'Expedovaná', className: 'bg-orange-50 text-orange-700' },
  dorucena: { label: 'Doručená', className: 'bg-slate-100 text-slate-700' },
  zrusena: { label: 'Zrušená', className: 'bg-red-50 text-red-700' },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const config = STATUS_CONFIG[status] ?? { label: status, className: 'bg-slate-100 text-slate-600' };
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${config.className}`}>
      {config.label}
    </span>
  );
}

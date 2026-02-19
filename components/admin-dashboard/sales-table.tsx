'use client';

import { useMemo } from 'react';
import { Banknote, Truck } from 'lucide-react';
import { AttendanceRecord } from '@/types';

interface SalesTableProps {
  data: AttendanceRecord[];
  pohodaTrzby: Record<string, number>;
  motivaceProdukty: Record<string, number>;
  onRowClick?: (record: AttendanceRecord) => void;
}

function czDateToIso(czDate: string): string {
  const parts = czDate.split('. ');
  const d = parts[0].padStart(2, '0');
  const m = parts[1].padStart(2, '0');
  const y = parts[2];
  return `${y}-${m}-${d}`;
}

export function SalesTable({ data, pohodaTrzby, motivaceProdukty, onRowClick }: SalesTableProps) {
  // Precompute total sales per store+date for proportional motivace split
  const storeDateTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const row of data) {
      const isoDate = czDateToIso(row.date);
      const key = `${row.store}|${isoDate}`;
      totals[key] = (totals[key] || 0) + row.cash + row.card;
    }
    return totals;
  }, [data]);

  return (
    <div className="excel-outer-wrapper">
      <div className="p-4 bg-slate-50 border-b flex items-center space-x-2">
        <Banknote className="w-4 h-4 text-blue-600" />
        <span className="font-semibold text-sm text-blue-600">Výkaz tržeb</span>
      </div>
      <div className="excel-scroll-container">
        <table className="excel-table">
          <thead>
            <tr>
              <th className="col-date">Datum</th>
              <th className="col-store">Prodejna</th>
              <th className="col-user">Prodavac</th>
              <th className="col-money">Hotovost</th>
              <th className="col-money">Karty</th>
              <th className="col-money">Partner</th>
              <th className="col-money">Pohyby</th>
              <th className="col-money text-blue-600">Moje Tržba</th>
              <th className="col-money text-green-600">Pohoda</th>
              <th className="col-money">2 %</th>
              <th className="col-money">Motivace</th>
              <th className="col-note text-left">Poznámka k tržbe</th>
              <th className="col-money">Odvod</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => {
              const total = row.cash + row.card + row.partner;
              const isoDate = czDateToIso(row.date);
              const key = `${row.store}|${isoDate}`;
              const pohodaAmount = pohodaTrzby[key];
              const pohodaComparable = row.cash + row.card;
              const hasMismatch = pohodaAmount !== undefined && Math.round(pohodaAmount) !== Math.round(pohodaComparable);
              return (
                <tr
                  key={index}
                  onClick={() => onRowClick?.(row)}
                  className={onRowClick ? 'cursor-pointer hover:bg-blue-50 transition-colors duration-200' : ''}
                >
                  <td className="col-date font-black text-slate-400">{row.date}</td>
                  <td className="col-store text-blue-600 font-extrabold uppercase text-[10px] tracking-widest">
                    {row.store}
                  </td>
                  <td className="col-user font-black">{row.user}</td>
                  <td className="col-money">{row.cash.toLocaleString('cs-CZ')}</td>
                  <td className="col-money">{row.card.toLocaleString('cs-CZ')}</td>
                  <td className="col-money text-blue-500 font-black">
                    {row.partner.toLocaleString('cs-CZ')}
                  </td>
                  <td className="col-money text-slate-400">{row.flows}</td>
                  <td className="col-money font-black">
                    {total.toLocaleString('cs-CZ')} Kc
                  </td>
                  <td className={`col-money font-black ${hasMismatch ? 'text-red-600 bg-red-50' : 'text-green-700 bg-green-50'}`}>
                    {pohodaAmount !== undefined
                      ? `${Math.round(pohodaAmount).toLocaleString('cs-CZ')} Kc`
                      : '-'}
                  </td>
                  <td className="col-money font-medium text-slate-600">
                    {row.motivaceAmount > 0
                      ? `${row.motivaceAmount.toLocaleString('cs-CZ')} Kc`
                      : '-'}
                  </td>
                  <td className="col-money font-medium text-orange-600">
                    {(() => {
                      // Prefer DB value, fall back to live RPC calculation
                      if (row.motivaceProduktyCastka > 0) {
                        return `${row.motivaceProduktyCastka.toLocaleString('cs-CZ', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} Kc`;
                      }
                      const storeMotivace = motivaceProdukty[key];
                      if (!storeMotivace) return '-';
                      const storeTotal = storeDateTotals[key] || 0;
                      const employeeShare = storeTotal > 0
                        ? (row.cash + row.card) / storeTotal
                        : 0;
                      const amount = Math.round(storeMotivace * employeeShare * 10) / 10;
                      return amount > 0
                        ? `${amount.toLocaleString('cs-CZ', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} Kc`
                        : '-';
                    })()}
                  </td>
                  <td className="col-note italic text-slate-400">{row.saleNote}</td>
                  <td className="col-money text-purple-600 font-medium text-xs">
                    {row.collected ? (
                      <span className="inline-flex items-center space-x-1">
                        <Truck className="w-3 h-3" />
                        <span>{row.collected}</span>
                      </span>
                    ) : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

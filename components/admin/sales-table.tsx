'use client';

import { Banknote, Truck } from 'lucide-react';
import { AttendanceRecord } from '@/types';

interface SalesTableProps {
  data: AttendanceRecord[];
}

export function SalesTable({ data }: SalesTableProps) {
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
              <th className="col-note text-left">Poznámka k tržbe</th>
              <th className="col-money">Odvod</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => {
              const total = row.cash + row.card + row.partner;
              return (
                <tr key={index}>
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
                  <td className="col-money font-black text-blue-700 bg-blue-50">
                    {total.toLocaleString('cs-CZ')} Kc
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

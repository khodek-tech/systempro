'use client';

import { Clock } from 'lucide-react';
import { AttendanceRecord } from '@/types';

interface AttendanceTableProps {
  data: AttendanceRecord[];
}

export function AttendanceTable({ data }: AttendanceTableProps) {
  return (
    <div className="excel-outer-wrapper">
      <div className="p-4 bg-slate-50 border-b flex items-center space-x-2">
        <Clock className="w-4 h-4 text-orange-600" />
        <span className="font-semibold text-sm text-orange-600">Výkaz docházky</span>
      </div>
      <div className="excel-scroll-container">
        <table className="excel-table">
          <thead>
            <tr>
              <th className="col-date">Datum</th>
              <th className="col-store">Pracoviště</th>
              <th className="col-user">Zamestnanec</th>
              <th className="w-time">Príchod</th>
              <th className="w-time">Odchod</th>
              <th className="w-time">Absence</th>
              <th className="w-time">Hodiny</th>
              <th className="col-note">Poznámka</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index}>
                <td className="col-date font-black text-slate-400">{row.date}</td>
                <td className="col-store text-blue-600 font-extrabold uppercase text-[10px] tracking-widest">
                  {row.workplaceName}
                </td>
                <td className="col-user font-black">{row.user}</td>
                <td>{row.in}</td>
                <td>{row.out}</td>
                <td className="text-orange-500 font-black">{row.abs}</td>
                <td>{row.hrs}</td>
                <td className="col-note italic text-slate-400">{row.absNote}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

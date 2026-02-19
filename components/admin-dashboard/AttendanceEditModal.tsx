'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { AttendanceRecord } from '@/types';
import { useAdminStore } from '@/stores/admin-store';
import { absenceTypes } from '@/lib/mock-data';

interface AttendanceEditModalProps {
  record: AttendanceRecord;
  onClose: () => void;
}

function calcHours(inTime: string, outTime: string): string {
  if (!inTime || !outTime) return '';
  const [inH, inM] = inTime.split(':').map(Number);
  const [outH, outM] = outTime.split(':').map(Number);
  if (isNaN(inH) || isNaN(inM) || isNaN(outH) || isNaN(outM)) return '';
  let diff = (outH * 60 + outM) - (inH * 60 + inM);
  if (diff < 0) diff += 24 * 60;
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return `${h}:${m.toString().padStart(2, '0')}`;
}

export function AttendanceEditModal({ record, onClose }: AttendanceEditModalProps) {
  const updateAttendanceRecord = useAdminStore((s) => s.updateAttendanceRecord);

  const [inTime, setInTime] = useState(record.in);
  const [outTime, setOutTime] = useState(record.out);
  const [abs, setAbs] = useState(record.abs);
  const [absNote, setAbsNote] = useState(record.absNote);
  const [cash, setCash] = useState(record.cash);
  const [card, setCard] = useState(record.card);
  const [partner, setPartner] = useState(record.partner);
  const [flows, setFlows] = useState(record.flows);
  const [saleNote, setSaleNote] = useState(record.saleNote);
  const [saving, setSaving] = useState(false);

  const hours = calcHours(inTime, outTime);

  // Reset form when record changes
  useEffect(() => {
    setInTime(record.in);
    setOutTime(record.out);
    setAbs(record.abs);
    setAbsNote(record.absNote);
    setCash(record.cash);
    setCard(record.card);
    setPartner(record.partner);
    setFlows(record.flows);
    setSaleNote(record.saleNote);
  }, [record]);

  const handleSave = async () => {
    setSaving(true);
    const updates: Partial<AttendanceRecord> = {
      in: inTime,
      out: outTime,
      hrs: hours || record.hrs,
      abs,
      absNote,
      cash,
      card,
      partner,
      flows,
      saleNote,
    };
    const result = await updateAttendanceRecord(record.id, updates);
    setSaving(false);
    if (result.success) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white max-w-lg w-full rounded-2xl p-10 shadow-lg animate-in fade-in duration-300 relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-100 transition-all duration-200"
        >
          <X className="w-5 h-5 text-slate-400" />
        </button>

        {/* Header */}
        <h2 className="text-2xl font-bold text-center text-slate-800 mb-6">Editace záznamu</h2>

        {/* Read-only info */}
        <div className="flex items-center gap-4 mb-6 text-sm">
          <span className="font-black text-slate-400">{record.date}</span>
          <span className="text-blue-600 font-extrabold uppercase text-[10px] tracking-widest">
            {record.workplaceName || record.store}
          </span>
          <span className="font-black text-slate-800">{record.user}</span>
        </div>

        {/* Attendance section */}
        <div className="space-y-3 mb-6">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Docházka</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Příchod</label>
              <input
                type="time"
                value={inTime}
                onChange={(e) => setInTime(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-base font-medium outline-none focus:border-orange-300 w-full"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Odchod</label>
              <input
                type="time"
                value={outTime}
                onChange={(e) => setOutTime(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-base font-medium outline-none focus:border-orange-300 w-full"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="font-medium">Hodiny:</span>
            <span className="font-bold text-slate-800">{hours || record.hrs || '-'}</span>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Absence</label>
            <select
              value={abs}
              onChange={(e) => setAbs(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-base font-medium outline-none cursor-pointer focus:border-orange-300 w-full"
            >
              <option value="-">-</option>
              {absenceTypes.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Poznámka absence</label>
            <textarea
              value={absNote}
              onChange={(e) => setAbsNote(e.target.value)}
              rows={2}
              className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-base font-medium outline-none resize-none focus:border-orange-300 w-full"
            />
          </div>
        </div>

        {/* Sales section */}
        <div className="space-y-3 mb-8">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Tržby</h3>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Hotovost</label>
              <input
                type="number"
                value={cash}
                onChange={(e) => setCash(Number(e.target.value) || 0)}
                className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-base font-bold text-right outline-none focus:border-orange-300 w-full"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Karta</label>
              <input
                type="number"
                value={card}
                onChange={(e) => setCard(Number(e.target.value) || 0)}
                className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-base font-bold text-right outline-none focus:border-orange-300 w-full"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Partner</label>
              <input
                type="number"
                value={partner}
                onChange={(e) => setPartner(Number(e.target.value) || 0)}
                className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-base font-bold text-right outline-none focus:border-orange-300 w-full"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Pohyby</label>
            <input
              type="text"
              value={flows}
              onChange={(e) => setFlows(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-base font-medium outline-none focus:border-orange-300 w-full"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Poznámka k tržbě</label>
            <textarea
              value={saleNote}
              onChange={(e) => setSaleNote(e.target.value)}
              rows={2}
              className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-base font-medium outline-none resize-none focus:border-orange-300 w-full"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="bg-transparent text-slate-600 px-4 py-2 rounded-lg font-medium hover:bg-slate-100 transition-all duration-200"
          >
            Zrušit
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 active:scale-[0.98] transition-all duration-200 disabled:opacity-50"
          >
            {saving ? 'Ukládám...' : 'Uložit'}
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AbsenceType } from '@/types';
import { absenceTypes } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { useAbsenceStore } from '@/stores/absence-store';
import { useAuthStore } from '@/stores/auth-store';

export function AbsenceRequestForm() {
  const [isExpanded, setIsExpanded] = useState(true);
  const { currentUser } = useAuthStore();
  const {
    formData,
    setAbsenceType,
    setDateFrom,
    setDateTo,
    setTimeFrom,
    setTimeTo,
    setNote,
    showTimeSection,
    submitAbsenceRequest,
    resetForm,
  } = useAbsenceStore();

  const handleSubmit = () => {
    if (!currentUser) return;

    const result = submitAbsenceRequest(currentUser.id);
    if (result.success) {
      setIsExpanded(false);
    } else if (result.error) {
      alert(`${result.error}`);
    }
  };

  const handleToggle = () => {
    if (!isExpanded) {
      resetForm();
    }
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={handleToggle}
        aria-expanded={isExpanded}
        aria-controls="absence-form-content"
        className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="bg-rose-50 w-10 h-10 rounded-lg flex items-center justify-center" aria-hidden="true">
            <Send className="w-5 h-5 text-rose-500" />
          </div>
          <span className="text-lg font-semibold text-slate-800">Nová žádost o absenci</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-slate-400" aria-hidden="true" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400" aria-hidden="true" />
        )}
      </button>

      <div
        id="absence-form-content"
        className={cn(
          'overflow-hidden transition-all duration-300',
          isExpanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className="p-5 pt-0 space-y-5 border-t border-slate-100">
          <label htmlFor="absence-type" className="sr-only">Typ absence</label>
          <select
            id="absence-type"
            value={formData.type}
            onChange={(e) => setAbsenceType(e.target.value as AbsenceType)}
            className="w-full bg-slate-50 p-4 rounded-xl font-semibold text-base outline-none cursor-pointer border border-slate-200 focus:border-orange-300"
          >
            {absenceTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-500">Datum od</label>
              <Input
                type="date"
                value={formData.dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="bg-slate-50 p-4 rounded-xl font-medium text-base border border-slate-200 focus:border-orange-300 h-auto"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-500">Datum do</label>
              <Input
                type="date"
                value={formData.dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="bg-slate-50 p-4 rounded-xl font-medium text-base border border-slate-200 focus:border-orange-300 h-auto"
              />
            </div>
          </div>

          <div
            className={cn(
              'grid grid-cols-2 gap-4 animate-in slide-in-from-top-1',
              !showTimeSection() && 'hidden'
            )}
          >
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-500">Čas od</label>
              <Input
                type="time"
                value={formData.timeFrom || ''}
                onChange={(e) => setTimeFrom(e.target.value)}
                className="bg-blue-50 p-4 rounded-xl font-semibold text-base text-center text-blue-600 border border-blue-200 outline-none h-auto"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-500">Čas do</label>
              <Input
                type="time"
                value={formData.timeTo || ''}
                onChange={(e) => setTimeTo(e.target.value)}
                className="bg-blue-50 p-4 rounded-xl font-semibold text-base text-center text-blue-600 border border-blue-200 outline-none h-auto"
              />
            </div>
          </div>

          <textarea
            value={formData.note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Poznámka ke schválení..."
            className="w-full bg-slate-50 p-5 rounded-xl font-medium text-base outline-none border border-slate-200 focus:border-orange-300 resize-none"
            rows={3}
          />

          <Button
            onClick={handleSubmit}
            className="w-full bg-orange-500 text-white py-5 rounded-xl font-semibold text-lg shadow-sm active:scale-[0.98] transition-all hover:bg-orange-600 h-auto"
          >
            Odeslat žádost
          </Button>
        </div>
      </div>
    </div>
  );
}

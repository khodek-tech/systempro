'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AbsenceType } from '@/types';
import { absenceTypes } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

interface AbsenceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AbsenceModal({ open, onOpenChange }: AbsenceModalProps) {
  const [absenceType, setAbsenceType] = useState<AbsenceType>('Dovolená');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [timeFrom, setTimeFrom] = useState('');
  const [timeTo, setTimeTo] = useState('');
  const [note, setNote] = useState('');

  const showTimeSection = absenceType === 'Lékař';

  const handleSubmit = () => {
    alert('Žádost odeslána!');
    setAbsenceType('Dovolená');
    setDateFrom('');
    setDateTo('');
    setTimeFrom('');
    setTimeTo('');
    setNote('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl p-8">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-800 text-center">
            Nahlásit absenci
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-6">
          <select
            value={absenceType}
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
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-slate-50 p-4 rounded-xl font-medium text-base border border-slate-200 focus:border-orange-300 h-auto"
            />
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-slate-50 p-4 rounded-xl font-medium text-base border border-slate-200 focus:border-orange-300 h-auto"
            />
          </div>

          <div
            className={cn(
              'grid grid-cols-2 gap-4 animate-in slide-in-from-top-1',
              !showTimeSection && 'hidden'
            )}
          >
            <Input
              type="time"
              value={timeFrom}
              onChange={(e) => setTimeFrom(e.target.value)}
              className="bg-blue-50 p-4 rounded-xl font-semibold text-base text-center text-blue-600 border border-blue-200 outline-none h-auto"
            />
            <Input
              type="time"
              value={timeTo}
              onChange={(e) => setTimeTo(e.target.value)}
              className="bg-blue-50 p-4 rounded-xl font-semibold text-base text-center text-blue-600 border border-blue-200 outline-none h-auto"
            />
          </div>

          <textarea
            value={note}
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
      </DialogContent>
    </Dialog>
  );
}

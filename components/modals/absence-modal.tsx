'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { AbsenceType } from '@/types';
import { absenceTypes } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { useAbsenceStore } from '@/stores/absence-store';
import { useAuthStore } from '@/stores/auth-store';

interface AbsenceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AbsenceModal({ open, onOpenChange }: AbsenceModalProps) {
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

  const handleSubmit = async () => {
    if (!currentUser) return;

    const result = await submitAbsenceRequest(currentUser.id);
    if (result.success) {
      toast.success('Žádost odeslána!');
      onOpenChange(false);
    } else if (result.error) {
      toast.error(result.error);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      resetForm();
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md rounded-2xl p-8">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-800 text-center">
            Nahlásit absenci
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-6">
          <select
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
            <Input
              type="date"
              value={formData.dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-slate-50 p-4 rounded-xl font-medium text-base border border-slate-200 focus:border-orange-300 h-auto"
            />
            <Input
              type="date"
              value={formData.dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-slate-50 p-4 rounded-xl font-medium text-base border border-slate-200 focus:border-orange-300 h-auto"
            />
          </div>

          <div
            className={cn(
              'grid grid-cols-2 gap-4 animate-in slide-in-from-top-1',
              !showTimeSection() && 'hidden'
            )}
          >
            <Input
              type="time"
              value={formData.timeFrom || ''}
              onChange={(e) => setTimeFrom(e.target.value)}
              className="bg-blue-50 p-4 rounded-xl font-semibold text-base text-center text-blue-600 border border-blue-200 outline-none h-auto"
            />
            <Input
              type="time"
              value={formData.timeTo || ''}
              onChange={(e) => setTimeTo(e.target.value)}
              className="bg-blue-50 p-4 rounded-xl font-semibold text-base text-center text-blue-600 border border-blue-200 outline-none h-auto"
            />
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
      </DialogContent>
    </Dialog>
  );
}

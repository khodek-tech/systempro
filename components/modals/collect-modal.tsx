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

interface CollectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  period: string;
  onSubmit: (driverName: string) => { success: boolean; error?: string };
}

export function CollectModal({
  open,
  onOpenChange,
  amount,
  period,
  onSubmit,
}: CollectModalProps) {
  const [driverName, setDriverName] = useState('');

  const handleSubmit = () => {
    const result = onSubmit(driverName);
    if (result.success) {
      alert('✅ Hotovost odevzdána.');
      setDriverName('');
      onOpenChange(false);
    } else if (result.error) {
      alert(`⚠️ ${result.error}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl p-10 text-center">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-purple-900 mb-4">
            Odevzdání hotovosti
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-purple-500 font-medium mb-6">
          Vyzvedáváte období: {period}
        </p>

        <div className="bg-slate-50 p-8 rounded-xl border border-slate-200 mb-8">
          <p className="text-sm font-medium text-slate-500 mb-2">
            Aktuálně v obálce:
          </p>
          <p className="text-5xl font-bold text-slate-900 font-mono">
            {amount.toLocaleString('cs-CZ')} Kč
          </p>
        </div>

        <Input
          type="text"
          value={driverName}
          onChange={(e) => setDriverName(e.target.value)}
          placeholder="Jméno řidiče / číslo vaku"
          className="w-full bg-slate-50 p-5 rounded-xl border border-slate-200 font-semibold text-center focus:ring-2 focus:ring-purple-200 outline-none text-base mb-8 h-auto"
        />

        <Button
          onClick={handleSubmit}
          className="w-full bg-purple-600 text-white py-5 rounded-xl font-semibold text-lg shadow-sm hover:bg-purple-700 active:scale-[0.98] transition-all h-auto"
        >
          Potvrdit odvod řidiči
        </Button>
      </DialogContent>
    </Dialog>
  );
}

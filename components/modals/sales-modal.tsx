'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { ExtraRow } from '@/types';

interface SalesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: {
    cash: number;
    card: number;
    partner: number;
    incomes: ExtraRow[];
    expenses: ExtraRow[];
  };
  total: number;
  onUpdateField: (field: 'cash' | 'card' | 'partner', value: number) => void;
  onAddIncome: () => void;
  onAddExpense: () => void;
  onUpdateIncome: (id: string, field: 'amount' | 'note', value: number | string) => void;
  onUpdateExpense: (id: string, field: 'amount' | 'note', value: number | string) => void;
  onRemoveIncome: (id: string) => void;
  onRemoveExpense: (id: string) => void;
  onSubmit: () => { valid: boolean; error?: string };
}

export function SalesModal({
  open,
  onOpenChange,
  formData,
  total,
  onUpdateField,
  onAddIncome,
  onAddExpense,
  onUpdateIncome,
  onUpdateExpense,
  onRemoveIncome,
  onRemoveExpense,
  onSubmit,
}: SalesModalProps) {
  const handleSubmit = () => {
    const result = onSubmit();
    if (result.valid) {
      alert('✅ Výkaz uložen.');
      onOpenChange(false);
    } else if (result.error) {
      alert(`⚠️ ${result.error}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] w-[90vw] rounded-2xl p-12 max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Denní výkaz tržeb
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mb-8 mt-6">
          <div className="bg-slate-50 p-5 rounded-xl flex justify-between items-center border border-slate-100">
            <span className="text-base font-medium text-slate-600">Hotovost CZK</span>
            <CurrencyInput
              value={formData.cash}
              onChange={(value) => onUpdateField('cash', value)}
              className="w-48"
            />
          </div>
          <div className="bg-slate-50 p-5 rounded-xl flex justify-between items-center border border-slate-100">
            <span className="text-base font-medium text-slate-600">Platební karty</span>
            <CurrencyInput
              value={formData.card}
              onChange={(value) => onUpdateField('card', value)}
              className="w-48"
            />
          </div>
          <div className="bg-blue-50 p-5 rounded-xl flex justify-between items-center border border-blue-200">
            <span className="text-base font-medium text-blue-600">Partner (T-L)</span>
            <CurrencyInput
              value={formData.partner}
              onChange={(value) => onUpdateField('partner', value)}
              className="w-48"
            />
          </div>
        </div>

        {/* Income rows */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-semibold text-green-600">
              Příjmy hotovosti (+)
            </span>
            <Button
              onClick={onAddIncome}
              variant="ghost"
              size="sm"
              className="text-sm bg-green-50 text-green-700 px-4 py-2 rounded-lg font-semibold hover:bg-green-100"
            >
              + Přidat
            </Button>
          </div>
          <div className="space-y-3">
            {formData.incomes.map((row) => (
              <div key={row.id} className="flex gap-3 items-stretch animate-in slide-in-from-top-1">
                <CurrencyInput
                  value={row.amount}
                  onChange={(value) => onUpdateIncome(row.id, 'amount', value)}
                  className="w-40 shrink-0 bg-slate-50 !p-3 !text-base !font-medium h-12"
                />
                <Input
                  type="text"
                  value={row.note}
                  onChange={(e) => onUpdateIncome(row.id, 'note', e.target.value)}
                  placeholder="Povinná poznámka k pohybu"
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-3 text-base font-medium outline-none h-12"
                />
                <button
                  onClick={() => onRemoveIncome(row.id)}
                  className="text-slate-300 hover:text-red-500 font-medium px-2 text-2xl transition-colors"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Expense rows */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-semibold text-red-600">
              Výdaje hotovosti (-)
            </span>
            <Button
              onClick={onAddExpense}
              variant="ghost"
              size="sm"
              className="text-sm bg-red-50 text-red-700 px-4 py-2 rounded-lg font-semibold hover:bg-red-100"
            >
              + Přidat
            </Button>
          </div>
          <div className="space-y-3">
            {formData.expenses.map((row) => (
              <div key={row.id} className="flex gap-3 items-stretch animate-in slide-in-from-top-1">
                <CurrencyInput
                  value={row.amount}
                  onChange={(value) => onUpdateExpense(row.id, 'amount', value)}
                  className="w-40 shrink-0 bg-slate-50 !p-3 !text-base !font-medium h-12"
                />
                <Input
                  type="text"
                  value={row.note}
                  onChange={(e) => onUpdateExpense(row.id, 'note', e.target.value)}
                  placeholder="Povinná poznámka k pohybu"
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-3 text-base font-medium outline-none h-12"
                />
                <button
                  onClick={() => onRemoveExpense(row.id)}
                  className="text-slate-300 hover:text-red-500 font-medium px-2 text-2xl transition-colors"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Total */}
        <div className="bg-blue-600 p-8 rounded-2xl flex justify-between items-center text-white shadow-md">
          <span className="font-semibold text-base opacity-90">
            Moje provizní tržba celkem za dnes
          </span>
          <span className="text-4xl font-bold font-mono">
            {total.toLocaleString('cs-CZ')} Kč
          </span>
        </div>

        <Button
          onClick={handleSubmit}
          className="w-full bg-slate-900 text-white py-5 rounded-xl mt-8 font-semibold text-lg shadow-sm hover:bg-slate-800 transition-all h-auto"
        >
          Uložit do systému
        </Button>
      </DialogContent>
    </Dialog>
  );
}

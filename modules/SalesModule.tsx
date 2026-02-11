'use client';

import { Wallet } from 'lucide-react';
import { SalesModal } from '@/components/modals/sales-modal';
import { useUIStore } from '@/stores/ui-store';
import { useSalesStore } from '@/stores/sales-store';

export function SalesModule() {
  const { salesModalOpen, setSalesModalOpen } = useUIStore();

  const {
    formData,
    calculateTotal,
    updateField,
    addIncomeRow,
    addExpenseRow,
    updateIncomeRow,
    updateExpenseRow,
    removeIncomeRow,
    removeExpenseRow,
    submitSales,
  } = useSalesStore();

  return (
    <>
      <button
        onClick={() => setSalesModalOpen(true)}
        className="group relative bg-white border border-slate-100 rounded-[24px] sm:rounded-[32px] lg:rounded-[var(--module-card-radius)] p-6 sm:p-8 lg:p-[var(--module-card-pad)] flex flex-col items-center justify-center space-y-4 sm:space-y-6 lg:space-y-[var(--module-inner-gap)] transition-all duration-500 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.08)] hover:-translate-y-2 active:scale-95 w-full aspect-square md:aspect-auto md:min-h-[280px] lg:min-h-0 lg:h-[var(--module-card-h)] overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative bg-emerald-50 w-20 h-20 sm:w-28 sm:h-28 lg:w-[var(--module-icon-size)] lg:h-[var(--module-icon-size)] rounded-2xl sm:rounded-3xl lg:rounded-[var(--module-icon-radius)] flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 z-10">
          <div className="absolute inset-0 blur-3xl opacity-0 group-hover:opacity-40 transition-opacity duration-500 rounded-full bg-emerald-50" />
          <div className="relative text-emerald-500 transition-transform duration-500 group-hover:scale-110">
            <Wallet className="w-10 h-10 sm:w-14 sm:h-14 lg:w-[var(--module-icon-inner)] lg:h-[var(--module-icon-inner)]" strokeWidth={1.2} />
          </div>
        </div>
        <div className="flex flex-col items-center space-y-3 z-10">
          <span className="text-xl sm:text-2xl lg:text-[length:var(--module-title-size)] font-extrabold tracking-tight transition-colors duration-300 text-slate-800">
            Tržby
          </span>
          <div className="w-12 h-1.5 bg-slate-100 rounded-full group-hover:w-20 group-hover:bg-emerald-500 transition-all duration-500 opacity-50" />
        </div>
      </button>

      <SalesModal
        open={salesModalOpen}
        onOpenChange={setSalesModalOpen}
        formData={formData}
        total={calculateTotal()}
        onUpdateField={updateField}
        onAddIncome={addIncomeRow}
        onAddExpense={addExpenseRow}
        onUpdateIncome={updateIncomeRow}
        onUpdateExpense={updateExpenseRow}
        onRemoveIncome={removeIncomeRow}
        onRemoveExpense={removeExpenseRow}
        onSubmit={submitSales}
      />
    </>
  );
}

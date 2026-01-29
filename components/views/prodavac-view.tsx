'use client';

import { Wallet, Send, Package, CheckSquare } from 'lucide-react';
import { CashMonitor } from '@/components/cash-monitor';
import { SalesModal } from '@/components/modals/sales-modal';
import { CollectModal } from '@/components/modals/collect-modal';
import { AbsenceCard } from '@/components/shared/absence-card';
import { useUIStore } from '@/stores/ui-store';
import { useSalesStore } from '@/stores/sales-store';

interface ProdavacViewProps {
  isWarehouse: boolean;
}

export function ProdavacView({ isWarehouse }: ProdavacViewProps) {
  const {
    salesModalOpen,
    collectModalOpen,
    setSalesModalOpen,
    setCollectModalOpen,
  } = useUIStore();

  const {
    cashToCollect,
    formData,
    calculateTotal,
    getCollectionPeriod,
    updateField,
    addIncomeRow,
    addExpenseRow,
    updateIncomeRow,
    updateExpenseRow,
    removeIncomeRow,
    removeExpenseRow,
    submitSales,
    submitCollection,
  } = useSalesStore();

  if (isWarehouse) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center p-8 relative overflow-y-auto">
        <div className="flex items-center space-x-3 text-slate-400">
          <Package className="w-8 h-8" />
          <span className="text-xl font-medium">Sklad neeviduje tržby.</span>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col items-center p-8 relative overflow-y-auto">
      <CashMonitor cashToCollect={cashToCollect} />

      <div className="w-full max-w-5xl mt-6 px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* Tržby */}
        <button
          onClick={() => setSalesModalOpen(true)}
          className="group relative bg-white border border-slate-100 rounded-[40px] p-10 flex flex-col items-center justify-center space-y-8 transition-all duration-500 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.08)] hover:-translate-y-2 active:scale-95 w-full aspect-square md:aspect-auto md:min-h-[380px] overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative bg-emerald-50 w-32 h-32 sm:w-36 sm:h-36 rounded-[36px] flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 z-10">
            <div className="absolute inset-0 blur-3xl opacity-0 group-hover:opacity-40 transition-opacity duration-500 rounded-full bg-emerald-50" />
            <div className="relative text-emerald-500 transition-transform duration-500 group-hover:scale-110">
              <Wallet className="w-[72px] h-[72px]" strokeWidth={1.2} />
            </div>
          </div>
          <div className="flex flex-col items-center space-y-3 z-10">
            <span className="text-3xl font-extrabold tracking-tight transition-colors duration-300 text-slate-800">
              Tržby
            </span>
            <div className="w-12 h-1.5 bg-slate-100 rounded-full group-hover:w-20 group-hover:bg-emerald-500 transition-all duration-500 opacity-50" />
          </div>
        </button>

        {/* Odvody */}
        <button
          onClick={() => setCollectModalOpen(true)}
          className="group relative bg-white border border-slate-100 rounded-[40px] p-10 flex flex-col items-center justify-center space-y-8 transition-all duration-500 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.08)] hover:-translate-y-2 active:scale-95 w-full aspect-square md:aspect-auto md:min-h-[380px] overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative bg-blue-50 w-32 h-32 sm:w-36 sm:h-36 rounded-[36px] flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 z-10">
            <div className="absolute inset-0 blur-3xl opacity-0 group-hover:opacity-40 transition-opacity duration-500 rounded-full bg-blue-50" />
            <div className="relative text-blue-500 transition-transform duration-500 group-hover:scale-110">
              <Send className="w-[72px] h-[72px]" strokeWidth={1.2} />
            </div>
          </div>
          <div className="flex flex-col items-center space-y-3 z-10">
            <span className="text-3xl font-extrabold tracking-tight transition-colors duration-300 text-blue-600">
              Odvody
            </span>
            <div className="w-12 h-1.5 bg-slate-100 rounded-full group-hover:w-20 group-hover:bg-blue-500 transition-all duration-500 opacity-50" />
          </div>
        </button>

        {/* Absence */}
        <AbsenceCard />

        {/* Úkoly */}
        <button
          onClick={() => {/* TODO: implementovat */}}
          className="group relative bg-white border border-slate-100 rounded-[40px] p-10 flex flex-col items-center justify-center space-y-8 transition-all duration-500 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.08)] hover:-translate-y-2 active:scale-95 w-full aspect-square md:aspect-auto md:min-h-[380px] overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative bg-violet-50 w-32 h-32 sm:w-36 sm:h-36 rounded-[36px] flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 z-10">
            <div className="absolute inset-0 blur-3xl opacity-0 group-hover:opacity-40 transition-opacity duration-500 rounded-full bg-violet-50" />
            <div className="relative text-violet-500 transition-transform duration-500 group-hover:scale-110">
              <CheckSquare className="w-[72px] h-[72px]" strokeWidth={1.2} />
            </div>
          </div>
          <div className="flex flex-col items-center space-y-3 z-10">
            <span className="text-3xl font-extrabold tracking-tight transition-colors duration-300 text-violet-600">
              Úkoly
            </span>
            <div className="w-12 h-1.5 bg-slate-100 rounded-full group-hover:w-20 group-hover:bg-violet-500 transition-all duration-500 opacity-50" />
          </div>
        </button>
      </div>

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

      <CollectModal
        open={collectModalOpen}
        onOpenChange={setCollectModalOpen}
        amount={cashToCollect}
        period={getCollectionPeriod()}
        onSubmit={submitCollection}
      />
    </main>
  );
}

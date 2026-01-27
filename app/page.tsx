'use client';

import { Header } from '@/components/header';
import { ProdavacView } from '@/components/views/prodavac-view';
import { VedouciView } from '@/components/views/vedouci-view';
import { useRole } from '@/hooks/use-role';
import { useAttendance } from '@/hooks/use-attendance';
import { useSales } from '@/hooks/use-sales';

export default function Home() {
  const { role, switchRole, isProdavac } = useRole();
  const {
    isInWork,
    kasaConfirmed,
    workplace,
    isWarehouse,
    toggleAttendance,
    confirmKasa,
    changeWorkplace,
  } = useAttendance();

  const {
    cashToCollect,
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
    submitCollection,
    getCollectionPeriod,
  } = useSales();

  return (
    <>
      <Header
        role={role}
        onRoleChange={switchRole}
        isInWork={isInWork}
        kasaConfirmed={kasaConfirmed}
        workplace={workplace}
        onToggleAttendance={toggleAttendance}
        onKasaConfirm={confirmKasa}
        onWorkplaceChange={changeWorkplace}
      />

      {isProdavac ? (
        <ProdavacView
          isWarehouse={isWarehouse}
          cashToCollect={cashToCollect}
          formData={formData}
          total={calculateTotal}
          collectionPeriod={getCollectionPeriod()}
          onUpdateField={updateField}
          onAddIncome={addIncomeRow}
          onAddExpense={addExpenseRow}
          onUpdateIncome={updateIncomeRow}
          onUpdateExpense={updateExpenseRow}
          onRemoveIncome={removeIncomeRow}
          onRemoveExpense={removeExpenseRow}
          onSubmitSales={submitSales}
          onSubmitCollection={submitCollection}
        />
      ) : (
        <VedouciView />
      )}
    </>
  );
}

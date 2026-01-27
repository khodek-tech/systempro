'use client';

import { useState, useCallback, useMemo } from 'react';
import { ExtraRow, SalesFormData } from '@/types';

const createEmptyRow = (): ExtraRow => ({
  id: crypto.randomUUID(),
  amount: 0,
  note: '',
});

export function useSales(initialCash: number = 28500) {
  const [cashToCollect, setCashToCollect] = useState(initialCash);
  const [formData, setFormData] = useState<SalesFormData>({
    cash: 0,
    card: 0,
    partner: 0,
    incomes: [],
    expenses: [],
  });

  const calculateTotal = useMemo(() => {
    let total = formData.cash + formData.card + formData.partner;
    formData.incomes.forEach((i) => {
      total += i.amount || 0;
    });
    formData.expenses.forEach((e) => {
      total -= e.amount || 0;
    });
    return total;
  }, [formData]);

  const updateField = useCallback(
    (field: 'cash' | 'card' | 'partner', value: number) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const addIncomeRow = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      incomes: [...prev.incomes, createEmptyRow()],
    }));
  }, []);

  const addExpenseRow = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      expenses: [...prev.expenses, createEmptyRow()],
    }));
  }, []);

  const updateIncomeRow = useCallback(
    (id: string, field: 'amount' | 'note', value: number | string) => {
      setFormData((prev) => ({
        ...prev,
        incomes: prev.incomes.map((row) =>
          row.id === id ? { ...row, [field]: value } : row
        ),
      }));
    },
    []
  );

  const updateExpenseRow = useCallback(
    (id: string, field: 'amount' | 'note', value: number | string) => {
      setFormData((prev) => ({
        ...prev,
        expenses: prev.expenses.map((row) =>
          row.id === id ? { ...row, [field]: value } : row
        ),
      }));
    },
    []
  );

  const removeIncomeRow = useCallback((id: string) => {
    setFormData((prev) => ({
      ...prev,
      incomes: prev.incomes.filter((row) => row.id !== id),
    }));
  }, []);

  const removeExpenseRow = useCallback((id: string) => {
    setFormData((prev) => ({
      ...prev,
      expenses: prev.expenses.filter((row) => row.id !== id),
    }));
  }, []);

  const validateForm = useCallback(() => {
    const allRows = [...formData.incomes, ...formData.expenses];
    for (const row of allRows) {
      if (row.amount > 0 && !row.note.trim()) {
        return {
          valid: false,
          error: 'Doplňte povinné poznámky u všech pohybů!',
        };
      }
    }
    return { valid: true };
  }, [formData]);

  const submitSales = useCallback(() => {
    const validation = validateForm();
    if (!validation.valid) {
      return validation;
    }

    setCashToCollect((prev) => prev + formData.cash);
    setFormData({
      cash: 0,
      card: 0,
      partner: 0,
      incomes: [],
      expenses: [],
    });

    return { valid: true };
  }, [formData, validateForm]);

  const submitCollection = useCallback(
    (driverName: string) => {
      if (!driverName.trim()) {
        return { success: false, error: 'Vyplňte jméno řidiče!' };
      }
      setCashToCollect(0);
      return { success: true };
    },
    []
  );

  const getCollectionPeriod = useCallback(() => {
    const now = new Date();
    const monthNames = [
      'ledna',
      'února',
      'března',
      'dubna',
      'května',
      'června',
      'července',
      'srpna',
      'září',
      'října',
      'listopadu',
      'prosince',
    ];
    if (now.getDate() >= 16) {
      return `1. - 15. ${monthNames[now.getMonth()]}`;
    }
    return `16. - Konec min. měsíce`;
  }, []);

  return {
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
  };
}

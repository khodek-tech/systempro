'use client';

import { useState, useCallback } from 'react';
import { WorkplaceType } from '@/types';

export function useAttendance() {
  const [isInWork, setIsInWork] = useState(false);
  const [kasaConfirmed, setKasaConfirmed] = useState(false);
  const [workplace, setWorkplace] = useState<WorkplaceType>('praha 1');

  const toggleAttendance = useCallback(() => {
    if (isInWork && !kasaConfirmed) {
      return { success: false, error: 'Před odchodem potvrďte stav kasy!' };
    }

    setIsInWork((prev) => !prev);
    setKasaConfirmed(false);
    return { success: true };
  }, [isInWork, kasaConfirmed]);

  const confirmKasa = useCallback((confirmed: boolean) => {
    setKasaConfirmed(confirmed);
  }, []);

  const changeWorkplace = useCallback((newWorkplace: WorkplaceType) => {
    if (!isInWork) {
      setWorkplace(newWorkplace);
    }
  }, [isInWork]);

  const isWarehouse = workplace === 'sklad';

  return {
    isInWork,
    kasaConfirmed,
    workplace,
    isWarehouse,
    toggleAttendance,
    confirmKasa,
    changeWorkplace,
  };
}

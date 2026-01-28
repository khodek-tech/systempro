'use client';

import { Header } from '@/components/header';
import { ProdavacView } from '@/components/views/prodavac-view';
import { VedouciView } from '@/components/views/vedouci-view';
import { useRoleStore } from '@/stores/role-store';
import { useAttendanceStore } from '@/stores/attendance-store';

export default function Home() {
  const { role, switchRole, isProdavac } = useRoleStore();
  const {
    isInWork,
    kasaConfirmed,
    workplace,
    isWarehouse,
    toggleAttendance,
    confirmKasa,
    changeWorkplace,
  } = useAttendanceStore();

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

      {isProdavac() ? (
        <ProdavacView isWarehouse={isWarehouse()} />
      ) : (
        <VedouciView />
      )}
    </>
  );
}

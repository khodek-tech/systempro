'use client';

import { Header } from '@/components/header';
import { ProdavacView } from '@/components/views/prodavac-view';
import { AdminView } from '@/components/views/admin-view';
import { SkladnikView } from '@/components/views/skladnik-view';
import { VedouciSkladView } from '@/components/views/vedouci-sklad-view';
import { ObsluhaEshopView } from '@/components/views/obsluha-eshop-view';
import { ObchodnikView } from '@/components/views/obchodnik-view';
import { VedouciVelkoobchodView } from '@/components/views/vedouci-velkoobchod-view';
import { MajitelView } from '@/components/views/majitel-view';
import { useAuthStore } from '@/stores/auth-store';
import { useAttendanceStore } from '@/stores/attendance-store';

export default function Home() {
  const { getActiveRoleType } = useAuthStore();
  const { workplaceType } = useAttendanceStore();

  const roleType = getActiveRoleType();

  // Determine which view to render based on active role
  const renderView = () => {
    switch (roleType) {
      case 'prodavac':
        // For prodavac, check if they're at a warehouse (no sales tracking)
        const isWarehouse = workplaceType === 'role';
        return <ProdavacView isWarehouse={isWarehouse} />;

      case 'administrator':
        return <AdminView />;

      case 'skladnik':
        return <SkladnikView />;

      case 'vedouci-sklad':
        return <VedouciSkladView />;

      case 'obsluha-eshop':
        return <ObsluhaEshopView />;

      case 'obchodnik':
        return <ObchodnikView />;

      case 'vedouci-velkoobchod':
        return <VedouciVelkoobchodView />;

      case 'majitel':
        return <MajitelView />;

      default:
        return <ProdavacView isWarehouse={false} />;
    }
  };

  return (
    <>
      <Header />
      {renderView()}
    </>
  );
}

'use client';

import { Header } from '@/components/header';
import { PresenceSidebar } from '@/components/PresenceSidebar';
import { ProdavacView } from '@/components/views/prodavac-view';
import { AdminView } from '@/components/views/admin-view';
import { SkladnikView } from '@/components/views/skladnik-view';
import { VedouciSkladView } from '@/components/views/vedouci-sklad-view';
import { ObsluhaEshopView } from '@/components/views/obsluha-eshop-view';
import { ObchodnikView } from '@/components/views/obchodnik-view';
import { VedouciVelkoobchodView } from '@/components/views/vedouci-velkoobchod-view';
import { MajitelView } from '@/components/views/majitel-view';
import { Toaster } from 'sonner';
import { useAuthStore } from '@/stores/auth-store';
import { useAttendanceStore } from '@/stores/attendance-store';
import { useInitializeData } from '@/lib/supabase/init';

export default function Home() {
  const { getActiveRoleType, _hydrated } = useAuthStore();
  const { workplaceType } = useAttendanceStore();
  const { ready } = useInitializeData();

  // Loading state during hydration and data loading
  if (!_hydrated || !ready) {
    return (
      <>
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50">
          <div className="animate-pulse text-slate-400">Načítání...</div>
        </main>
      </>
    );
  }

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
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <PresenceSidebar />
        {renderView()}
      </div>
      <Toaster richColors position="top-center" />
    </div>
  );
}

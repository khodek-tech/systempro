'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/header';
import { ProdavacView } from '@/components/views/prodavac-view';
import { AdminView } from '@/components/views/admin-view';
import { SkladnikView } from '@/components/views/skladnik-view';
import { VedouciSkladView } from '@/components/views/vedouci-sklad-view';
import { ObsluhaEshopView } from '@/components/views/obsluha-eshop-view';
import { ObchodnikView } from '@/components/views/obchodnik-view';
import { VedouciVelkoobchodView } from '@/components/views/vedouci-velkoobchod-view';
import { MajitelView } from '@/components/views/majitel-view';
import { ChangePasswordOverlay } from '@/components/auth/change-password-overlay';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from 'sonner';
import { useAuthStore } from '@/stores/auth-store';
import { useAttendanceStore } from '@/stores/attendance-store';
import { useUsersStore } from '@/stores/users-store';
import { useInitializeData } from '@/lib/supabase/init';
import { createClient } from '@/lib/supabase/client';
import { useUrlSync } from '@/shared/hooks/use-url-sync';

interface HomePageProps {
  slug: string[];
}

export function HomePage({ slug }: HomePageProps) {
  const { getActiveRoleType, _hydrated, setLoggedInUser } = useAuthStore();
  const { workplaceType } = useAttendanceStore();
  const { ready, error: initError } = useInitializeData();
  const { getUserByAuthId } = useUsersStore();
  const [authId, setAuthId] = useState<string | null>(null);

  useUrlSync(slug, ready);

  useEffect(() => {
    if (!ready) return;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setAuthId(user.id);
        setLoggedInUser(user.id);
      }
    });
  }, [ready, setLoggedInUser]);

  // Error state
  if (initError) {
    return (
      <>
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50">
          <div className="text-center space-y-4">
            <div className="text-red-600 font-semibold">Nepodařilo se načíst data</div>
            <p className="text-sm text-slate-500">{initError}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-all"
            >
              Zkusit znovu
            </button>
          </div>
        </main>
      </>
    );
  }

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

  // Check if the logged-in user must change password
  const matchedUser = authId ? getUserByAuthId(authId) : null;
  const mustChangePassword = matchedUser?.mustChangePassword === true;

  const roleType = getActiveRoleType();

  // Determine which view to render based on active role
  const renderView = () => {
    switch (roleType) {
      case 'prodavac': {
        // For prodavac, check if they're at a warehouse (no sales tracking)
        const isWarehouse = workplaceType === 'role';
        return <ProdavacView isWarehouse={isWarehouse} />;
      }

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
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex overflow-hidden">
          {renderView()}
        </div>
        <Toaster richColors position="top-center" />
        {mustChangePassword && authId && <ChangePasswordOverlay authId={authId} />}
      </div>
    </ErrorBoundary>
  );
}

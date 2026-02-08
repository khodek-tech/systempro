'use client';

import { ArrowLeft, RefreshCw, PenSquare, Loader2, X, Wrench } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useEmailStore } from '@/stores/email-store';
import { useAuthStore } from '@/stores/auth-store';
import { EmailSidebar } from '@/components/email/EmailSidebar';
import { EmailMessageList } from '@/components/email/EmailMessageList';
import { EmailDetail } from '@/components/email/EmailDetail';
import { EmailComposer } from '@/components/email/EmailComposer';

export function EmailFullView() {
  const {
    closeEmailView, selectedAccountId, selectedFolderId, selectedMessageId, selectMessage,
    openComposer, composerOpen, triggerSync, triggerBackfill, getAccountsForUser,
  } = useEmailStore();
  const { currentUser } = useAuthStore();
  const [syncing, setSyncing] = useState(false);
  const [backfilling, setBackfilling] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const userAccounts = useMemo(
    () => currentUser ? getAccountsForUser(currentUser.id) : [],
    [currentUser, getAccountsForUser]
  );

  // Close detail modal on Escape
  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && selectedMessageId) {
      selectMessage(null);
    }
  }, [selectedMessageId, selectMessage]);

  useEffect(() => {
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [handleEscape]);

  // Auto-select first account if none selected
  useEffect(() => {
    if (!selectedAccountId && userAccounts.length > 0) {
      useEmailStore.getState().selectAccount(userAccounts[0].id);
    }
  }, [selectedAccountId, userAccounts]);

  const handleSync = async () => {
    if (!selectedAccountId || syncing) return;
    setSyncing(true);
    setSyncMessage(null);
    const result = await triggerSync(selectedAccountId);
    setSyncing(false);
    if (result.success) {
      setSyncMessage({ type: 'success', text: 'Synchronizace dokončena' });
    } else {
      setSyncMessage({ type: 'error', text: result.error || 'Chyba při synchronizaci' });
    }
    setTimeout(() => setSyncMessage(null), 5000);
  };

  const handleBackfill = async () => {
    if (!selectedAccountId || backfilling) return;
    setBackfilling(true);
    setSyncMessage(null);
    const result = await triggerBackfill(selectedAccountId, selectedFolderId ?? undefined);
    setBackfilling(false);
    if (result.success) {
      const msg = result.processed
        ? `Opraveno ${result.processed} zpráv${result.remaining ? `, zbývá ${result.remaining}` : ''}`
        : 'Žádné zprávy k opravě';
      setSyncMessage({ type: 'success', text: msg });
    } else {
      setSyncMessage({ type: 'error', text: result.error || 'Chyba při opravě těl' });
    }
    setTimeout(() => setSyncMessage(null), 8000);
  };

  return (
    <main className="flex-1 flex flex-col overflow-hidden bg-slate-50">
      {/* Header */}
      <div className="flex items-center justify-between bg-white border-b border-slate-200 px-6 py-4">
        <Button
          onClick={closeEmailView}
          variant="outline"
          className="px-4 py-2 rounded-lg text-xs font-medium"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Zpět
        </Button>

        <h1 className="text-xl font-bold text-slate-800">E-mail</h1>

        <div className="flex items-center gap-2">
          {selectedAccountId && (
            <>
              <button
                onClick={handleBackfill}
                disabled={backfilling}
                className="flex items-center gap-2 bg-slate-100 text-slate-700 px-3 py-2 rounded-lg text-xs font-medium hover:bg-slate-200 transition-all disabled:opacity-50"
                title="Doplnit chybějící HTML těla e-mailů"
              >
                {backfilling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wrench className="w-4 h-4" />}
                Opravit těla
              </button>
              <button
                onClick={handleSync}
                disabled={syncing}
                className="flex items-center gap-2 bg-slate-100 text-slate-700 px-3 py-2 rounded-lg text-xs font-medium hover:bg-slate-200 transition-all disabled:opacity-50"
              >
                {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Sync
              </button>
            </>
          )}
          <button
            onClick={() => openComposer('new')}
            className="flex items-center gap-2 bg-sky-600 text-white px-3 py-2 rounded-lg text-xs font-semibold hover:bg-sky-700 active:scale-[0.98] transition-all"
          >
            <PenSquare className="w-4 h-4" />
            Nový
          </button>
        </div>
      </div>

      {/* Sync notification */}
      {syncMessage && (
        <div className={`flex items-center justify-between px-4 py-2 text-sm font-medium ${
          syncMessage.type === 'success' ? 'bg-green-50 text-green-700 border-b border-green-200' : 'bg-red-50 text-red-700 border-b border-red-200'
        }`}>
          <span>{syncMessage.text}</span>
          <button onClick={() => setSyncMessage(null)} className="ml-2 opacity-60 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Mobile: progressive navigation */}
        <div className="md:hidden flex-1 flex">
          {!selectedAccountId ? (
            <div className="flex-1 bg-white">
              <EmailSidebar />
            </div>
          ) : !selectedMessageId ? (
            <div className="flex-1 flex flex-col">
              {/* Mobile: show folders + messages */}
              <div className="bg-white border-b border-slate-200 max-h-48 overflow-y-auto">
                <EmailSidebar />
              </div>
              <div className="flex-1 bg-white">
                <EmailMessageList />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col">
              <button
                onClick={() => selectMessage(null)}
                className="flex items-center gap-2 px-4 py-3 bg-white border-b border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                <ArrowLeft className="w-4 h-4" />
                Zpět na seznam
              </button>
              <EmailDetail />
            </div>
          )}
        </div>

        {/* Desktop: two-panel layout */}
        <div className="hidden md:flex flex-1 min-w-0">
          <div className="w-64 flex-shrink-0 bg-white border-r border-slate-200">
            <EmailSidebar />
          </div>
          <div className="flex-1 min-w-0 bg-white overflow-hidden">
            <EmailMessageList />
          </div>
        </div>
      </div>

      {/* Desktop: detail modal */}
      {selectedMessageId && (
        <div
          className="fixed inset-0 z-[60] hidden md:flex items-center justify-center bg-black/30"
          onClick={() => selectMessage(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-lg w-full max-w-4xl mx-4 flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-end px-5 pt-4 pb-0">
              <button
                onClick={() => selectMessage(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <EmailDetail />
          </div>
        </div>
      )}

      {/* Composer modal */}
      {composerOpen && <EmailComposer />}
    </main>
  );
}

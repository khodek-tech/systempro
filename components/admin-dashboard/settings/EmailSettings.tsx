'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Loader2, CheckCircle, XCircle, RefreshCw, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useEmailStore } from '@/stores/email-store';
import { useUsersStore } from '@/stores/users-store';
import { formatEmailDate } from '@/features/email/email-helpers';
import { createClient } from '@/lib/supabase/client';
import { mapDbToEmailSyncLog } from '@/lib/supabase/mappers';
import type { EmailAccount, EmailAccountAccess, EmailSyncLog } from '@/shared/types';
import { toast } from 'sonner';

export function EmailSettings() {
  const { accounts, accountAccess, fetchEmailData } = useEmailStore();
  const { users } = useUsersStore();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleEdit = (account: EmailAccount) => {
    setEditingId(account.id);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">E-mailové účty</h2>
          <p className="text-sm text-slate-500">Správa IMAP/SMTP emailových účtů</p>
        </div>
        <button
          onClick={() => { setEditingId(null); setShowForm(true); }}
          className="flex items-center gap-2 bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-sky-700 active:scale-[0.98] transition-all"
        >
          <Plus className="w-4 h-4" />
          Přidat účet
        </button>
      </div>

      {/* Account list */}
      {accounts.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-sm text-slate-400">
          Žádné e-mailové účty. Klikněte na &quot;Přidat účet&quot; pro vytvoření.
        </div>
      ) : (
        <div className="space-y-3">
          {accounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              access={accountAccess.filter((a) => a.accountId === account.id)}
              users={users}
              isExpanded={expandedId === account.id}
              onToggle={() => setExpandedId(expandedId === account.id ? null : account.id)}
              onEdit={() => handleEdit(account)}
              onRefetch={fetchEmailData}
            />
          ))}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <AccountFormModal
          editingId={editingId}
          account={editingId ? accounts.find((a) => a.id === editingId) : undefined}
          onClose={handleFormClose}
          onSaved={() => { handleFormClose(); fetchEmailData(); }}
        />
      )}
    </div>
  );
}

// =============================================================================
// Account Card
// =============================================================================

function AccountCard({
  account, access, users, isExpanded, onToggle, onEdit, onRefetch,
}: {
  account: EmailAccount;
  access: EmailAccountAccess[];
  users: { id: string; fullName: string; active: boolean }[];
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onRefetch: () => void;
}) {
  const [syncing, setSyncing] = useState(false);
  const [logs, setLogs] = useState<EmailSyncLog[]>([]);
  const [logsLoaded, setLogsLoaded] = useState(false);
  const [progress, setProgress] = useState<{ processed: number; total: number; folder: string | null } | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { triggerInitialSync } = useEmailStore();

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  const startPolling = useCallback((accountId: string) => {
    stopPolling();
    const supabase = createClient();
    pollingRef.current = setInterval(async () => {
      const { data } = await supabase
        .from('emailovy_log')
        .select('stav, celkem_zprav, zpracovano, aktualni_slozka')
        .eq('id_uctu', accountId)
        .eq('stav', 'running')
        .order('vytvoreno', { ascending: false })
        .limit(1)
        .single();
      if (data) {
        setProgress({
          processed: data.zpracovano ?? 0,
          total: data.celkem_zprav ?? 0,
          folder: data.aktualni_slozka ?? null,
        });
      }
    }, 2000);
  }, [stopPolling]);

  const handleSync = async () => {
    setSyncing(true);
    setProgress({ processed: 0, total: 0, folder: null });
    startPolling(account.id);

    const result = await triggerInitialSync(account.id);

    stopPolling();
    setSyncing(false);
    setProgress(null);

    if (result.success) {
      toast.success('Synchronizace dokončena');
      onRefetch();
      // Refresh logs if expanded
      if (logsLoaded) loadLogs();
    } else {
      toast.error(result.error || 'Chyba');
    }
  };

  const loadLogs = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('emailovy_log')
      .select('*')
      .eq('id_uctu', account.id)
      .order('vytvoreno', { ascending: false })
      .limit(10);
    if (data) {
      setLogs(data.map(mapDbToEmailSyncLog));
      setLogsLoaded(true);
    }
  };

  const handleToggle = () => {
    if (!isExpanded && !logsLoaded) {
      loadLogs();
    }
    onToggle();
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      {/* Main row */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <div className={`w-3 h-3 rounded-full ${account.active ? 'bg-green-500' : 'bg-slate-300'}`} />
          <div>
            <div className="font-semibold text-slate-800">{account.name}</div>
            <div className="text-sm text-slate-500">{account.email}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {syncing && progress ? (
            <span className="text-xs text-sky-600 font-medium">
              Synchronizace: {progress.processed} / {progress.total} zpráv
              {progress.folder && <span className="text-slate-400"> &bull; {progress.folder}</span>}
            </span>
          ) : account.lastSync ? (
            <span className="text-xs text-slate-400">
              Sync: {formatEmailDate(account.lastSync)}
            </span>
          ) : null}
          <button
            onClick={handleSync}
            disabled={syncing}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
            title="Synchronizovat"
          >
            {syncing ? <Loader2 className="w-4 h-4 animate-spin text-sky-500" /> : <RefreshCw className="w-4 h-4 text-slate-500" />}
          </button>
          <button
            onClick={onEdit}
            className="text-sm font-medium text-sky-600 hover:text-sky-700"
          >
            Upravit
          </button>
          <button onClick={handleToggle} className="p-1">
            {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>
        </div>
      </div>

      {/* Progress bar during sync */}
      {syncing && progress && progress.total > 0 && (
        <div className="px-4 pb-2">
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-sky-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (progress.processed / progress.total) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Expanded details */}
      {isExpanded && (
        <div className="border-t border-slate-100 p-4 space-y-4">
          {/* Access list */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
              Přístupy ({access.length})
            </div>
            <AccessManager accountId={account.id} existingAccess={access} users={users} onSaved={onRefetch} />
          </div>

          {/* Sync logs */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
              Sync log
            </div>
            {logs.length === 0 ? (
              <p className="text-sm text-slate-400">Žádné záznamy</p>
            ) : (
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-center gap-3 text-xs bg-slate-50 rounded px-3 py-1.5">
                    {log.status === 'success' ? (
                      <CheckCircle className="w-3 h-3 text-green-500" />
                    ) : log.status === 'error' ? (
                      <XCircle className="w-3 h-3 text-red-500" />
                    ) : (
                      <Loader2 className="w-3 h-3 text-slate-400 animate-spin" />
                    )}
                    <span className="text-slate-600">{formatEmailDate(log.createdAt)}</span>
                    <span className="text-slate-500">+{log.newCount} zpráv</span>
                    <span className="text-slate-400">{log.durationMs}ms</span>
                    {log.message && <span className="text-red-500 truncate flex-1">{log.message}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Server info */}
          <div className="text-xs text-slate-400 flex gap-4">
            <span>IMAP: {account.imapServer}:{account.imapPort}</span>
            <span>SMTP: {account.smtpServer}:{account.smtpPort}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Access Manager
// =============================================================================

function AccessManager({
  accountId, existingAccess, users, onSaved,
}: {
  accountId: string;
  existingAccess: EmailAccountAccess[];
  users: { id: string; fullName: string; active: boolean }[];
  onSaved: () => void;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [canSend, setCanSend] = useState(true);
  const [canDelete, setCanDelete] = useState(false);

  const availableUsers = users.filter(
    (u) => u.active && !existingAccess.some((a) => a.employeeId === u.id)
  );

  const handleAdd = async () => {
    if (!selectedUser) return;
    const supabase = createClient();
    const { error } = await supabase.from('emailovy_pristup').insert({
      id_uctu: accountId,
      id_zamestnance: selectedUser,
      muze_odesilat: canSend,
      muze_mazat: canDelete,
    });
    if (!error) {
      toast.success('Přístup přidán');
      setShowAdd(false);
      setSelectedUser('');
      onSaved();
    } else {
      toast.error('Chyba při přidávání přístupu');
    }
  };

  const handleRemove = async (employeeId: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('emailovy_pristup')
      .delete()
      .eq('id_uctu', accountId)
      .eq('id_zamestnance', employeeId);
    if (!error) {
      toast.success('Přístup odebrán');
      onSaved();
    }
  };

  return (
    <div className="mt-2">
      {existingAccess.length === 0 ? (
        <p className="text-sm text-slate-400">Žádné přístupy</p>
      ) : (
        <div className="space-y-1">
          {existingAccess.map((a) => {
            const userName = users.find((u) => u.id === a.employeeId)?.fullName || a.employeeId;
            return (
              <div key={a.employeeId} className="group flex items-center justify-between text-sm bg-slate-50 rounded-lg px-3 py-2">
                <span className="font-medium text-slate-700">{userName}</span>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  {a.canSend && <span className="text-green-600">Odesílání</span>}
                  {a.canDelete && <span className="text-red-600">Mazání</span>}
                  <button
                    onClick={() => handleRemove(a.employeeId)}
                    className="hidden group-hover:inline-flex p-1 rounded hover:bg-red-50 transition-colors"
                    title="Odebrat přístup"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400 hover:text-red-600" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!showAdd ? (
        <button
          onClick={() => setShowAdd(true)}
          className="text-xs font-medium text-sky-600 hover:text-sky-700 mt-2"
        >
          + Přidat přístup
        </button>
      ) : (
        <div className="flex items-end gap-2 mt-2 bg-slate-50 rounded-lg p-3">
          <div className="flex-1">
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none"
            >
              <option value="">Vybrat zaměstnance...</option>
              {availableUsers.map((u) => (
                <option key={u.id} value={u.id}>{u.fullName}</option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-1 text-xs">
            <input type="checkbox" checked={canSend} onChange={(e) => setCanSend(e.target.checked)} />
            Odesílat
          </label>
          <label className="flex items-center gap-1 text-xs">
            <input type="checkbox" checked={canDelete} onChange={(e) => setCanDelete(e.target.checked)} />
            Mazat
          </label>
          <button
            onClick={handleAdd}
            disabled={!selectedUser}
            className="bg-sky-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50"
          >
            Přidat
          </button>
          <button onClick={() => setShowAdd(false)} className="text-xs text-slate-500">Zrušit</button>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Account Form Modal
// =============================================================================

function AccountFormModal({
  editingId, account, onClose, onSaved,
}: {
  editingId: string | null;
  account?: EmailAccount;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(account?.name || '');
  const [email, setEmail] = useState(account?.email || '');
  const [imapServer, setImapServer] = useState(account?.imapServer || '');
  const [imapPort, setImapPort] = useState(account?.imapPort || 993);
  const [smtpServer, setSmtpServer] = useState(account?.smtpServer || '');
  const [smtpPort, setSmtpPort] = useState(account?.smtpPort || 465);
  const [username, setUsername] = useState(account?.username || '');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ imap: boolean; smtp: boolean } | null>(null);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const body = editingId
        ? { accountId: editingId }
        : { imapServer, imapPort, smtpServer, smtpPort, username, password };

      const res = await fetch('/api/email/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      setTestResult({ imap: json.imap, smtp: json.smtp });
      if (json.success) {
        toast.success('Připojení OK');
      } else {
        toast.error(json.error || 'Test selhal');
      }
    } catch {
      toast.error('Chyba při testování');
    }
    setTesting(false);
  };

  const handleSave = async () => {
    if (!name || !email || !imapServer || !smtpServer || !username || (!editingId && !password)) {
      toast.error('Vyplňte všechna povinná pole');
      return;
    }

    setSaving(true);
    try {
      const url = '/api/email/accounts';
      const method = editingId ? 'PUT' : 'POST';
      const body = {
        ...(editingId && { id: editingId }),
        name, email, imapServer, imapPort, smtpServer, smtpPort, username,
        ...(password && { password }),
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();

      if (json.success) {
        toast.success(editingId ? 'Účet aktualizován' : 'Účet vytvořen');
        onSaved();
      } else {
        toast.error(json.error || 'Chyba při ukládání');
      }
    } catch {
      toast.error('Chyba při ukládání');
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-lg mx-4 p-8">
        <h2 className="text-2xl font-bold text-center text-slate-800 mb-6">
          {editingId ? 'Upravit e-mailový účet' : 'Nový e-mailový účet'}
        </h2>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-500 block mb-1">Název</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Info e-shop" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-300" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-500 block mb-1">E-mail</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="info@firma.cz" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-300" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="text-sm font-medium text-slate-500 block mb-1">IMAP server</label>
              <input value={imapServer} onChange={(e) => setImapServer(e.target.value)} placeholder="imap.firma.cz" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-300" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-500 block mb-1">Port</label>
              <input type="number" value={imapPort} onChange={(e) => setImapPort(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-300" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="text-sm font-medium text-slate-500 block mb-1">SMTP server</label>
              <input value={smtpServer} onChange={(e) => setSmtpServer(e.target.value)} placeholder="smtp.firma.cz" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-300" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-500 block mb-1">Port</label>
              <input type="number" value={smtpPort} onChange={(e) => setSmtpPort(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-300" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-500 block mb-1">Uživatelské jméno</label>
              <input value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-300" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-500 block mb-1">Heslo {editingId && '(ponechte prázdné)'}</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={editingId ? '••••••••' : ''} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-300" />
            </div>
          </div>

          {/* Test result */}
          {testResult && (
            <div className="flex items-center gap-4 bg-slate-50 rounded-lg px-4 py-2 text-sm">
              <div className="flex items-center gap-1">
                {testResult.imap ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                IMAP
              </div>
              <div className="flex items-center gap-1">
                {testResult.smtp ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                SMTP
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-8">
          <button
            onClick={handleTest}
            disabled={testing}
            className="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-200 transition-all disabled:opacity-50"
          >
            {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Test připojení
          </button>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
              Zrušit
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-sky-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-sky-700 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingId ? 'Uložit' : 'Vytvořit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { create } from 'zustand';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type {
  EmailAccount,
  EmailAccountAccess,
  EmailFolder,
  EmailMessage,
  EmailRule,
  EmailComposeData,
} from '@/shared/types';
import { createClient } from '@/lib/supabase/client';
import {
  mapDbToEmailAccount,
  mapDbToEmailAccess,
  mapDbToEmailFolder,
  mapDbToEmailMessage,
  mapDbToEmailRule,
  mapEmailRuleToDb,
} from '@/lib/supabase/mappers';

import { toast } from 'sonner';

const PAGE_SIZE = 50;

type ImapAction = 'move' | 'setRead' | 'setUnread' | 'setFlagged' | 'unsetFlagged' | 'delete';

async function callImapAction(
  action: ImapAction,
  messageId: string,
  accountId: string,
  targetFolderId?: string,
): Promise<{ success: boolean; newUid?: number; skipped?: boolean; error?: string }> {
  try {
    const res = await fetch('/api/email/imap-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, messageId, accountId, targetFolderId }),
    });
    return await res.json();
  } catch {
    return { success: false, error: 'Network error' };
  }
}

interface EmailState {
  accounts: EmailAccount[];
  accountAccess: EmailAccountAccess[];
  folders: EmailFolder[];
  messages: EmailMessage[];
  rules: EmailRule[];
  _loaded: boolean;
  _loading: boolean;
  _messagesLoading: boolean;
  _bodyLoading: boolean;
  _searchLoading: boolean;
  searchResults: EmailMessage[];

  // View state
  emailViewMode: 'card' | 'view';
  selectedAccountId: string | null;
  selectedFolderId: string | null;
  selectedMessageId: string | null;
  selectedMessageIds: string[];
  composerOpen: boolean;
  composerMode: 'new' | 'reply' | 'replyAll' | 'forward';
  composerReplyTo: EmailMessage | null;
  searchQuery: string;
  emailSortField: 'date' | 'from' | 'subject';
  emailSortDirection: 'asc' | 'desc';

  // Pagination
  messagesPage: number;
  messagesTotal: number;
  messagesHasMore: boolean;

  // Realtime & auto-sync (internal)
  _realtimeChannel: RealtimeChannel | null;
  _autoSyncInterval: ReturnType<typeof setInterval> | null;
}

interface EmailActions {
  // Fetch
  fetchEmailData: () => Promise<void>;
  fetchMessages: (accountId: string, folderId: string, page?: number) => Promise<void>;
  fetchMessageBody: (messageId: string) => Promise<void>;

  // View
  openEmailView: () => void;
  closeEmailView: () => void;
  selectAccount: (accountId: string | null) => void;
  selectFolder: (folderId: string | null) => void;
  selectMessage: (messageId: string | null) => void;
  setSearchQuery: (query: string) => void;
  searchMessages: (query: string) => Promise<void>;
  setEmailSort: (field: 'date' | 'from' | 'subject') => void;
  loadMoreMessages: () => Promise<void>;

  // Selection
  toggleMessageSelection: (messageId: string) => void;
  selectAllMessages: () => void;
  clearSelection: () => void;
  moveSelectedToFolder: (targetFolderId: string) => Promise<void>;

  // Message actions
  markAsRead: (messageId: string) => Promise<void>;
  markAsUnread: (messageId: string) => Promise<void>;
  toggleFlagged: (messageId: string) => Promise<void>;
  moveToFolder: (messageId: string, targetFolderId: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;

  // Composer
  openComposer: (mode: 'new' | 'reply' | 'replyAll' | 'forward', replyTo?: EmailMessage) => void;
  closeComposer: () => void;

  // API routes (server-side IMAP/SMTP)
  sendEmail: (data: EmailComposeData) => Promise<{ success: boolean; error?: string }>;
  triggerSync: (accountId: string) => Promise<{ success: boolean; error?: string }>;
  triggerInitialSync: (accountId: string) => Promise<{ success: boolean; error?: string; logId?: number }>;
  triggerBackfill: (accountId: string, folderId?: string) => Promise<{ success: boolean; processed?: number; remaining?: number; error?: string }>;

  // Rules
  createRule: (rule: Omit<EmailRule, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateRule: (ruleId: string, updates: Partial<EmailRule>) => Promise<void>;
  deleteRule: (ruleId: string) => Promise<void>;

  // Realtime & auto-sync
  subscribeRealtime: () => void;
  unsubscribeRealtime: () => void;
  startAutoSync: () => void;
  stopAutoSync: () => void;

  // Getters
  getAccountsForUser: (userId: string) => EmailAccount[];
  getFoldersForAccount: (accountId: string) => EmailFolder[];
  getUnreadCountForUser: (userId: string) => number;
  getSelectedMessage: () => EmailMessage | undefined;
  getRulesForAccount: (accountId: string) => EmailRule[];
}

export const useEmailStore = create<EmailState & EmailActions>()((set, get) => ({
  // Initial state
  accounts: [],
  accountAccess: [],
  folders: [],
  messages: [],
  rules: [],
  _loaded: false,
  _loading: false,
  _messagesLoading: false,
  _bodyLoading: false,
  _searchLoading: false,
  searchResults: [],

  emailViewMode: 'card',
  selectedAccountId: null,
  selectedFolderId: null,
  selectedMessageId: null,
  selectedMessageIds: [],
  composerOpen: false,
  composerMode: 'new',
  composerReplyTo: null,
  searchQuery: '',
  emailSortField: 'date',
  emailSortDirection: 'desc',

  messagesPage: 0,
  messagesTotal: 0,
  messagesHasMore: false,

  _realtimeChannel: null,
  _autoSyncInterval: null,

  // =========================================================================
  // Fetch
  // =========================================================================

  fetchEmailData: async () => {
    if (get()._loading) return;
    set({ _loading: true });
    const supabase = createClient();

    const [accountsResult, accessResult, foldersResult, rulesResult] = await Promise.all([
      supabase.from('emailove_ucty').select('id, nazev, email, imap_server, imap_port, smtp_server, smtp_port, uzivatelske_jmeno, aktivni, posledni_sync, vytvoreno, aktualizovano'),
      supabase.from('emailovy_pristup').select('*'),
      supabase.from('emailove_slozky').select('*').order('poradi'),
      supabase.from('emailova_pravidla').select('*').order('poradi'),
    ]);

    if (!accountsResult.error && !accessResult.error && !foldersResult.error && !rulesResult.error) {
      set({
        accounts: (accountsResult.data ?? []).map(mapDbToEmailAccount),
        accountAccess: (accessResult.data ?? []).map(mapDbToEmailAccess),
        folders: (foldersResult.data ?? []).map(mapDbToEmailFolder),
        rules: (rulesResult.data ?? []).map(mapDbToEmailRule),
        _loaded: true,
        _loading: false,
      });
    } else {
      console.error('Failed to fetch email data:', {
        accounts: accountsResult.error,
        access: accessResult.error,
        folders: foldersResult.error,
        rules: rulesResult.error,
      });
      set({ _loading: false });
    }
  },

  fetchMessages: async (accountId: string, folderId: string, page = 0) => {
    set({ _messagesLoading: true });
    const supabase = createClient();
    const offset = page * PAGE_SIZE;

    // Fetch messages without body text/html (lazy loaded)
    const { data, error, count } = await supabase
      .from('emailove_zpravy')
      .select('id, id_uctu, id_slozky, imap_uid, id_zpravy_rfc, predmet, odesilatel, prijemci, kopie, skryta_kopie, datum, nahled, precteno, oznaceno, ma_prilohy, metadata_priloh, odpoved_na, vlakno_id, velikost, synchronizovano', { count: 'exact' })
      .eq('id_uctu', accountId)
      .eq('id_slozky', folderId)
      .order('datum', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (!error && data) {
      const existingMessages = get().messages;
      const mapped = data.map((row) => {
        const msg = mapDbToEmailMessage({ ...row, telo_text: null, telo_html: null });
        // Preserve already-loaded body so auto-sync doesn't wipe it
        const existing = existingMessages.find((m) => m.id === msg.id);
        if (existing && (existing.bodyText !== null || existing.bodyHtml !== null)) {
          return { ...msg, bodyText: existing.bodyText, bodyHtml: existing.bodyHtml };
        }
        return msg;
      });
      set({
        messages: page === 0 ? mapped : [...get().messages, ...mapped],
        messagesPage: page,
        messagesTotal: count ?? 0,
        messagesHasMore: (count ?? 0) > offset + PAGE_SIZE,
        _messagesLoading: false,
      });

      // Correct folder unread count from actual DB data
      const { count: unreadCount } = await supabase
        .from('emailove_zpravy')
        .select('id', { count: 'exact', head: true })
        .eq('id_slozky', folderId)
        .eq('precteno', false);
      if (unreadCount !== null) {
        set({
          folders: get().folders.map((f) =>
            f.id === folderId ? { ...f, unreadCount } : f
          ),
        });
        supabase.from('emailove_slozky').update({ pocet_neprectenych: unreadCount }).eq('id', folderId)
          .then(({ error: folderErr }) => { if (folderErr) console.error('Failed to persist folder unread count:', folderErr); });
      }
    } else {
      console.error('Failed to fetch messages:', error);
      set({ _messagesLoading: false });
    }
  },

  fetchMessageBody: async (messageId: string) => {
    set({ _bodyLoading: true });
    const supabase = createClient();
    const { data, error } = await supabase
      .from('emailove_zpravy')
      .select('telo_text, telo_html')
      .eq('id', messageId)
      .single();

    if (!error && data) {
      set({
        _bodyLoading: false,
        messages: get().messages.map((m) =>
          m.id === messageId
            ? { ...m, bodyText: data.telo_text ?? '', bodyHtml: data.telo_html ?? '' }
            : m
        ),
      });
    } else {
      set({ _bodyLoading: false });
    }
  },

  // =========================================================================
  // View
  // =========================================================================

  openEmailView: () => set({ emailViewMode: 'view' }),
  closeEmailView: () => set({
    emailViewMode: 'card',
    selectedAccountId: null,
    selectedFolderId: null,
    selectedMessageId: null,
    selectedMessageIds: [],
    composerOpen: false,
    searchQuery: '',
    searchResults: [],
  }),

  selectAccount: (accountId) => {
    set({
      selectedAccountId: accountId,
      selectedFolderId: null,
      selectedMessageId: null,
      selectedMessageIds: [],
      messages: [],
      messagesPage: 0,
      messagesTotal: 0,
      messagesHasMore: false,
    });

    if (accountId) {
      // Auto-select inbox
      const inbox = get().folders.find(
        (f) => f.accountId === accountId && f.type === 'inbox'
      );
      if (inbox) {
        set({ selectedFolderId: inbox.id });
        get().fetchMessages(accountId, inbox.id);
      }
    }
  },

  selectFolder: (folderId) => {
    set({
      selectedFolderId: folderId,
      selectedMessageId: null,
      selectedMessageIds: [],
      messages: [],
      messagesPage: 0,
      messagesTotal: 0,
      messagesHasMore: false,
    });

    const accountId = get().selectedAccountId;
    if (accountId && folderId) {
      get().fetchMessages(accountId, folderId);
    }
  },

  selectMessage: async (messageId) => {
    set({ selectedMessageId: messageId });

    if (messageId) {
      const msg = get().messages.find((m) => m.id === messageId);
      // Lazy load body if not yet loaded
      if (msg && msg.bodyText === null && msg.bodyHtml === null) {
        await get().fetchMessageBody(messageId);
      }
      // Mark as read
      if (msg && !msg.read) {
        await get().markAsRead(messageId);
      }
    }
  },

  setSearchQuery: (query) => set({ searchQuery: query }),

  searchMessages: async (query) => {
    const accountId = get().selectedAccountId;
    if (!accountId || !query.trim()) {
      set({ searchResults: [], _searchLoading: false });
      return;
    }

    set({ _searchLoading: true });
    const supabase = createClient();
    const q = query.trim().replace(/%/g, '\\%').replace(/_/g, '\\_');

    const { data, error } = await supabase
      .from('emailove_zpravy')
      .select('id, id_uctu, id_slozky, imap_uid, id_zpravy_rfc, predmet, odesilatel, prijemci, kopie, skryta_kopie, datum, nahled, precteno, oznaceno, ma_prilohy, metadata_priloh, odpoved_na, vlakno_id, velikost, synchronizovano')
      .eq('id_uctu', accountId)
      .or(`predmet.ilike.%${q}%,nahled.ilike.%${q}%,odesilatel->>address.ilike.%${q}%,odesilatel->>name.ilike.%${q}%`)
      .order('datum', { ascending: false })
      .limit(100);

    if (!error && data) {
      set({
        searchResults: data.map((row) => mapDbToEmailMessage({ ...row, telo_text: null, telo_html: null })),
        _searchLoading: false,
      });
    } else {
      console.error('Search failed:', error);
      toast.error('Vyhledávání selhalo');
      set({ searchResults: [], _searchLoading: false });
    }
  },

  setEmailSort: (field) => {
    const { emailSortField, emailSortDirection } = get();
    if (field === emailSortField) {
      set({ emailSortDirection: emailSortDirection === 'asc' ? 'desc' : 'asc' });
    } else {
      set({
        emailSortField: field,
        emailSortDirection: field === 'date' ? 'desc' : 'asc',
      });
    }
  },

  loadMoreMessages: async () => {
    const { selectedAccountId, selectedFolderId, messagesPage, messagesHasMore, _messagesLoading } = get();
    if (!selectedAccountId || !selectedFolderId || !messagesHasMore || _messagesLoading) return;
    await get().fetchMessages(selectedAccountId, selectedFolderId, messagesPage + 1);
  },

  // =========================================================================
  // Selection
  // =========================================================================

  toggleMessageSelection: (messageId) => {
    const ids = get().selectedMessageIds;
    set({
      selectedMessageIds: ids.includes(messageId)
        ? ids.filter((id) => id !== messageId)
        : [...ids, messageId],
    });
  },

  selectAllMessages: () => {
    set({ selectedMessageIds: get().messages.map((m) => m.id) });
  },

  clearSelection: () => {
    set({ selectedMessageIds: [] });
  },

  moveSelectedToFolder: async (targetFolderId) => {
    const ids = get().selectedMessageIds;
    if (ids.length === 0) return;

    // Call IMAP action for each selected message (best-effort, don't block on failure)
    const messagesToMove = get().messages.filter((m) => ids.includes(m.id));
    for (const msg of messagesToMove) {
      if (msg.imapUid > 0) {
        const imapResult = await callImapAction('move', msg.id, msg.accountId, targetFolderId);
        if (!imapResult.success && !imapResult.skipped) {
          console.error(`IMAP move failed for ${msg.id}:`, imapResult.error);
        }
        // Update imap_uid if IMAP returned a new UID after move
        if (imapResult.newUid) {
          const sb = createClient();
          const { error: uidErr } = await sb.from('emailove_zpravy').update({ imap_uid: imapResult.newUid }).eq('id', msg.id);
          if (uidErr) console.error(`Failed to update IMAP UID for ${msg.id}:`, uidErr);
        }
      }
    }

    const supabase = createClient();
    const { error } = await supabase
      .from('emailove_zpravy')
      .update({ id_slozky: targetFolderId })
      .in('id', ids);

    if (error) {
      console.error('Failed to move messages:', error);
      toast.error('Nepodařilo se přesunout zprávy');
      return;
    }

    const movedMessages = get().messages.filter((m) => ids.includes(m.id));
    const unreadCount = movedMessages.filter((m) => !m.read).length;
    const sourceFolderId = get().selectedFolderId;

    set({
      messages: get().messages.filter((m) => !ids.includes(m.id)),
      selectedMessageIds: [],
      selectedMessageId: ids.includes(get().selectedMessageId ?? '') ? null : get().selectedMessageId,
      folders: get().folders.map((f) => {
        if (f.id === sourceFolderId) {
          return {
            ...f,
            messageCount: Math.max(0, f.messageCount - movedMessages.length),
            unreadCount: Math.max(0, f.unreadCount - unreadCount),
          };
        }
        if (f.id === targetFolderId) {
          return {
            ...f,
            messageCount: f.messageCount + movedMessages.length,
            unreadCount: f.unreadCount + unreadCount,
          };
        }
        return f;
      }),
    });
  },

  // =========================================================================
  // Message actions
  // =========================================================================

  markAsRead: async (messageId) => {
    const msg = get().messages.find((m) => m.id === messageId);

    // IMAP flag sync (best-effort — don't block DB update on failure)
    if (msg && msg.imapUid > 0) {
      callImapAction('setRead', messageId, msg.accountId).catch((e) => console.warn('IMAP setRead failed:', e));
    }

    const supabase = createClient();
    const { error } = await supabase
      .from('emailove_zpravy')
      .update({ precteno: true })
      .eq('id', messageId);

    if (!error) {
      set({
        messages: get().messages.map((m) => m.id === messageId ? { ...m, read: true } : m),
      });
      if (msg) {
        // Recount unread from DB and persist to folder (non-blocking)
        Promise.resolve(
          supabase
            .from('emailove_zpravy')
            .select('id', { count: 'exact', head: true })
            .eq('id_slozky', msg.folderId)
            .eq('precteno', false)
        ).then(({ count }) => {
          const newCount = count ?? 0;
          set({
            folders: get().folders.map((f) => f.id === msg.folderId ? { ...f, unreadCount: newCount } : f),
          });
          supabase.from('emailove_slozky').update({ pocet_neprectenych: newCount }).eq('id', msg.folderId)
            .then(({ error: folderErr }) => { if (folderErr) console.error('Failed to persist folder unread count:', folderErr); });
        }).catch((e) => console.error('Failed to recount unread (markAsRead):', e));
      }
    }
  },

  markAsUnread: async (messageId) => {
    const msg = get().messages.find((m) => m.id === messageId);

    // IMAP flag sync (best-effort)
    if (msg && msg.imapUid > 0) {
      callImapAction('setUnread', messageId, msg.accountId).catch((e) => console.warn('IMAP setUnread failed:', e));
    }

    const supabase = createClient();
    const { error } = await supabase
      .from('emailove_zpravy')
      .update({ precteno: false })
      .eq('id', messageId);

    if (!error) {
      set({
        messages: get().messages.map((m) => m.id === messageId ? { ...m, read: false } : m),
      });
      if (msg) {
        // Recount unread from DB and persist to folder (non-blocking)
        Promise.resolve(
          supabase
            .from('emailove_zpravy')
            .select('id', { count: 'exact', head: true })
            .eq('id_slozky', msg.folderId)
            .eq('precteno', false)
        ).then(({ count }) => {
          const newCount = count ?? 0;
          set({
            folders: get().folders.map((f) => f.id === msg.folderId ? { ...f, unreadCount: newCount } : f),
          });
          supabase.from('emailove_slozky').update({ pocet_neprectenych: newCount }).eq('id', msg.folderId)
            .then(({ error: folderErr }) => { if (folderErr) console.error('Failed to persist folder unread count:', folderErr); });
        }).catch((e) => console.error('Failed to recount unread (markAsUnread):', e));
      }
    }
  },

  toggleFlagged: async (messageId) => {
    const msg = get().messages.find((m) => m.id === messageId);
    if (!msg) return;

    // IMAP flag sync (best-effort)
    if (msg.imapUid > 0) {
      const action: ImapAction = msg.flagged ? 'unsetFlagged' : 'setFlagged';
      callImapAction(action, messageId, msg.accountId).catch((e) => console.warn(`IMAP ${action} failed:`, e));
    }

    const supabase = createClient();
    const { error } = await supabase
      .from('emailove_zpravy')
      .update({ oznaceno: !msg.flagged })
      .eq('id', messageId);

    if (!error) {
      set({
        messages: get().messages.map((m) =>
          m.id === messageId ? { ...m, flagged: !m.flagged } : m
        ),
      });
    }
  },

  moveToFolder: async (messageId, targetFolderId) => {
    const msg = get().messages.find((m) => m.id === messageId);
    if (!msg) return;

    // IMAP move (blocking — if it fails, don't update DB)
    if (msg.imapUid > 0) {
      const imapResult = await callImapAction('move', messageId, msg.accountId, targetFolderId);
      if (!imapResult.success && !imapResult.skipped) {
        console.error('IMAP move failed:', imapResult.error);
        toast.error('Nepodařilo se přesunout zprávu');
        return;
      }
      // Update imap_uid if IMAP returned a new UID after move
      if (imapResult.newUid) {
        const sb = createClient();
        const { error: uidErr } = await sb.from('emailove_zpravy').update({ imap_uid: imapResult.newUid }).eq('id', messageId);
        if (uidErr) console.error(`Failed to update IMAP UID for ${messageId}:`, uidErr);
      }
    }

    const supabase = createClient();
    const { error } = await supabase
      .from('emailove_zpravy')
      .update({ id_slozky: targetFolderId })
      .eq('id', messageId);

    if (!error) {
      const oldFolderId = msg.folderId;
      // Remove from current view
      set({
        messages: get().messages.filter((m) => m.id !== messageId),
        selectedMessageId: get().selectedMessageId === messageId ? null : get().selectedMessageId,
      });
      // Update folder counts
      set({
        folders: get().folders.map((f) => {
          if (f.id === oldFolderId) {
            return {
              ...f,
              messageCount: Math.max(0, f.messageCount - 1),
              unreadCount: msg.read ? f.unreadCount : Math.max(0, f.unreadCount - 1),
            };
          }
          if (f.id === targetFolderId) {
            return {
              ...f,
              messageCount: f.messageCount + 1,
              unreadCount: msg.read ? f.unreadCount : f.unreadCount + 1,
            };
          }
          return f;
        }),
      });
    }
  },

  deleteMessage: async (messageId) => {
    const msg = get().messages.find((m) => m.id === messageId);
    if (!msg) return;

    // Find trash folder for this account
    const trashFolder = get().folders.find(
      (f) => f.accountId === msg.accountId && f.type === 'trash'
    );

    if (trashFolder && msg.folderId !== trashFolder.id) {
      // Soft delete — move to trash (IMAP move handled inside moveToFolder)
      await get().moveToFolder(messageId, trashFolder.id);
    } else {
      // Already in trash — hard delete
      // IMAP permanent delete (blocking)
      if (msg.imapUid > 0) {
        const imapResult = await callImapAction('delete', messageId, msg.accountId);
        if (!imapResult.success && !imapResult.skipped) {
          console.error('IMAP delete failed:', imapResult.error);
          toast.error('Nepodařilo se smazat zprávu');
          return;
        }
      }

      const supabase = createClient();
      const { error } = await supabase
        .from('emailove_zpravy')
        .delete()
        .eq('id', messageId);

      if (!error) {
        set({
          messages: get().messages.filter((m) => m.id !== messageId),
          selectedMessageId: get().selectedMessageId === messageId ? null : get().selectedMessageId,
        });
        set({
          folders: get().folders.map((f) =>
            f.id === msg.folderId
              ? {
                  ...f,
                  messageCount: Math.max(0, f.messageCount - 1),
                  unreadCount: msg.read ? f.unreadCount : Math.max(0, f.unreadCount - 1),
                }
              : f
          ),
        });
      }
    }
  },

  // =========================================================================
  // Composer
  // =========================================================================

  openComposer: (mode, replyTo) => set({
    composerOpen: true,
    composerMode: mode,
    composerReplyTo: replyTo ?? null,
  }),
  closeComposer: () => set({
    composerOpen: false,
    composerReplyTo: null,
  }),

  // =========================================================================
  // API routes
  // =========================================================================

  sendEmail: async (data) => {
    // Validate that the current user has send permission for this account
    const { useAuthStore } = await import('@/core/stores/auth-store');
    const currentUserId = useAuthStore.getState().currentUser?.id;

    if (currentUserId) {
      const access = get().accountAccess.find(
        (a) => a.accountId === data.accountId && a.employeeId === currentUserId
      );
      if (!access || !access.canSend) {
        toast.error('Nemáte oprávnění odesílat z tohoto účtu.');
        return { success: false, error: 'Nemáte oprávnění odesílat z tohoto účtu.' };
      }
    }

    try {
      const formData = new FormData();
      formData.append('accountId', data.accountId);
      formData.append('to', JSON.stringify(data.to));
      if (data.cc) formData.append('cc', JSON.stringify(data.cc));
      if (data.bcc) formData.append('bcc', JSON.stringify(data.bcc));
      formData.append('subject', data.subject);
      formData.append('bodyText', data.bodyText);
      if (data.bodyHtml) formData.append('bodyHtml', data.bodyHtml);
      if (data.inReplyTo) formData.append('inReplyTo', data.inReplyTo);
      if (data.threadId) formData.append('threadId', data.threadId);
      if (data.attachments) {
        for (const file of data.attachments) {
          formData.append('attachments', file);
        }
      }

      const res = await fetch('/api/email/send', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      return { success: json.success, error: json.error };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  },

  triggerSync: async (accountId) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);
    try {
      const res = await fetch('/api/email/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId, mode: 'incremental' }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const json = await res.json();
      if (json.success) {
        // Refetch data after sync
        await get().fetchEmailData();
        const { selectedAccountId, selectedFolderId } = get();
        if (selectedAccountId && selectedFolderId) {
          await get().fetchMessages(selectedAccountId, selectedFolderId);
        }
      }
      return { success: json.success, error: json.error };
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof DOMException && err.name === 'AbortError') {
        return { success: false, error: 'Synchronizace trvala příliš dlouho' };
      }
      return { success: false, error: String(err) };
    }
  },

  triggerInitialSync: async (accountId) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 600000);
    try {
      const res = await fetch('/api/email/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId, mode: 'initial' }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const json = await res.json();
      if (json.success) {
        await get().fetchEmailData();
      }
      return { success: json.success, error: json.error, logId: json.logId };
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof DOMException && err.name === 'AbortError') {
        return { success: false, error: 'Synchronizace trvala příliš dlouho (timeout 10 min)' };
      }
      return { success: false, error: String(err) };
    }
  },

  triggerBackfill: async (accountId, folderId?) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);
    try {
      const res = await fetch('/api/email/backfill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId, folderId }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const json = await res.json();
      return { success: json.success, processed: json.processed, remaining: json.remaining, error: json.error };
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof DOMException && err.name === 'AbortError') {
        return { success: false, error: 'Synchronizace trvala příliš dlouho' };
      }
      return { success: false, error: String(err) };
    }
  },

  // =========================================================================
  // Rules
  // =========================================================================

  createRule: async (rule) => {
    const id = `rule-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const fullRule: EmailRule = { ...rule, id, createdAt: now, updatedAt: now };

    const dbData = mapEmailRuleToDb(fullRule);
    dbData.vytvoreno = now;
    dbData.aktualizovano = now;

    const supabase = createClient();
    const { error } = await supabase.from('emailova_pravidla').insert(dbData);

    if (!error) {
      set({ rules: [...get().rules, fullRule] });
    } else {
      console.error('Failed to create rule:', error);
      toast.error('Nepodařilo se vytvořit pravidlo');
    }
  },

  updateRule: async (ruleId, updates) => {
    const now = new Date().toISOString();
    const dbData = mapEmailRuleToDb({ ...updates, id: ruleId });
    delete dbData.id;
    dbData.aktualizovano = now;

    const supabase = createClient();
    const { error } = await supabase
      .from('emailova_pravidla')
      .update(dbData)
      .eq('id', ruleId);

    if (!error) {
      set({
        rules: get().rules.map((r) =>
          r.id === ruleId ? { ...r, ...updates, updatedAt: now } : r
        ),
      });
    }
  },

  deleteRule: async (ruleId) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('emailova_pravidla')
      .delete()
      .eq('id', ruleId);

    if (!error) {
      set({ rules: get().rules.filter((r) => r.id !== ruleId) });
    }
  },

  // =========================================================================
  // Realtime & auto-sync
  // =========================================================================

  subscribeRealtime: () => {
    // Unsubscribe existing channel first
    get()._realtimeChannel?.unsubscribe();

    const supabase = createClient();
    const accountIds = get().accounts.map((a) => a.id);
    if (accountIds.length === 0) return;

    const channel = supabase
      .channel('email-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'emailove_zpravy',
          filter: `id_uctu=in.(${accountIds.join(',')})`,
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          const selectedFolderId = get().selectedFolderId;

          if (payload.eventType === 'INSERT') {
            const newMsg = mapDbToEmailMessage({ ...payload.new, telo_text: null, telo_html: null });
            // Only add to messages list if it's in the currently viewed folder
            if (newMsg.folderId === selectedFolderId) {
              const exists = get().messages.some((m) => m.id === newMsg.id);
              if (!exists) {
                set({ messages: [newMsg, ...get().messages] });
              }
            }
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new;
            set({
              messages: get().messages.map((m) => {
                if (m.id !== updated.id) return m;
                return {
                  ...m,
                  read: updated.precteno ?? m.read,
                  flagged: updated.oznaceno ?? m.flagged,
                  folderId: updated.id_slozky ?? m.folderId,
                };
              }),
            });
            // If message moved to a different folder, remove from view
            if (updated.id_slozky && updated.id_slozky !== selectedFolderId) {
              set({
                messages: get().messages.filter((m) => m.id !== updated.id),
              });
            }
          } else if (payload.eventType === 'DELETE') {
            const oldId = payload.old?.id;
            if (oldId) {
              set({
                messages: get().messages.filter((m) => m.id !== oldId),
              });
            }
          }
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'emailove_slozky',
          filter: `id_uctu=in.(${accountIds.join(',')})`,
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          const updated = payload.new;
          set({
            folders: get().folders.map((f) => {
              if (f.id !== updated.id) return f;
              return {
                ...f,
                messageCount: updated.pocet_zprav ?? f.messageCount,
                unreadCount: updated.pocet_neprectenych ?? f.unreadCount,
              };
            }),
          });
        },
      )
      .subscribe((status, err) => {
        if (err) console.error('[email-realtime]', status, err);
        // Re-fetch data after reconnect to catch missed events
        if (status === 'SUBSCRIBED' && get()._loaded) {
          const { selectedAccountId, selectedFolderId } = get();
          if (selectedAccountId && selectedFolderId) {
            get().fetchMessages(selectedAccountId, selectedFolderId);
          }
          // Refresh folders (unread counts etc.)
          const supabaseRefresh = createClient();
          Promise.resolve(supabaseRefresh.from('emailove_slozky').select('*').order('poradi')).then(({ data }) => {
            if (data) {
              set({ folders: data.map(mapDbToEmailFolder) });
            }
          }).catch((err) => {
            console.error('[email-realtime] reconnect folder refresh failed:', err);
          });
        }
      });

    set({ _realtimeChannel: channel });
  },

  unsubscribeRealtime: () => {
    get()._realtimeChannel?.unsubscribe();
    set({ _realtimeChannel: null });
  },

  startAutoSync: () => {
    // Clear any existing interval
    const existing = get()._autoSyncInterval;
    if (existing) clearInterval(existing);

    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        const accounts = get().accounts;
        accounts.forEach((acc) => get().triggerSync(acc.id));
      }
    }, 60_000);

    set({ _autoSyncInterval: interval });
  },

  stopAutoSync: () => {
    const interval = get()._autoSyncInterval;
    if (interval) clearInterval(interval);
    set({ _autoSyncInterval: null });
  },

  // =========================================================================
  // Getters
  // =========================================================================

  getAccountsForUser: (userId) => {
    const accessibleAccountIds = get().accountAccess
      .filter((a) => a.employeeId === userId)
      .map((a) => a.accountId);
    return get().accounts.filter(
      (acc) => acc.active && accessibleAccountIds.includes(acc.id)
    );
  },

  getFoldersForAccount: (accountId) => {
    return get().folders
      .filter((f) => f.accountId === accountId)
      .sort((a, b) => a.order - b.order);
  },

  getUnreadCountForUser: (userId) => {
    const accountIds = get().accountAccess
      .filter((a) => a.employeeId === userId)
      .map((a) => a.accountId);
    return get().folders
      .filter((f) => accountIds.includes(f.accountId) && f.type === 'inbox')
      .reduce((sum, f) => sum + f.unreadCount, 0);
  },

  getSelectedMessage: () => {
    const id = get().selectedMessageId;
    return id ? get().messages.find((m) => m.id === id) : undefined;
  },

  getRulesForAccount: (accountId) => {
    return get().rules
      .filter((r) => r.accountId === accountId)
      .sort((a, b) => a.order - b.order);
  },
}));

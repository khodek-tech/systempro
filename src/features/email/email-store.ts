import { create } from 'zustand';
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

const PAGE_SIZE = 50;

interface EmailState {
  accounts: EmailAccount[];
  accountAccess: EmailAccountAccess[];
  folders: EmailFolder[];
  messages: EmailMessage[];
  rules: EmailRule[];
  _loaded: boolean;
  _loading: boolean;
  _messagesLoading: boolean;

  // View state
  emailViewMode: 'card' | 'view';
  selectedAccountId: string | null;
  selectedFolderId: string | null;
  selectedMessageId: string | null;
  composerOpen: boolean;
  composerMode: 'new' | 'reply' | 'replyAll' | 'forward';
  composerReplyTo: EmailMessage | null;
  searchQuery: string;

  // Pagination
  messagesPage: number;
  messagesTotal: number;
  messagesHasMore: boolean;
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
  loadMoreMessages: () => Promise<void>;

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

  emailViewMode: 'card',
  selectedAccountId: null,
  selectedFolderId: null,
  selectedMessageId: null,
  composerOpen: false,
  composerMode: 'new',
  composerReplyTo: null,
  searchQuery: '',

  messagesPage: 0,
  messagesTotal: 0,
  messagesHasMore: false,

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
      const mapped = data.map((row) => mapDbToEmailMessage({ ...row, telo_text: null, telo_html: null }));
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
        await supabase.from('emailove_slozky').update({ pocet_neprectenych: unreadCount }).eq('id', folderId);
      }
    } else {
      console.error('Failed to fetch messages:', error);
      set({ _messagesLoading: false });
    }
  },

  fetchMessageBody: async (messageId: string) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('emailove_zpravy')
      .select('telo_text, telo_html')
      .eq('id', messageId)
      .single();

    if (!error && data) {
      set({
        messages: get().messages.map((m) =>
          m.id === messageId
            ? { ...m, bodyText: data.telo_text ?? '', bodyHtml: data.telo_html ?? '' }
            : m
        ),
      });
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
    composerOpen: false,
    searchQuery: '',
  }),

  selectAccount: (accountId) => {
    set({
      selectedAccountId: accountId,
      selectedFolderId: null,
      selectedMessageId: null,
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

  loadMoreMessages: async () => {
    const { selectedAccountId, selectedFolderId, messagesPage, messagesHasMore, _messagesLoading } = get();
    if (!selectedAccountId || !selectedFolderId || !messagesHasMore || _messagesLoading) return;
    await get().fetchMessages(selectedAccountId, selectedFolderId, messagesPage + 1);
  },

  // =========================================================================
  // Message actions
  // =========================================================================

  markAsRead: async (messageId) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('emailove_zpravy')
      .update({ precteno: true })
      .eq('id', messageId);

    if (!error) {
      const msg = get().messages.find((m) => m.id === messageId);
      if (msg) {
        // Recount unread from DB and persist to folder
        const { count } = await supabase
          .from('emailove_zpravy')
          .select('id', { count: 'exact', head: true })
          .eq('id_slozky', msg.folderId)
          .eq('precteno', false);
        const newCount = count ?? 0;
        await supabase.from('emailove_slozky').update({ pocet_neprectenych: newCount }).eq('id', msg.folderId);
        set({
          messages: get().messages.map((m) => m.id === messageId ? { ...m, read: true } : m),
          folders: get().folders.map((f) => f.id === msg.folderId ? { ...f, unreadCount: newCount } : f),
        });
      } else {
        set({
          messages: get().messages.map((m) => m.id === messageId ? { ...m, read: true } : m),
        });
      }
    }
  },

  markAsUnread: async (messageId) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('emailove_zpravy')
      .update({ precteno: false })
      .eq('id', messageId);

    if (!error) {
      const msg = get().messages.find((m) => m.id === messageId);
      if (msg) {
        // Recount unread from DB and persist to folder
        const { count } = await supabase
          .from('emailove_zpravy')
          .select('id', { count: 'exact', head: true })
          .eq('id_slozky', msg.folderId)
          .eq('precteno', false);
        const newCount = count ?? 0;
        await supabase.from('emailove_slozky').update({ pocet_neprectenych: newCount }).eq('id', msg.folderId);
        set({
          messages: get().messages.map((m) => m.id === messageId ? { ...m, read: false } : m),
          folders: get().folders.map((f) => f.id === msg.folderId ? { ...f, unreadCount: newCount } : f),
        });
      } else {
        set({
          messages: get().messages.map((m) => m.id === messageId ? { ...m, read: false } : m),
        });
      }
    }
  },

  toggleFlagged: async (messageId) => {
    const msg = get().messages.find((m) => m.id === messageId);
    if (!msg) return;

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
      // Soft delete — move to trash
      await get().moveToFolder(messageId, trashFolder.id);
    } else {
      // Already in trash — hard delete
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

import { create } from 'zustand';
import type { RealtimeChannel } from '@supabase/supabase-js';
import {
  ChatGroup,
  ChatMessage,
  ChatReadStatus,
  ChatReactionType,
  ChatAttachment,
} from '@/shared/types';
import { createClient } from '@/lib/supabase/client';
import {
  mapDbToChatGroup,
  mapChatGroupToDb,
  mapDbToChatMessage,
  mapChatMessageToDb,
  mapDbToChatReadStatus,
  mapChatReadStatusToDb,
} from '@/lib/supabase/mappers';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { getLastMessageInGroup, sortGroupsByLastMessage } from './chat-helpers';

interface ChatState {
  groups: ChatGroup[];
  messages: ChatMessage[];
  readStatuses: ChatReadStatus[];
  _loaded: boolean;
  _loading: boolean;
  chatViewMode: 'card' | 'view';
  selectedGroupId: string | null;
  searchQuery: string;
  isGroupFormOpen: boolean;
  editingGroupId: string | null;
  _realtimeChannel: RealtimeChannel | null;
  _autoSyncInterval: ReturnType<typeof setInterval> | null;
}

interface ChatActions {
  // Fetch
  fetchChatData: () => Promise<void>;

  // View mode actions
  openChatView: () => void;
  closeChatView: () => void;
  selectGroup: (groupId: string | null) => void;
  setSearchQuery: (query: string) => void;

  // Message actions
  sendMessage: (
    groupId: string,
    userId: string,
    text: string,
    attachments?: ChatAttachment[]
  ) => Promise<void>;
  addReaction: (messageId: string, userId: string, reactionType: ChatReactionType) => Promise<void>;
  removeReaction: (messageId: string, userId: string, reactionType: ChatReactionType) => Promise<void>;

  // Read status actions
  markGroupAsRead: (groupId: string, userId: string) => Promise<void>;

  // Group management actions (admin)
  openGroupForm: (groupId?: string) => void;
  closeGroupForm: () => void;
  createGroup: (name: string, memberIds: string[], createdBy: string) => Promise<void>;
  updateGroup: (groupId: string, updates: Partial<Pick<ChatGroup, 'name' | 'memberIds'>>) => Promise<void>;
  deleteGroup: (groupId: string) => Promise<void>;

  // Realtime
  subscribeRealtime: () => void;
  unsubscribeRealtime: () => void;

  // Auto-sync
  startAutoSync: () => void;
  stopAutoSync: () => void;

  // Getters
  getGroupsForUser: (userId: string) => ChatGroup[];
  getMessagesForGroup: (groupId: string) => ChatMessage[];
  getUnreadCountForUser: (userId: string) => number;
  getUnreadCountForGroup: (groupId: string, userId: string) => number;
  getGroupById: (groupId: string) => ChatGroup | undefined;
}

export const useChatStore = create<ChatState & ChatActions>()((set, get) => ({
  // Initial state
  groups: [],
  messages: [],
  readStatuses: [],
  _loaded: false,
  _loading: false,
  chatViewMode: 'card',
  selectedGroupId: null,
  searchQuery: '',
  isGroupFormOpen: false,
  editingGroupId: null,
  _realtimeChannel: null,
  _autoSyncInterval: null,

  // Fetch
  fetchChatData: async () => {
    set({ _loading: true });
    const supabase = createClient();

    const [groupsResult, messagesResult, readStatusResult] = await Promise.all([
      supabase.from('chat_skupiny').select('*'),
      supabase.from('chat_zpravy').select('*'),
      supabase.from('chat_stav_precteni').select('*'),
    ]);

    if (!groupsResult.error && groupsResult.data &&
        !messagesResult.error && messagesResult.data &&
        !readStatusResult.error && readStatusResult.data) {
      set({
        groups: groupsResult.data.map(mapDbToChatGroup),
        messages: messagesResult.data.map(mapDbToChatMessage),
        readStatuses: readStatusResult.data.map(mapDbToChatReadStatus),
        _loaded: true,
        _loading: false,
      });
    } else {
      logger.error('Failed to fetch chat data');
      set({ _loading: false });
    }
  },

  // View mode actions
  openChatView: () => set({ chatViewMode: 'view' }),
  closeChatView: () => set({ chatViewMode: 'card', selectedGroupId: null, searchQuery: '' }),

  selectGroup: (groupId) => set({ selectedGroupId: groupId }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  // Message actions
  sendMessage: async (groupId, userId, text, attachments = []) => {
    const newMessage: ChatMessage = {
      id: `msg-${crypto.randomUUID()}`,
      groupId,
      userId,
      text,
      attachments,
      reactions: [],
      createdAt: new Date().toISOString(),
    };

    const dbData = mapChatMessageToDb(newMessage);
    const supabase = createClient();
    const { error } = await supabase.from('chat_zpravy').insert(dbData);
    if (error) {
      logger.error('Failed to send message');
      toast.error('Nepodařilo se odeslat zprávu');
      return;
    }

    set((state) => ({
      messages: [...state.messages, newMessage],
    }));

    // Mark as read for sender
    await get().markGroupAsRead(groupId, userId);
  },

  addReaction: async (messageId, userId, reactionType) => {
    const { messages } = get();
    const msg = messages.find((m) => m.id === messageId);
    if (!msg) return;

    // Check if user already has this reaction
    const existingReaction = msg.reactions.find(
      (r) => r.userId === userId && r.type === reactionType
    );
    if (existingReaction) return;

    const updatedReactions = [
      ...msg.reactions,
      {
        type: reactionType,
        userId,
        createdAt: new Date().toISOString(),
      },
    ];

    const supabase = createClient();
    const { error } = await supabase.from('chat_zpravy').update({ reakce: updatedReactions }).eq('id', messageId);
    if (error) {
      logger.error('Failed to add reaction');
      return;
    }

    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId ? { ...m, reactions: updatedReactions } : m
      ),
    }));
  },

  removeReaction: async (messageId, userId, reactionType) => {
    const { messages } = get();
    const msg = messages.find((m) => m.id === messageId);
    if (!msg) return;

    const updatedReactions = msg.reactions.filter(
      (r) => !(r.userId === userId && r.type === reactionType)
    );

    const supabase = createClient();
    const { error } = await supabase.from('chat_zpravy').update({ reakce: updatedReactions }).eq('id', messageId);
    if (error) {
      logger.error('Failed to remove reaction');
      return;
    }

    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId ? { ...m, reactions: updatedReactions } : m
      ),
    }));
  },

  // Read status actions
  markGroupAsRead: async (groupId, userId) => {
    const { messages } = get();
    const lastMessage = getLastMessageInGroup(groupId, messages);

    if (!lastMessage) return;

    const readStatus: ChatReadStatus = {
      groupId,
      userId,
      lastReadMessageId: lastMessage.id,
      lastReadAt: new Date().toISOString(),
    };

    const dbData = mapChatReadStatusToDb(readStatus);
    const supabase = createClient();
    const { error } = await supabase.from('chat_stav_precteni').upsert(dbData, {
      onConflict: 'id_skupiny,id_uzivatele',
    });
    if (error) {
      logger.error('Failed to mark group as read');
      return;
    }

    const { readStatuses } = get();
    const existingStatus = readStatuses.find(
      (s) => s.groupId === groupId && s.userId === userId
    );

    if (existingStatus) {
      set((state) => ({
        readStatuses: state.readStatuses.map((s) =>
          s.groupId === groupId && s.userId === userId
            ? { ...s, lastReadMessageId: lastMessage.id, lastReadAt: readStatus.lastReadAt }
            : s
        ),
      }));
    } else {
      set((state) => ({
        readStatuses: [...state.readStatuses, readStatus],
      }));
    }
  },

  // Group management actions
  openGroupForm: (groupId) =>
    set({ isGroupFormOpen: true, editingGroupId: groupId || null }),

  closeGroupForm: () => set({ isGroupFormOpen: false, editingGroupId: null }),

  createGroup: async (name, memberIds, createdBy) => {
    const newGroup: ChatGroup = {
      id: `group-${crypto.randomUUID()}`,
      name,
      memberIds,
      createdAt: new Date().toISOString(),
      createdBy,
    };

    const dbData = mapChatGroupToDb(newGroup);
    const supabase = createClient();
    const { error } = await supabase.from('chat_skupiny').insert(dbData);
    if (error) {
      logger.error('Failed to create group');
      toast.error('Nepodařilo se vytvořit skupinu');
      return;
    }

    set((state) => ({
      groups: [...state.groups, newGroup],
      isGroupFormOpen: false,
      editingGroupId: null,
    }));
  },

  updateGroup: async (groupId, updates) => {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) dbUpdates.nazev = updates.name;
    if (updates.memberIds !== undefined) dbUpdates.id_clenu = updates.memberIds;

    const supabase = createClient();
    const { error } = await supabase.from('chat_skupiny').update(dbUpdates).eq('id', groupId);
    if (error) {
      logger.error('Failed to update group');
      toast.error('Nepodařilo se upravit skupinu');
      return;
    }

    set((state) => ({
      groups: state.groups.map((g) =>
        g.id === groupId ? { ...g, ...updates } : g
      ),
      isGroupFormOpen: false,
      editingGroupId: null,
    }));
  },

  deleteGroup: async (groupId) => {
    const supabase = createClient();

    // CASCADE DELETE handles messages and read statuses automatically
    const { error } = await supabase.from('chat_skupiny').delete().eq('id', groupId);
    if (error) {
      logger.error('Failed to delete group');
      toast.error('Nepodařilo se smazat skupinu');
      return;
    }

    set((state) => ({
      groups: state.groups.filter((g) => g.id !== groupId),
      messages: state.messages.filter((m) => m.groupId !== groupId),
      readStatuses: state.readStatuses.filter((s) => s.groupId !== groupId),
      selectedGroupId:
        state.selectedGroupId === groupId ? null : state.selectedGroupId,
    }));
  },

  // Realtime
  subscribeRealtime: () => {
    get()._realtimeChannel?.unsubscribe();

    const supabase = createClient();

    const channel = supabase
      .channel('chat-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_zpravy',
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          const newMsg = mapDbToChatMessage(payload.new);
          const exists = get().messages.some((m) => m.id === newMsg.id);
          if (!exists) {
            set({ messages: [...get().messages, newMsg] });
          }
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_zpravy',
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          const updated = mapDbToChatMessage(payload.new);
          set({
            messages: get().messages.map((m) =>
              m.id === updated.id ? { ...m, ...updated } : m,
            ),
          });
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_stav_precteni',
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const updated = mapDbToChatReadStatus(payload.new);
            const existing = get().readStatuses.find(
              (s) => s.groupId === updated.groupId && s.userId === updated.userId,
            );
            if (existing) {
              set({
                readStatuses: get().readStatuses.map((s) =>
                  s.groupId === updated.groupId && s.userId === updated.userId ? updated : s,
                ),
              });
            } else {
              set({ readStatuses: [...get().readStatuses, updated] });
            }
          }
        },
      )
      .subscribe((status, err) => {
        if (err) logger.error(`[chat-realtime] ${status}`);
        // Re-fetch data after reconnect to catch missed events
        if (status === 'SUBSCRIBED' && get()._loaded) {
          const supabaseRefresh = createClient();
          Promise.all([
            supabaseRefresh.from('chat_zpravy').select('*'),
            supabaseRefresh.from('chat_stav_precteni').select('*'),
          ]).then(([msgsResult, readResult]) => {
            if (!msgsResult.error && msgsResult.data) {
              const freshMessages = msgsResult.data.map(mapDbToChatMessage);
              const current = get().messages;
              // Merge: keep local messages, add any missing from DB
              const currentIds = new Set(current.map((m) => m.id));
              const newMessages = freshMessages.filter((m) => !currentIds.has(m.id));
              if (newMessages.length > 0) {
                set({ messages: [...current, ...newMessages] });
              }
            }
            if (!readResult.error && readResult.data) {
              set({ readStatuses: readResult.data.map(mapDbToChatReadStatus) });
            }
          }).catch(() => {
            logger.error('[chat-realtime] reconnect refresh failed');
          });
        }
      });

    set({ _realtimeChannel: channel });
  },

  unsubscribeRealtime: () => {
    get()._realtimeChannel?.unsubscribe();
    set({ _realtimeChannel: null });
  },

  // Auto-sync
  startAutoSync: () => {
    const existing = get()._autoSyncInterval;
    if (existing) clearInterval(existing);

    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        const supabase = createClient();
        Promise.all([
          supabase.from('chat_zpravy').select('*'),
          supabase.from('chat_stav_precteni').select('*'),
        ]).then(([msgsResult, readResult]) => {
          if (!msgsResult.error && msgsResult.data) {
            const freshMessages = msgsResult.data.map(mapDbToChatMessage);
            const current = get().messages;
            const currentIds = new Set(current.map((m) => m.id));
            const newMessages = freshMessages.filter((m) => !currentIds.has(m.id));
            if (newMessages.length > 0) {
              set({ messages: [...current, ...newMessages] });
            }
            // Also update existing messages (e.g. reactions)
            const updatedMessages = freshMessages.filter(
              (m) => currentIds.has(m.id),
            );
            if (updatedMessages.length > 0) {
              const freshMap = new Map(updatedMessages.map((m) => [m.id, m]));
              set({
                messages: get().messages.map((m) => freshMap.get(m.id) ?? m),
              });
            }
          }
          if (!readResult.error && readResult.data) {
            set({ readStatuses: readResult.data.map(mapDbToChatReadStatus) });
          }
        }).catch(() => {
          logger.error('[chat-autosync] refresh failed');
        });
      }
    }, 15_000);

    set({ _autoSyncInterval: interval });
  },

  stopAutoSync: () => {
    const interval = get()._autoSyncInterval;
    if (interval) clearInterval(interval);
    set({ _autoSyncInterval: null });
  },

  // Getters
  getGroupsForUser: (userId) => {
    const { groups, messages } = get();
    const userGroups = groups.filter((g) => g.memberIds.includes(userId));
    return sortGroupsByLastMessage(userGroups, messages);
  },

  getMessagesForGroup: (groupId) => {
    const { messages, searchQuery } = get();
    let groupMessages = messages.filter((m) => m.groupId === groupId);

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      groupMessages = groupMessages.filter((m) =>
        m.text.toLowerCase().includes(query)
      );
    }

    return groupMessages.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  },

  getUnreadCountForUser: (userId) => {
    const { groups, messages, readStatuses } = get();
    let totalUnread = 0;

    const userGroups = groups.filter((g) => g.memberIds.includes(userId));

    for (const group of userGroups) {
      const groupMessages = messages.filter(
        (m) => m.groupId === group.id && m.userId !== userId
      );
      const readStatus = readStatuses.find(
        (s) => s.groupId === group.id && s.userId === userId
      );

      if (!readStatus) {
        totalUnread += groupMessages.length;
      } else {
        const lastReadTime = new Date(readStatus.lastReadAt).getTime();
        totalUnread += groupMessages.filter(
          (m) => new Date(m.createdAt).getTime() > lastReadTime
        ).length;
      }
    }

    return totalUnread;
  },

  getUnreadCountForGroup: (groupId, userId) => {
    const { messages, readStatuses } = get();
    const groupMessages = messages.filter(
      (m) => m.groupId === groupId && m.userId !== userId
    );

    const readStatus = readStatuses.find(
      (s) => s.groupId === groupId && s.userId === userId
    );

    if (!readStatus) {
      return groupMessages.length;
    }

    const lastReadTime = new Date(readStatus.lastReadAt).getTime();
    return groupMessages.filter(
      (m) => new Date(m.createdAt).getTime() > lastReadTime
    ).length;
  },

  getGroupById: (groupId) => {
    return get().groups.find((g) => g.id === groupId);
  },
}));

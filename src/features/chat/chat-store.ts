import { create } from 'zustand';
import type { RealtimeChannel } from '@supabase/supabase-js';
import {
  ChatGroup,
  ChatMessage,
  ChatReadStatus,
  ChatReactionType,
  ChatAttachment,
  ChatGroupSummary,
  ChatGroupPaginationState,
  ChatSearchResult,
} from '@/shared/types';
import { createClient } from '@/lib/supabase/client';
import {
  mapDbToChatGroup,
  mapChatGroupToDb,
  mapDbToChatMessage,
  mapChatMessageToDb,
  mapDbToChatReadStatus,
  mapChatReadStatusToDb,
  mapDbToChatGroupSummary,
  mapDbToChatSearchResult,
} from '@/lib/supabase/mappers';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { useAuthStore } from '@/core/stores/auth-store';
import { getAdminRoleId } from '@/core/stores/store-helpers';
import { sortGroupsBySummary } from './chat-helpers';

const MESSAGES_PAGE_SIZE = 50;

let _chatVisibilityHandler: (() => void) | null = null;
let _searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

interface ChatState {
  groups: ChatGroup[];
  groupMessages: Record<string, ChatGroupPaginationState>;
  groupSummaries: Record<string, ChatGroupSummary>;
  readStatuses: ChatReadStatus[];
  _loaded: boolean;
  _loading: boolean;
  chatViewMode: 'card' | 'view';
  selectedGroupId: string | null;
  groupFilterQuery: string;
  messageSearchQuery: string;
  messageSearchResults: ChatSearchResult[];
  messageSearchLoading: boolean;
  isGroupFormOpen: boolean;
  editingGroupId: string | null;
  isNewDmOpen: boolean;
  replyingToMessageId: string | null;
  _realtimeChannel: RealtimeChannel | null;
  _autoSyncInterval: ReturnType<typeof setInterval> | null;
}

interface ChatActions {
  // Fetch
  fetchChatData: () => Promise<void>;
  fetchGroupSummaries: () => Promise<void>;
  fetchMessagesForGroup: (groupId: string) => Promise<void>;
  loadOlderMessages: (groupId: string) => Promise<void>;

  // View mode actions
  openChatView: () => void;
  closeChatView: () => void;
  selectGroup: (groupId: string | null) => void;
  setGroupFilterQuery: (query: string) => void;

  // Search
  searchMessages: (query: string) => void;
  clearMessageSearch: () => void;
  navigateToSearchResult: (result: ChatSearchResult) => Promise<void>;

  // Message actions
  sendMessage: (
    groupId: string,
    userId: string,
    text: string,
    attachments?: ChatAttachment[],
    replyToMessageId?: string | null
  ) => Promise<void>;
  setReplyingTo: (messageId: string | null) => void;
  deleteMessage: (messageId: string) => Promise<void>;
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

  // Direct messages
  openNewDm: () => void;
  closeNewDm: () => void;
  startDirectMessage: (otherUserId: string) => Promise<void>;
  getDirectGroupWith: (otherUserId: string) => ChatGroup | undefined;

  // Realtime
  subscribeRealtime: () => void;
  unsubscribeRealtime: () => void;

  // Auto-sync polling
  startAutoSync: () => void;
  stopAutoSync: () => void;

  // Getters
  getGroupsForUser: (userId: string) => ChatGroup[];
  getMessagesForGroup: (groupId: string) => ChatMessage[];
  getUnreadCountForUser: (userId: string) => number;
  getUnreadCountForGroup: (groupId: string) => number;
  getGroupById: (groupId: string) => ChatGroup | undefined;
}

/**
 * Helper: find a message across all loaded group messages
 */
function findMessageInGroups(
  groupMessages: Record<string, ChatGroupPaginationState>,
  messageId: string,
): ChatMessage | undefined {
  for (const state of Object.values(groupMessages)) {
    const found = state.messages.find((m) => m.id === messageId);
    if (found) return found;
  }
  return undefined;
}

/**
 * Helper: update messages in a specific group's pagination state
 */
function updateGroupMessages(
  groupMessages: Record<string, ChatGroupPaginationState>,
  groupId: string,
  updater: (messages: ChatMessage[]) => ChatMessage[],
): Record<string, ChatGroupPaginationState> {
  const state = groupMessages[groupId];
  if (!state) return groupMessages;
  return {
    ...groupMessages,
    [groupId]: { ...state, messages: updater(state.messages) },
  };
}

export const useChatStore = create<ChatState & ChatActions>()((set, get) => ({
  // Initial state
  groups: [],
  groupMessages: {},
  groupSummaries: {},
  readStatuses: [],
  _loaded: false,
  _loading: false,
  chatViewMode: 'card',
  selectedGroupId: null,
  groupFilterQuery: '',
  messageSearchQuery: '',
  messageSearchResults: [],
  messageSearchLoading: false,
  isGroupFormOpen: false,
  editingGroupId: null,
  isNewDmOpen: false,
  replyingToMessageId: null,
  _realtimeChannel: null,
  _autoSyncInterval: null,

  // Fetch — loads groups, read statuses, and summaries (NOT all messages)
  fetchChatData: async () => {
    set({ _loading: true });
    const supabase = createClient();

    const [groupsResult, readStatusResult] = await Promise.all([
      supabase.from('chat_skupiny').select('*'),
      supabase.from('chat_stav_precteni').select('*'),
    ]);

    if (!groupsResult.error && groupsResult.data &&
        !readStatusResult.error && readStatusResult.data) {
      set({
        groups: groupsResult.data.map(mapDbToChatGroup),
        readStatuses: readStatusResult.data.map(mapDbToChatReadStatus),
        _loaded: true,
        _loading: false,
      });
      // Fetch summaries separately (uses RPC)
      await get().fetchGroupSummaries();
    } else {
      logger.error('Failed to fetch chat data');
      set({ _loading: false });
    }
  },

  fetchGroupSummaries: async () => {
    const currentUser = useAuthStore.getState().currentUser;
    if (!currentUser) return;

    const supabase = createClient();
    const { data, error } = await supabase.rpc('get_chat_group_summaries', {
      p_user_id: currentUser.id,
    });

    if (error) {
      logger.error('Failed to fetch group summaries');
      return;
    }

    if (data) {
      const summaries: Record<string, ChatGroupSummary> = {};
      for (const row of data) {
        const summary = mapDbToChatGroupSummary(row);
        summaries[summary.groupId] = summary;
      }
      set({ groupSummaries: summaries });
    }
  },

  fetchMessagesForGroup: async (groupId) => {
    const existing = get().groupMessages[groupId];
    if (existing?.loading) return;

    set((state) => ({
      groupMessages: {
        ...state.groupMessages,
        [groupId]: {
          messages: existing?.messages || [],
          hasMore: existing?.hasMore ?? true,
          loading: true,
          oldestLoadedAt: existing?.oldestLoadedAt ?? null,
        },
      },
    }));

    const supabase = createClient();
    const { data, error } = await supabase
      .from('chat_zpravy')
      .select('*')
      .eq('id_skupiny', groupId)
      .order('vytvoreno', { ascending: false })
      .limit(MESSAGES_PAGE_SIZE);

    if (error) {
      logger.error('Failed to fetch messages for group');
      set((state) => ({
        groupMessages: {
          ...state.groupMessages,
          [groupId]: {
            messages: existing?.messages || [],
            hasMore: false,
            loading: false,
            oldestLoadedAt: existing?.oldestLoadedAt ?? null,
          },
        },
      }));
      return;
    }

    const messages = (data || []).map(mapDbToChatMessage).reverse(); // ASC order
    const hasMore = (data || []).length >= MESSAGES_PAGE_SIZE;
    const oldestLoadedAt = messages.length > 0 ? messages[0].createdAt : null;

    set((state) => ({
      groupMessages: {
        ...state.groupMessages,
        [groupId]: { messages, hasMore, loading: false, oldestLoadedAt },
      },
    }));
  },

  loadOlderMessages: async (groupId) => {
    const state = get().groupMessages[groupId];
    if (!state || state.loading || !state.hasMore || !state.oldestLoadedAt) return;

    set((s) => ({
      groupMessages: {
        ...s.groupMessages,
        [groupId]: { ...state, loading: true },
      },
    }));

    const supabase = createClient();
    const { data, error } = await supabase
      .from('chat_zpravy')
      .select('*')
      .eq('id_skupiny', groupId)
      .lt('vytvoreno', state.oldestLoadedAt)
      .order('vytvoreno', { ascending: false })
      .limit(MESSAGES_PAGE_SIZE);

    if (error) {
      logger.error('Failed to load older messages');
      set((s) => ({
        groupMessages: {
          ...s.groupMessages,
          [groupId]: { ...state, loading: false },
        },
      }));
      return;
    }

    const olderMessages = (data || []).map(mapDbToChatMessage).reverse();
    const hasMore = (data || []).length >= MESSAGES_PAGE_SIZE;
    const oldestLoadedAt = olderMessages.length > 0
      ? olderMessages[0].createdAt
      : state.oldestLoadedAt;

    set((s) => {
      const current = s.groupMessages[groupId];
      return {
        groupMessages: {
          ...s.groupMessages,
          [groupId]: {
            messages: [...olderMessages, ...(current?.messages || [])],
            hasMore,
            loading: false,
            oldestLoadedAt,
          },
        },
      };
    });
  },

  // View mode actions
  openChatView: () => set({ chatViewMode: 'view' }),
  closeChatView: () => set({
    chatViewMode: 'card',
    selectedGroupId: null,
    groupFilterQuery: '',
    messageSearchQuery: '',
    messageSearchResults: [],
  }),

  selectGroup: (groupId) => {
    set({ selectedGroupId: groupId, messageSearchQuery: '', messageSearchResults: [] });

    if (groupId) {
      // Lazy-load messages if not already loaded
      const existing = get().groupMessages[groupId];
      if (!existing) {
        get().fetchMessagesForGroup(groupId);
      }

      // Mark as read immediately
      const currentUser = useAuthStore.getState().currentUser;
      if (currentUser) {
        get().markGroupAsRead(groupId, currentUser.id);
      }
    }
  },

  setGroupFilterQuery: (query) => set({ groupFilterQuery: query }),

  // Search
  searchMessages: (query) => {
    set({ messageSearchQuery: query });

    if (_searchDebounceTimer) clearTimeout(_searchDebounceTimer);

    if (!query.trim()) {
      set({ messageSearchResults: [], messageSearchLoading: false });
      return;
    }

    set({ messageSearchLoading: true });

    _searchDebounceTimer = setTimeout(async () => {
      const currentUser = useAuthStore.getState().currentUser;
      if (!currentUser) {
        set({ messageSearchLoading: false });
        return;
      }

      const { groups } = get();
      const isAdmin = useAuthStore.getState().activeRoleId === getAdminRoleId();
      const userGroupIds = isAdmin
        ? groups.map((g) => g.id)
        : groups.filter((g) => g.memberIds.includes(currentUser.id)).map((g) => g.id);

      if (userGroupIds.length === 0) {
        set({ messageSearchResults: [], messageSearchLoading: false });
        return;
      }

      const supabase = createClient();
      const { data, error } = await supabase.rpc('search_chat_messages', {
        p_user_id: currentUser.id,
        p_query: query.trim(),
        p_group_ids: userGroupIds,
        p_limit: 50,
        p_offset: 0,
      });

      // Only update if query hasn't changed during fetch
      if (get().messageSearchQuery !== query) return;

      if (error) {
        logger.error('Failed to search messages');
        set({ messageSearchResults: [], messageSearchLoading: false });
        return;
      }

      set({
        messageSearchResults: (data || []).map(mapDbToChatSearchResult),
        messageSearchLoading: false,
      });
    }, 300);
  },

  clearMessageSearch: () => {
    if (_searchDebounceTimer) clearTimeout(_searchDebounceTimer);
    set({ messageSearchQuery: '', messageSearchResults: [], messageSearchLoading: false });
  },

  navigateToSearchResult: async (result) => {
    const { selectedGroupId, groupMessages } = get();

    // Switch group if needed
    if (selectedGroupId !== result.groupId) {
      set({ selectedGroupId: result.groupId });

      // Load messages for the target group
      const existing = groupMessages[result.groupId];
      if (!existing) {
        await get().fetchMessagesForGroup(result.groupId);
      }
    }

    // Check if message is already loaded
    const gmState = get().groupMessages[result.groupId];
    const messageExists = gmState?.messages.some((m) => m.id === result.messageId);

    if (!messageExists) {
      // Load messages around the search result
      const supabase = createClient();
      const { data, error } = await supabase
        .from('chat_zpravy')
        .select('*')
        .eq('id_skupiny', result.groupId)
        .lte('vytvoreno', result.createdAt)
        .order('vytvoreno', { ascending: false })
        .limit(MESSAGES_PAGE_SIZE);

      if (!error && data) {
        const olderMessages = data.map(mapDbToChatMessage).reverse();
        const oldestLoadedAt = olderMessages.length > 0 ? olderMessages[0].createdAt : null;

        // Also fetch some newer messages after the result
        const { data: newerData } = await supabase
          .from('chat_zpravy')
          .select('*')
          .eq('id_skupiny', result.groupId)
          .gt('vytvoreno', result.createdAt)
          .order('vytvoreno', { ascending: true })
          .limit(MESSAGES_PAGE_SIZE);

        const newerMessages = (newerData || []).map(mapDbToChatMessage);
        const allMessages = [...olderMessages, ...newerMessages];
        const hasMore = data.length >= MESSAGES_PAGE_SIZE;

        set((s) => ({
          groupMessages: {
            ...s.groupMessages,
            [result.groupId]: {
              messages: allMessages,
              hasMore,
              loading: false,
              oldestLoadedAt,
            },
          },
        }));
      }
    }

    // Scroll to message with highlight (handled by ChatConversation component via state)
    // We use a small timeout to allow React to render
    setTimeout(() => {
      const el = document.getElementById(`msg-${result.messageId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('ring-2', 'ring-yellow-400', 'rounded-2xl');
        setTimeout(() => el.classList.remove('ring-2', 'ring-yellow-400', 'rounded-2xl'), 2000);
      }
    }, 200);
  },

  // Message actions
  sendMessage: async (groupId, userId, text, attachments = [], replyToMessageId = null) => {
    const newMessage: ChatMessage = {
      id: `msg-${crypto.randomUUID()}`,
      groupId,
      userId,
      text,
      attachments,
      reactions: [],
      replyToMessageId: replyToMessageId ?? null,
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

    // Append to groupMessages
    set((state) => {
      const gmState = state.groupMessages[groupId];
      const updatedGroupMessages = gmState
        ? {
            ...state.groupMessages,
            [groupId]: {
              ...gmState,
              messages: [...gmState.messages, newMessage],
            },
          }
        : state.groupMessages;

      // Update summary
      const updatedSummaries = {
        ...state.groupSummaries,
        [groupId]: {
          ...(state.groupSummaries[groupId] || {
            groupId,
            totalCount: 0,
            unreadCount: 0,
          }),
          groupId,
          lastMessageText: text,
          lastMessageUserId: userId,
          lastMessageAt: newMessage.createdAt,
          totalCount: (state.groupSummaries[groupId]?.totalCount || 0) + 1,
        },
      };

      return {
        groupMessages: updatedGroupMessages,
        groupSummaries: updatedSummaries,
        replyingToMessageId: null,
      };
    });

    // Mark as read for sender
    await get().markGroupAsRead(groupId, userId);
  },

  setReplyingTo: (messageId) => set({ replyingToMessageId: messageId }),

  deleteMessage: async (messageId) => {
    const { groupMessages } = get();
    const msg = findMessageInGroups(groupMessages, messageId);
    if (!msg) return;

    const currentUser = useAuthStore.getState().currentUser;
    if (!currentUser || msg.userId !== currentUser.id) return;

    const supabase = createClient();
    const { error } = await supabase.from('chat_zpravy').delete().eq('id', messageId);
    if (error) {
      logger.error('Failed to delete message');
      toast.error('Nepodařilo se smazat zprávu');
      return;
    }

    set((state) => ({
      groupMessages: updateGroupMessages(
        state.groupMessages,
        msg.groupId,
        (msgs) => msgs.filter((m) => m.id !== messageId),
      ),
    }));
  },

  addReaction: async (messageId, userId, reactionType) => {
    const { groupMessages } = get();
    const msg = findMessageInGroups(groupMessages, messageId);
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
      groupMessages: updateGroupMessages(
        state.groupMessages,
        msg.groupId,
        (msgs) => msgs.map((m) =>
          m.id === messageId ? { ...m, reactions: updatedReactions } : m
        ),
      ),
    }));
  },

  removeReaction: async (messageId, userId, reactionType) => {
    const { groupMessages } = get();
    const msg = findMessageInGroups(groupMessages, messageId);
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
      groupMessages: updateGroupMessages(
        state.groupMessages,
        msg.groupId,
        (msgs) => msgs.map((m) =>
          m.id === messageId ? { ...m, reactions: updatedReactions } : m
        ),
      ),
    }));
  },

  // Read status actions
  markGroupAsRead: async (groupId, userId) => {
    const gmState = get().groupMessages[groupId];
    const messages = gmState?.messages || [];
    if (messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];

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

    set((state) => {
      const existing = state.readStatuses.find(
        (s) => s.groupId === groupId && s.userId === userId
      );

      const updatedReadStatuses = existing
        ? state.readStatuses.map((s) =>
            s.groupId === groupId && s.userId === userId
              ? { ...s, lastReadMessageId: lastMessage.id, lastReadAt: readStatus.lastReadAt }
              : s
          )
        : [...state.readStatuses, readStatus];

      // Update summary unread count
      const updatedSummaries = state.groupSummaries[groupId]
        ? {
            ...state.groupSummaries,
            [groupId]: { ...state.groupSummaries[groupId], unreadCount: 0 },
          }
        : state.groupSummaries;

      return { readStatuses: updatedReadStatuses, groupSummaries: updatedSummaries };
    });
  },

  // Group management actions
  openGroupForm: (groupId) =>
    set({ isGroupFormOpen: true, editingGroupId: groupId || null }),

  closeGroupForm: () => set({ isGroupFormOpen: false, editingGroupId: null }),

  createGroup: async (name, memberIds, createdBy) => {
    const newGroup: ChatGroup = {
      id: `group-${crypto.randomUUID()}`,
      name,
      type: 'group',
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

    set((state) => {
      const updatedGroupMessages = { ...state.groupMessages };
      delete updatedGroupMessages[groupId];
      const updatedSummaries = { ...state.groupSummaries };
      delete updatedSummaries[groupId];
      return {
        groups: state.groups.filter((g) => g.id !== groupId),
        groupMessages: updatedGroupMessages,
        groupSummaries: updatedSummaries,
        readStatuses: state.readStatuses.filter((s) => s.groupId !== groupId),
        selectedGroupId:
          state.selectedGroupId === groupId ? null : state.selectedGroupId,
      };
    });
  },

  // Direct messages
  openNewDm: () => set({ isNewDmOpen: true }),
  closeNewDm: () => set({ isNewDmOpen: false }),

  startDirectMessage: async (otherUserId) => {
    const currentUser = useAuthStore.getState().currentUser;
    if (!currentUser) return;

    // Check for existing direct group
    const existing = get().getDirectGroupWith(otherUserId);
    if (existing) {
      set({ isNewDmOpen: false });
      get().selectGroup(existing.id);
      return;
    }

    // Create new direct group
    const memberIds = [currentUser.id, otherUserId].sort();
    const newGroup: ChatGroup = {
      id: `group-${crypto.randomUUID()}`,
      name: '',
      type: 'direct',
      memberIds,
      createdAt: new Date().toISOString(),
      createdBy: currentUser.id,
    };

    const dbData = mapChatGroupToDb(newGroup);
    const supabase = createClient();
    const { error } = await supabase.from('chat_skupiny').insert(dbData);
    if (error) {
      logger.error('Failed to create direct message');
      toast.error('Nepodařilo se vytvořit konverzaci');
      return;
    }

    set((state) => ({
      groups: [...state.groups, newGroup],
      isNewDmOpen: false,
    }));
    get().selectGroup(newGroup.id);
  },

  getDirectGroupWith: (otherUserId) => {
    const currentUser = useAuthStore.getState().currentUser;
    if (!currentUser) return undefined;

    return get().groups.find(
      (g) =>
        g.type === 'direct' &&
        g.memberIds.includes(currentUser.id) &&
        g.memberIds.includes(otherUserId)
    );
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
          const groupId = newMsg.groupId;

          // If group messages are loaded, append
          const gmState = get().groupMessages[groupId];
          if (gmState) {
            const exists = gmState.messages.some((m) => m.id === newMsg.id);
            if (!exists) {
              set((state) => ({
                groupMessages: {
                  ...state.groupMessages,
                  [groupId]: {
                    ...gmState,
                    messages: [...gmState.messages, newMsg],
                  },
                },
              }));
            }
          }

          // Always update summary
          set((state) => ({
            groupSummaries: {
              ...state.groupSummaries,
              [groupId]: {
                ...(state.groupSummaries[groupId] || {
                  groupId,
                  totalCount: 0,
                  unreadCount: 0,
                }),
                groupId,
                lastMessageText: newMsg.text,
                lastMessageUserId: newMsg.userId,
                lastMessageAt: newMsg.createdAt,
                totalCount: (state.groupSummaries[groupId]?.totalCount || 0) + 1,
                // Increment unread if not from current user and not viewing that group
                unreadCount:
                  (state.groupSummaries[groupId]?.unreadCount || 0) +
                  (newMsg.userId !== useAuthStore.getState().currentUser?.id &&
                   state.selectedGroupId !== groupId
                    ? 1
                    : 0),
              },
            },
          }));
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
          set((state) => ({
            groupMessages: updateGroupMessages(
              state.groupMessages,
              updated.groupId,
              (msgs) => msgs.map((m) =>
                m.id === updated.id ? { ...m, ...updated } : m
              ),
            ),
          }));
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'chat_zpravy',
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          const deletedId = payload.old?.id;
          if (deletedId) {
            // Find which group this message belongs to and remove it
            const { groupMessages: gm } = get();
            for (const [gid, gState] of Object.entries(gm)) {
              if (gState.messages.some((m) => m.id === deletedId)) {
                set((state) => ({
                  groupMessages: updateGroupMessages(
                    state.groupMessages,
                    gid,
                    (msgs) => msgs.filter((m) => m.id !== deletedId),
                  ),
                }));
                break;
              }
            }
          }
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_skupiny',
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          const newGroup = mapDbToChatGroup(payload.new);
          const exists = get().groups.some((g) => g.id === newGroup.id);
          if (!exists) {
            set({ groups: [...get().groups, newGroup] });
          }
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
        if (err) logger.error(`[chat-realtime] ${status}:`, err);
        // Re-fetch summaries + active group messages after reconnect
        if (status === 'SUBSCRIBED' && get()._loaded) {
          get().fetchGroupSummaries();

          // Refresh active group messages
          const activeGroupId = get().selectedGroupId;
          if (activeGroupId) {
            get().fetchMessagesForGroup(activeGroupId);
          }

          // Refresh groups and read statuses
          const supabaseRefresh = createClient();
          Promise.all([
            supabaseRefresh.from('chat_stav_precteni').select('*'),
            supabaseRefresh.from('chat_skupiny').select('*'),
          ]).then(([readResult, groupsResult]) => {
            if (!readResult.error && readResult.data) {
              set({ readStatuses: readResult.data.map(mapDbToChatReadStatus) });
            }
            if (!groupsResult.error && groupsResult.data) {
              const freshGroups = groupsResult.data.map(mapDbToChatGroup);
              const currentGroups = get().groups;
              const currentGroupIds = new Set(currentGroups.map((g) => g.id));
              const newGroups = freshGroups.filter((g) => !currentGroupIds.has(g.id));
              if (newGroups.length > 0) {
                set({ groups: [...currentGroups, ...newGroups] });
              }
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

  // Auto-sync polling — now lightweight (summaries + read statuses + active group only)
  startAutoSync: () => {
    get().stopAutoSync();

    const syncNow = () => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;

      // Refresh summaries (lightweight)
      get().fetchGroupSummaries();

      // Refresh read statuses
      const supabase = createClient();
      supabase.from('chat_stav_precteni').select('*').then(({ data, error }) => {
        if (!error && data) {
          set({ readStatuses: data.map(mapDbToChatReadStatus) });
        }
      });

      // Refresh groups
      supabase.from('chat_skupiny').select('*').then(({ data, error }) => {
        if (!error && data) {
          set({ groups: data.map(mapDbToChatGroup) });
        }
      });

      // Refresh active group messages (fetch new ones since last loaded)
      const activeGroupId = get().selectedGroupId;
      if (activeGroupId) {
        const gmState = get().groupMessages[activeGroupId];
        if (gmState && gmState.messages.length > 0) {
          const lastMsg = gmState.messages[gmState.messages.length - 1];
          supabase
            .from('chat_zpravy')
            .select('*')
            .eq('id_skupiny', activeGroupId)
            .gt('vytvoreno', lastMsg.createdAt)
            .order('vytvoreno', { ascending: true })
            .then(({ data, error: fetchError }) => {
              if (!fetchError && data && data.length > 0) {
                const newMessages = data.map(mapDbToChatMessage);
                set((state) => {
                  const current = state.groupMessages[activeGroupId];
                  if (!current) return state;
                  // Deduplicate
                  const existingIds = new Set(current.messages.map((m) => m.id));
                  const uniqueNew = newMessages.filter((m) => !existingIds.has(m.id));
                  if (uniqueNew.length === 0) return state;
                  return {
                    groupMessages: {
                      ...state.groupMessages,
                      [activeGroupId]: {
                        ...current,
                        messages: [...current.messages, ...uniqueNew],
                      },
                    },
                  };
                });
              }
            });
        }
      }
    };

    _chatVisibilityHandler = () => {
      if (document.visibilityState === 'visible') syncNow();
    };
    document.addEventListener('visibilitychange', _chatVisibilityHandler);

    const interval = setInterval(syncNow, 2_000);
    set({ _autoSyncInterval: interval });
  },

  stopAutoSync: () => {
    const interval = get()._autoSyncInterval;
    if (interval) {
      clearInterval(interval);
      set({ _autoSyncInterval: null });
    }
    if (_chatVisibilityHandler) {
      document.removeEventListener('visibilitychange', _chatVisibilityHandler);
      _chatVisibilityHandler = null;
    }
  },

  // Getters
  getGroupsForUser: (userId) => {
    const { groups, groupSummaries } = get();
    const isAdmin = useAuthStore.getState().activeRoleId === getAdminRoleId();
    const userGroups = isAdmin
      ? groups
      : groups.filter((g) => g.memberIds.includes(userId));

    return sortGroupsBySummary(userGroups, groupSummaries);
  },

  getMessagesForGroup: (groupId) => {
    const gmState = get().groupMessages[groupId];
    return gmState?.messages || [];
  },

  getUnreadCountForUser: (userId) => {
    const { groups, groupSummaries } = get();
    let totalUnread = 0;
    const userGroups = groups.filter((g) => g.memberIds.includes(userId));

    for (const group of userGroups) {
      const summary = groupSummaries[group.id];
      if (summary) {
        totalUnread += summary.unreadCount;
      }
    }

    return totalUnread;
  },

  getUnreadCountForGroup: (groupId) => {
    const summary = get().groupSummaries[groupId];
    return summary?.unreadCount || 0;
  },

  getGroupById: (groupId) => {
    return get().groups.find((g) => g.id === groupId);
  },
}));

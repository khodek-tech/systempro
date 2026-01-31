import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  ChatGroup,
  ChatMessage,
  ChatReadStatus,
  ChatReactionType,
  ChatAttachment,
} from '@/shared/types';
import { STORAGE_KEYS } from '@/lib/constants';
import { getLastMessageInGroup, sortGroupsByLastMessage } from './chat-helpers';

// Mock data for initial state
const MOCK_CHAT_GROUPS: ChatGroup[] = [
  {
    id: 'group-1',
    name: 'Všichni',
    memberIds: [
      'user-1', 'user-2', 'user-3', 'user-4', 'user-5', 'user-6', 'user-7',
      'user-8', 'user-9', 'user-10', 'user-11', 'user-12', 'user-13', 'user-14',
      'user-15', 'user-16', 'user-17', 'user-18', 'user-19', 'user-20', 'user-21',
      'user-22', 'user-23', 'user-24', 'user-25', 'user-26', 'user-27',
    ],
    createdAt: '2026-01-01T00:00:00Z',
    createdBy: 'user-6',
  },
  {
    id: 'group-2',
    name: 'Vedení',
    memberIds: ['user-6', 'user-7', 'user-11', 'user-13'],
    createdAt: '2026-01-01T00:00:00Z',
    createdBy: 'user-6',
  },
  {
    id: 'group-3',
    name: 'Prodejna Bohnice',
    memberIds: ['user-27', 'user-14', 'user-13', 'user-6'],
    createdAt: '2026-01-15T10:00:00Z',
    createdBy: 'user-13',
  },
  {
    id: 'group-4',
    name: 'Sklad',
    memberIds: ['user-1', 'user-3', 'user-5', 'user-11', 'user-20'],
    createdAt: '2026-01-10T08:00:00Z',
    createdBy: 'user-11',
  },
];

const MOCK_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-1',
    groupId: 'group-1',
    userId: 'user-6',
    text: 'Dobrý den všem, připomínám zítřejší poradu v 9:00.',
    attachments: [],
    reactions: [
      { type: 'thumbsUp', userId: 'user-7', createdAt: '2026-01-30T10:05:00Z' },
      { type: 'thumbsUp', userId: 'user-11', createdAt: '2026-01-30T10:06:00Z' },
    ],
    createdAt: '2026-01-30T10:00:00Z',
  },
  {
    id: 'msg-2',
    groupId: 'group-1',
    userId: 'user-7',
    text: 'Díky za připomínku! 👋',
    attachments: [],
    reactions: [],
    createdAt: '2026-01-30T10:15:00Z',
  },
  {
    id: 'msg-3',
    groupId: 'group-2',
    userId: 'user-6',
    text: 'Kolegové, potřebujeme prodiskutovat nový ceník. Máte čas tento týden?',
    attachments: [],
    reactions: [],
    createdAt: '2026-01-30T09:00:00Z',
  },
  {
    id: 'msg-4',
    groupId: 'group-2',
    userId: 'user-13',
    text: 'Mohu ve středu odpoledne.',
    attachments: [],
    reactions: [{ type: 'heart', userId: 'user-6', createdAt: '2026-01-30T09:35:00Z' }],
    createdAt: '2026-01-30T09:30:00Z',
  },
  {
    id: 'msg-5',
    groupId: 'group-2',
    userId: 'user-11',
    text: 'Středa mi taky vyhovuje.',
    attachments: [],
    reactions: [],
    createdAt: '2026-01-30T09:45:00Z',
  },
  {
    id: 'msg-6',
    groupId: 'group-3',
    userId: 'user-27',
    text: 'Dobrý den, dnes máme hodně zákazníků, prosím o trpělivost s odpověďmi.',
    attachments: [],
    reactions: [
      { type: 'thumbsUp', userId: 'user-14', createdAt: '2026-01-30T11:05:00Z' },
    ],
    createdAt: '2026-01-30T11:00:00Z',
  },
  {
    id: 'msg-7',
    groupId: 'group-3',
    userId: 'user-14',
    text: 'Držte se! Jdu vám pomoct.',
    attachments: [],
    reactions: [
      { type: 'heart', userId: 'user-27', createdAt: '2026-01-30T11:12:00Z' },
    ],
    createdAt: '2026-01-30T11:10:00Z',
  },
  {
    id: 'msg-8',
    groupId: 'group-4',
    userId: 'user-11',
    text: 'Prosím o kontrolu dodávky od dodavatele XYZ. Měla přijít ráno.',
    attachments: [],
    reactions: [],
    createdAt: '2026-01-30T08:00:00Z',
  },
  {
    id: 'msg-9',
    groupId: 'group-4',
    userId: 'user-1',
    text: 'Zkontrolováno, vše v pořádku. 23 krabic.',
    attachments: [],
    reactions: [
      { type: 'thumbsUp', userId: 'user-11', createdAt: '2026-01-30T08:35:00Z' },
    ],
    createdAt: '2026-01-30T08:30:00Z',
  },
  {
    id: 'msg-10',
    groupId: 'group-4',
    userId: 'user-3',
    text: 'Začínám s naskladněním.',
    attachments: [],
    reactions: [],
    createdAt: '2026-01-30T08:45:00Z',
  },
  {
    id: 'msg-11',
    groupId: 'group-1',
    userId: 'user-11',
    text: 'Upozornění: Zítra bude probíhat inventura ve skladu. Prosím nepřebírejte zboží mezi 10:00-12:00.',
    attachments: [],
    reactions: [
      { type: 'thumbsUp', userId: 'user-1', createdAt: '2026-01-30T14:05:00Z' },
      { type: 'thumbsUp', userId: 'user-3', createdAt: '2026-01-30T14:10:00Z' },
      { type: 'wow', userId: 'user-27', createdAt: '2026-01-30T14:15:00Z' },
    ],
    createdAt: '2026-01-30T14:00:00Z',
  },
];

const MOCK_READ_STATUSES: ChatReadStatus[] = [];

interface ChatState {
  groups: ChatGroup[];
  messages: ChatMessage[];
  readStatuses: ChatReadStatus[];
  chatViewMode: 'card' | 'view';
  selectedGroupId: string | null;
  searchQuery: string;
  isGroupFormOpen: boolean;
  editingGroupId: string | null;
}

interface ChatActions {
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
  ) => void;
  addReaction: (messageId: string, userId: string, reactionType: ChatReactionType) => void;
  removeReaction: (messageId: string, userId: string, reactionType: ChatReactionType) => void;

  // Read status actions
  markGroupAsRead: (groupId: string, userId: string) => void;

  // Group management actions (admin)
  openGroupForm: (groupId?: string) => void;
  closeGroupForm: () => void;
  createGroup: (name: string, memberIds: string[], createdBy: string) => void;
  updateGroup: (groupId: string, updates: Partial<Pick<ChatGroup, 'name' | 'memberIds'>>) => void;
  deleteGroup: (groupId: string) => void;

  // Getters
  getGroupsForUser: (userId: string) => ChatGroup[];
  getMessagesForGroup: (groupId: string) => ChatMessage[];
  getUnreadCountForUser: (userId: string) => number;
  getUnreadCountForGroup: (groupId: string, userId: string) => number;
  getGroupById: (groupId: string) => ChatGroup | undefined;
}

export const useChatStore = create<ChatState & ChatActions>()(
  persist(
    (set, get) => ({
      // Initial state
      groups: MOCK_CHAT_GROUPS,
      messages: MOCK_CHAT_MESSAGES,
      readStatuses: MOCK_READ_STATUSES,
      chatViewMode: 'card',
      selectedGroupId: null,
      searchQuery: '',
      isGroupFormOpen: false,
      editingGroupId: null,

      // View mode actions
      openChatView: () => set({ chatViewMode: 'view' }),
      closeChatView: () => set({ chatViewMode: 'card', selectedGroupId: null, searchQuery: '' }),

      selectGroup: (groupId) => set({ selectedGroupId: groupId }),

      setSearchQuery: (query) => set({ searchQuery: query }),

      // Message actions
      sendMessage: (groupId, userId, text, attachments = []) => {
        const newMessage: ChatMessage = {
          id: `msg-${crypto.randomUUID()}`,
          groupId,
          userId,
          text,
          attachments,
          reactions: [],
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          messages: [...state.messages, newMessage],
        }));

        // Mark as read for sender
        get().markGroupAsRead(groupId, userId);
      },

      addReaction: (messageId, userId, reactionType) => {
        set((state) => ({
          messages: state.messages.map((msg) => {
            if (msg.id !== messageId) return msg;

            // Check if user already has this reaction
            const existingReaction = msg.reactions.find(
              (r) => r.userId === userId && r.type === reactionType
            );
            if (existingReaction) return msg;

            return {
              ...msg,
              reactions: [
                ...msg.reactions,
                {
                  type: reactionType,
                  userId,
                  createdAt: new Date().toISOString(),
                },
              ],
            };
          }),
        }));
      },

      removeReaction: (messageId, userId, reactionType) => {
        set((state) => ({
          messages: state.messages.map((msg) => {
            if (msg.id !== messageId) return msg;

            return {
              ...msg,
              reactions: msg.reactions.filter(
                (r) => !(r.userId === userId && r.type === reactionType)
              ),
            };
          }),
        }));
      },

      // Read status actions
      markGroupAsRead: (groupId, userId) => {
        const { messages, readStatuses } = get();
        const lastMessage = getLastMessageInGroup(groupId, messages);

        if (!lastMessage) return;

        const existingStatus = readStatuses.find(
          (s) => s.groupId === groupId && s.userId === userId
        );

        if (existingStatus) {
          set((state) => ({
            readStatuses: state.readStatuses.map((s) =>
              s.groupId === groupId && s.userId === userId
                ? {
                    ...s,
                    lastReadMessageId: lastMessage.id,
                    lastReadAt: new Date().toISOString(),
                  }
                : s
            ),
          }));
        } else {
          set((state) => ({
            readStatuses: [
              ...state.readStatuses,
              {
                groupId,
                userId,
                lastReadMessageId: lastMessage.id,
                lastReadAt: new Date().toISOString(),
              },
            ],
          }));
        }
      },

      // Group management actions
      openGroupForm: (groupId) =>
        set({ isGroupFormOpen: true, editingGroupId: groupId || null }),

      closeGroupForm: () => set({ isGroupFormOpen: false, editingGroupId: null }),

      createGroup: (name, memberIds, createdBy) => {
        const newGroup: ChatGroup = {
          id: `group-${crypto.randomUUID()}`,
          name,
          memberIds,
          createdAt: new Date().toISOString(),
          createdBy,
        };

        set((state) => ({
          groups: [...state.groups, newGroup],
          isGroupFormOpen: false,
          editingGroupId: null,
        }));
      },

      updateGroup: (groupId, updates) => {
        set((state) => ({
          groups: state.groups.map((g) =>
            g.id === groupId ? { ...g, ...updates } : g
          ),
          isGroupFormOpen: false,
          editingGroupId: null,
        }));
      },

      deleteGroup: (groupId) => {
        set((state) => ({
          groups: state.groups.filter((g) => g.id !== groupId),
          messages: state.messages.filter((m) => m.groupId !== groupId),
          readStatuses: state.readStatuses.filter((s) => s.groupId !== groupId),
          selectedGroupId:
            state.selectedGroupId === groupId ? null : state.selectedGroupId,
        }));
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
    }),
    {
      name: STORAGE_KEYS.CHAT,
      partialize: (state) => ({
        groups: state.groups,
        messages: state.messages,
        readStatuses: state.readStatuses,
      }),
    }
  )
);

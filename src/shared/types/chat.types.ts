/**
 * Chat Module Types
 */

export type ChatGroupType = 'group' | 'direct';

export type ChatReactionType = 'thumbsUp' | 'heart' | 'laugh' | 'wow' | 'sad' | 'pray';

export interface ChatAttachment {
  id: string;
  fileName: string;
  fileType: 'image' | 'pdf' | 'excel' | 'other';
  fileSize: number;
  url: string;
  uploadedAt: string;
}

export interface ChatReaction {
  type: ChatReactionType;
  userId: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  groupId: string;
  userId: string;
  text: string;
  attachments: ChatAttachment[];
  reactions: ChatReaction[];
  replyToMessageId?: string | null;
  createdAt: string;
}

export interface ChatReadStatus {
  groupId: string;
  userId: string;
  lastReadMessageId: string | null;
  lastReadAt: string;
}

export interface ChatGroup {
  id: string;
  name: string;
  type: ChatGroupType;
  memberIds: string[];
  createdAt: string;
  createdBy: string;
}

/**
 * Summary of a chat group for sidebar display (from DB RPC).
 * Avoids fetching all messages just to show last message preview + unread count.
 */
export interface ChatGroupSummary {
  groupId: string;
  lastMessageText: string;
  lastMessageUserId: string;
  lastMessageAt: string;
  totalCount: number;
  unreadCount: number;
}

/**
 * Pagination state for messages within a single group.
 */
export interface ChatGroupPaginationState {
  messages: ChatMessage[];
  hasMore: boolean;
  loading: boolean;
  oldestLoadedAt: string | null;
}

/**
 * A single search result from fulltext DB search.
 */
export interface ChatSearchResult {
  messageId: string;
  groupId: string;
  userId: string;
  text: string;
  createdAt: string;
}

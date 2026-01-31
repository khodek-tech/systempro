/**
 * Chat Module Types
 */

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
  memberIds: string[];
  createdAt: string;
  createdBy: string;
}

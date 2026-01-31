/**
 * Chat helper functions
 */

import { ChatMessage, ChatReactionType, ChatGroup } from '@/shared/types';

/**
 * Format message time for display
 */
export function formatMessageTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const time = date.toLocaleTimeString('cs-CZ', {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (isToday) {
    return time;
  }

  if (isYesterday) {
    return `Včera ${time}`;
  }

  return date.toLocaleDateString('cs-CZ', {
    day: 'numeric',
    month: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Group messages by date for display
 */
export function groupMessagesByDate(messages: ChatMessage[]): Map<string, ChatMessage[]> {
  const grouped = new Map<string, ChatMessage[]>();

  for (const message of messages) {
    const date = new Date(message.createdAt);
    const dateKey = date.toLocaleDateString('cs-CZ', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, []);
    }
    grouped.get(dateKey)!.push(message);
  }

  return grouped;
}

/**
 * Get emoji for reaction type
 */
export function getReactionEmoji(type: ChatReactionType): string {
  const emojiMap: Record<ChatReactionType, string> = {
    thumbsUp: '👍',
    heart: '❤️',
    laugh: '😂',
    wow: '😮',
    sad: '😢',
    pray: '🙏',
  };
  return emojiMap[type];
}

/**
 * Get all available reactions
 */
export function getAllReactions(): { type: ChatReactionType; emoji: string }[] {
  return [
    { type: 'thumbsUp', emoji: '👍' },
    { type: 'heart', emoji: '❤️' },
    { type: 'laugh', emoji: '😂' },
    { type: 'wow', emoji: '😮' },
    { type: 'sad', emoji: '😢' },
    { type: 'pray', emoji: '🙏' },
  ];
}

/**
 * Check if user can access a chat group
 */
export function canUserAccessGroup(userId: string, group: ChatGroup): boolean {
  return group.memberIds.includes(userId);
}

/**
 * Get the last message in a group
 */
export function getLastMessageInGroup(
  groupId: string,
  messages: ChatMessage[]
): ChatMessage | undefined {
  const groupMessages = messages.filter((m) => m.groupId === groupId);
  if (groupMessages.length === 0) return undefined;

  return groupMessages.reduce((latest, current) => {
    return new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest;
  });
}

/**
 * Sort groups by last message time
 */
export function sortGroupsByLastMessage(
  groups: ChatGroup[],
  messages: ChatMessage[]
): ChatGroup[] {
  return [...groups].sort((a, b) => {
    const lastA = getLastMessageInGroup(a.id, messages);
    const lastB = getLastMessageInGroup(b.id, messages);

    if (!lastA && !lastB) return 0;
    if (!lastA) return 1;
    if (!lastB) return -1;

    return new Date(lastB.createdAt).getTime() - new Date(lastA.createdAt).getTime();
  });
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

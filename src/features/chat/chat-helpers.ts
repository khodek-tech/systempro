/**
 * Chat helper functions
 */

import { ChatMessage, ChatReactionType, ChatGroup, ChatReadStatus, ChatGroupSummary } from '@/shared/types';
import { useAuthStore } from '@/core/stores/auth-store';
import { useUsersStore } from '@/core/stores/users-store';
import { getAdminRoleId } from '@/core/stores/store-helpers';

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
  const isAdmin = useAuthStore.getState().activeRoleId === getAdminRoleId();
  return isAdmin || group.memberIds.includes(userId);
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
 * Sort groups by summary data (last message time from DB).
 * Preferred over sortGroupsByLastMessage — uses pre-computed summaries.
 */
export function sortGroupsBySummary(
  groups: ChatGroup[],
  summaries: Record<string, ChatGroupSummary>,
): ChatGroup[] {
  return [...groups].sort((a, b) => {
    const sa = summaries[a.id];
    const sb = summaries[b.id];
    if (!sa && !sb) return 0;
    if (!sa) return 1;
    if (!sb) return -1;
    return new Date(sb.lastMessageAt).getTime() - new Date(sa.lastMessageAt).getTime();
  });
}

/**
 * Get the display name for a direct message group (other person's name)
 */
export function getDirectGroupDisplayName(group: ChatGroup, currentUserId: string): string {
  const otherUserId = group.memberIds.find((id) => id !== currentUserId);
  if (!otherUserId) return 'Neznámý';
  const user = useUsersStore.getState().getUserById(otherUserId);
  return user?.fullName || 'Neznámý';
}

/**
 * Get both participant names for a DM group (for admin view)
 */
export function getDirectGroupBothNames(group: ChatGroup): string {
  const users = useUsersStore.getState();
  const names = group.memberIds
    .map((id) => users.getUserById(id)?.fullName || 'Neznámý')
    .sort((a, b) => a.localeCompare(b, 'cs'));
  return names.join(' a ');
}

/**
 * Sort direct groups alphabetically by the other person's name (cs locale)
 */
export function sortDirectGroupsAlphabetically(groups: ChatGroup[], currentUserId: string): ChatGroup[] {
  return [...groups].sort((a, b) => {
    const nameA = getDirectGroupDisplayName(a, currentUserId);
    const nameB = getDirectGroupDisplayName(b, currentUserId);
    return nameA.localeCompare(nameB, 'cs');
  });
}

/**
 * Get delivery status of a message for WhatsApp-style checkmarks (DM only).
 * Returns 'sent' (✓ gray), 'read' (✓✓ blue), or null (no indicator).
 */
export function getMessageDeliveryStatus(
  message: ChatMessage,
  group: ChatGroup,
  readStatuses: ChatReadStatus[],
  currentUserId: string
): 'sent' | 'read' | null {
  // Only show for own messages in DMs
  if (message.userId !== currentUserId || group.type !== 'direct') return null;

  // Find the other user in the DM
  const otherUserId = group.memberIds.find((id) => id !== currentUserId);
  if (!otherUserId) return 'sent';

  // Find the other user's read status for this group
  const otherReadStatus = readStatuses.find(
    (s) => s.groupId === group.id && s.userId === otherUserId
  );

  if (!otherReadStatus) return 'sent';

  // Compare timestamps: if other user read after this message was created → read
  const messageTime = new Date(message.createdAt).getTime();
  const readTime = new Date(otherReadStatus.lastReadAt).getTime();

  return readTime >= messageTime ? 'read' : 'sent';
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

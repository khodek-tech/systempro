'use client';

import { ChatMessage as ChatMessageType, ChatReactionType } from '@/types';
import { useChatStore } from '@/stores/chat-store';
import { useAuthStore } from '@/stores/auth-store';
import { useUsersStore } from '@/stores/users-store';
import { formatMessageTime, getReactionEmoji } from '@/features/chat';
import { ChatReactionPicker } from './ChatReactionPicker';
import { ChatAttachmentPreview } from './ChatAttachmentPreview';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const { addReaction, removeReaction } = useChatStore();
  const { currentUser } = useAuthStore();
  const { getUserById } = useUsersStore();

  const sender = getUserById(message.userId);
  const isOwnMessage = currentUser?.id === message.userId;

  // Group reactions by type with user info
  const groupedReactions = message.reactions.reduce(
    (acc, reaction) => {
      if (!acc[reaction.type]) {
        acc[reaction.type] = { count: 0, userIds: [], hasCurrentUser: false };
      }
      acc[reaction.type].count++;
      acc[reaction.type].userIds.push(reaction.userId);
      if (reaction.userId === currentUser?.id) {
        acc[reaction.type].hasCurrentUser = true;
      }
      return acc;
    },
    {} as Record<ChatReactionType, { count: number; userIds: string[]; hasCurrentUser: boolean }>
  );

  const handleReactionClick = (type: ChatReactionType, hasCurrentUser: boolean) => {
    if (!currentUser) return;

    if (hasCurrentUser) {
      removeReaction(message.id, currentUser.id, type);
    } else {
      addReaction(message.id, currentUser.id, type);
    }
  };

  const handleAddReaction = (type: ChatReactionType) => {
    if (!currentUser) return;
    addReaction(message.id, currentUser.id, type);
  };

  return (
    <div
      className={cn(
        'flex flex-col max-w-[75%] group',
        isOwnMessage ? 'items-end ml-auto' : 'items-start mr-auto'
      )}
    >
      {/* Sender name (only for other's messages) */}
      {!isOwnMessage && (
        <span className="text-xs font-medium text-slate-500 mb-1 px-1">
          {sender?.fullName || 'Neznámý'}
        </span>
      )}

      {/* Message bubble */}
      <div
        className={cn(
          'rounded-2xl px-4 py-2.5 relative',
          isOwnMessage
            ? 'bg-blue-500 text-white rounded-br-md'
            : 'bg-slate-100 text-slate-800 rounded-bl-md'
        )}
      >
        {/* Text */}
        <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>

        {/* Attachments */}
        {message.attachments.length > 0 && (
          <div className="mt-2 space-y-1">
            {message.attachments.map((attachment) => (
              <ChatAttachmentPreview key={attachment.id} attachment={attachment} />
            ))}
          </div>
        )}

        {/* Time */}
        <span
          className={cn(
            'text-[10px] mt-1 block',
            isOwnMessage ? 'text-blue-100' : 'text-slate-400'
          )}
        >
          {formatMessageTime(message.createdAt)}
        </span>
      </div>

      {/* Reactions */}
      <div className="flex items-center gap-1 mt-1 px-1">
        {/* Existing reactions */}
        {Object.entries(groupedReactions).map(([type, data]) => (
          <button
            key={type}
            onClick={() => handleReactionClick(type as ChatReactionType, data.hasCurrentUser)}
            className={cn(
              'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors',
              data.hasCurrentUser
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            )}
            title={data.userIds
              .map((id) => getUserById(id)?.fullName || 'Neznámý')
              .join(', ')}
          >
            <span>{getReactionEmoji(type as ChatReactionType)}</span>
            <span>{data.count}</span>
          </button>
        ))}

        {/* Add reaction button (visible on hover) */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <ChatReactionPicker onSelect={handleAddReaction} />
        </div>
      </div>
    </div>
  );
}

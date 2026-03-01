'use client';

import { Trash2, Reply, Check, CheckCheck } from 'lucide-react';
import { ChatMessage as ChatMessageType, ChatReactionType } from '@/types';
import { useChatStore } from '@/stores/chat-store';
import { useAuthStore } from '@/stores/auth-store';
import { useUsersStore } from '@/stores/users-store';
import { formatMessageTime, getReactionEmoji } from '@/features/chat';
import { ChatReactionPicker } from './ChatReactionPicker';
import { ChatAttachmentPreview } from './ChatAttachmentPreview';
import { LinkPreviewCard } from './LinkPreviewCard';
import { cn } from '@/lib/utils';
import { linkifyText, extractFirstUrl } from '@/lib/linkify';
import { useLinkPreview } from '@/lib/hooks/use-link-preview';

interface ChatMessageProps {
  message: ChatMessageType;
  onReply?: (messageId: string) => void;
  deliveryStatus?: 'sent' | 'read' | null;
}

export function ChatMessage({ message, onReply, deliveryStatus }: ChatMessageProps) {
  const { addReaction, removeReaction, deleteMessage, getMessagesForGroup } = useChatStore();
  const { currentUser } = useAuthStore();
  const { getUserById } = useUsersStore();

  // Look up reply-to message in the same group's loaded messages
  const groupMsgs = getMessagesForGroup(message.groupId);
  const replyToMessage = message.replyToMessageId
    ? groupMsgs.find((m) => m.id === message.replyToMessageId)
    : null;
  const replyToSender = replyToMessage ? getUserById(replyToMessage.userId) : null;

  const sender = getUserById(message.userId);
  const isOwnMessage = currentUser?.id === message.userId;
  const firstUrl = extractFirstUrl(message.text);
  const linkPreview = useLinkPreview(firstUrl);

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

  const handleDelete = () => {
    if (window.confirm('Opravdu chcete smazat tuto zprávu?')) {
      deleteMessage(message.id);
    }
  };

  return (
    <div
      id={`msg-${message.id}`}
      className={cn(
        'flex flex-col max-w-[75%] group transition-all duration-300',
        isOwnMessage ? 'items-end ml-auto' : 'items-start mr-auto'
      )}
    >
      {/* Sender name (only for other's messages) */}
      {!isOwnMessage && (
        <span className="text-xs font-medium text-slate-500 mb-1 px-1">
          {sender?.fullName || 'Neznámý'}
        </span>
      )}

      {/* Reply citation */}
      {replyToMessage && (
        <button
          onClick={() => {
            const el = document.getElementById(`msg-${replyToMessage.id}`);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              el.classList.add('ring-2', 'ring-blue-300', 'rounded-2xl');
              setTimeout(() => el.classList.remove('ring-2', 'ring-blue-300', 'rounded-2xl'), 2000);
            }
          }}
          className={cn(
            'w-full text-left rounded-xl px-3 py-2 mb-1 border-l-4 cursor-pointer transition-colors',
            'bg-slate-50 border-l-green-400 hover:bg-slate-100'
          )}
        >
          <p className={cn(
            'text-xs font-semibold',
            'text-green-600'
          )}>
            {replyToSender?.fullName || 'Neznámý'}
          </p>
          <p className={cn(
            'text-xs truncate',
            'text-slate-500'
          )}>
            {replyToMessage.text.length > 80
              ? replyToMessage.text.slice(0, 80) + '...'
              : replyToMessage.text}
          </p>
        </button>
      )}

      {/* Message bubble */}
      <div
        className={cn(
          'rounded-2xl px-4 py-2.5 relative bg-slate-100 text-slate-800',
          isOwnMessage ? 'rounded-br-md' : 'rounded-bl-md'
        )}
      >
        {/* Text */}
        <p className="text-sm whitespace-pre-wrap break-words">
          {linkifyText(message.text, 'text-blue-600 underline break-all')}
        </p>

        {/* Link preview */}
        {linkPreview && <LinkPreviewCard preview={linkPreview} />}

        {/* Attachments */}
        {message.attachments.length > 0 && (
          <div className="mt-2 space-y-1">
            {message.attachments.map((attachment) => (
              <ChatAttachmentPreview key={attachment.id} attachment={attachment} />
            ))}
          </div>
        )}

        {/* Time + delivery status */}
        <span className="flex items-center justify-end gap-1 mt-1 text-[10px] text-slate-400">
          {formatMessageTime(message.createdAt)}
          {deliveryStatus === 'sent' && <Check className="w-3.5 h-3.5 text-slate-400" />}
          {deliveryStatus === 'read' && <CheckCheck className="w-3.5 h-3.5 text-blue-500" />}
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
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
          {onReply && (
            <button
              onClick={() => onReply(message.id)}
              className="p-1 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
              title="Odpovědět"
              aria-label="Odpovědět"
            >
              <Reply className="w-3.5 h-3.5" />
            </button>
          )}
          <ChatReactionPicker onSelect={handleAddReaction} />
          {isOwnMessage && (
            <button
              onClick={handleDelete}
              className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Smazat zprávu"
              aria-label="Smazat zprávu"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

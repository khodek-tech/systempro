'use client';

import { Users, User } from 'lucide-react';
import { ChatGroup } from '@/types';
import { useChatStore } from '@/stores/chat-store';
import { useAuthStore } from '@/stores/auth-store';
import { useUsersStore } from '@/stores/users-store';
import { formatMessageTime, getLastMessageInGroup, getDirectGroupDisplayName, getDirectGroupBothNames } from '@/features/chat';
import { cn } from '@/lib/utils';

interface ChatGroupItemProps {
  group: ChatGroup;
  isSelected: boolean;
  onClick: () => void;
  isOthersDm?: boolean;
}

export function ChatGroupItem({ group, isSelected, onClick, isOthersDm }: ChatGroupItemProps) {
  const { messages, getUnreadCountForGroup } = useChatStore();
  const { currentUser } = useAuthStore();
  const { getUserById } = useUsersStore();

  const lastMessage = getLastMessageInGroup(group.id, messages);
  const unreadCount = currentUser ? getUnreadCountForGroup(group.id, currentUser.id) : 0;

  const isDirect = group.type === 'direct';
  const displayName = isDirect
    ? isOthersDm
      ? getDirectGroupBothNames(group)
      : currentUser
        ? getDirectGroupDisplayName(group, currentUser.id)
        : 'Neznámý'
    : group.name;

  const lastMessageUser = lastMessage ? getUserById(lastMessage.userId) : null;
  const lastMessagePreview = lastMessage
    ? isDirect
      ? lastMessage.text
      : `${lastMessageUser?.fullName.split(' ')[0] || 'Někdo'}: ${lastMessage.text}`
    : 'Žádné zprávy';

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left p-4 transition-all duration-200 border-l-4',
        isOthersDm
          ? isSelected
            ? 'bg-green-100 border-l-green-500'
            : 'bg-green-50 border-l-transparent hover:bg-green-100/70'
          : isSelected
            ? 'bg-blue-50 border-l-blue-500'
            : 'bg-white border-l-transparent hover:bg-slate-50'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {isOthersDm ? (
              <User className="w-4 h-4 text-green-500 flex-shrink-0" />
            ) : isDirect ? (
              <User className="w-4 h-4 text-blue-500 flex-shrink-0" />
            ) : (
              <Users className="w-4 h-4 text-slate-400 flex-shrink-0" />
            )}
            <span className="font-semibold text-slate-800 truncate">{displayName}</span>
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold bg-red-500 text-white">
                {unreadCount}
              </span>
            )}
          </div>
          {isOthersDm && (
            <p className="text-xs text-slate-400 mt-0.5 ml-6">Přímá zpráva</p>
          )}
          <p className="text-sm text-slate-500 truncate mt-1">{lastMessagePreview}</p>
        </div>
        {lastMessage && (
          <span className="text-xs text-slate-400 whitespace-nowrap">
            {formatMessageTime(lastMessage.createdAt)}
          </span>
        )}
      </div>
    </button>
  );
}

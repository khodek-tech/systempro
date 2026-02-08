'use client';

import { Star, Paperclip } from 'lucide-react';
import type { EmailMessage } from '@/shared/types';
import { formatEmailDate, formatEmailAddressShort, getEmailInitials } from '@/features/email/email-helpers';
import { cn } from '@/lib/utils';

interface EmailMessageItemProps {
  message: EmailMessage;
  selected: boolean;
  onToggleSelect: () => void;
  onClick: () => void;
}

export function EmailMessageItem({ message, selected, onToggleSelect, onClick }: EmailMessageItemProps) {
  const initials = getEmailInitials(message.from);
  const senderName = formatEmailAddressShort(message.from);
  const dateStr = formatEmailDate(message.date);

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 w-full min-w-0 px-4 py-2.5 text-left border-b border-slate-100 transition-colors hover:bg-slate-50',
        !message.read && 'bg-blue-50/50'
      )}
    >
      {/* Checkbox */}
      <input
        type="checkbox"
        checked={selected}
        onChange={(e) => { e.stopPropagation(); onToggleSelect(); }}
        onClick={(e) => e.stopPropagation()}
        className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 flex-shrink-0 cursor-pointer"
      />

      {/* Unread indicator */}
      <div className="w-2 flex-shrink-0">
        {!message.read && (
          <div className="w-2 h-2 rounded-full bg-sky-500" />
        )}
      </div>

      {/* Avatar */}
      <div className={cn(
        'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold',
        !message.read ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-500'
      )}>
        {initials}
      </div>

      {/* Sender */}
      <span className={cn(
        'w-44 truncate text-sm flex-shrink-0',
        !message.read ? 'font-bold text-slate-900' : 'font-medium text-slate-600'
      )}>
        {senderName}
      </span>

      {/* Subject + preview */}
      <div className="flex-1 min-w-0 truncate">
        <span className={cn(
          'text-sm',
          !message.read ? 'font-semibold text-slate-800' : 'text-slate-600'
        )}>
          {message.subject || '(bez předmětu)'}
        </span>
        {message.preview && (
          <span className="hidden lg:inline text-xs text-slate-400 ml-1.5">
            — {message.preview}
          </span>
        )}
      </div>

      {/* Icons */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {message.hasAttachments && (
          <Paperclip className="w-3.5 h-3.5 text-slate-400" />
        )}
        {message.flagged && (
          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
        )}
      </div>

      {/* Date */}
      <span className="w-16 text-right text-xs text-slate-400 flex-shrink-0">
        {dateStr}
      </span>
    </button>
  );
}

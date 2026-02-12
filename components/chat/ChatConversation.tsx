'use client';

import { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useChatStore } from '@/stores/chat-store';
import { useAuthStore } from '@/stores/auth-store';
import { groupMessagesByDate, getDirectGroupDisplayName, getDirectGroupBothNames } from '@/features/chat';
import { useUsersStore } from '@/stores/users-store';
import { ChatMessage } from './ChatMessage';
import { ChatMessageInput } from './ChatMessageInput';
import { uploadFiles } from '@/lib/supabase/storage';
import { ChatAttachment } from '@/types';
import { toast } from 'sonner';

export function ChatConversation() {
  const {
    selectedGroupId,
    searchQuery,
    setSearchQuery,
    getMessagesForGroup,
    getGroupById,
    sendMessage,
    markGroupAsRead,
    replyingToMessageId,
    setReplyingTo,
    messages: allMessages,
  } = useChatStore();
  const { currentUser } = useAuthStore();
  const { getUserById } = useUsersStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [uploading, setUploading] = useState(false);

  const group = selectedGroupId ? getGroupById(selectedGroupId) : null;
  const messages = selectedGroupId ? getMessagesForGroup(selectedGroupId) : [];
  const groupedMessages = groupMessagesByDate(messages);

  const isOthersDm =
    group?.type === 'direct' && currentUser && !group.memberIds.includes(currentUser.id);

  const replyingToMessage = replyingToMessageId
    ? allMessages.find((m) => m.id === replyingToMessageId)
    : null;
  const replyingToSender = replyingToMessage ? getUserById(replyingToMessage.userId) : null;

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Mark as read when viewing
  useEffect(() => {
    if (selectedGroupId && currentUser) {
      markGroupAsRead(selectedGroupId, currentUser.id);
    }
  }, [selectedGroupId, currentUser, markGroupAsRead, messages.length]);

  const handleSend = async (text: string, files: File[]) => {
    if (!selectedGroupId || !currentUser) return;

    let attachments: ChatAttachment[] = [];

    if (files.length > 0) {
      setUploading(true);
      const results = await uploadFiles(`chat/${selectedGroupId}`, files);
      setUploading(false);

      const failed = results.filter((r) => !r.success);
      if (failed.length > 0) {
        toast.error(`Nepodařilo se nahrát ${failed.length} soubor(ů)`);
      }

      attachments = results
        .filter((r) => r.success && r.path)
        .map((r, i) => {
          const file = files[i];
          let fileType: ChatAttachment['fileType'] = 'other';
          if (file.type.startsWith('image/')) fileType = 'image';
          else if (file.type === 'application/pdf') fileType = 'pdf';
          else if (file.type.includes('spreadsheet') || file.type.includes('excel'))
            fileType = 'excel';

          return {
            id: `att-${crypto.randomUUID()}`,
            fileName: file.name,
            fileType,
            fileSize: file.size,
            url: r.path!,
            uploadedAt: new Date().toISOString(),
          };
        });

      if (attachments.length === 0 && !text.trim()) return;
    }

    sendMessage(selectedGroupId, currentUser.id, text, attachments, replyingToMessageId);
  };

  if (!selectedGroupId || !group) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="text-center text-slate-400">
          <p className="text-lg font-medium">Vyberte konverzaci</p>
          <p className="text-sm mt-1">Klikněte na skupinu vlevo pro zobrazení zpráv</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-slate-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              {group.type === 'direct'
                ? isOthersDm
                  ? getDirectGroupBothNames(group)
                  : currentUser
                    ? getDirectGroupDisplayName(group, currentUser.id)
                    : 'Neznámý'
                : group.name}
            </h2>
            <p className="text-sm text-slate-500">
              {group.type === 'direct' ? 'Přímá zpráva' : `${group.memberIds.length} členů`}
            </p>
          </div>

          {/* Search in conversation */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Hledat ve zprávách..."
              className="pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-blue-300 transition-colors w-56"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded"
                aria-label="Vymazat vyhledávání"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-400">
            <p>{searchQuery ? 'Žádné zprávy nenalezeny' : 'Zatím žádné zprávy'}</p>
          </div>
        ) : (
          Array.from(groupedMessages.entries()).map(([date, dateMessages]) => (
            <div key={date}>
              {/* Date separator */}
              <div className="flex items-center justify-center my-4">
                <span className="text-xs font-medium text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-100">
                  {date}
                </span>
              </div>

              {/* Messages for this date */}
              <div className="space-y-3">
                {dateMessages.map((message) => (
                  <ChatMessage key={message.id} message={message} onReply={setReplyingTo} />
                ))}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatMessageInput
        onSend={handleSend}
        disabled={uploading}
        replyPreview={replyingToMessage ? {
          senderName: replyingToSender?.fullName || 'Neznámý',
          text: replyingToMessage.text,
        } : null}
        onCancelReply={() => setReplyingTo(null)}
      />
    </div>
  );
}

'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { useChatStore } from '@/stores/chat-store';
import { useAuthStore } from '@/stores/auth-store';
import { groupMessagesByDate, getDirectGroupDisplayName, getDirectGroupBothNames, getMessageDeliveryStatus, formatMessageTime } from '@/features/chat';
import { useUsersStore } from '@/stores/users-store';
import { ChatMessage } from './ChatMessage';
import { ChatMessageInput } from './ChatMessageInput';
import { uploadFiles } from '@/lib/supabase/storage';
import { ChatAttachment } from '@/types';
import { toast } from 'sonner';

export function ChatConversation() {
  const {
    selectedGroupId,
    groupMessages,
    getMessagesForGroup,
    getGroupById,
    sendMessage,
    replyingToMessageId,
    setReplyingTo,
    readStatuses,
    loadOlderMessages,
    messageSearchQuery,
    messageSearchResults,
    messageSearchLoading,
    searchMessages,
    clearMessageSearch,
    navigateToSearchResult,
  } = useChatStore();
  const { currentUser } = useAuthStore();
  const { getUserById } = useUsersStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const unreadSeparatorRef = useRef<HTMLDivElement>(null);
  const [uploading, setUploading] = useState(false);
  const [initialScrollDone, setInitialScrollDone] = useState(false);
  // Snapshot of firstUnreadTimestamp at mount — doesn't change after markAsRead
  const [firstUnreadTimestamp, setFirstUnreadTimestamp] = useState<string | null>(null);
  const prevGroupIdRef = useRef<string | null>(null);
  const prevMessageCountRef = useRef(0);

  const group = selectedGroupId ? getGroupById(selectedGroupId) : null;
  const messages = useMemo(
    () => (selectedGroupId ? getMessagesForGroup(selectedGroupId) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedGroupId, groupMessages[selectedGroupId ?? '']]
  );
  const gmState = selectedGroupId ? groupMessages[selectedGroupId] : null;
  const isLoadingMessages = gmState?.loading ?? false;
  const hasMore = gmState?.hasMore ?? false;
  const groupedMessages = groupMessagesByDate(messages);

  const isOthersDm =
    group?.type === 'direct' && currentUser && !group.memberIds.includes(currentUser.id);

  // Find reply-to message in current group's messages
  const replyingToMessage = replyingToMessageId
    ? messages.find((m) => m.id === replyingToMessageId)
    : null;
  const replyingToSender = replyingToMessage ? getUserById(replyingToMessage.userId) : null;

  // Compute firstUnreadTimestamp when group changes
  useEffect(() => {
    if (!selectedGroupId || !currentUser) {
      setFirstUnreadTimestamp(null);
      return;
    }

    if (selectedGroupId !== prevGroupIdRef.current) {
      prevGroupIdRef.current = selectedGroupId;
      setInitialScrollDone(false);

      const readStatus = readStatuses.find(
        (s) => s.groupId === selectedGroupId && s.userId === currentUser.id
      );
      if (readStatus) {
        setFirstUnreadTimestamp(readStatus.lastReadAt);
      } else {
        // No read status = all messages are unread, show separator before first
        setFirstUnreadTimestamp('1970-01-01T00:00:00.000Z');
      }
    }
  }, [selectedGroupId, currentUser, readStatuses]);

  // Scroll logic: on initial load → scroll to unread separator or bottom (instant)
  // On new messages → scroll to bottom (smooth)
  useEffect(() => {
    if (messages.length === 0 || isLoadingMessages) return;

    if (!initialScrollDone) {
      // First load — scroll to unread separator or bottom
      setTimeout(() => {
        if (unreadSeparatorRef.current) {
          unreadSeparatorRef.current.scrollIntoView({ behavior: 'instant', block: 'center' });
        } else {
          messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
        }
        setInitialScrollDone(true);
        prevMessageCountRef.current = messages.length;
      }, 50);
    } else if (messages.length > prevMessageCountRef.current) {
      // New message arrived — smooth scroll to bottom
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      prevMessageCountRef.current = messages.length;
    }
  }, [messages.length, initialScrollDone, isLoadingMessages]);

  // Infinite scroll: load older messages when scrolled near top
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current || !selectedGroupId || isLoadingMessages || !hasMore) return;

    const { scrollTop } = scrollContainerRef.current;
    if (scrollTop < 100) {
      // Save current scroll height to restore position after prepend
      const container = scrollContainerRef.current;
      const prevScrollHeight = container.scrollHeight;

      loadOlderMessages(selectedGroupId).then(() => {
        // Restore scroll position after older messages are prepended
        requestAnimationFrame(() => {
          if (container) {
            const newScrollHeight = container.scrollHeight;
            container.scrollTop = newScrollHeight - prevScrollHeight;
          }
        });
      });
    }
  }, [selectedGroupId, isLoadingMessages, hasMore, loadOlderMessages]);

  // Determine if unread separator should be shown for a message
  const shouldShowUnreadSeparator = useCallback(
    (messageCreatedAt: string, index: number): boolean => {
      if (!firstUnreadTimestamp || !currentUser) return false;
      // Show separator before the first unread message from another user
      const msgTime = new Date(messageCreatedAt).getTime();
      const readTime = new Date(firstUnreadTimestamp).getTime();

      if (msgTime <= readTime) return false;

      // Check if this is the first message after the read timestamp
      if (index === 0) return true;
      const prevMsg = messages[index - 1];
      if (!prevMsg) return true;
      return new Date(prevMsg.createdAt).getTime() <= readTime;
    },
    [firstUnreadTimestamp, currentUser, messages]
  );

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

          {/* Search in conversation (DB fulltext) */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={messageSearchQuery}
              onChange={(e) => searchMessages(e.target.value)}
              placeholder="Hledat ve zprávách..."
              className="pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-blue-300 transition-colors w-56"
            />
            {messageSearchQuery && (
              <button
                onClick={clearMessageSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded"
                aria-label="Vymazat vyhledávání"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Search results overlay */}
      {messageSearchQuery.trim() && (
        <div className="border-b border-slate-200 bg-slate-50 max-h-64 overflow-y-auto">
          {messageSearchLoading ? (
            <div className="flex items-center justify-center py-4 text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              <span className="text-sm">Hledám...</span>
            </div>
          ) : messageSearchResults.length === 0 ? (
            <div className="py-4 text-center text-sm text-slate-400">
              Žádné výsledky
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {messageSearchResults.map((result) => {
                const sender = getUserById(result.userId);
                const resultGroup = getGroupById(result.groupId);
                return (
                  <button
                    key={result.messageId}
                    onClick={() => navigateToSearchResult(result)}
                    className="w-full text-left px-4 py-3 hover:bg-white transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-600">
                        {sender?.fullName || 'Neznámý'}
                      </span>
                      <span className="text-xs text-slate-400">
                        {formatMessageTime(result.createdAt)}
                      </span>
                    </div>
                    {resultGroup && resultGroup.id !== selectedGroupId && (
                      <p className="text-xs text-blue-500 mt-0.5">
                        {resultGroup.type === 'direct' && currentUser
                          ? getDirectGroupDisplayName(resultGroup, currentUser.id)
                          : resultGroup.name}
                      </p>
                    )}
                    <p className="text-sm text-slate-500 truncate mt-1">
                      {result.text}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {/* Loading indicator for older messages */}
        {isLoadingMessages && hasMore && (
          <div className="flex items-center justify-center py-2">
            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
          </div>
        )}

        {messages.length === 0 && !isLoadingMessages ? (
          <div className="flex items-center justify-center h-full text-slate-400">
            <p>Zatím žádné zprávy</p>
          </div>
        ) : (
          (() => {
            let globalIndex = 0;
            return Array.from(groupedMessages.entries()).map(([date, dateMessages]) => (
              <div key={date}>
                {/* Date separator */}
                <div className="flex items-center justify-center my-4">
                  <span className="text-xs font-medium text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-100">
                    {date}
                  </span>
                </div>

                {/* Messages for this date */}
                <div className="space-y-3">
                  {dateMessages.map((message) => {
                    const currentIndex = globalIndex++;
                    const showUnread = shouldShowUnreadSeparator(message.createdAt, currentIndex)
                      && message.userId !== currentUser?.id;
                    return (
                      <div key={message.id}>
                        {/* Unread separator */}
                        {showUnread && (
                          <div ref={unreadSeparatorRef} className="flex items-center gap-3 my-4">
                            <div className="flex-1 h-px bg-red-400" />
                            <span className="text-xs font-semibold text-red-500 whitespace-nowrap">
                              Nové zprávy
                            </span>
                            <div className="flex-1 h-px bg-red-400" />
                          </div>
                        )}
                        <ChatMessage
                          message={message}
                          onReply={setReplyingTo}
                          deliveryStatus={
                            currentUser && group
                              ? getMessageDeliveryStatus(message, group, readStatuses, currentUser.id)
                              : null
                          }
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ));
          })()
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

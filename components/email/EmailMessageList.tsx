'use client';

import { Search, Loader2 } from 'lucide-react';
import { useEmailStore } from '@/stores/email-store';
import { EmailMessageItem } from './EmailMessageItem';

export function EmailMessageList() {
  const {
    messages, searchQuery, _messagesLoading,
    messagesHasMore, messagesTotal,
    selectMessage, setSearchQuery, loadMoreMessages,
  } = useEmailStore();

  // Filter by search query
  const filtered = searchQuery
    ? messages.filter((m) =>
        m.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.preview.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.from.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.from.name && m.from.name.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : messages;

  return (
    <div className="flex flex-col h-full min-w-0">
      {/* Search bar */}
      <div className="p-3 border-b border-slate-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Hledat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-sky-300"
          />
        </div>
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden min-w-0">
        {_messagesLoading && messages.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-sm text-slate-400">
            {searchQuery ? 'Žádné výsledky' : 'Žádné zprávy'}
          </div>
        ) : (
          <>
            {filtered.map((msg) => (
              <EmailMessageItem
                key={msg.id}
                message={msg}
                onClick={() => selectMessage(msg.id)}
              />
            ))}

            {/* Load more */}
            {messagesHasMore && (
              <div className="p-4 text-center">
                <button
                  onClick={loadMoreMessages}
                  disabled={_messagesLoading}
                  className="text-sm font-medium text-sky-600 hover:text-sky-700 disabled:opacity-50"
                >
                  {_messagesLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin inline mr-1" />
                  ) : null}
                  Načíst další ({messages.length} z {messagesTotal})
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

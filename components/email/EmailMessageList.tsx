'use client';

import { useMemo, useRef, useState, useEffect } from 'react';
import { Search, Loader2, ChevronUp, ChevronDown, FolderInput, Inbox, Send, FileEdit, Trash2, ShieldAlert, Folder } from 'lucide-react';
import { useEmailStore } from '@/stores/email-store';
import { EmailMessageItem } from './EmailMessageItem';
import { cn } from '@/lib/utils';
import type { EmailFolderType } from '@/shared/types';

type SortField = 'date' | 'from' | 'subject';

const FOLDER_ICONS: Record<string, typeof Inbox> = {
  inbox: Inbox,
  sent: Send,
  drafts: FileEdit,
  trash: Trash2,
  spam: ShieldAlert,
  custom: Folder,
};

function SortHeader({ field, label, className }: { field: SortField; label: string; className?: string }) {
  const { emailSortField, emailSortDirection, setEmailSort } = useEmailStore();
  const active = emailSortField === field;

  return (
    <button
      onClick={() => setEmailSort(field)}
      aria-label={`Řadit podle ${label}${active ? (emailSortDirection === 'asc' ? ' vzestupně' : ' sestupně') : ''}`}
      className={cn(
        'flex items-center gap-0.5 text-xs transition-colors',
        active ? 'text-slate-800 font-semibold' : 'text-slate-500 font-medium hover:text-slate-700',
        className
      )}
    >
      {label}
      {active && (
        emailSortDirection === 'asc'
          ? <ChevronUp className="w-3 h-3" />
          : <ChevronDown className="w-3 h-3" />
      )}
    </button>
  );
}

function MoveDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const {
    selectedMessageIds, selectedAccountId, selectedFolderId,
    getFoldersForAccount, moveSelectedToFolder,
  } = useEmailStore();

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (selectedMessageIds.length === 0) return null;

  const folders = selectedAccountId
    ? getFoldersForAccount(selectedAccountId).filter((f) => f.id !== selectedFolderId)
    : [];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
      >
        <FolderInput className="w-4 h-4" />
        Přesunout ({selectedMessageIds.length})
      </button>

      {open && folders.length > 0 && (
        <div className="absolute left-0 top-full mt-1 z-10 bg-white border border-slate-200 rounded-lg shadow-lg py-1 min-w-[240px] max-h-96 overflow-y-auto">
          {folders.map((folder) => {
            const Icon = FOLDER_ICONS[folder.type as EmailFolderType] || Folder;
            return (
              <button
                key={folder.id}
                onClick={() => {
                  moveSelectedToFolder(folder.id);
                  setOpen(false);
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
              >
                <Icon className="w-4 h-4 flex-shrink-0 text-slate-400" />
                <span className="truncate">{folder.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function EmailMessageList() {
  const {
    messages, searchQuery, searchResults, _messagesLoading, _searchLoading,
    messagesHasMore, messagesTotal,
    emailSortField, emailSortDirection,
    selectedMessageIds,
    selectMessage, setSearchQuery, searchMessages, loadMoreMessages,
    toggleMessageSelection, selectAllMessages, clearSelection,
  } = useEmailStore();

  // Debounced global search
  useEffect(() => {
    if (!searchQuery.trim()) return;
    const timer = setTimeout(() => {
      searchMessages(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchMessages]);

  const isSearching = searchQuery.trim().length > 0;
  const sourceMessages = isSearching ? searchResults : messages;
  const loading = isSearching ? _searchLoading : _messagesLoading;

  // Client-side sorting
  const sorted = useMemo(() => {
    const dir = emailSortDirection === 'asc' ? 1 : -1;
    return [...sourceMessages].sort((a, b) => {
      switch (emailSortField) {
        case 'from':
          return dir * (a.from.name || a.from.address).localeCompare(b.from.name || b.from.address, 'cs');
        case 'subject':
          return dir * a.subject.localeCompare(b.subject, 'cs');
        case 'date':
          return dir * (new Date(a.date).getTime() - new Date(b.date).getTime());
      }
    });
  }, [sourceMessages, emailSortField, emailSortDirection]);

  const allSelected = sourceMessages.length > 0 && selectedMessageIds.length === sourceMessages.length;
  const someSelected = selectedMessageIds.length > 0 && !allSelected;

  return (
    <div className="flex flex-col h-full min-w-0">
      {/* Toolbar: select-all + move | search */}
      <div className="flex items-center gap-3 p-3 border-b border-slate-200">
        {/* Left: select-all + move dropdown */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <input
            type="checkbox"
            checked={allSelected}
            ref={(el) => { if (el) el.indeterminate = someSelected; }}
            onChange={() => allSelected || someSelected ? clearSelection() : selectAllMessages()}
            aria-label="Vybrat všechny zprávy"
            className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
          />
          <MoveDropdown />
        </div>

        {/* Right: search */}
        <div className="relative flex-1 max-w-xs ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Hledat v celém e-mailu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-sky-300"
          />
        </div>
      </div>

      {/* Sort header */}
      <div className="px-4 py-2 border-b border-slate-200 bg-slate-50 flex items-center gap-3">
        {/* Offset for checkbox + unread dot + avatar */}
        <div className="w-5 flex-shrink-0" />
        <div className="w-2 flex-shrink-0" />
        <div className="w-8 flex-shrink-0" />
        <SortHeader field="from" label="Odesílatel" className="w-44 flex-shrink-0" />
        <SortHeader field="subject" label="Předmět" className="flex-1 min-w-0" />
        <SortHeader field="date" label="Datum" className="w-16 flex-shrink-0 justify-end" />
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden min-w-0">
        {loading && sourceMessages.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-12 text-sm text-slate-400">
            {isSearching ? 'Žádné výsledky' : 'Žádné zprávy'}
          </div>
        ) : (
          <>
            {sorted.map((msg) => (
              <EmailMessageItem
                key={msg.id}
                message={msg}
                selected={selectedMessageIds.includes(msg.id)}
                onToggleSelect={() => toggleMessageSelection(msg.id)}
                onClick={() => selectMessage(msg.id)}
              />
            ))}

            {/* Load more — only for folder view, not search */}
            {!isSearching && messagesHasMore && (
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

'use client';

import { Inbox, Send, FileEdit, Trash2, ShieldAlert, Folder, Settings, ChevronDown } from 'lucide-react';
import { useEmailStore } from '@/stores/email-store';
import { useAuthStore } from '@/stores/auth-store';
import type { EmailFolder } from '@/shared/types';
import { cn } from '@/lib/utils';

const FOLDER_NAMES: Record<string, string> = {
  inbox: 'Doručená pošta',
  sent: 'Odeslaná',
  drafts: 'Koncepty',
  spam: 'Spam',
  trash: 'Koš',
};

const FOLDER_ICONS: Record<string, typeof Inbox> = {
  inbox: Inbox,
  sent: Send,
  drafts: FileEdit,
  trash: Trash2,
  spam: ShieldAlert,
  custom: Folder,
};

export function EmailSidebar() {
  const {
    selectedAccountId, selectedFolderId,
    selectAccount, selectFolder, getFoldersForAccount, getAccountsForUser,
  } = useEmailStore();
  const { currentUser } = useAuthStore();

  const userAccounts = currentUser ? getAccountsForUser(currentUser.id) : [];
  const folders = selectedAccountId ? getFoldersForAccount(selectedAccountId) : [];

  return (
    <div className="flex flex-col h-full">
      {/* Account selector */}
      <div className="p-4 border-b border-slate-200">
        {userAccounts.length > 1 ? (
          <div className="relative">
            <select
              value={selectedAccountId || ''}
              onChange={(e) => selectAccount(e.target.value || null)}
              className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 pr-8 text-sm font-semibold text-slate-700 outline-none cursor-pointer"
            >
              {!selectedAccountId && <option value="">Vyberte účet</option>}
              {userAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>{acc.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        ) : userAccounts.length === 1 ? (
          <div className="text-sm font-semibold text-slate-700 truncate">
            {userAccounts[0].name}
          </div>
        ) : (
          <div className="text-sm text-slate-400">Žádný e-mailový účet</div>
        )}
      </div>

      {/* Folder list */}
      <div className="flex-1 overflow-y-auto py-2">
        {folders.length === 0 && selectedAccountId && (
          <div className="px-4 py-8 text-center text-sm text-slate-400">
            Spusťte synchronizaci pro načtení složek
          </div>
        )}
        {folders.map((folder) => (
          <FolderItem
            key={folder.id}
            folder={folder}
            isSelected={folder.id === selectedFolderId}
            onClick={() => selectFolder(folder.id)}
          />
        ))}
      </div>

      {/* Bottom links */}
      {selectedAccountId && (
        <div className="border-t border-slate-200 p-2">
          <button className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-slate-500 rounded-lg hover:bg-slate-50 transition-colors">
            <Settings className="w-4 h-4" />
            Pravidla
          </button>
        </div>
      )}
    </div>
  );
}

function FolderItem({ folder, isSelected, onClick }: {
  folder: EmailFolder;
  isSelected: boolean;
  onClick: () => void;
}) {
  const Icon = FOLDER_ICONS[folder.type] || Folder;

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium transition-colors',
        isSelected
          ? 'bg-sky-50 text-sky-700 border-r-2 border-sky-500'
          : 'text-slate-600 hover:bg-slate-50'
      )}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="flex-1 text-left truncate">{FOLDER_NAMES[folder.type] || folder.name}</span>
      {folder.unreadCount > 0 && (
        <span className={cn(
          'inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold',
          isSelected ? 'bg-sky-200 text-sky-800' : 'bg-slate-200 text-slate-600'
        )}>
          {folder.unreadCount}
        </span>
      )}
    </button>
  );
}

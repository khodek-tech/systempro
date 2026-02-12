'use client';

import { Search, MessageCirclePlus } from 'lucide-react';
import { useChatStore } from '@/stores/chat-store';
import { useAuthStore } from '@/stores/auth-store';
import { getDirectGroupDisplayName } from '@/features/chat';
import { ChatGroupItem } from './ChatGroupItem';
import { ChatNewDmModal } from './ChatNewDmModal';

export function ChatGroupList() {
  const { selectedGroupId, selectGroup, getGroupsForUser, searchQuery, setSearchQuery, openNewDm } =
    useChatStore();
  const { currentUser } = useAuthStore();

  const groups = currentUser ? getGroupsForUser(currentUser.id) : [];

  const filteredGroups = searchQuery.trim()
    ? groups.filter((g) => {
        const query = searchQuery.toLowerCase();
        if (g.type === 'direct' && currentUser) {
          const displayName = getDirectGroupDisplayName(g, currentUser.id);
          return displayName.toLowerCase().includes(query);
        }
        return g.name.toLowerCase().includes(query);
      })
    : groups;

  return (
    <div className="flex flex-col h-full">
      {/* New DM button + Search input */}
      <div className="p-4 border-b border-slate-200 space-y-3">
        <button
          onClick={openNewDm}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 active:scale-[0.98] transition-all"
        >
          <MessageCirclePlus className="w-4 h-4" />
          Nová zpráva
        </button>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Hledat skupinu nebo zprávu..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-blue-300 transition-colors"
          />
        </div>
      </div>

      {/* Groups list */}
      <div className="flex-1 overflow-y-auto">
        {filteredGroups.length === 0 ? (
          <div className="p-4 text-center text-slate-500 text-sm">
            {searchQuery.trim() ? 'Žádné konverzace nenalezeny' : 'Nejste členem žádné skupiny'}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredGroups.map((group) => (
              <ChatGroupItem
                key={group.id}
                group={group}
                isSelected={selectedGroupId === group.id}
                onClick={() => selectGroup(group.id)}
              />
            ))}
          </div>
        )}
      </div>

      <ChatNewDmModal />
    </div>
  );
}

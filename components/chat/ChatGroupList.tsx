'use client';

import { useState } from 'react';
import { Search, MessageCirclePlus, ChevronDown, ChevronRight } from 'lucide-react';
import { useChatStore } from '@/stores/chat-store';
import { useAuthStore } from '@/stores/auth-store';
import { getDirectGroupDisplayName, getDirectGroupBothNames, sortGroupsByLastMessage } from '@/features/chat';
import { getAdminRoleId } from '@/core/stores/store-helpers';
import { ChatGroupItem } from './ChatGroupItem';
import { ChatNewDmModal } from './ChatNewDmModal';

export function ChatGroupList() {
  const { selectedGroupId, selectGroup, getGroupsForUser, searchQuery, setSearchQuery, openNewDm, messages } =
    useChatStore();
  const { currentUser, activeRoleId } = useAuthStore();
  const [showOthersDms, setShowOthersDms] = useState(false);

  const isAdmin = activeRoleId === getAdminRoleId();
  const groups = currentUser ? getGroupsForUser(currentUser.id) : [];

  const filteredGroups = searchQuery.trim()
    ? groups.filter((g) => {
        const query = searchQuery.toLowerCase();
        if (g.type === 'direct' && currentUser) {
          const displayName = isAdmin && !g.memberIds.includes(currentUser.id)
            ? getDirectGroupBothNames(g)
            : getDirectGroupDisplayName(g, currentUser.id);
          return displayName.toLowerCase().includes(query);
        }
        return g.name.toLowerCase().includes(query);
      })
    : groups;

  // Split own conversations from admin-visible others' conversations
  const visibleGroups = filteredGroups.filter(
    (g) => currentUser && g.memberIds.includes(currentUser.id)
  );
  const othersConversations = sortGroupsByLastMessage(
    filteredGroups.filter(
      (g) => currentUser && !g.memberIds.includes(currentUser.id)
    ),
    messages
  );

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
        {visibleGroups.length === 0 && othersConversations.length === 0 ? (
          <div className="p-4 text-center text-slate-500 text-sm">
            {searchQuery.trim() ? 'Žádné konverzace nenalezeny' : 'Nejste členem žádné skupiny'}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {visibleGroups.map((group) => (
              <ChatGroupItem
                key={group.id}
                group={group}
                isSelected={selectedGroupId === group.id}
                onClick={() => selectGroup(group.id)}
              />
            ))}

            {/* Others' conversations toggle (admin only) */}
            {isAdmin && othersConversations.length > 0 && (
              <>
                <button
                  onClick={() => setShowOthersDms((v) => !v)}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all"
                >
                  {showOthersDms ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                  {showOthersDms
                    ? `− Skrýt cizí konverzace`
                    : `+ Zobrazit cizí konverzace (${othersConversations.length})`}
                </button>

                {showOthersDms &&
                  othersConversations.map((group) => (
                    <ChatGroupItem
                      key={group.id}
                      group={group}
                      isSelected={selectedGroupId === group.id}
                      onClick={() => selectGroup(group.id)}
                      isOthersDm
                    />
                  ))}
              </>
            )}
          </div>
        )}
      </div>

      <ChatNewDmModal />
    </div>
  );
}

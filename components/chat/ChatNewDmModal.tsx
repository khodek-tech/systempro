'use client';

import { useState } from 'react';
import { X, Search, User } from 'lucide-react';
import { useChatStore } from '@/stores/chat-store';
import { useAuthStore } from '@/stores/auth-store';
import { useUsersStore } from '@/stores/users-store';

export function ChatNewDmModal() {
  const { isNewDmOpen, closeNewDm, startDirectMessage } = useChatStore();
  const { currentUser } = useAuthStore();
  const { users } = useUsersStore();
  const [search, setSearch] = useState('');

  if (!isNewDmOpen) return null;

  const activeUsers = users
    .filter((u) => u.active && u.id !== currentUser?.id)
    .sort((a, b) => a.fullName.localeCompare(b.fullName, 'cs'));

  const filteredUsers = search.trim()
    ? activeUsers.filter((u) =>
        u.fullName.toLowerCase().includes(search.toLowerCase())
      )
    : activeUsers;

  const handleSelect = (userId: string) => {
    setSearch('');
    startDirectMessage(userId);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-center text-slate-800">
            Nová zpráva
          </h2>
          <button
            onClick={() => {
              setSearch('');
              closeNewDm();
            }}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Zavřít"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Hledat zaměstnance..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-blue-300 transition-colors"
            autoFocus
          />
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {filteredUsers.length === 0 ? (
            <div className="p-4 text-center text-slate-500 text-sm">
              Žádní zaměstnanci nenalezeni
            </div>
          ) : (
            filteredUsers.map((user) => (
              <button
                key={user.id}
                onClick={() => handleSelect(user.id)}
                className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <span className="font-medium text-slate-800">
                  {user.fullName}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

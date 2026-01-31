'use client';

import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChatStore } from '@/stores/chat-store';
import { ChatGroupList } from '@/components/chat/ChatGroupList';
import { ChatConversation } from '@/components/chat/ChatConversation';

export function ChatFullView() {
  const { closeChatView, selectedGroupId, selectGroup } = useChatStore();

  return (
    <main className="flex-1 flex flex-col overflow-hidden bg-slate-50">
      {/* Header */}
      <div className="flex items-center justify-between bg-white border-b border-slate-200 px-6 py-4">
        <Button
          onClick={closeChatView}
          variant="outline"
          className="px-4 py-2 rounded-lg text-xs font-medium"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Zpět
        </Button>

        <h1 className="text-xl font-bold text-slate-800">Chat</h1>

        <div className="w-[88px]" /> {/* Spacer for centering */}
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Mobile: Show either list or conversation */}
        <div className="md:hidden flex-1 flex">
          {!selectedGroupId ? (
            <div className="flex-1 bg-white border-r border-slate-200">
              <ChatGroupList />
            </div>
          ) : (
            <div className="flex-1 flex flex-col">
              {/* Mobile back button */}
              <button
                onClick={() => selectGroup(null)}
                className="flex items-center gap-2 px-4 py-3 bg-white border-b border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                <ArrowLeft className="w-4 h-4" />
                Zpět na skupiny
              </button>
              <ChatConversation />
            </div>
          )}
        </div>

        {/* Desktop: Show both side by side */}
        <div className="hidden md:flex flex-1">
          {/* Groups sidebar */}
          <div className="w-80 flex-shrink-0 bg-white border-r border-slate-200">
            <ChatGroupList />
          </div>

          {/* Conversation */}
          <ChatConversation />
        </div>
      </div>
    </main>
  );
}

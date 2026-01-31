'use client';

import { useState } from 'react';
import { X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChatStore } from '@/stores/chat-store';
import { useUsersStore } from '@/stores/users-store';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/utils';

interface FormState {
  name: string;
  memberIds: string[];
  error: string;
}

function ChatGroupFormContent() {
  const { editingGroupId, closeGroupForm, createGroup, updateGroup, getGroupById } =
    useChatStore();
  const { users } = useUsersStore();
  const { currentUser } = useAuthStore();

  const editingGroup = editingGroupId ? getGroupById(editingGroupId) : null;

  // Initialize state from editing group (computed during render, not in effect)
  const [formState, setFormState] = useState<FormState>(() => ({
    name: editingGroup?.name || '',
    memberIds: editingGroup?.memberIds || [],
    error: '',
  }));

  const activeUsers = users.filter((u) => u.active);

  const toggleMember = (userId: string) => {
    setFormState((prev) => ({
      ...prev,
      memberIds: prev.memberIds.includes(userId)
        ? prev.memberIds.filter((id) => id !== userId)
        : [...prev.memberIds, userId],
    }));
  };

  const selectAll = () => {
    setFormState((prev) => ({
      ...prev,
      memberIds: activeUsers.map((u) => u.id),
    }));
  };

  const deselectAll = () => {
    setFormState((prev) => ({
      ...prev,
      memberIds: [],
    }));
  };

  const handleSubmit = () => {
    if (!formState.name.trim()) {
      setFormState((prev) => ({ ...prev, error: 'Název skupiny je povinný' }));
      return;
    }

    if (formState.memberIds.length < 2) {
      setFormState((prev) => ({ ...prev, error: 'Skupina musí mít alespoň 2 členy' }));
      return;
    }

    if (editingGroupId) {
      updateGroup(editingGroupId, {
        name: formState.name.trim(),
        memberIds: formState.memberIds,
      });
    } else {
      createGroup(formState.name.trim(), formState.memberIds, currentUser?.id || '');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-800">
            {editingGroupId ? 'Upravit skupinu' : 'Nová skupina'}
          </h2>
          <button
            onClick={closeGroupForm}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Název skupiny
            </label>
            <input
              type="text"
              value={formState.name}
              onChange={(e) =>
                setFormState((prev) => ({ ...prev, name: e.target.value, error: '' }))
              }
              placeholder="např. Vedení, Prodejna Bohnice..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-base font-medium outline-none focus:border-blue-300 transition-colors"
            />
          </div>

          {/* Members */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-slate-700">
                Členové ({formState.memberIds.length})
              </label>
              <div className="flex gap-2">
                <button
                  onClick={selectAll}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700"
                >
                  Vybrat vše
                </button>
                <span className="text-slate-300">|</span>
                <button
                  onClick={deselectAll}
                  className="text-xs font-medium text-slate-500 hover:text-slate-700"
                >
                  Zrušit vše
                </button>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 max-h-64 overflow-y-auto">
              {activeUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => toggleMember(user.id)}
                  className={cn(
                    'w-full flex items-center justify-between p-3 rounded-lg transition-colors text-left',
                    formState.memberIds.includes(user.id)
                      ? 'bg-blue-50 text-blue-700'
                      : 'hover:bg-slate-100 text-slate-700'
                  )}
                >
                  <span className="font-medium">{user.fullName}</span>
                  {formState.memberIds.includes(user.id) && (
                    <Check className="w-4 h-4 text-blue-600" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {formState.error && (
            <p className="text-sm font-medium text-red-600 bg-red-50 p-3 rounded-lg">
              {formState.error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200">
          <Button variant="outline" onClick={closeGroupForm} className="px-6">
            Zrušit
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-blue-600 text-white hover:bg-blue-700 px-6"
          >
            {editingGroupId ? 'Uložit změny' : 'Vytvořit skupinu'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ChatGroupFormModal() {
  const { isGroupFormOpen } = useChatStore();

  // Remount the form content when modal opens to reset state
  if (!isGroupFormOpen) return null;

  return <ChatGroupFormContent />;
}

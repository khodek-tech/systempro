'use client';

import { useState, useRef } from 'react';
import { X, User, Building2, Paperclip, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTasksStore } from '@/stores/tasks-store';
import { useAuthStore } from '@/stores/auth-store';
import { useUsersStore } from '@/stores/users-store';
import { useStoresStore } from '@/stores/stores-store';
import { TaskPriority, TaskRepeat, TaskAssigneeType, TaskAttachment } from '@/types';
import { cn } from '@/lib/utils';
import { uploadFiles } from '@/lib/supabase/storage';
import { toast } from 'sonner';

const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: 'high', label: 'Vysoká' },
  { value: 'medium', label: 'Střední' },
  { value: 'low', label: 'Nízká' },
];

const REPEAT_OPTIONS: { value: TaskRepeat; label: string }[] = [
  { value: 'none', label: 'Neopakovat' },
  { value: 'daily', label: 'Denně' },
  { value: 'weekly', label: 'Týdně' },
  { value: 'monthly', label: 'Měsíčně' },
  { value: 'yearly', label: 'Ročně' },
];

export function TaskFormModal() {
  const { closeFormModal, createTask, editingTaskId, getTaskById, updateTask, addComment } = useTasksStore();
  const { currentUser } = useAuthStore();
  const { users } = useUsersStore();
  const { stores } = useStoresStore();

  const existingTask = editingTaskId ? getTaskById(editingTaskId) : null;

  const [title, setTitle] = useState(existingTask?.title || '');
  const [description, setDescription] = useState(existingTask?.description || '');
  const [priority, setPriority] = useState<TaskPriority>(existingTask?.priority || 'medium');
  const [repeat, setRepeat] = useState<TaskRepeat>(existingTask?.repeat || 'none');
  const [assigneeType, setAssigneeType] = useState<TaskAssigneeType>(existingTask?.assigneeType || 'employee');
  const [assigneeId, setAssigneeId] = useState(existingTask?.assigneeId || '');
  const [deadline, setDeadline] = useState(
    existingTask ? new Date(existingTask.deadline).toISOString().slice(0, 16) : ''
  );
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeUsers = users
    .filter((u) => u.active)
    .sort((a, b) => a.fullName.localeCompare(b.fullName, 'cs'));
  const activeStores = stores
    .filter((s) => s.active)
    .sort((a, b) => a.name.localeCompare(b.name, 'cs'));

  if (!currentUser) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!title.trim()) {
      setError('Vyplňte název úkolu');
      return;
    }
    if (!assigneeId) {
      setError('Vyberte příjemce');
      return;
    }
    if (!deadline) {
      setError('Zadejte termín splnění');
      return;
    }

    setIsSubmitting(true);

    if (editingTaskId && existingTask) {
      // Update existing task
      await updateTask(editingTaskId, {
        title: title.trim(),
        description: description.trim(),
        priority,
        repeat,
        assigneeType,
        assigneeId,
        deadline: new Date(deadline).toISOString(),
      });
    } else {
      // Create new task
      const result = await createTask({
        title: title.trim(),
        description: description.trim(),
        priority,
        repeat,
        assigneeType,
        assigneeId,
        deadline: new Date(deadline).toISOString(),
        createdBy: currentUser.id,
      });

      // Upload attachments if any
      if (result.success && result.taskId && selectedFiles.length > 0) {
        const uploadResults = await uploadFiles(`tasks/${result.taskId}`, selectedFiles);

        const failed = uploadResults.filter((r) => !r.success);
        if (failed.length > 0) {
          toast.error(`Nepodařilo se nahrát ${failed.length} soubor(ů)`);
        }

        const attachments: TaskAttachment[] = uploadResults
          .filter((r) => r.success && r.path)
          .map((r, i) => ({
            id: `att-${crypto.randomUUID()}`,
            fileName: selectedFiles[i].name,
            fileType: selectedFiles[i].type,
            fileUrl: r.path!,
            uploadedAt: new Date().toISOString(),
            uploadedBy: currentUser.id,
          }));

        if (attachments.length > 0) {
          await addComment(result.taskId, currentUser.id, '', attachments);
        }
      }
    }

    setIsSubmitting(false);
    closeFormModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={closeFormModal} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-800">
            {editingTaskId ? 'Upravit úkol' : 'Nový úkol'}
          </h2>
          <button
            onClick={closeFormModal}
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-160px)]">
          <div className="grid grid-cols-2 gap-6">
            {/* Left column */}
            <div className="space-y-5">
              {/* Title */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  Název úkolu <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Zadejte název úkolu"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-base font-medium outline-none focus:border-violet-300"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Popis</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Popište úkol podrobněji..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-base font-medium outline-none resize-none focus:border-violet-300 h-32"
                />
              </div>

              {/* Attachments (only for new tasks) */}
              {!editingTaskId && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Přílohy</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) {
                        setSelectedFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
                      }
                      e.target.value = '';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors"
                  >
                    <Paperclip className="w-4 h-4" />
                    Přiložit soubory
                  </button>
                  {selectedFiles.length > 0 && (
                    <div className="space-y-1.5 mt-2">
                      {selectedFiles.map((file, idx) => (
                        <div
                          key={`${file.name}-${idx}`}
                          className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg text-sm"
                        >
                          <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                          <span className="text-slate-600 font-medium truncate flex-1">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => setSelectedFiles((prev) => prev.filter((_, i) => i !== idx))}
                            className="text-slate-400 hover:text-red-500 transition-colors shrink-0"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Priority and Repeat */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Priorita</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-base font-semibold outline-none cursor-pointer focus:border-violet-300"
                  >
                    {PRIORITY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Opakování</label>
                  <select
                    value={repeat}
                    onChange={(e) => setRepeat(e.target.value as TaskRepeat)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-base font-semibold outline-none cursor-pointer focus:border-violet-300"
                  >
                    {REPEAT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-5">
              {/* Assignee type toggle */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Přiřazení</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAssigneeType('employee');
                      setAssigneeId('');
                    }}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all',
                      assigneeType === 'employee'
                        ? 'bg-violet-100 text-violet-700 border-2 border-violet-300'
                        : 'bg-slate-50 text-slate-500 border-2 border-transparent hover:bg-slate-100'
                    )}
                  >
                    <User className="w-4 h-4" />
                    Zaměstnanec
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAssigneeType('store');
                      setAssigneeId('');
                    }}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all',
                      assigneeType === 'store'
                        ? 'bg-violet-100 text-violet-700 border-2 border-violet-300'
                        : 'bg-slate-50 text-slate-500 border-2 border-transparent hover:bg-slate-100'
                    )}
                  >
                    <Building2 className="w-4 h-4" />
                    Prodejna
                  </button>
                </div>
              </div>

              {/* Assignee select */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  {assigneeType === 'employee' ? 'Vyberte zaměstnance' : 'Vyberte prodejnu'}{' '}
                  <span className="text-red-500">*</span>
                </label>
                <Select value={assigneeId} onValueChange={setAssigneeId}>
                  <SelectTrigger className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 h-auto text-base font-semibold outline-none cursor-pointer focus:border-violet-300">
                    <SelectValue
                      placeholder={
                        assigneeType === 'employee' ? '-- Vyberte zaměstnance --' : '-- Vyberte prodejnu --'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent position="popper" className="max-h-[300px] bg-white border border-slate-200 rounded-xl shadow-lg z-[100]">
                    {assigneeType === 'employee'
                      ? activeUsers.map((user) => (
                          <SelectItem
                            key={user.id}
                            value={user.id}
                            className="cursor-pointer hover:bg-slate-100 p-3 text-base"
                          >
                            {user.fullName}
                          </SelectItem>
                        ))
                      : activeStores.map((store) => (
                          <SelectItem
                            key={store.id}
                            value={store.id}
                            className="cursor-pointer hover:bg-slate-100 p-3 text-base"
                          >
                            {store.name}
                          </SelectItem>
                        ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Deadline */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  Termín splnění <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-base font-medium outline-none focus:border-violet-300"
                />
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mt-5">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 mt-5 border-t border-slate-200">
            <Button type="button" onClick={closeFormModal} variant="outline" className="px-6 py-2.5 rounded-lg">
              Zrušit
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-violet-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-violet-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Ukládám...' : editingTaskId ? 'Uložit změny' : 'Vytvořit úkol'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

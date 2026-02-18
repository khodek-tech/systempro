'use client';

import { useState, useEffect } from 'react';
import { X, User, Building2, Clock, RotateCcw, Send, Paperclip, FileText, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTasksStore } from '@/stores/tasks-store';
import { useAuthStore } from '@/stores/auth-store';
import { useUsersStore } from '@/stores/users-store';
import { useStoresStore } from '@/stores/stores-store';
import {
  getTaskStatusConfig,
  getTaskPriorityConfig,
  isDeadlineApproaching,
  isDeadlineOverdue,
  getRepeatLabel,
  canSubmitForApproval,
  canApproveTask,
  canReturnTask,
  canDelegateTask,
  canReturnToDelegator,
  canApproveDelegation,
  canReturnToDelegatee,
} from '@/lib/tasks-helpers';
import type { TaskAttachment } from '@/types';
import { cn } from '@/lib/utils';
import { linkifyText } from '@/lib/linkify';
import { uploadFiles } from '@/lib/supabase/storage';
import { useSignedUrl } from '@/lib/hooks/use-signed-url';
import { toast } from 'sonner';

function TaskAttachmentLink({ att }: { att: TaskAttachment }) {
  const signedUrl = useSignedUrl(att.fileUrl);

  return (
    <a
      href={signedUrl || '#'}
      target="_blank"
      rel="noopener noreferrer"
      download={att.fileName}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 hover:border-slate-300 transition-colors',
        !signedUrl && 'pointer-events-none opacity-50'
      )}
    >
      <FileText className="w-3.5 h-3.5 text-slate-400" />
      <span className="max-w-[150px] truncate">{att.fileName}</span>
    </a>
  );
}

export function TaskDetailModal() {
  const {
    selectedTaskId,
    closeTaskDetail,
    getTaskById,
    submitForApproval,
    approveTask,
    returnTask,
    addComment,
    markTaskAsSeen,
    delegateTask,
    returnToDelegator,
    approveDelegation,
    returnToDelegatee,
  } = useTasksStore();
  const { currentUser } = useAuthStore();
  const { users } = useUsersStore();
  const { stores } = useStoresStore();

  const [commentText, setCommentText] = useState('');
  const [returnReason, setReturnReason] = useState('');
  const [showReturnInput, setShowReturnInput] = useState(false);
  const [showReturnToDelegateeInput, setShowReturnToDelegateeInput] = useState(false);
  const [showDelegateModal, setShowDelegateModal] = useState(false);
  const [selectedDelegatee, setSelectedDelegatee] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const task = selectedTaskId ? getTaskById(selectedTaskId) : null;

  // Mark task as seen when opening - must be in useEffect to avoid infinite re-render loop
  // Using selectedTaskId instead of task.id to avoid triggering on every task change
  const currentUserId = currentUser?.id;
  useEffect(() => {
    if (selectedTaskId && currentUserId) {
      markTaskAsSeen(selectedTaskId, currentUserId);
    }
  }, [selectedTaskId, currentUserId, markTaskAsSeen]);

  if (!task || !currentUser) return null;

  const statusConfig = getTaskStatusConfig(task.status);
  const priorityConfig = getTaskPriorityConfig(task.priority);
  const repeatLabel = getRepeatLabel(task.repeat);

  const deadline = new Date(task.deadline);
  const isApproaching = isDeadlineApproaching(task.deadline);
  const isOverdue = isDeadlineOverdue(task.deadline) && task.status !== 'approved';

  // Get assignee name
  let assigneeName = '';
  if (task.assigneeType === 'employee') {
    const user = users.find((u) => u.id === task.assigneeId);
    assigneeName = user?.fullName || 'Neznámý uživatel';
  } else {
    const store = stores.find((s) => s.id === task.assigneeId);
    assigneeName = store?.name || 'Neznámá prodejna';
  }

  // Get creator name
  const creator = users.find((u) => u.id === task.createdBy);
  const creatorName = creator?.fullName || 'Neznámý uživatel';

  // Format date
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('cs-CZ', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Permissions
  const canSubmit = canSubmitForApproval(currentUser.id, task);
  const canApprove = canApproveTask(currentUser.id, task);
  const canReturn = canReturnTask(currentUser.id, task);

  // Delegation permissions
  const canDelegate = canDelegateTask(currentUser.id, task);
  const canReturnToDelegatorAction = canReturnToDelegator(currentUser.id, task);
  const canApproveDelegationAction = canApproveDelegation(currentUser.id, task);
  const canReturnToDelegateeAction = canReturnToDelegatee(currentUser.id, task);

  // Get delegatee name if task is delegated
  const delegatee = task.delegatedTo ? users.find((u) => u.id === task.delegatedTo) : null;
  const delegateeName = delegatee?.fullName || 'Neznámý uživatel';

  // Get delegator name if task was delegated
  const delegator = task.delegatedBy ? users.find((u) => u.id === task.delegatedBy) : null;
  const delegatorName = delegator?.fullName || 'Neznámý uživatel';

  // Get available users for delegation (exclude current user, creator, and assignee)
  const availableForDelegation = users.filter(
    (u) => u.active && u.id !== currentUser.id && u.id !== task.createdBy && u.id !== task.assigneeId
  );

  // Handlers
  const handleSubmit = async () => {
    setError(null);
    const result = await submitForApproval(task.id, currentUser.id);
    if (!result.success) {
      setError(result.error || 'Chyba při odesílání ke schválení');
    }
  };

  const handleApprove = async () => {
    setError(null);
    const result = await approveTask(task.id, currentUser.id);
    if (!result.success) {
      setError(result.error || 'Chyba při schvalování úkolu');
    }
  };

  const handleReturn = async () => {
    if (!showReturnInput) {
      setShowReturnInput(true);
      return;
    }

    setError(null);
    const result = await returnTask(task.id, currentUser.id, returnReason);
    if (!result.success) {
      setError(result.error || 'Chyba při vracení úkolu');
    } else {
      setShowReturnInput(false);
      setReturnReason('');
    }
  };

  // Delegation handlers
  const handleDelegate = async () => {
    if (!selectedDelegatee) {
      setError('Vyberte osobu pro delegování');
      return;
    }

    setError(null);
    const result = await delegateTask(task.id, currentUser.id, selectedDelegatee);
    if (!result.success) {
      setError(result.error || 'Chyba při delegování úkolu');
    } else {
      setShowDelegateModal(false);
      setSelectedDelegatee('');
    }
  };

  const handleReturnToDelegator = async () => {
    setError(null);
    const result = await returnToDelegator(task.id, currentUser.id);
    if (!result.success) {
      setError(result.error || 'Chyba při vracení úkolu delegujícímu');
    }
  };

  const handleApproveDelegation = async () => {
    setError(null);
    const result = await approveDelegation(task.id, currentUser.id);
    if (!result.success) {
      setError(result.error || 'Chyba při schvalování delegace');
    }
  };

  const handleReturnToDelegatee = async () => {
    if (!showReturnToDelegateeInput) {
      setShowReturnToDelegateeInput(true);
      return;
    }

    setError(null);
    const result = await returnToDelegatee(task.id, currentUser.id, returnReason);
    if (!result.success) {
      setError(result.error || 'Chyba při vracení úkolu delegovanému');
    } else {
      setShowReturnToDelegateeInput(false);
      setReturnReason('');
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() && selectedFiles.length === 0) return;

    let attachments: TaskAttachment[] = [];

    if (selectedFiles.length > 0) {
      const results = await uploadFiles(`tasks/${task.id}`, selectedFiles);

      const failed = results.filter((r) => !r.success);
      if (failed.length > 0) {
        toast.error(`Nepodařilo se nahrát ${failed.length} soubor(ů)`);
      }

      attachments = results
        .filter((r) => r.success && r.path)
        .map((r, i) => ({
          id: `att-${crypto.randomUUID()}`,
          fileName: selectedFiles[i].name,
          fileType: selectedFiles[i].type,
          fileUrl: r.path!,
          uploadedAt: new Date().toISOString(),
          uploadedBy: currentUser.id,
        }));

      if (attachments.length === 0 && !commentText.trim()) return;
    }

    addComment(task.id, currentUser.id, commentText.trim(), attachments);
    setCommentText('');
    setSelectedFiles([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleAddComment();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={closeTaskDetail} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-800">{task.title}</h2>
            <span className={cn('px-2.5 py-1 rounded-lg text-xs font-semibold', statusConfig.bgColor, statusConfig.textColor)}>
              {statusConfig.label}
            </span>
            <span className={cn('px-2.5 py-1 rounded-lg text-xs font-semibold', priorityConfig.bgColor, priorityConfig.textColor)}>
              {priorityConfig.label}
            </span>
            {repeatLabel && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-100 text-blue-700">
                <RotateCcw className="w-3 h-3" />
                {repeatLabel}
              </span>
            )}
          </div>
          <button
            onClick={closeTaskDetail}
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)] space-y-6">
          {/* Description */}
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-sm text-slate-600 whitespace-pre-wrap">
              {linkifyText(task.description, 'text-blue-600 underline break-all')}
            </p>
          </div>

          {/* Return reason */}
          {task.returnReason && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-orange-700 mb-1">Důvod vrácení:</p>
              <p className="text-sm text-orange-600 whitespace-pre-wrap">{linkifyText(task.returnReason, 'text-orange-700 underline break-all')}</p>
            </div>
          )}

          {/* Meta info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <User className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-400 font-medium">Vytvořil</p>
                <p className="text-sm font-semibold text-slate-700">{creatorName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              {task.assigneeType === 'employee' ? (
                <User className="w-5 h-5 text-slate-400" />
              ) : (
                <Building2 className="w-5 h-5 text-slate-400" />
              )}
              <div>
                <p className="text-xs text-slate-400 font-medium">Přiřazeno</p>
                <p className="text-sm font-semibold text-slate-700">{assigneeName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <Clock className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-400 font-medium">Vytvořeno</p>
                <p className="text-sm font-semibold text-slate-700">{formatDate(task.createdAt)}</p>
              </div>
            </div>
            <div
              className={cn(
                'flex items-center gap-3 p-3 rounded-xl',
                isOverdue ? 'bg-red-50' : isApproaching ? 'bg-orange-50' : 'bg-slate-50'
              )}
            >
              <Clock className={cn('w-5 h-5', isOverdue ? 'text-red-400' : isApproaching ? 'text-orange-400' : 'text-slate-400')} />
              <div>
                <p className={cn('text-xs font-medium', isOverdue ? 'text-red-400' : isApproaching ? 'text-orange-400' : 'text-slate-400')}>
                  Termín
                </p>
                <p
                  className={cn(
                    'text-sm font-semibold',
                    isOverdue ? 'text-red-700' : isApproaching ? 'text-orange-700' : 'text-slate-700'
                  )}
                >
                  {formatDate(deadline)}
                  {isOverdue && ' (po termínu)'}
                  {isApproaching && !isOverdue && ' (blíží se)'}
                </p>
              </div>
            </div>
          </div>

          {/* Delegation info */}
          {task.delegatedTo && (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-sm font-semibold text-purple-700">
                    Delegováno na: {delegateeName}
                  </p>
                  <p className="text-xs text-purple-600">
                    Delegoval: {delegatorName} • {task.delegatedAt && formatDate(task.delegatedAt)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-3 flex-wrap">
            {canDelegate && (
              <Button
                onClick={() => setShowDelegateModal(true)}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-purple-700"
              >
                Delegovat
              </Button>
            )}
            {canSubmit && (
              <Button
                onClick={handleSubmit}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700"
              >
                Odeslat ke schválení
              </Button>
            )}
            {canReturnToDelegatorAction && (
              <Button
                onClick={handleReturnToDelegator}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700"
              >
                Vrátit delegujícímu
              </Button>
            )}
            {canApproveDelegationAction && !showReturnToDelegateeInput && (
              <Button
                onClick={handleApproveDelegation}
                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700"
              >
                Schválit a odeslat výš
              </Button>
            )}
            {canReturnToDelegateeAction && !showReturnToDelegateeInput && (
              <Button
                onClick={handleReturnToDelegatee}
                className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-orange-600"
              >
                Vrátit delegovanému
              </Button>
            )}
            {canApprove && (
              <Button
                onClick={handleApprove}
                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700"
              >
                Schválit
              </Button>
            )}
            {canReturn && !showReturnInput && (
              <Button
                onClick={handleReturn}
                className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-orange-600"
              >
                Vrátit
              </Button>
            )}
          </div>

          {/* Return reason input */}
          {showReturnInput && (
            <div className="space-y-3 bg-orange-50 border border-orange-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-orange-700">
                Klikněte na &quot;Potvrdit vrácení&quot; pro dokončení akce
              </p>
              <textarea
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                placeholder="Důvod vrácení (volitelné)..."
                className="w-full bg-white border border-slate-200 rounded-xl p-4 text-sm font-medium outline-none resize-none focus:border-orange-300 h-24"
              />
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleReturn}
                  className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-orange-600 animate-pulse"
                >
                  Potvrdit vrácení
                </Button>
                <Button
                  onClick={() => {
                    setShowReturnInput(false);
                    setReturnReason('');
                  }}
                  variant="outline"
                  className="px-4 py-2 rounded-lg text-sm font-medium"
                >
                  Zrušit
                </Button>
              </div>
            </div>
          )}

          {/* Return to delegatee reason input */}
          {showReturnToDelegateeInput && (
            <div className="space-y-3 bg-orange-50 border border-orange-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-orange-700">
                Klikněte na &quot;Potvrdit vrácení&quot; pro dokončení akce
              </p>
              <textarea
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                placeholder="Důvod vrácení delegovanému (volitelné)..."
                className="w-full bg-white border border-slate-200 rounded-xl p-4 text-sm font-medium outline-none resize-none focus:border-orange-300 h-24"
              />
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleReturnToDelegatee}
                  className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-orange-600 animate-pulse"
                >
                  Potvrdit vrácení
                </Button>
                <Button
                  onClick={() => {
                    setShowReturnToDelegateeInput(false);
                    setReturnReason('');
                  }}
                  variant="outline"
                  className="px-4 py-2 rounded-lg text-sm font-medium"
                >
                  Zrušit
                </Button>
              </div>
            </div>
          )}

          {/* Delegate modal */}
          {showDelegateModal && (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-4">
              <h4 className="text-sm font-semibold text-purple-800">Delegovat úkol</h4>
              <select
                value={selectedDelegatee}
                onChange={(e) => setSelectedDelegatee(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl p-4 text-base font-semibold outline-none cursor-pointer focus:border-purple-300"
              >
                <option value="">Vyberte osobu...</option>
                {availableForDelegation.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.fullName}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleDelegate}
                  disabled={!selectedDelegatee}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-purple-700 disabled:opacity-50"
                >
                  Delegovat
                </Button>
                <Button
                  onClick={() => {
                    setShowDelegateModal(false);
                    setSelectedDelegatee('');
                  }}
                  variant="outline"
                  className="px-4 py-2 rounded-lg text-sm font-medium"
                >
                  Zrušit
                </Button>
              </div>
            </div>
          )}

          {/* Comments section */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-slate-800">Komentáře</h3>

            {/* Comments list */}
            {task.comments.length > 0 ? (
              <div className="space-y-3">
                {task.comments.map((comment) => {
                  const commentUser = users.find((u) => u.id === comment.userId);
                  const isOwnComment = comment.userId === currentUser.id;

                  return (
                    <div
                      key={comment.id}
                      className={cn(
                        'p-4 rounded-xl',
                        isOwnComment ? 'bg-violet-50 ml-8' : 'bg-slate-50 mr-8'
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-slate-700">
                          {commentUser?.fullName || 'Neznámý uživatel'}
                        </span>
                        <span className="text-xs text-slate-400">{formatDate(comment.createdAt)}</span>
                      </div>
                      {comment.text && (
                        <p className="text-sm text-slate-600">
                          {linkifyText(comment.text, 'text-blue-600 underline break-all')}
                        </p>
                      )}
                      {comment.attachments.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {comment.attachments.map((att) => (
                            <TaskAttachmentLink key={att.id} att={att} />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-400">Zatím žádné komentáře</p>
            )}

            {/* Add comment */}
            {task.status !== 'approved' && (
              <div className="space-y-3">
                <div className="flex items-end gap-3">
                  <div className="flex-1 space-y-2">
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Napište komentář..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium outline-none resize-none focus:border-violet-300 h-20"
                    />
                    {/* Selected files preview */}
                    {selectedFiles.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedFiles.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-1.5 px-2 py-1 bg-violet-100 rounded-lg text-xs font-medium text-violet-700"
                          >
                            <FileText className="w-3 h-3" />
                            <span className="max-w-[100px] truncate">{file.name}</span>
                            <button
                              onClick={() => removeFile(index)}
                              className="ml-1 p-0.5 rounded hover:bg-violet-200"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <input
                      type="file"
                      id="file-upload"
                      multiple
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer p-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                    >
                      <Paperclip className="w-5 h-5" />
                    </label>
                    <Button
                      onClick={() => void handleAddComment()}
                      disabled={!commentText.trim() && selectedFiles.length === 0}
                      className="bg-violet-600 text-white p-3 rounded-xl hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

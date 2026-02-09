'use client';

import { Paperclip, Download, AlertTriangle } from 'lucide-react';
import type { EmailAttachmentMeta } from '@/shared/types';
import { formatEmailSize } from '@/features/email/email-helpers';

interface EmailAttachmentBadgeProps {
  attachment: EmailAttachmentMeta;
  accountId: string;
  folderId: string;
  messageUid: number;
  showWarning?: boolean;
}

export function EmailAttachmentBadge({
  attachment,
  accountId,
  folderId,
  messageUid,
  showWarning = false,
}: EmailAttachmentBadgeProps) {
  const handleDownload = () => {
    const params = new URLSearchParams({
      accountId,
      folderId,
      messageUid: String(messageUid),
      partId: attachment.partId,
    });
    window.open(`/api/email/attachment?${params.toString()}`, '_blank');
  };

  return (
    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm">
      <Paperclip className="w-4 h-4 text-slate-400 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="font-medium text-slate-700 truncate">{attachment.name}</div>
        <div className="text-xs text-slate-400">{formatEmailSize(attachment.size)}</div>
      </div>
      {showWarning && (
        <span title="Neznámý odesílatel"><AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" /></span>
      )}
      <button
        onClick={handleDownload}
        className="p-1 rounded hover:bg-slate-200 transition-colors flex-shrink-0"
        title="Stáhnout"
        aria-label="Stáhnout přílohu"
      >
        <Download className="w-4 h-4 text-slate-500" />
      </button>
    </div>
  );
}

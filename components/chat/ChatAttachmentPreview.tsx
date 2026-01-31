'use client';

import { FileText, Image as ImageIcon, FileSpreadsheet, File, X } from 'lucide-react';
import { ChatAttachment } from '@/types';
import { formatFileSize } from '@/features/chat';

interface ChatAttachmentPreviewProps {
  attachment: ChatAttachment;
  onRemove?: () => void;
  isEditable?: boolean;
}

export function ChatAttachmentPreview({
  attachment,
  onRemove,
  isEditable = false,
}: ChatAttachmentPreviewProps) {
  const getIcon = () => {
    switch (attachment.fileType) {
      case 'image':
        return <ImageIcon className="w-5 h-5 text-green-500" />;
      case 'pdf':
        return <FileText className="w-5 h-5 text-red-500" />;
      case 'excel':
        return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
      default:
        return <File className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-2 max-w-xs">
      <div className="flex-shrink-0">{getIcon()}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-700 truncate">{attachment.fileName}</p>
        <p className="text-xs text-slate-400">{formatFileSize(attachment.fileSize)}</p>
      </div>
      {isEditable && onRemove && (
        <button
          onClick={onRemove}
          className="flex-shrink-0 p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
          title="Odebrat"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

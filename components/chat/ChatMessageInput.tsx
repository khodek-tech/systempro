'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { Send, Paperclip } from 'lucide-react';
import { ChatAttachment } from '@/types';
import { ChatAttachmentPreview } from './ChatAttachmentPreview';

interface ChatMessageInputProps {
  onSend: (text: string, attachments: ChatAttachment[]) => void;
  disabled?: boolean;
}

export function ChatMessageInput({ onSend, disabled = false }: ChatMessageInputProps) {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (!text.trim() && attachments.length === 0) return;

    onSend(text.trim(), attachments);
    setText('');
    setAttachments([]);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleTextChange = (value: string) => {
    setText(value);

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newAttachments: ChatAttachment[] = Array.from(files).map((file) => {
      let fileType: ChatAttachment['fileType'] = 'other';
      if (file.type.startsWith('image/')) fileType = 'image';
      else if (file.type === 'application/pdf') fileType = 'pdf';
      else if (
        file.type === 'application/vnd.ms-excel' ||
        file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      )
        fileType = 'excel';

      return {
        id: `att-${crypto.randomUUID()}`,
        fileName: file.name,
        fileType,
        fileSize: file.size,
        url: URL.createObjectURL(file),
        uploadedAt: new Date().toISOString(),
      };
    });

    setAttachments((prev) => [...prev, ...newAttachments]);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="border-t border-slate-200 bg-white p-4">
      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {attachments.map((attachment) => (
            <ChatAttachmentPreview
              key={attachment.id}
              attachment={attachment}
              isEditable
              onRemove={() => removeAttachment(attachment.id)}
            />
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="flex items-end gap-2">
        {/* Attachment button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="flex-shrink-0 p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
          title="Přidat přílohu"
        >
          <Paperclip className="w-5 h-5" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,.pdf,.xls,.xlsx"
        />

        {/* Text input */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Napište zprávu..."
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:border-blue-300 transition-colors disabled:opacity-50 max-h-[120px]"
        />

        {/* Send button */}
        <button
          onClick={handleSubmit}
          disabled={disabled || (!text.trim() && attachments.length === 0)}
          className="flex-shrink-0 p-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:hover:bg-blue-500"
          title="Odeslat (Enter)"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { Send, Paperclip, X, FileText, Image as ImageIcon, FileSpreadsheet, File as FileIcon } from 'lucide-react';

interface ChatMessageInputProps {
  onSend: (text: string, files: File[]) => void;
  disabled?: boolean;
}

function getFileIcon(file: File) {
  if (file.type.startsWith('image/')) return <ImageIcon className="w-4 h-4 text-green-500" />;
  if (file.type === 'application/pdf') return <FileText className="w-4 h-4 text-red-500" />;
  if (file.type.includes('spreadsheet') || file.type.includes('excel'))
    return <FileSpreadsheet className="w-4 h-4 text-emerald-600" />;
  return <FileIcon className="w-4 h-4 text-slate-500" />;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export function ChatMessageInput({ onSend, disabled = false }: ChatMessageInputProps) {
  const [text, setText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (!text.trim() && selectedFiles.length === 0) return;

    onSend(text.trim(), selectedFiles);
    setText('');
    setSelectedFiles([]);

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

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setSelectedFiles((prev) => [...prev, ...Array.from(files)]);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="border-t border-slate-200 bg-white p-4">
      {/* Files preview */}
      {selectedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {selectedFiles.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-2 max-w-xs"
            >
              <div className="flex-shrink-0">{getFileIcon(file)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">{file.name}</p>
                <p className="text-xs text-slate-400">{formatSize(file.size)}</p>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="flex-shrink-0 p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                title="Odebrat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="flex items-end gap-2">
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
          accept="image/*,.pdf,.xls,.xlsx,.doc,.docx"
        />

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

        <button
          onClick={handleSubmit}
          disabled={disabled || (!text.trim() && selectedFiles.length === 0)}
          className="flex-shrink-0 p-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:hover:bg-blue-500"
          title="Odeslat (Enter)"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

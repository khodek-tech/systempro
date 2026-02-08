'use client';

import { Reply, Forward, Trash2, Star, MailOpen, Mail, Loader2 } from 'lucide-react';
import { useEmailStore } from '@/stores/email-store';
import { formatEmailAddress, formatEmailDate, sanitizeEmailHtml } from '@/features/email/email-helpers';
import { EmailAttachmentBadge } from './EmailAttachmentBadge';

export function EmailDetail() {
  const {
    selectedMessageId, messages,
    markAsUnread, toggleFlagged, deleteMessage, openComposer,
  } = useEmailStore();

  const message = messages.find((m) => m.id === selectedMessageId);

  if (!message) return null;

  // Show loading if body not yet loaded
  const bodyLoading = message.bodyText === null && message.bodyHtml === null;

  const renderBody = () => {
    if (bodyLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
        </div>
      );
    }

    if (message.bodyHtml) {
      const sanitized = sanitizeEmailHtml(message.bodyHtml);
      return (
        <div
          className="prose prose-sm max-w-none text-slate-700"
          dangerouslySetInnerHTML={{ __html: sanitized }}
        />
      );
    }

    if (message.bodyText) {
      return (
        <pre className="whitespace-pre-wrap text-sm text-slate-700 font-sans">
          {message.bodyText}
        </pre>
      );
    }

    return <p className="text-sm text-slate-400 italic">Žádný obsah</p>;
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      {/* Header */}
      <div className="border-b border-slate-200 p-5 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-lg font-bold text-slate-800 flex-1">
            {message.subject || '(bez předmětu)'}
          </h2>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => toggleFlagged(message.id)}
              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              title={message.flagged ? 'Odoznačit' : 'Označit hvězdičkou'}
            >
              <Star className={`w-4 h-4 ${message.flagged ? 'text-amber-400 fill-amber-400' : 'text-slate-400'}`} />
            </button>
            <button
              onClick={() => markAsUnread(message.id)}
              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              title="Označit jako nepřečtené"
            >
              {message.read ? <MailOpen className="w-4 h-4 text-slate-400" /> : <Mail className="w-4 h-4 text-sky-500" />}
            </button>
            <button
              onClick={() => deleteMessage(message.id)}
              className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
              title="Smazat"
            >
              <Trash2 className="w-4 h-4 text-slate-400 hover:text-red-500" />
            </button>
          </div>
        </div>

        {/* Sender info */}
        <div className="space-y-1 text-sm">
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-slate-500 w-12">Od:</span>
            <span className="text-slate-700">{formatEmailAddress(message.from)}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-slate-500 w-12">Komu:</span>
            <span className="text-slate-700">
              {message.to.map(formatEmailAddress).join(', ')}
            </span>
          </div>
          {message.cc && message.cc.length > 0 && (
            <div className="flex items-baseline gap-2">
              <span className="font-semibold text-slate-500 w-12">Kopie:</span>
              <span className="text-slate-700">
                {message.cc.map(formatEmailAddress).join(', ')}
              </span>
            </div>
          )}
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-slate-500 w-12">Datum:</span>
            <span className="text-slate-700">{formatEmailDate(message.date)}</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5">
        {renderBody()}

        {/* Attachments */}
        {message.hasAttachments && message.attachmentsMeta.length > 0 && (
          <div className="mt-6 space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Přílohy ({message.attachmentsMeta.length})
            </div>
            <div className="flex flex-wrap gap-2">
              {message.attachmentsMeta.map((att, i) => (
                <EmailAttachmentBadge
                  key={i}
                  attachment={att}
                  accountId={message.accountId}
                  folderId={message.folderId}
                  messageUid={message.imapUid}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action bar */}
      <div className="border-t border-slate-200 px-5 py-3 flex items-center gap-2">
        <button
          onClick={() => openComposer('reply', message)}
          className="flex items-center gap-2 bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-sky-700 active:scale-[0.98] transition-all"
        >
          <Reply className="w-4 h-4" />
          Odpovědět
        </button>
        <button
          onClick={() => openComposer('replyAll', message)}
          className="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-200 transition-all"
        >
          <Reply className="w-4 h-4" />
          Odpovědět všem
        </button>
        <button
          onClick={() => openComposer('forward', message)}
          className="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-200 transition-all"
        >
          <Forward className="w-4 h-4" />
          Přeposlat
        </button>
      </div>
    </div>
  );
}

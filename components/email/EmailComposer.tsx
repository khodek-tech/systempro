'use client';

import { useState, useRef } from 'react';
import { X, Send, Paperclip, Loader2 } from 'lucide-react';
import { useEmailStore } from '@/stores/email-store';
import type { EmailAddress, EmailComposeData } from '@/shared/types';
import { toast } from 'sonner';

export function EmailComposer() {
  const {
    composerOpen, composerMode, composerReplyTo, selectedAccountId,
    closeComposer, sendEmail, accounts,
  } = useEmailStore();

  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize fields based on mode
  const initFields = () => {
    if (!composerReplyTo) return;

    switch (composerMode) {
      case 'reply':
        setTo(composerReplyTo.from.address);
        setSubject(composerReplyTo.subject.startsWith('Re:') ? composerReplyTo.subject : `Re: ${composerReplyTo.subject}`);
        setBody(`\n\n--- Původní zpráva ---\nOd: ${composerReplyTo.from.name || composerReplyTo.from.address}\nDatum: ${new Date(composerReplyTo.date).toLocaleString('cs-CZ')}\n\n${composerReplyTo.bodyText || ''}`);
        break;
      case 'replyAll': {
        setTo(composerReplyTo.from.address);
        const ccAddrs = [
          ...(composerReplyTo.to || []).map((a) => a.address),
          ...(composerReplyTo.cc || []).map((a) => a.address),
        ].filter((addr) => {
          const account = accounts.find((a) => a.id === selectedAccountId);
          return addr !== account?.email;
        });
        setCc(ccAddrs.join(', '));
        setSubject(composerReplyTo.subject.startsWith('Re:') ? composerReplyTo.subject : `Re: ${composerReplyTo.subject}`);
        setBody(`\n\n--- Původní zpráva ---\nOd: ${composerReplyTo.from.name || composerReplyTo.from.address}\nDatum: ${new Date(composerReplyTo.date).toLocaleString('cs-CZ')}\n\n${composerReplyTo.bodyText || ''}`);
        break;
      }
      case 'forward':
        setSubject(composerReplyTo.subject.startsWith('Fwd:') ? composerReplyTo.subject : `Fwd: ${composerReplyTo.subject}`);
        setBody(`\n\n--- Přeposlaná zpráva ---\nOd: ${composerReplyTo.from.name || composerReplyTo.from.address}\nKomu: ${composerReplyTo.to.map((a) => a.address).join(', ')}\nDatum: ${new Date(composerReplyTo.date).toLocaleString('cs-CZ')}\nPředmět: ${composerReplyTo.subject}\n\n${composerReplyTo.bodyText || ''}`);
        break;
    }
  };

  // Init on open
  useState(() => {
    if (composerOpen && composerReplyTo) {
      initFields();
    }
  });

  if (!composerOpen) return null;

  const parseAddresses = (str: string): EmailAddress[] => {
    return str.split(',').map((s) => s.trim()).filter(Boolean).map((addr) => {
      const match = addr.match(/^"?(.+?)"?\s*<(.+)>$/);
      if (match) return { name: match[1], address: match[2] };
      return { address: addr };
    });
  };

  const handleSend = async () => {
    if (!selectedAccountId || !to.trim()) {
      toast.error('Vyplňte příjemce');
      return;
    }

    setSending(true);
    const data: EmailComposeData = {
      accountId: selectedAccountId,
      to: parseAddresses(to),
      ...(cc.trim() && { cc: parseAddresses(cc) }),
      subject,
      bodyText: body,
      ...(composerReplyTo?.rfcMessageId && { inReplyTo: composerReplyTo.rfcMessageId }),
      ...(composerReplyTo?.threadId && { threadId: composerReplyTo.threadId }),
      ...(files.length > 0 && { attachments: files }),
    };

    const result = await sendEmail(data);
    setSending(false);

    if (result.success) {
      toast.success('E-mail odeslán');
      closeComposer();
      setTo('');
      setCc('');
      setSubject('');
      setBody('');
      setFiles([]);
    } else {
      toast.error(result.error || 'Chyba při odesílání');
    }
  };

  const handleFileAdd = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles([...files, ...Array.from(e.target.files)]);
    }
  };

  const removeFile = (idx: number) => {
    setFiles(files.filter((_, i) => i !== idx));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-2xl mx-4 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">
            {composerMode === 'new' && 'Nový e-mail'}
            {composerMode === 'reply' && 'Odpovědět'}
            {composerMode === 'replyAll' && 'Odpovědět všem'}
            {composerMode === 'forward' && 'Přeposlat'}
          </h2>
          <button onClick={closeComposer} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <label className="text-sm font-semibold text-slate-500 w-12">Komu:</label>
              <input
                type="text"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="email@example.com"
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-300"
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm font-semibold text-slate-500 w-12">Kopie:</label>
              <input
                type="text"
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                placeholder="email@example.com"
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-300"
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm font-semibold text-slate-500 w-12">Předm.:</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Předmět"
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-300"
              />
            </div>
          </div>

          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Napište zprávu..."
            rows={12}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm outline-none resize-none focus:border-sky-300"
          />

          {/* Attachments */}
          {files.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {files.map((file, i) => (
                <div key={i} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm">
                  <Paperclip className="w-3 h-3 text-slate-400" />
                  <span className="text-slate-700">{file.name}</span>
                  <button onClick={() => removeFile(i)} className="text-slate-400 hover:text-red-500">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200">
          <div>
            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileChange} />
            <button
              onClick={handleFileAdd}
              className="flex items-center gap-2 bg-slate-100 text-slate-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-200 transition-all"
            >
              <Paperclip className="w-4 h-4" />
              Příloha
            </button>
          </div>
          <button
            onClick={handleSend}
            disabled={sending || !to.trim()}
            className="flex items-center gap-2 bg-sky-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-sky-700 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Odeslat
          </button>
        </div>
      </div>
    </div>
  );
}

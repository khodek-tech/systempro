import type { EmailAddress, EmailMessage } from '@/shared/types';

/**
 * Format an email date as a relative or absolute string.
 */
export function formatEmailDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Nyní';
  if (diffMins < 60) return `${diffMins} min`;
  if (diffHours < 24) return `${diffHours} h`;
  if (diffDays < 7) {
    const days = ['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So'];
    return days[date.getDay()];
  }
  return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
}

/**
 * Format bytes as human-readable file size.
 */
export function formatEmailSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

/**
 * Get initials from email address for avatar placeholder.
 */
export function getEmailInitials(addr: EmailAddress): string {
  if (addr.name) {
    const parts = addr.name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  }
  return addr.address.substring(0, 2).toUpperCase();
}

/**
 * Format email address for display.
 */
export function formatEmailAddress(addr: EmailAddress): string {
  if (addr.name) return `${addr.name} <${addr.address}>`;
  return addr.address;
}

/**
 * Format email address short (name only or address).
 */
export function formatEmailAddressShort(addr: EmailAddress): string {
  return addr.name || addr.address;
}

/**
 * Build threads from a flat list of messages using In-Reply-To / threadId.
 */
export function buildThreads(messages: EmailMessage[]): Map<string, EmailMessage[]> {
  const threads = new Map<string, EmailMessage[]>();

  for (const msg of messages) {
    const key = msg.threadId || msg.rfcMessageId || msg.id;
    const existing = threads.get(key);
    if (existing) {
      existing.push(msg);
    } else {
      threads.set(key, [msg]);
    }
  }

  // Sort each thread by date ascending
  for (const [key, threadMsgs] of threads) {
    threads.set(key, threadMsgs.sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    ));
  }

  return threads;
}

/**
 * Sanitize email HTML by removing dangerous elements.
 * Uses DOMPurify on the client side.
 */
export function sanitizeEmailHtml(html: string): string {
  if (typeof window === 'undefined') return html;

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const DOMPurify = require('dompurify');
  const purify = DOMPurify.default ?? DOMPurify;
  return purify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'b', 'i', 'u', 'a', 'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre', 'code',
      'img', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 'hr', 'div',
      'span', 'font', 'center', 'small',
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'style', 'class', 'width', 'height',
      'border', 'cellpadding', 'cellspacing', 'align', 'valign', 'color',
      'bgcolor', 'target', 'colspan', 'rowspan',
    ],
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ['target'],
  });
}

/**
 * Folder type to icon name mapping (lucide-react).
 */
export function getFolderIcon(type: string): string {
  switch (type) {
    case 'inbox': return 'Inbox';
    case 'sent': return 'Send';
    case 'drafts': return 'FileEdit';
    case 'trash': return 'Trash2';
    case 'spam': return 'ShieldAlert';
    case 'custom': return 'Folder';
    default: return 'Folder';
  }
}

/**
 * Folder type to order priority for default sorting.
 */
export function getFolderSortOrder(type: string): number {
  switch (type) {
    case 'inbox': return 0;
    case 'sent': return 1;
    case 'drafts': return 2;
    case 'spam': return 3;
    case 'trash': return 4;
    case 'custom': return 5;
    default: return 6;
  }
}

// =============================================================================
// EMAIL MODULE TYPES
// =============================================================================

export type EmailFolderType = 'inbox' | 'sent' | 'drafts' | 'trash' | 'spam' | 'custom';

export interface EmailAddress {
  name?: string;
  address: string;
}

export interface EmailAttachmentMeta {
  name: string;
  size: number;
  contentType: string;
  partId: string;
}

export interface EmailAccount {
  id: string;
  name: string;
  email: string;
  imapServer: string;
  imapPort: number;
  smtpServer: string;
  smtpPort: number;
  username: string;
  // heslo se NIKDY neposílá na klienta
  active: boolean;
  lastSync: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmailAccountAccess {
  accountId: string;
  employeeId: string;
  canSend: boolean;
  canDelete: boolean;
  createdAt: string;
}

export interface EmailFolder {
  id: string;
  accountId: string;
  name: string;
  imapPath: string;
  type: EmailFolderType;
  messageCount: number;
  unreadCount: number;
  lastUid: number;
  order: number;
  createdAt: string;
}

export interface EmailMessage {
  id: string;
  accountId: string;
  folderId: string;
  imapUid: number;
  rfcMessageId: string | null;
  subject: string;
  from: EmailAddress;
  to: EmailAddress[];
  cc: EmailAddress[] | null;
  bcc: EmailAddress[] | null;
  date: string;
  preview: string;
  bodyText: string | null;
  bodyHtml: string | null;
  read: boolean;
  flagged: boolean;
  hasAttachments: boolean;
  attachmentsMeta: EmailAttachmentMeta[];
  inReplyTo: string | null;
  threadId: string | null;
  size: number;
  syncedAt: string;
}

export interface EmailRuleCondition {
  field: 'from' | 'to' | 'subject' | 'body';
  operator: 'contains' | 'equals' | 'starts_with' | 'ends_with' | 'regex';
  value: string;
}

export interface EmailRuleAction {
  type: 'move' | 'mark_read' | 'mark_flagged' | 'delete' | 'forward';
  params?: Record<string, string>;
}

export interface EmailRule {
  id: string;
  accountId: string;
  name: string;
  active: boolean;
  order: number;
  conditions: {
    match: 'all' | 'any';
    rules: EmailRuleCondition[];
  };
  actions: EmailRuleAction[];
  stopFurther: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmailSyncLog {
  id: number;
  accountId: string;
  status: 'running' | 'success' | 'error';
  message: string | null;
  newCount: number;
  durationMs: number;
  totalMessages: number;
  processed: number;
  currentFolder: string | null;
  createdAt: string;
}

export interface EmailComposeData {
  accountId: string;
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  subject: string;
  bodyText: string;
  bodyHtml?: string;
  inReplyTo?: string;
  threadId?: string;
  attachments?: File[];
}

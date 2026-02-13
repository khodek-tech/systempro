/**
 * Zod schemas for API route request validation.
 */
import { z } from 'zod';

// =============================================================================
// Shared helpers
// =============================================================================

const portSchema = z.number().int().min(1).max(65535).optional();

const emailAddressSchema = z.object({
  name: z.string().optional(),
  address: z.string().email(),
});

// =============================================================================
// Email routes
// =============================================================================

export const emailSendSchema = z.object({
  accountId: z.string().min(1),
  to: z.array(emailAddressSchema).min(1),
  cc: z.array(emailAddressSchema).optional(),
  bcc: z.array(emailAddressSchema).optional(),
  subject: z.string().default(''),
  bodyText: z.string().default(''),
  bodyHtml: z.string().nullable().optional(),
  inReplyTo: z.string().nullable().optional(),
  threadId: z.string().nullable().optional(),
});

export const emailImapActionSchema = z.object({
  action: z.enum(['move', 'setRead', 'setUnread', 'setFlagged', 'unsetFlagged', 'delete']),
  messageId: z.string().min(1),
  accountId: z.string().min(1),
  targetFolderId: z.string().min(1).optional(),
});

export const emailSyncSchema = z.object({
  accountId: z.string().min(1),
  mode: z.enum(['initial', 'incremental']).default('incremental'),
});

export const emailTestConnectionSchema = z.union([
  z.object({
    accountId: z.string().min(1),
  }),
  z.object({
    accountId: z.undefined().optional(),
    imapServer: z.string().min(1),
    imapPort: portSchema,
    smtpServer: z.string().min(1),
    smtpPort: portSchema,
    username: z.string().min(1),
    password: z.string().min(1),
  }),
]);

export const emailBackfillSchema = z.object({
  accountId: z.string().min(1),
  folderId: z.string().min(1),
  batchSize: z.number().int().min(1).max(500).default(50),
});

export const emailAccountCreateSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  imapServer: z.string().min(1),
  imapPort: portSchema,
  smtpServer: z.string().min(1),
  smtpPort: portSchema,
  username: z.string().min(1),
  password: z.string().min(1),
});

export const emailAccountUpdateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  imapServer: z.string().min(1).optional(),
  imapPort: portSchema,
  smtpServer: z.string().min(1).optional(),
  smtpPort: portSchema,
  username: z.string().min(1).optional(),
  password: z.string().optional(),
  active: z.boolean().optional(),
});

// =============================================================================
// Pohoda routes
// =============================================================================

export const pohodaCredentialsSchema = z.object({
  url: z.string().url(),
  username: z.string().min(1),
  password: z.string().min(1),
  ico: z.string().min(1),
});

export const pohodaSkladyExportSchema = pohodaCredentialsSchema.extend({
  skladId: z.string().optional(),
});

export const pohodaSkladySyncSchema = pohodaCredentialsSchema.extend({
  skladId: z.string().nullable().optional(),
  columns: z.array(z.string()).min(1, 'Vyberte alespon jeden sloupec'),
});

// =============================================================================
// Helper: parse and return Zod error as 400 response
// =============================================================================

export function parseBody<T>(schema: z.ZodType<T>, body: unknown):
  | { success: true; data: T }
  | { success: false; error: string } {
  const result = schema.safeParse(body);
  if (!result.success) {
    const msg = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
    return { success: false, error: msg };
  }
  return { success: true, data: result.data };
}

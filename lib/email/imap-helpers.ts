/**
 * Shared IMAP helper functions for inline image resolution.
 * Used by both sync-core.ts and backfill/route.ts.
 */

import { ImapFlow } from 'imapflow';

interface InlinePart {
  partId: string;
  contentId: string;
  contentType: string;
}

const MAX_INLINE_IMAGES = 10;
const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_HTML_SIZE = 500000; // 500KB
const DOWNLOAD_TIMEOUT = 10000; // 10s

/**
 * Walk MIME bodyStructure tree and collect inline image parts with Content-ID.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function findInlineParts(node: any): InlinePart[] {
  if (!node) return [];

  const results: InlinePart[] = [];

  if (!node.childNodes?.length) {
    if (
      node.type &&
      node.type.startsWith('image/') &&
      node.id
    ) {
      results.push({
        partId: node.part || '1',
        contentId: node.id,
        contentType: node.type,
      });
    }
    return results;
  }

  for (const child of node.childNodes) {
    results.push(...findInlineParts(child));
  }

  return results;
}

/**
 * Read a stream into a raw Buffer with timeout protection.
 */
export async function streamToBuffer(
  stream: ReadableStream | NodeJS.ReadableStream,
  timeoutMs = DOWNLOAD_TIMEOUT,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const timeout = setTimeout(() => {
      reject(new Error('Stream read timeout'));
    }, timeoutMs);

    (async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for await (const chunk of stream as any) {
          chunks.push(Buffer.from(chunk));
        }
        clearTimeout(timeout);
        resolve(Buffer.concat(chunks));
      } catch (err) {
        clearTimeout(timeout);
        reject(err);
      }
    })();
  });
}

/**
 * Resolve CID references in HTML by downloading inline image parts from IMAP
 * and replacing cid: URLs with base64 data URIs.
 *
 * Returns the original HTML unchanged if:
 * - no cid: references are found
 * - resolved HTML exceeds MAX_HTML_SIZE (500KB)
 */
export async function resolveInlineImages(
  html: string,
  client: ImapFlow,
  uid: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bodyStructure: any,
): Promise<string> {
  if (!html.includes('cid:')) return html;

  const parts = findInlineParts(bodyStructure);
  if (parts.length === 0) return html;

  // Limit to MAX_INLINE_IMAGES
  const partsToProcess = parts.slice(0, MAX_INLINE_IMAGES);

  let resolved = html;

  for (const part of partsToProcess) {
    try {
      const { content } = await client.download(uid, part.partId, { uid: true });
      if (!content) continue;

      const buffer = await streamToBuffer(content);

      // Skip images larger than 2MB
      if (buffer.length > MAX_IMAGE_SIZE) continue;

      const base64 = buffer.toString('base64');
      const dataUri = `data:${part.contentType};base64,${base64}`;

      // Content-ID may have angle brackets in the MIME header: <abc123@xyz>
      // In HTML src it appears as cid:abc123@xyz (without brackets)
      const cidClean = part.contentId.replace(/^<|>$/g, '');

      // Replace all occurrences of cid:CONTENT_ID
      resolved = resolved.split(`cid:${cidClean}`).join(dataUri);
    } catch (err) {
      console.error(`[inline-images] Failed to download part ${part.partId} for UID ${uid}:`, err);
      // Continue with next image, don't fail the whole email
    }
  }

  // If resolved HTML exceeds size limit, return original
  if (resolved.length > MAX_HTML_SIZE) {
    return html;
  }

  return resolved;
}

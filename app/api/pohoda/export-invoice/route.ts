import { NextRequest, NextResponse } from 'next/server';
import { XMLParser } from 'fast-xml-parser';
import iconv from 'iconv-lite';
import { requireAdmin } from '@/lib/supabase/api-auth';
import { checkRateLimit, getRateLimitKey } from '@/lib/rate-limit';
import { fetchWithRetry } from '@/lib/api/fetch-retry';
import { z } from 'zod';
import { parseBody } from '@/lib/api/schemas';

// =============================================================================
// TYPES & SCHEMAS
// =============================================================================

const exportInvoiceSchema = z.object({
  url: z.string().url(),
  username: z.string().min(1),
  password: z.string().min(1),
  ico: z.string().min(1),
  orders: z.array(z.object({
    id: z.number(),
    orderNumber: z.string(),
    totalPrice: z.number(),
    shippingPrice: z.number(),
    paymentPrice: z.number(),
    shippingType: z.string().nullable().optional(),
    paymentType: z.string().nullable().optional(),
    note: z.string().nullable().optional(),
    createdAt: z.string(),
    billingAddress: z.record(z.string(), z.string()).nullable().optional(),
    items: z.array(z.object({
      name: z.string(),
      quantity: z.number(),
      price: z.number(),
    })),
  })).min(1, 'Vyberte alespoň jednu objednávku'),
});

type ExportOrder = z.infer<typeof exportInvoiceSchema>['orders'][number];

// =============================================================================
// HELPERS
// =============================================================================

function createAuthHeader(username: string, password: string): string {
  return Buffer.from(`${username}:${password}`).toString('base64');
}

/** Escape XML special characters */
function escXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Format date as YYYY-MM-DD for Pohoda */
function formatPohodaDate(dateStr: string): string {
  return new Date(dateStr).toISOString().split('T')[0];
}

/** Format due date (14 days after creation) */
function formatDueDate(dateStr: string): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + 14);
  return d.toISOString().split('T')[0];
}

/** Build address XML block from billingAddress record */
function buildAddressXml(address?: Record<string, string> | null): string {
  if (!address) return '';
  const name = [address.firstName, address.lastName].filter(Boolean).join(' ');
  const parts: string[] = [];
  if (name) parts.push(`<typ:name>${escXml(name)}</typ:name>`);
  if (address.street) parts.push(`<typ:street>${escXml(address.street)}</typ:street>`);
  if (address.city) parts.push(`<typ:city>${escXml(address.city)}</typ:city>`);
  if (address.zip) parts.push(`<typ:zip>${escXml(address.zip)}</typ:zip>`);
  if (address.email) parts.push(`<typ:email>${escXml(address.email)}</typ:email>`);
  if (address.phone) parts.push(`<typ:phone>${escXml(address.phone)}</typ:phone>`);
  parts.push(`<typ:country><typ:ids>CZ</typ:ids></typ:country>`);
  return parts.join('\n              ');
}

/** Build invoice XML for a single order */
function buildInvoiceXml(order: ExportOrder, index: number): string {
  const date = formatPohodaDate(order.createdAt);
  const dueDate = formatDueDate(order.createdAt);

  // Build item rows
  const itemRows = order.items.map((item) => `
          <inv:invoiceItem>
            <inv:text>${escXml(item.name)}</inv:text>
            <inv:quantity>${item.quantity}</inv:quantity>
            <inv:unit>ks</inv:unit>
            <inv:rateVAT>high</inv:rateVAT>
            <inv:homeCurrency>
              <typ:unitPrice>${item.price}</typ:unitPrice>
            </inv:homeCurrency>
          </inv:invoiceItem>`).join('');

  // Shipping as a line item (if > 0)
  const shippingRow = order.shippingPrice > 0 ? `
          <inv:invoiceItem>
            <inv:text>Doprava${order.shippingType ? ` (${escXml(order.shippingType)})` : ''}</inv:text>
            <inv:quantity>1</inv:quantity>
            <inv:unit>ks</inv:unit>
            <inv:rateVAT>high</inv:rateVAT>
            <inv:homeCurrency>
              <typ:unitPrice>${order.shippingPrice}</typ:unitPrice>
            </inv:homeCurrency>
          </inv:invoiceItem>` : '';

  // Payment fee as a line item (if > 0)
  const paymentRow = order.paymentPrice > 0 ? `
          <inv:invoiceItem>
            <inv:text>Poplatek za platbu${order.paymentType ? ` (${escXml(order.paymentType)})` : ''}</inv:text>
            <inv:quantity>1</inv:quantity>
            <inv:unit>ks</inv:unit>
            <inv:rateVAT>high</inv:rateVAT>
            <inv:homeCurrency>
              <typ:unitPrice>${order.paymentPrice}</typ:unitPrice>
            </inv:homeCurrency>
          </inv:invoiceItem>` : '';

  const addressBlock = buildAddressXml(order.billingAddress);

  return `
    <dat:dataPackItem id="inv${String(index + 1).padStart(3, '0')}" version="2.0">
      <inv:invoice version="2.0">
        <inv:invoiceHeader>
          <inv:invoiceType>issuedInvoice</inv:invoiceType>
          <inv:number>
            <typ:numberRequested>${escXml(order.orderNumber)}</typ:numberRequested>
          </inv:number>
          <inv:symVar>${escXml(order.orderNumber.replace(/\D/g, '').slice(-10))}</inv:symVar>
          <inv:date>${date}</inv:date>
          <inv:dateTax>${date}</inv:dateTax>
          <inv:dateDue>${dueDate}</inv:dateDue>
          <inv:text>Objednavka ${escXml(order.orderNumber)}</inv:text>
          ${addressBlock ? `<inv:partnerIdentity>
            <typ:address>
              ${addressBlock}
            </typ:address>
          </inv:partnerIdentity>` : ''}
          ${order.note ? `<inv:note>${escXml(order.note)}</inv:note>` : ''}
        </inv:invoiceHeader>
        <inv:invoiceDetail>${itemRows}${shippingRow}${paymentRow}
        </inv:invoiceDetail>
      </inv:invoice>
    </dat:dataPackItem>`;
}

/** Build the full dataPack XML envelope */
function buildDataPackXml(ico: string, orders: ExportOrder[]): string {
  const invoices = orders.map((order, i) => buildInvoiceXml(order, i)).join('');

  return `<?xml version="1.0" encoding="Windows-1250"?>
<dat:dataPack
  xmlns:dat="http://www.stormware.cz/schema/version_2/data.xsd"
  xmlns:inv="http://www.stormware.cz/schema/version_2/invoice.xsd"
  xmlns:typ="http://www.stormware.cz/schema/version_2/type.xsd"
  id="eshop-export-${Date.now()}"
  ico="${escXml(ico)}"
  application="SYSTEM.PRO"
  version="2.0"
  note="Export e-shop objednavek">${invoices}
</dat:dataPack>`;
}

// =============================================================================
// ROUTE HANDLER
// =============================================================================

export async function POST(request: NextRequest) {
  // Rate limit
  const rlKey = getRateLimitKey(request, 'pohoda-export-invoice');
  const rl = checkRateLimit(rlKey, { limit: 10, windowSeconds: 60 });
  if (!rl.success) {
    return NextResponse.json(
      { success: false, error: 'Příliš mnoho požadavků. Zkuste to za chvíli.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    );
  }

  // Auth check
  const { error: authError } = await requireAdmin();
  if (authError) {
    const status = authError === 'Forbidden' ? 403 : 401;
    return NextResponse.json({ success: false, error: authError }, { status });
  }

  try {
    const body = await request.json();
    const parsed = parseBody(exportInvoiceSchema, body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error }, { status: 400 });
    }

    const { url, username, password, ico, orders } = parsed.data;

    // Build XML
    const xmlRequest = buildDataPackXml(ico, orders);

    // Encode to Windows-1250
    const encodedBuffer = iconv.encode(xmlRequest, 'win1250');
    const encodedBody = new Uint8Array(encodedBuffer);

    // Send to mServer
    const mserverUrl = `${url.replace(/\/$/, '')}/xml`;
    const authHeader = createAuthHeader(username, password);

    const response = await fetchWithRetry(mserverUrl, {
      method: 'POST',
      headers: {
        'STW-Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/xml; charset=Windows-1250',
      },
      body: encodedBody,
      signal: AbortSignal.timeout(120000), // 2 minutes
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('mServer export error:', response.status, errorText);
      return NextResponse.json({
        success: false,
        error: `Pohoda server vrátil chybu ${response.status}`,
      }, { status: 502 });
    }

    // Decode response from Windows-1250
    const arrayBuffer = await response.arrayBuffer();
    const xmlText = iconv.decode(Buffer.from(arrayBuffer), 'win1250');

    // Check for errors
    if (xmlText.includes('state="error"') || xmlText.includes('<rdc:state>error</rdc:state>')) {
      // Try to extract error message
      const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_', removeNSPrefix: true });
      const result = parser.parse(xmlText);
      let errorMsg = 'Pohoda vrátila chybu při importu';

      try {
        const items = result.responsePack?.responsePackItem;
        const itemArray = Array.isArray(items) ? items : items ? [items] : [];
        const errors: string[] = [];
        for (const item of itemArray) {
          const note = item?.['@_note'] || item?.producedDetails?.detail?.['@_note'];
          if (note) errors.push(String(note));
        }
        if (errors.length > 0) errorMsg = errors.join('; ');
      } catch {
        // ignore parse errors, use generic message
      }

      return NextResponse.json({ success: false, error: errorMsg }, { status: 422 });
    }

    // Parse success response — extract created invoice IDs
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_', removeNSPrefix: true });
    const result = parser.parse(xmlText);

    const results: { orderNumber: string; pohodaId?: string; success: boolean; error?: string }[] = [];
    const items = result.responsePack?.responsePackItem;
    const itemArray = Array.isArray(items) ? items : items ? [items] : [];

    for (let i = 0; i < orders.length; i++) {
      const responseItem = itemArray[i];
      if (!responseItem) {
        results.push({ orderNumber: orders[i].orderNumber, success: false, error: 'Žádná odpověď' });
        continue;
      }

      const state = responseItem['@_state'] || '';
      if (state === 'error' || state === 'warning') {
        const note = responseItem['@_note'] || 'Neznámá chyba';
        results.push({ orderNumber: orders[i].orderNumber, success: false, error: String(note) });
      } else {
        const producedId = responseItem?.producedDetails?.detail?.['@_id'] || responseItem?.['@_id'];
        results.push({ orderNumber: orders[i].orderNumber, success: true, pohodaId: producedId ? String(producedId) : undefined });
      }
    }

    return NextResponse.json({
      success: true,
      results,
      totalExported: results.filter((r) => r.success).length,
      totalFailed: results.filter((r) => !r.success).length,
    });
  } catch (error) {
    console.error('Pohoda export invoice error:', error);

    if (error instanceof Error) {
      if (error.name === 'AbortError' || error.message.includes('timeout')) {
        return NextResponse.json({ success: false, error: 'Časový limit vypršel - server neodpovídá' }, { status: 504 });
      }
      if (error.message.includes('ECONNREFUSED')) {
        return NextResponse.json({ success: false, error: 'Nelze se připojit k Pohoda serveru' }, { status: 502 });
      }
    }

    return NextResponse.json({ success: false, error: 'Neočekávaná chyba při exportu' }, { status: 500 });
  }
}

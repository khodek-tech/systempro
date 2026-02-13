import { NextRequest, NextResponse } from 'next/server';
import { XMLParser } from 'fast-xml-parser';
import { requireAdmin } from '@/lib/supabase/api-auth';
import { pohodaCredentialsSchema, parseBody } from '@/lib/api/schemas';
import { fetchWithRetry } from '@/lib/api/fetch-retry';

// Pomocna funkce pro vytvoreni autentizacni hlavicky
function createAuthHeader(username: string, password: string): string {
  // Pohoda mServer pouziva Basic Auth s kodovanim Windows-1250
  // Pro jednoduchost pouzijeme UTF-8 a pripadne upravime
  const credentials = `${username}:${password}`;
  const encoded = Buffer.from(credentials).toString('base64');
  return encoded;
}

export async function POST(request: NextRequest) {
  const { error: authError } = await requireAdmin()
  if (authError) {
    const status = authError === 'Forbidden' ? 403 : 401
    return NextResponse.json({ success: false, error: authError }, { status })
  }

  try {
    const body = await request.json();
    const parsed = parseBody(pohodaCredentialsSchema, body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error }, { status: 400 });
    }
    const { url, username, password } = parsed.data;

    // Sestaveni URL pro status endpoint
    const statusUrl = `${url.replace(/\/$/, '')}/status?companyDetail`;

    // Vytvoreni autentizacni hlavicky
    const authHeader = createAuthHeader(username, password);

    // Volani mServeru (s retry pro cold start)
    const response = await fetchWithRetry(statusUrl, {
      method: 'GET',
      headers: {
        'STW-Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/xml; charset=Windows-1250',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      // Zkusime precist chybovou zpravu
      const errorText = await response.text();
      console.error('mServer error:', response.status, errorText);

      if (response.status === 401) {
        return NextResponse.json({
          success: false,
          error: 'Neplatne prihласovaci udaje',
        });
      }

      return NextResponse.json({
        success: false,
        error: `Server vratil chybu ${response.status}`,
      });
    }

    // Parsovani XML odpovedi
    const xmlText = await response.text();
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
    });

    const result = parser.parse(xmlText);

    // Extrakce nazvu firmy z odpovedi (pokud je dostupny)
    let companyName = null;
    try {
      // Struktura odpovedi muze byt ruzna, zkusime najit nazev firmy
      if (result.status?.company?.name) {
        companyName = result.status.company.name;
      } else if (result.rsp?.company) {
        companyName = result.rsp.company;
      }
    } catch {
      // Ignorujeme chyby pri parsovani nazvu firmy
    }

    return NextResponse.json({
      success: true,
      companyName,
      message: 'Pripojeni uspesne',
    });
  } catch (error) {
    console.error('Pohoda test connection error:', error);

    if (error instanceof Error) {
      if (error.name === 'AbortError' || error.message.includes('timeout')) {
        return NextResponse.json({
          success: false,
          error: 'Casovy limit vypsel - server neodpovida',
        });
      }

      if (error.message.includes('ECONNREFUSED')) {
        return NextResponse.json({
          success: false,
          error: 'Nelze se pripojit k serveru - zkontrolujte URL a port',
        });
      }
    }

    return NextResponse.json({
      success: false,
      error: 'Neocekavana chyba pri pripojeni',
    });
  }
}

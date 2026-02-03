import { NextRequest, NextResponse } from 'next/server';
import { XMLParser } from 'fast-xml-parser';

function createAuthHeader(username: string, password: string): string {
  const credentials = `${username}:${password}`;
  return Buffer.from(credentials).toString('base64');
}

// XML pozadavek pro seznam skladu
function createSkladyListRequest(ico: string): string {
  return `<?xml version="1.0" encoding="Windows-1250"?>
<dat:dataPack
  xmlns:dat="http://www.stormware.cz/schema/version_2/data.xsd"
  xmlns:typ="http://www.stormware.cz/schema/version_2/type.xsd"
  xmlns:lst="http://www.stormware.cz/schema/version_2/list.xsd"
  xmlns:lStk="http://www.stormware.cz/schema/version_2/list_stock.xsd"
  id="sklady001"
  ico="${ico}"
  application="SYSTEM.PRO"
  version="2.0"
  note="Seznam skladu">

  <dat:dataPackItem id="lst001" version="2.0">
    <lst:listStorageRequest version="2.0" storageVersion="2.0">
      <lst:requestStorage/>
    </lst:listStorageRequest>
  </dat:dataPackItem>
</dat:dataPack>`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, username, password, ico } = body;

    if (!url || !username || !password || !ico) {
      return NextResponse.json(
        { success: false, error: 'Chybi povinne udaje' },
        { status: 400 }
      );
    }

    const mserverUrl = `${url.replace(/\/$/, '')}/xml`;
    const authHeader = createAuthHeader(username, password);
    const xmlRequest = createSkladyListRequest(ico);

    const response = await fetch(mserverUrl, {
      method: 'POST',
      headers: {
        'STW-Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/xml; charset=Windows-1250',
      },
      body: xmlRequest,
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: `Server vratil chybu ${response.status}`,
      });
    }

    const xmlText = await response.text();
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      removeNSPrefix: true,
    });

    const result = parser.parse(xmlText);

    // Extrakce seznamu skladu z odpovedi
    const sklady: Array<{ id: string; ids: string; name: string }> = [];

    try {
      // Navigace k datum skladu - struktura muze byt ruzna
      const responsePack = result.responsePack || result.rsp;
      if (responsePack) {
        const items = responsePack.responsePackItem || responsePack.item;
        const itemArray = Array.isArray(items) ? items : [items];

        for (const item of itemArray) {
          const storageList = item?.listStorage?.storage || item?.storage;
          if (storageList) {
            const storageArray = Array.isArray(storageList)
              ? storageList
              : [storageList];
            for (const storage of storageArray) {
              sklady.push({
                id: storage['@_id'] || storage.id?.toString() || '',
                ids: storage.ids || storage.code || '',
                name: storage.name || storage.text || storage.ids || '',
              });
            }
          }
        }
      }
    } catch (parseError) {
      console.error('Error parsing sklady response:', parseError);
      // Vratime prazdny seznam misto chyby
    }

    return NextResponse.json({
      success: true,
      sklady,
      count: sklady.length,
    });
  } catch (error) {
    console.error('Pohoda sklady list error:', error);

    return NextResponse.json({
      success: false,
      error: 'Chyba pri nacitani seznamu skladu',
    });
  }
}

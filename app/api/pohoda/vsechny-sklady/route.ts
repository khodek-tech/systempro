import { NextRequest, NextResponse } from 'next/server';
import { XMLParser } from 'fast-xml-parser';
import ExcelJS from 'exceljs';
import iconv from 'iconv-lite';
import { requireAuth } from '@/lib/supabase/api-auth';

function createAuthHeader(username: string, password: string): string {
  const credentials = `${username}:${password}`;
  return Buffer.from(credentials).toString('base64');
}

// Preferovane poradi skladu v exportu (nazvy pro Excel)
const STORAGE_ORDER = [
  'ALL_Zdiby',
  'Bohnice',
  'Butovice',
  'Brno',
  'Č Most',
  'OC_Šestka',
  'Prosek',
  'Ústí',
  'Chodov',
  'Vysočany',
  'Zličín',
  'Daňový',
];

// Mapovani nazvu skladu z Pohody na nazvy v exportu
const STORAGE_NAME_MAP: Record<string, string> = {
  Zdiby: 'ALL_Zdiby',
  'OC Šestka': 'OC_Šestka',
};

// Helper funkce pro ziskani nazvu skladu pro export
function getExportStorageName(pohodaName: string): string {
  return STORAGE_NAME_MAP[pohodaName] || pohodaName;
}

// XML pozadavek pro export VSECH skladovych zasob najednou (bez filtru)
function createAllStockExportRequest(ico: string): string {
  return `<?xml version="1.0" encoding="Windows-1250"?>
<dat:dataPack
  xmlns:dat="http://www.stormware.cz/schema/version_2/data.xsd"
  xmlns:typ="http://www.stormware.cz/schema/version_2/type.xsd"
  xmlns:lst="http://www.stormware.cz/schema/version_2/list.xsd"
  xmlns:lStk="http://www.stormware.cz/schema/version_2/list_stock.xsd"
  xmlns:ftr="http://www.stormware.cz/schema/version_2/filter.xsd"
  id="export001"
  ico="${ico}"
  application="SYSTEM.PRO"
  version="2.0"
  note="Export skladovych zasob">

  <dat:dataPackItem id="stk001" version="2.0">
    <lStk:listStockRequest version="2.0" stockVersion="2.0">
      <lStk:requestStock>
      </lStk:requestStock>
    </lStk:listStockRequest>
  </dat:dataPackItem>
</dat:dataPack>`;
}

interface StockItem {
  code: string;
  ean: string;
  quantity: number;
  storage: string;
}

function parseStockItems(xmlText: string): StockItem[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    removeNSPrefix: true,
  });

  const result = parser.parse(xmlText);
  const items: StockItem[] = [];

  try {
    const responsePack = result.responsePack || result.rsp || result;
    const responseItems =
      responsePack?.responsePackItem || responsePack?.item || [];
    const itemArray = Array.isArray(responseItems)
      ? responseItems
      : [responseItems];

    for (const responseItem of itemArray) {
      const stockList =
        responseItem?.listStock?.stock || responseItem?.stock || [];
      const stockArray = Array.isArray(stockList) ? stockList : [stockList];

      for (const stock of stockArray) {
        if (!stock) continue;

        const stockHeader = stock.stockHeader || stock;

        const ean = String(stockHeader?.EAN || stockHeader?.ean || '');
        const code = String(stockHeader?.code || stockHeader?.ids || '');
        const quantity =
          parseFloat(stockHeader?.count || stockHeader?.quantity || '0') || 0;
        const storage = String(
          stockHeader?.storage?.ids || stockHeader?.sklad || ''
        );

        // DEBUG: Sledování kódů 99826*
        if (code.startsWith('99826')) {
          console.log('[DEBUG] Nalezen kod 99826*:', { ean, code, quantity, storage });
        }

        items.push({
          code,
          ean,
          quantity,
          storage,
        });
      }
    }
  } catch (parseError) {
    console.error('Error parsing stock items:', parseError);
  }

  return items;
}

async function fetchAllStockData(
  url: string,
  username: string,
  password: string,
  ico: string
): Promise<StockItem[]> {
  const mserverUrl = `${url.replace(/\/$/, '')}/xml`;
  const authHeader = createAuthHeader(username, password);
  const xmlRequest = createAllStockExportRequest(ico);

  console.log('[Vsechny sklady] Stahovani VSECH skladovych dat...');

  const response = await fetch(mserverUrl, {
    method: 'POST',
    headers: {
      'STW-Authorization': `Basic ${authHeader}`,
      'Content-Type': 'application/xml; charset=Windows-1250',
    },
    body: xmlRequest,
    signal: AbortSignal.timeout(300000), // 5 minut pro velka data
  });

  if (!response.ok) {
    throw new Error(`Server vratil chybu ${response.status}`);
  }

  // Dekodovat z Windows-1250 do UTF-8
  const arrayBuffer = await response.arrayBuffer();
  const xmlText = iconv.decode(Buffer.from(arrayBuffer), 'win1250');

  console.log(`[Vsechny sklady] XML response length: ${xmlText.length} chars`);

  // Zkontrolovat, zda odpoved obsahuje chybu
  if (
    xmlText.includes('<rdc:state>error</rdc:state>') ||
    xmlText.includes('state="error"')
  ) {
    console.error('Pohoda returned error in response');
    throw new Error('Pohoda vratila chybu. Zkontrolujte opravneni uzivatele.');
  }

  return parseStockItems(xmlText);
}

async function createVsechnySkladyExcel(
  stockData: Map<string, Map<string, number>>, // kod -> (sklad -> mnozstvi)
  allStorages: string[]
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SYSTEM.PRO';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Vsechny sklady');

  // Pouzit STORAGE_ORDER jako zaklad a pridat dalsi sklady z dat
  const additionalStorages = [...allStorages]
    .filter((s) => !STORAGE_ORDER.includes(s))
    .sort((a, b) => String(a).localeCompare(String(b), 'cs'));
  const sortedStorages = [...STORAGE_ORDER, ...additionalStorages];

  // Definice sloupcu - Kod + vsechny sklady
  const columns: Partial<ExcelJS.Column>[] = [
    { header: 'Kod', key: 'kod', width: 20 },
  ];

  for (const storage of sortedStorages) {
    columns.push({
      header: storage,
      key: storage,
      width: 12,
    });
  }

  worksheet.columns = columns;

  // Formatovat sloupec Kod jako cislo bez desetinnych mist
  worksheet.getColumn(1).numFmt = '0';

  // Stylovani hlavicky
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' },
  };
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

  // Seradit kody numericky (pokud jsou cisla), jinak abecedne
  const sortedCodes = Array.from(stockData.keys()).sort((a, b) => {
    const numA = Number(a);
    const numB = Number(b);
    if (!isNaN(numA) && !isNaN(numB)) {
      return numA - numB;
    }
    return String(a).localeCompare(String(b), 'cs');
  });

  // Pridani dat
  for (const kod of sortedCodes) {
    const skladyMnozstvi = stockData.get(kod)!;

    const numericKod = Number(kod);
    const rowData: Record<string, string | number> = {
      kod: isNaN(numericKod) ? kod : numericKod,
    };

    for (const storage of sortedStorages) {
      const qty = skladyMnozstvi.get(storage) || 0;
      rowData[storage] = qty < 0 ? 0 : qty;
    }

    worksheet.addRow(rowData);
  }

  // Formatovani ciselnych sloupcu (vsechny krome prvniho)
  for (let i = 2; i <= sortedStorages.length + 1; i++) {
    worksheet.getColumn(i).numFmt = '#,##0';
  }

  // Pridani filtru
  if (sortedCodes.length > 0) {
    worksheet.autoFilter = {
      from: 'A1',
      to: `${String.fromCharCode(65 + sortedStorages.length)}${sortedCodes.length + 1}`,
    };
  }

  // Zmrazit prvni radek
  worksheet.views = [{ state: 'frozen', ySplit: 1 }];

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export async function POST(request: NextRequest) {
  // Ověření přihlášení
  const { user, error: authError } = await requireAuth()
  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json();
    const { url, username, password, ico } = body;

    if (!url || !username || !password || !ico) {
      return NextResponse.json(
        { success: false, error: 'Chybi prihlasovaci udaje' },
        { status: 400 }
      );
    }

    // 1. Stahnout VSECHNA data z mServeru
    console.log('[Vsechny sklady] Stahovani dat z mServeru...');
    const allItems = await fetchAllStockData(url, username, password, ico);
    console.log(`[Vsechny sklady] Stazeno celkem ${allItems.length} polozek`);

    if (allItems.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Zadna data ze skladu' },
        { status: 400 }
      );
    }

    // 2. Transformovat data: kod -> (sklad -> mnozstvi)
    const stockData = new Map<string, Map<string, number>>();
    const allStorages = new Set<string>();

    for (const item of allItems) {
      // Pouzit EAN jako klic (konzistentne s ostatnimi endpointy), fallback na code
      const kod = String(item.ean || item.code || '');
      if (!kod) continue;

      const storage = getExportStorageName(String(item.storage || 'Nezadano'));
      allStorages.add(storage);

      if (!stockData.has(kod)) {
        stockData.set(kod, new Map());
      }

      // Scitat mnozstvi pokud uz existuje (pro pripad duplicit)
      const currentQty = stockData.get(kod)!.get(storage) || 0;
      stockData.get(kod)!.set(storage, currentQty + item.quantity);
    }

    console.log(`[Vsechny sklady] Nalezeno ${stockData.size} unikatnich kodu`);
    console.log(`[Vsechny sklady] Nalezeno ${allStorages.size} skladu`);

    // DEBUG: Kontrola zda jsou kódy 99826* v stockData
    for (const [kod] of stockData) {
      if (kod.startsWith('99826')) {
        console.log('[DEBUG] stockData obsahuje:', kod, stockData.get(kod));
      }
    }

    // 3. Vygenerovat Excel
    console.log('[Vsechny sklady] Generovani Excel...');
    const excelBuffer = await createVsechnySkladyExcel(
      stockData,
      Array.from(allStorages)
    );

    // 4. Vratit jako downloadable soubor
    const fileName = `vsechny-sklady-${new Date().toISOString().split('T')[0]}.xlsx`;

    return new NextResponse(new Uint8Array(excelBuffer), {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('[Vsechny sklady] Error:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Neznama chyba pri generovani';

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

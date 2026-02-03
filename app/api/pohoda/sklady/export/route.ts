import { NextRequest, NextResponse } from 'next/server';
import { XMLParser } from 'fast-xml-parser';
import ExcelJS from 'exceljs';

function createAuthHeader(username: string, password: string): string {
  const credentials = `${username}:${password}`;
  return Buffer.from(credentials).toString('base64');
}

// XML pozadavek pro export skladovych zasob
function createSkladExportRequest(ico: string, skladId?: string | null): string {
  const filterPart = skladId
    ? `<ftr:filter>
        <ftr:storage>
          <typ:ids>${skladId}</typ:ids>
        </ftr:storage>
      </ftr:filter>`
    : '';

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
        ${filterPart}
      </lStk:requestStock>
    </lStk:listStockRequest>
  </dat:dataPackItem>
</dat:dataPack>`;
}

interface StockItem {
  code: string;
  name: string;
  ean: string;
  unit: string;
  quantity: number;
  purchasePrice: number;
  sellingPrice: number;
  storage: string;
  supplier: string;
  category: string;
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

        items.push({
          code: stockHeader?.code || stockHeader?.ids || '',
          name: stockHeader?.name || stockHeader?.text || '',
          ean: stockHeader?.EAN || stockHeader?.ean || '',
          unit: stockHeader?.unit || stockHeader?.mj || 'ks',
          quantity:
            parseFloat(stockHeader?.count || stockHeader?.quantity || '0') || 0,
          purchasePrice:
            parseFloat(
              stockHeader?.purchasePrice || stockHeader?.nakupCena || '0'
            ) || 0,
          sellingPrice:
            parseFloat(
              stockHeader?.sellingPrice || stockHeader?.prodejCena || '0'
            ) || 0,
          storage: stockHeader?.storage?.ids || stockHeader?.sklad || '',
          supplier:
            stockHeader?.supplier?.company || stockHeader?.dodavatel || '',
          category:
            stockHeader?.categories?.idCategory || stockHeader?.kategorie || '',
        });
      }
    }
  } catch (parseError) {
    console.error('Error parsing stock items:', parseError);
  }

  return items;
}

async function createExcel(
  items: StockItem[],
  skladName: string
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SYSTEM.PRO';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Skladove zasoby');

  // Definice sloupcu
  worksheet.columns = [
    { header: 'Kod', key: 'code', width: 15 },
    { header: 'Nazev', key: 'name', width: 40 },
    { header: 'EAN', key: 'ean', width: 15 },
    { header: 'MJ', key: 'unit', width: 8 },
    { header: 'Mnozstvi', key: 'quantity', width: 12 },
    { header: 'Nakupni cena', key: 'purchasePrice', width: 15 },
    { header: 'Prodejni cena', key: 'sellingPrice', width: 15 },
    { header: 'Sklad', key: 'storage', width: 15 },
    { header: 'Dodavatel', key: 'supplier', width: 25 },
    { header: 'Kategorie', key: 'category', width: 20 },
  ];

  // Stylovani hlavicky
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' },
  };
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

  // Pridani dat
  items.forEach((item) => {
    worksheet.addRow(item);
  });

  // Formatovani ciselnych sloupcu
  worksheet.getColumn('quantity').numFmt = '#,##0.00';
  worksheet.getColumn('purchasePrice').numFmt = '#,##0.00 Kc';
  worksheet.getColumn('sellingPrice').numFmt = '#,##0.00 Kc';

  // Pridani filtru
  worksheet.autoFilter = {
    from: 'A1',
    to: `J${items.length + 1}`,
  };

  // Zmrazit prvni radek
  worksheet.views = [{ state: 'frozen', ySplit: 1 }];

  // Pridani sumare na konec
  worksheet.addRow([]);
  worksheet.addRow([
    'Celkem polozek:',
    items.length,
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
  ]);
  worksheet.addRow([
    'Exportovano:',
    new Date().toLocaleString('cs-CZ'),
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
  ]);
  worksheet.addRow([
    'Sklad:',
    skladName || 'Vsechny sklady',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
  ]);

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, username, password, ico, skladId } = body;

    if (!url || !username || !password || !ico) {
      return NextResponse.json(
        { success: false, error: 'Chybi povinne udaje' },
        { status: 400 }
      );
    }

    const mserverUrl = `${url.replace(/\/$/, '')}/xml`;
    const authHeader = createAuthHeader(username, password);
    const xmlRequest = createSkladExportRequest(ico, skladId);

    console.log('Fetching stock data from Pohoda...');

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
      return NextResponse.json({
        success: false,
        error: `Server vratil chybu ${response.status}`,
      });
    }

    const xmlText = await response.text();
    console.log('Received response, length:', xmlText.length);
    console.log('First 500 chars:', xmlText.substring(0, 500));
    console.log('Parsing stock data...');

    // Zkontrolovat, zda odpoved obsahuje chybu
    if (xmlText.includes('<rdc:state>error</rdc:state>') || xmlText.includes('state="error"')) {
      console.error('Pohoda returned error in response');
      return NextResponse.json({
        success: false,
        error: 'Pohoda vratila chybu. Zkontrolujte opravneni uzivatele.',
      });
    }

    const items = parseStockItems(xmlText);
    console.log(`Parsed ${items.length} stock items`);

    // Vytvoreni Excel souboru
    const excelBuffer = await createExcel(items, skladId || 'Vsechny sklady');

    // Vraceni jako downloadable soubor
    return new NextResponse(new Uint8Array(excelBuffer), {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="pohoda-sklady-${skladId || 'all'}-${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    });
  } catch (error) {
    console.error('Pohoda export error:', error);

    let errorMessage = 'Chyba pri exportu dat';
    if (error instanceof Error) {
      if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
        errorMessage = 'Pozadavek vyprsel - zkuste mensi rozsah dat nebo zkontrolujte pripojeni';
      } else if (error.message.includes('ECONNREFUSED')) {
        errorMessage = 'Nelze se pripojit k mServeru - zkontrolujte, ze bezi';
      } else if (error.message.includes('fetch')) {
        errorMessage = 'Chyba sitoveho pripojeni';
      } else {
        errorMessage = error.message;
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

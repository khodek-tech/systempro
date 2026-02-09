import { NextRequest, NextResponse } from 'next/server';
import { XMLParser } from 'fast-xml-parser';
import ExcelJS from 'exceljs';
import * as fs from 'fs';
import * as path from 'path';
import iconv from 'iconv-lite';
import { requireAdmin } from '@/lib/supabase/api-auth';
import { checkRateLimit, getRateLimitKey } from '@/lib/rate-limit';

function createAuthHeader(username: string, password: string): string {
  const credentials = `${username}:${password}`;
  return Buffer.from(credentials).toString('base64');
}

// XML pozadavek pro export VSECH skladovych zasob najednou (bez filtru)
// Sjednoceno s fungujicim exportem skladu (/api/pohoda/sklady/export)
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

// Mapovani nazvu skladu z Pohody na nazvy v exportu (sjednoceno s vsechny-sklady)
const STORAGE_NAME_MAP: Record<string, string> = {
  Zdiby: 'ALL_Zdiby',
  'OC Šestka': 'OC_Šestka',
};

// Helper funkce pro ziskani nazvu skladu pro export
function getExportStorageName(pohodaName: string): string {
  return STORAGE_NAME_MAP[pohodaName] || pohodaName;
}

// Sklady pro sloupec E (Vse ve Zdiby) - tyto 2 sklady se scitaji
const ZDIBY_SKLADY = ['ALL_Zdiby', 'Daňový'];

// Prodejny pro vypocet sloupce F (Podklady nazvy)
const PRODEJNY = [
  'Zdiby',
  'Bohnice',
  'Butovice',
  'Brno',
  'Cerny Most',
  'OC Sestka',
  'Prosek',
  'Usti',
  'Chodov',
  'Vysocany',
  'Zlicin',
];

// Mapovani prodejna (nazev z Podklady) -> sklad (nazev po transformaci)
const PRODEJNA_TO_SKLAD: Record<string, string> = {
  Zdiby: 'ALL_Zdiby',
  Bohnice: 'Bohnice',
  Butovice: 'Butovice',
  Brno: 'Brno',
  'Cerny Most': 'Č Most',
  'OC Sestka': 'OC_Šestka',
  Prosek: 'Prosek',
  Usti: 'Ústí',
  Chodov: 'Chodov',
  Vysocany: 'Vysočany',
  Zlicin: 'Zličín',
};

interface StockItem {
  code: string;
  ean: string;
  quantity: number;
  storage: string;
}

interface PodkladyRow {
  kod: string;
  kategorie: string;
  nazev: string;
  cena: number;
  chciMit: Record<string, number>; // skladId -> pocet
  prodanoNejstarsi: number;
  prodanoPredchozi: number;
  prodanoAktualni: number;
  nasobek: number;
  obj: number;
  topZbozi: string;
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

        const ean = stockHeader?.EAN || stockHeader?.ean || '';
        const code = stockHeader?.code || stockHeader?.ids || '';
        const quantity = parseFloat(stockHeader?.count || stockHeader?.quantity || '0') || 0;
        // Storage field - same logic as working export endpoint
        const storage = stockHeader?.storage?.ids || stockHeader?.sklad || '';

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

  // Zkontrolovat, zda odpoved obsahuje chybu
  if (xmlText.includes('<rdc:state>error</rdc:state>') || xmlText.includes('state="error"')) {
    console.error('Pohoda returned error in response');
    throw new Error('Pohoda vratila chybu. Zkontrolujte opravneni uzivatele.');
  }

  return parseStockItems(xmlText);
}

async function loadPodklady(): Promise<PodkladyRow[]> {
  const filePath = path.join(process.cwd(), 'export', 'Podklady.xlsx');

  if (!fs.existsSync(filePath)) {
    throw new Error('Soubor Podklady.xlsx nebyl nalezen v /export');
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error('Prazdny Excel soubor');
  }

  const rows: PodkladyRow[] = [];

  // Preskocit prvni radek (hlavicka), zaciname od 2
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // skip header

    const obj = Number(row.getCell(20).value) || 0;
    // Filtrujeme pouze radky kde Obj = 1
    if (obj !== 1) return;

    const chciMit: Record<string, number> = {};
    PRODEJNY.forEach((prodejna, index) => {
      const colIndex = 5 + index; // sloupce E-O (5-15)
      chciMit[prodejna] = Number(row.getCell(colIndex).value) || 0;
    });

    rows.push({
      kod: String(row.getCell(1).value || ''),
      kategorie: String(row.getCell(2).value || ''),
      nazev: String(row.getCell(3).value || ''),
      cena: Number(row.getCell(4).value) || 0,
      chciMit,
      prodanoNejstarsi: Number(row.getCell(16).value) || 0,
      prodanoPredchozi: Number(row.getCell(17).value) || 0,
      prodanoAktualni: Number(row.getCell(18).value) || 0,
      nasobek: Number(row.getCell(19).value) || 0,
      obj,
      topZbozi: String(row.getCell(21).value || ''),
    });
  });

  return rows;
}

async function createOutputExcel(
  podklady: PodkladyRow[],
  stockData: Map<string, Map<string, number>> // kod -> (sklad -> mnozstvi)
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SYSTEM.PRO';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Objednavka');

  // Definice sloupcu podle planu
  worksheet.columns = [
    { header: 'Kod', key: 'kod', width: 15 },
    { header: 'Kategorie', key: 'kategorie', width: 20 },
    { header: 'Nazev', key: 'nazev', width: 40 },
    { header: 'Cena', key: 'cena', width: 12 },
    { header: 'Vse ve Zdiby', key: 'vseVeZdiby', width: 15 },
    { header: 'Objednat', key: 'objednat', width: 12 },
    { header: 'Objednano', key: 'objednano1', width: 12 },
    { header: 'Objednano 2', key: 'objednano2', width: 12 },
    { header: 'Vyradit', key: 'vyradit', width: 12 },
    { header: 'Poznamka', key: 'poznamka', width: 25 },
    { header: 'nejstarsi', key: 'nejstarsi', width: 12 },
    { header: 'predchozi', key: 'predchozi', width: 12 },
    { header: 'aktualni', key: 'aktualni', width: 12 },
    { header: 'Na X mesicu', key: 'naXMesicu', width: 12 },
    { header: 'Top zbozi', key: 'topZbozi', width: 15 },
  ];

  // Stylovani hlavicky
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' },
  };
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

  // Zpracovani dat
  for (const row of podklady) {
    // Sloupec E: Vse ve Zdiby = suma ALL_Zdiby + Danovy pro dany kod
    // Zaporne stavy se pocitaji jako 0
    let vseVeZdiby = 0;
    const kodData = stockData.get(row.kod);
    if (kodData) {
      for (const skladName of ZDIBY_SKLADY) {
        const qty = kodData.get(skladName) || 0;
        vseVeZdiby += qty < 0 ? 0 : qty;
      }
    }

    // Sloupec F: Objednat
    // Zdiby (centrala) = presny rozdil (muze byt zaporny = prebytek pokryje nedostatek jinde)
    // Prodejny = pouze nedostatek MAX(0, rozdil)
    // Zaporne stavy skladu se pocitaji jako 0
    let objednat = 0;

    // 1. Zdiby (centrala) = ALL_Zdiby + Danovy - presny rozdil
    const rawZdiby = kodData?.get('ALL_Zdiby') || 0;
    const rawDanovy = kodData?.get('Daňový') || 0;
    const zdibyCelkem =
      (rawZdiby < 0 ? 0 : rawZdiby) + (rawDanovy < 0 ? 0 : rawDanovy);
    const zdibyChciMit = row.chciMit['Zdiby'] || 0;
    objednat += zdibyChciMit - zdibyCelkem; // muze byt zaporny

    // 2. Prodejny (bez Zdiby) - pouze nedostatek MAX(0, rozdil)
    for (const prodejna of PRODEJNY) {
      if (prodejna === 'Zdiby') continue; // uz zpracovano vyse

      const skladName = PRODEJNA_TO_SKLAD[prodejna];
      const rawStav = kodData?.get(skladName) || 0;
      const aktualniStav = rawStav < 0 ? 0 : rawStav;
      const chciMit = row.chciMit[prodejna] || 0;
      const nedostatek = Math.max(0, chciMit - aktualniStav);
      objednat += nedostatek;
    }

    worksheet.addRow({
      kod: isNaN(Number(row.kod)) ? row.kod : Number(row.kod),
      kategorie: row.kategorie,
      nazev: row.nazev,
      cena: row.cena,
      vseVeZdiby,
      objednat,
      objednano1: '',
      objednano2: '',
      vyradit: '',
      poznamka: '',
      nejstarsi: row.prodanoNejstarsi,
      predchozi: row.prodanoPredchozi,
      aktualni: row.prodanoAktualni,
      naXMesicu: row.nasobek,
      topZbozi: row.topZbozi,
    });
  }

  // Formatovani ciselnych sloupcu
  worksheet.getColumn('kod').numFmt = '0';
  worksheet.getColumn('cena').numFmt = '#,##0.00 Kc';
  worksheet.getColumn('vseVeZdiby').numFmt = '#,##0';
  worksheet.getColumn('objednat').numFmt = '#,##0';
  worksheet.getColumn('nejstarsi').numFmt = '#,##0';
  worksheet.getColumn('predchozi').numFmt = '#,##0';
  worksheet.getColumn('aktualni').numFmt = '#,##0';
  worksheet.getColumn('naXMesicu').numFmt = '#,##0';

  // Pridani filtru
  worksheet.autoFilter = {
    from: 'A1',
    to: `O${podklady.length + 1}`,
  };

  // Zmrazit prvni radek
  worksheet.views = [{ state: 'frozen', ySplit: 1 }];

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export async function POST(request: NextRequest) {
  // Rate limit: 5 order generations per minute per IP
  const rlKey = getRateLimitKey(request, 'pohoda-order');
  const rl = checkRateLimit(rlKey, { limit: 5, windowSeconds: 60 });
  if (!rl.success) {
    return NextResponse.json(
      { success: false, error: 'Příliš mnoho požadavků. Zkuste to za chvíli.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    );
  }

  const { error: authError } = await requireAdmin()
  if (authError) {
    const status = authError === 'Forbidden' ? 403 : 401
    return NextResponse.json({ success: false, error: authError }, { status })
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

    // 1. Nacist Podklady.xlsx
    const podklady = await loadPodklady();

    if (podklady.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Zadne produkty s Obj=1 v Podkladech' },
        { status: 400 }
      );
    }

    // 2. Stahnout VSECHNA data najednou (jako fungujici export)
    const allItems = await fetchAllStockData(url, username, password, ico);

    // 3. Transformovat data: kod -> (sklad -> mnozstvi) - sjednoceno s vsechny-sklady
    const stockData = new Map<string, Map<string, number>>();
    const allStorages = new Set<string>();

    for (const item of allItems) {
      // Pouzit EAN jako klic (Podklady.xlsx obsahuje EAN kody), fallback na code
      const kod = String(item.ean || item.code || '');
      if (!kod) continue;

      // Aplikovat mapovani nazvu skladu (Zdiby -> ALL_Zdiby, OC Šestka -> OC_Šestka)
      const storage = getExportStorageName(String(item.storage || 'Nezadano'));
      allStorages.add(storage);

      if (!stockData.has(kod)) {
        stockData.set(kod, new Map());
      }

      // Scitat mnozstvi pokud uz existuje (pro pripad duplicit)
      const currentQty = stockData.get(kod)!.get(storage) || 0;
      stockData.get(kod)!.set(storage, currentQty + item.quantity);
    }

    // 4. Vygenerovat vystupni Excel
    const excelBuffer = await createOutputExcel(podklady, stockData);

    // 5. Vratit jako downloadable soubor
    const fileName = `objednavka-${new Date().toISOString().split('T')[0]}.xlsx`;

    return new NextResponse(new Uint8Array(excelBuffer), {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('Generate order error:', error);

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

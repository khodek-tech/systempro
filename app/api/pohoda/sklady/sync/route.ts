import { NextRequest, NextResponse } from 'next/server';
import { XMLParser } from 'fast-xml-parser';
import { requireAdmin } from '@/lib/supabase/api-auth';
import { pohodaSkladySyncSchema, parseBody } from '@/lib/api/schemas';
import { createClient } from '@/lib/supabase/server';
import { fetchWithRetry } from '@/lib/api/fetch-retry';

function createAuthHeader(username: string, password: string): string {
  const credentials = `${username}:${password}`;
  return Buffer.from(credentials).toString('base64');
}

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

interface FullStockItem {
  pohodaId: number;
  typZasoby: string | null;
  kod: string | null;
  ean: string | null;
  plu: number | null;
  nabizet_pri_prodeji: boolean | null;
  evidovat_vyrobni_cisla: boolean | null;
  internetovy_obchod: boolean | null;
  evidovat_sarze: boolean | null;
  sazba_dph_nakup: string | null;
  sazba_dph_prodej: string | null;
  nazev: string | null;
  doplnkovy_text: string | null;
  merna_jednotka: string | null;
  merna_jednotka_2: string | null;
  merna_jednotka_3: string | null;
  koeficient_2: number | null;
  koeficient_3: number | null;
  cleneni_skladu_id: number | null;
  cleneni_skladu_nazev: string | null;
  cenova_skupina_id: number | null;
  cenova_skupina_nazev: string | null;
  vazena_nakupni_cena: number | null;
  nakupni_cena: number | null;
  prodejni_cena: number | null;
  fixace_ceny: string | null;
  limit_min: number | null;
  limit_max: number | null;
  hmotnost: number | null;
  objem: number | null;
  stav_zasoby: number | null;
  mnozstvi_k_vydeji: number | null;
  prijate_objednavky: number | null;
  rezervace: number | null;
  dodavatel_id: number | null;
  dodavatel_nazev: string | null;
  nazev_pro_objednavku: string | null;
  mnozstvi_objednavka: number | null;
  mnozstvi_objednane: number | null;
  reklamace: number | null;
  servis: number | null;
  zkraceny_nazev: string | null;
  typ_zaruky: string | null;
  delka_zaruky: number | null;
  vyrobce: string | null;
  stredisko_id: number | null;
  stredisko_nazev: string | null;
  cinnost_id: number | null;
  cinnost_nazev: string | null;
  zakazka_id: number | null;
  zakazka_nazev: string | null;
  vynosovy_ucet: string | null;
  nakladovy_ucet: string | null;
  poznamka: string | null;
  strucny_popis: string | null;
  podrobny_popis: string | null;
  novinka: boolean | null;
  doprodej: boolean | null;
  akce: boolean | null;
  doporucujeme: boolean | null;
  sleva: boolean | null;
  pripravujeme: boolean | null;
  dostupnost: string | null;
  oznaceni_zaznamu: boolean | null;
}

function parseNum(val: unknown): number | null {
  if (val === undefined || val === null || val === '') return null;
  const n = parseFloat(String(val));
  return isNaN(n) ? null : n;
}

function parseInt2(val: unknown): number | null {
  if (val === undefined || val === null || val === '') return null;
  const n = parseInt(String(val), 10);
  return isNaN(n) ? null : n;
}

function parseBool(val: unknown): boolean | null {
  if (val === undefined || val === null) return null;
  if (typeof val === 'boolean') return val;
  if (val === 'true' || val === '1') return true;
  if (val === 'false' || val === '0') return false;
  return null;
}

function parseStr(val: unknown): string | null {
  if (val === undefined || val === null) return null;
  return String(val);
}

function parseFullStockItems(xmlText: string): FullStockItem[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    removeNSPrefix: true,
  });

  const result = parser.parse(xmlText);
  const items: FullStockItem[] = [];

  try {
    const responsePack = result.responsePack || result.rsp || result;
    const responseItems = responsePack?.responsePackItem || responsePack?.item || [];
    const itemArray = Array.isArray(responseItems) ? responseItems : [responseItems];

    for (const responseItem of itemArray) {
      const stockList = responseItem?.listStock?.stock || responseItem?.stock || [];
      const stockArray = Array.isArray(stockList) ? stockList : [stockList];

      for (const stock of stockArray) {
        if (!stock) continue;
        const h = stock.stockHeader || stock;

        const pohodaId = parseInt2(h?.id || h?.['@_id']);
        if (!pohodaId) continue;

        items.push({
          pohodaId,
          typZasoby: parseStr(h?.stockType),
          kod: parseStr(h?.code),
          ean: parseStr(h?.EAN),
          plu: parseInt2(h?.PLU),
          nabizet_pri_prodeji: parseBool(h?.isSales),
          evidovat_vyrobni_cisla: parseBool(h?.isSerialNumber),
          internetovy_obchod: parseBool(h?.isInternet),
          evidovat_sarze: parseBool(h?.isBatch),
          sazba_dph_nakup: parseStr(h?.purchasingRateVAT),
          sazba_dph_prodej: parseStr(h?.sellingRateVAT),
          nazev: parseStr(h?.name),
          doplnkovy_text: parseStr(h?.nameComplement),
          merna_jednotka: parseStr(h?.unit),
          merna_jednotka_2: parseStr(h?.unit2),
          merna_jednotka_3: parseStr(h?.unit3),
          koeficient_2: parseNum(h?.coefficient2),
          koeficient_3: parseNum(h?.coefficient3),
          cleneni_skladu_id: parseInt2(h?.storage?.id),
          cleneni_skladu_nazev: parseStr(h?.storage?.ids),
          cenova_skupina_id: parseInt2(h?.typePrice?.id),
          cenova_skupina_nazev: parseStr(h?.typePrice?.ids),
          vazena_nakupni_cena: parseNum(h?.weightedPurchasePrice),
          nakupni_cena: parseNum(h?.purchasingPrice),
          prodejni_cena: parseNum(h?.sellingPrice),
          fixace_ceny: parseStr(h?.fixation),
          limit_min: parseNum(h?.limitMin),
          limit_max: parseNum(h?.limitMax),
          hmotnost: parseNum(h?.mass),
          objem: parseNum(h?.volume),
          stav_zasoby: parseNum(h?.count),
          mnozstvi_k_vydeji: parseNum(h?.countIssue),
          prijate_objednavky: parseNum(h?.countReceivedOrders),
          rezervace: parseNum(h?.reservation),
          dodavatel_id: parseInt2(h?.supplier?.id),
          dodavatel_nazev: parseStr(h?.supplier?.company),
          nazev_pro_objednavku: parseStr(h?.orderName),
          mnozstvi_objednavka: parseNum(h?.orderQuantity),
          mnozstvi_objednane: parseNum(h?.countIssuedOrders),
          reklamace: parseNum(h?.reclamation),
          servis: parseNum(h?.service),
          zkraceny_nazev: parseStr(h?.shortName),
          typ_zaruky: parseStr(h?.guaranteeType),
          delka_zaruky: parseInt2(h?.guarantee),
          vyrobce: parseStr(h?.producer),
          stredisko_id: parseInt2(h?.centre?.id),
          stredisko_nazev: parseStr(h?.centre?.ids),
          cinnost_id: parseInt2(h?.activity?.id),
          cinnost_nazev: parseStr(h?.activity?.ids),
          zakazka_id: parseInt2(h?.contract?.id),
          zakazka_nazev: parseStr(h?.contract?.ids),
          vynosovy_ucet: parseStr(h?.yield),
          nakladovy_ucet: parseStr(h?.cost),
          poznamka: parseStr(h?.note),
          strucny_popis: parseStr(h?.description),
          podrobny_popis: parseStr(h?.description2),
          novinka: parseBool(h?.news),
          doprodej: parseBool(h?.clearanceSale),
          akce: parseBool(h?.sale),
          doporucujeme: parseBool(h?.recommended),
          sleva: parseBool(h?.discount),
          pripravujeme: parseBool(h?.prepare),
          dostupnost: parseStr(h?.availability),
          oznaceni_zaznamu: parseBool(h?.markRecord),
        });
      }
    }
  } catch (parseError) {
    console.error('Error parsing stock items:', parseError);
  }

  return items;
}

// Map FullStockItem to DB row, filtering to only selected columns
function itemToDbRow(item: FullStockItem, columns: string[]): Record<string, unknown> {
  const row: Record<string, unknown> = {
    pohoda_id: item.pohodaId,
    synchronizovano: new Date().toISOString(),
  };

  const columnMap: Record<string, [string, unknown]> = {
    kod: ['kod', item.kod],
    nazev: ['nazev', item.nazev],
    ean: ['ean', item.ean],
    plu: ['plu', item.plu],
    zkraceny_nazev: ['zkraceny_nazev', item.zkraceny_nazev],
    doplnkovy_text: ['doplnkovy_text', item.doplnkovy_text],
    stav_zasoby: ['stav_zasoby', item.stav_zasoby],
    mnozstvi_k_vydeji: ['mnozstvi_k_vydeji', item.mnozstvi_k_vydeji],
    prijate_objednavky: ['prijate_objednavky', item.prijate_objednavky],
    rezervace: ['rezervace', item.rezervace],
    mnozstvi_objednane: ['mnozstvi_objednane', item.mnozstvi_objednane],
    nakupni_cena: ['nakupni_cena', item.nakupni_cena],
    prodejni_cena: ['prodejni_cena', item.prodejni_cena],
    vazena_nakupni_cena: ['vazena_nakupni_cena', item.vazena_nakupni_cena],
    fixace_ceny: ['fixace_ceny', item.fixace_ceny],
    merna_jednotka: ['merna_jednotka', item.merna_jednotka],
    merna_jednotka_2: ['merna_jednotka_2', item.merna_jednotka_2],
    merna_jednotka_3: ['merna_jednotka_3', item.merna_jednotka_3],
    koeficient_2: ['koeficient_2', item.koeficient_2],
    koeficient_3: ['koeficient_3', item.koeficient_3],
    cleneni_skladu: ['cleneni_skladu_id', item.cleneni_skladu_id],
    cenova_skupina: ['cenova_skupina_id', item.cenova_skupina_id],
    dodavatel: ['dodavatel_id', item.dodavatel_id],
    limit_min: ['limit_min', item.limit_min],
    limit_max: ['limit_max', item.limit_max],
    nazev_pro_objednavku: ['nazev_pro_objednavku', item.nazev_pro_objednavku],
    mnozstvi_objednavka: ['mnozstvi_objednavka', item.mnozstvi_objednavka],
    hmotnost: ['hmotnost', item.hmotnost],
    objem: ['objem', item.objem],
    novinka: ['novinka', item.novinka],
    doprodej: ['doprodej', item.doprodej],
    akce: ['akce', item.akce],
    doporucujeme: ['doporucujeme', item.doporucujeme],
    sleva: ['sleva', item.sleva],
    pripravujeme: ['pripravujeme', item.pripravujeme],
    dostupnost: ['dostupnost', item.dostupnost],
    typ_zasoby: ['typ_zasoby', item.typZasoby],
    sazba_dph_nakup: ['sazba_dph_nakup', item.sazba_dph_nakup],
    sazba_dph_prodej: ['sazba_dph_prodej', item.sazba_dph_prodej],
    vyrobce: ['vyrobce', item.vyrobce],
    typ_zaruky: ['typ_zaruky', item.typ_zaruky],
    delka_zaruky: ['delka_zaruky', item.delka_zaruky],
    poznamka: ['poznamka', item.poznamka],
    strucny_popis: ['strucny_popis', item.strucny_popis],
    podrobny_popis: ['podrobny_popis', item.podrobny_popis],
    oznaceni_zaznamu: ['oznaceni_zaznamu', item.oznaceni_zaznamu],
    stredisko: ['stredisko_id', item.stredisko_id],
    cinnost: ['cinnost_id', item.cinnost_id],
    zakazka: ['zakazka_id', item.zakazka_id],
    vynosovy_ucet: ['vynosovy_ucet', item.vynosovy_ucet],
    nakladovy_ucet: ['nakladovy_ucet', item.nakladovy_ucet],
    nabizet_pri_prodeji: ['nabizet_pri_prodeji', item.nabizet_pri_prodeji],
    evidovat_vyrobni_cisla: ['evidovat_vyrobni_cisla', item.evidovat_vyrobni_cisla],
    internetovy_obchod: ['internetovy_obchod', item.internetovy_obchod],
    evidovat_sarze: ['evidovat_sarze', item.evidovat_sarze],
    reklamace: ['reklamace', item.reklamace],
    servis: ['servis', item.servis],
  };

  // Also add paired columns (e.g. cleneni_skladu includes both id and nazev)
  const pairedColumns: Record<string, string[]> = {
    cleneni_skladu: ['cleneni_skladu_nazev'],
    cenova_skupina: ['cenova_skupina_nazev'],
    dodavatel: ['dodavatel_nazev'],
    stredisko: ['stredisko_nazev'],
    cinnost: ['cinnost_nazev'],
    zakazka: ['zakazka_nazev'],
  };

  const pairedValues: Record<string, unknown> = {
    cleneni_skladu_nazev: item.cleneni_skladu_nazev,
    cenova_skupina_nazev: item.cenova_skupina_nazev,
    dodavatel_nazev: item.dodavatel_nazev,
    stredisko_nazev: item.stredisko_nazev,
    cinnost_nazev: item.cinnost_nazev,
    zakazka_nazev: item.zakazka_nazev,
  };

  for (const col of columns) {
    const mapping = columnMap[col];
    if (mapping) {
      row[mapping[0]] = mapping[1];
      // Add paired columns
      const paired = pairedColumns[col];
      if (paired) {
        for (const p of paired) {
          row[p] = pairedValues[p];
        }
      }
    }
  }

  return row;
}

export async function POST(request: NextRequest) {
  const { error: authError } = await requireAdmin();
  if (authError) {
    const status = authError === 'Forbidden' ? 403 : 401;
    return NextResponse.json({ success: false, error: authError }, { status });
  }

  const startTime = Date.now();
  const supabase = await createClient();
  let logId: number | null = null;

  try {
    const body = await request.json();
    const parsed = parseBody(pohodaSkladySyncSchema, body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error }, { status: 400 });
    }
    const { url, username, password, ico, skladId, columns } = parsed.data;

    // Create running log entry
    const { data: logData } = await supabase
      .from('pohoda_sync_log')
      .insert({ typ: 'zasoby', stav: 'running', sklad: skladId || null })
      .select('id')
      .single();
    logId = logData?.id ?? null;

    // Fetch from mServer
    const mserverUrl = `${url.replace(/\/$/, '')}/xml`;
    const authHeader = createAuthHeader(username, password);
    const xmlRequest = createSkladExportRequest(ico, skladId);

    const response = await fetchWithRetry(mserverUrl, {
      method: 'POST',
      headers: {
        'STW-Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/xml; charset=Windows-1250',
      },
      body: xmlRequest,
      signal: AbortSignal.timeout(300000),
    });

    if (!response.ok) {
      throw new Error(`mServer vratil chybu ${response.status}`);
    }

    const xmlText = await response.text();

    if (xmlText.includes('<rdc:state>error</rdc:state>') || xmlText.includes('state="error"')) {
      throw new Error('Pohoda vratila chybu. Zkontrolujte opravneni uzivatele.');
    }

    // Parse all stock items with full fields
    const items = parseFullStockItems(xmlText);

    if (items.length === 0) {
      const duration = Date.now() - startTime;
      if (logId) {
        await supabase
          .from('pohoda_sync_log')
          .update({ stav: 'success', pocet_zaznamu: 0, trvani_ms: duration, zprava: 'Zadne zasoby k synchronizaci' })
          .eq('id', logId);
      }
      return NextResponse.json({
        success: true,
        pocetZaznamu: 0,
        pocetNovych: 0,
        pocetAktualizovanych: 0,
        trvaniMs: duration,
      });
    }

    // Get existing pohoda_ids to determine new vs updated
    const pohodaIds = items.map((i) => i.pohodaId);
    const { data: existingRows } = await supabase
      .from('pohoda_zasoby')
      .select('pohoda_id')
      .in('pohoda_id', pohodaIds);
    const existingSet = new Set((existingRows || []).map((r: { pohoda_id: number }) => r.pohoda_id));

    // Upsert in batches of 500
    const batchSize = 500;
    let pocetNovych = 0;
    let pocetAktualizovanych = 0;

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const rows = batch.map((item) => itemToDbRow(item, columns));

      const { error: upsertError } = await supabase
        .from('pohoda_zasoby')
        .upsert(rows, { onConflict: 'pohoda_id' });

      if (upsertError) {
        throw new Error(`Chyba pri upsert: ${upsertError.message}`);
      }

      for (const item of batch) {
        if (existingSet.has(item.pohodaId)) {
          pocetAktualizovanych++;
        } else {
          pocetNovych++;
        }
      }
    }

    const duration = Date.now() - startTime;

    // Update log
    if (logId) {
      await supabase
        .from('pohoda_sync_log')
        .update({
          stav: 'success',
          pocet_zaznamu: items.length,
          pocet_novych: pocetNovych,
          pocet_aktualizovanych: pocetAktualizovanych,
          trvani_ms: duration,
        })
        .eq('id', logId);
    }

    return NextResponse.json({
      success: true,
      pocetZaznamu: items.length,
      pocetNovych,
      pocetAktualizovanych,
      trvaniMs: duration,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Neznama chyba';

    if (logId) {
      await supabase
        .from('pohoda_sync_log')
        .update({
          stav: 'error',
          zprava: errorMessage,
          trvani_ms: duration,
        })
        .eq('id', logId);
    }

    console.error('Pohoda sync error:', error);
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

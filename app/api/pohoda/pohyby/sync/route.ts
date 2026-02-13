import { NextRequest, NextResponse } from 'next/server';
import { XMLParser } from 'fast-xml-parser';
import { requireAdmin } from '@/lib/supabase/api-auth';
import { pohodaPohybySyncSchema, parseBody } from '@/lib/api/schemas';
import { createClient } from '@/lib/supabase/server';
import { fetchWithRetry } from '@/lib/api/fetch-retry';

function createAuthHeader(username: string, password: string): string {
  const credentials = `${username}:${password}`;
  return Buffer.from(credentials).toString('base64');
}

function createPohybyExportRequest(ico: string): string {
  return `<?xml version="1.0" encoding="Windows-1250"?>
<dat:dataPack
  xmlns:dat="http://www.stormware.cz/schema/version_2/data.xsd"
  xmlns:typ="http://www.stormware.cz/schema/version_2/type.xsd"
  xmlns:lst="http://www.stormware.cz/schema/version_2/list.xsd"
  xmlns:mov="http://www.stormware.cz/schema/version_2/movement.xsd"
  xmlns:ftr="http://www.stormware.cz/schema/version_2/filter.xsd"
  id="mov001"
  ico="${ico}"
  application="SYSTEM.PRO"
  version="2.0"
  note="Export skladovych pohybu">
  <dat:dataPackItem id="mov001" version="2.0">
    <mov:listMovementRequest version="2.0" movementVersion="2.0">
      <mov:requestMovement>
        <ftr:filter>
          <ftr:dateFrom>2025-11-01</ftr:dateFrom>
        </ftr:filter>
      </mov:requestMovement>
    </mov:listMovementRequest>
  </dat:dataPackItem>
</dat:dataPack>`;
}

interface MovementItem {
  pohodaId: number;
  agenda: string | null;
  typZasoby: string | null;
  typPohybu: string | null;
  datum: string | null;
  cisloDokladu: string | null;
  regCislo: string | null;
  zasobaId: number | null;
  zasobaKod: string | null;
  zasobaNazev: string | null;
  zasobaEan: string | null;
  zasobaPlu: number | null;
  mernaJednotka: string | null;
  mnozstvi: number | null;
  jednotkovaCena: number | null;
  celkovaCena: number | null;
  vazenaNakupniCena: number | null;
  oceneni: number | null;
  ziskJednotka: number | null;
  ziskCelkem: number | null;
  stavPoPohybu: number | null;
  cenovaSkupinaId: number | null;
  cenovaSkupinaNazev: string | null;
  adresaFirma: string | null;
  adresaJmeno: string | null;
  adresaUlice: string | null;
  adresaMesto: string | null;
  adresaPsc: string | null;
  strediskoId: number | null;
  strediskoNazev: string | null;
  cinnostId: number | null;
  cinnostNazev: string | null;
  zakazkaId: number | null;
  zakazkaNazev: string | null;
  oznaceniZaznamu: boolean | null;
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

function parseMovementItems(xmlText: string): MovementItem[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    removeNSPrefix: true,
  });

  const result = parser.parse(xmlText);
  const items: MovementItem[] = [];

  try {
    const responsePack = result.responsePack || result.rsp || result;
    const responseItems = responsePack?.responsePackItem || responsePack?.item || [];
    const itemArray = Array.isArray(responseItems) ? responseItems : [responseItems];

    for (const responseItem of itemArray) {
      const movementList = responseItem?.listMovement?.movement || responseItem?.movement || [];
      const movementArray = Array.isArray(movementList) ? movementList : [movementList];

      for (const movement of movementArray) {
        if (!movement) continue;
        const h = movement.movementHeader || movement;

        const pohodaId = parseInt2(h?.id || h?.['@_id']);
        if (!pohodaId) continue;

        const stockItem = h?.stockItem || {};
        const address = h?.partnerIdentity?.address || {};

        items.push({
          pohodaId,
          agenda: parseStr(h?.agenda),
          typZasoby: parseStr(h?.stockType || stockItem?.stockType),
          typPohybu: parseStr(h?.movType),
          datum: parseStr(h?.date),
          cisloDokladu: parseStr(h?.number?.numberRequested),
          regCislo: parseStr(h?.regNumber),
          zasobaId: parseInt2(stockItem?.id || stockItem?.store?.id),
          zasobaKod: parseStr(stockItem?.code || stockItem?.store?.ids),
          zasobaNazev: parseStr(stockItem?.name),
          zasobaEan: parseStr(stockItem?.EAN),
          zasobaPlu: parseInt2(stockItem?.PLU),
          mernaJednotka: parseStr(h?.unit),
          mnozstvi: parseNum(h?.quantity),
          jednotkovaCena: parseNum(h?.unitPrice),
          celkovaCena: parseNum(h?.price),
          vazenaNakupniCena: parseNum(h?.weightedPurchasePrice),
          oceneni: parseNum(h?.valuation),
          ziskJednotka: parseNum(h?.profitUnit),
          ziskCelkem: parseNum(h?.profitTotal),
          stavPoPohybu: parseNum(h?.countAfter),
          cenovaSkupinaId: parseInt2(h?.typePrice?.id),
          cenovaSkupinaNazev: parseStr(h?.typePrice?.ids),
          adresaFirma: parseStr(address?.company),
          adresaJmeno: parseStr(address?.name),
          adresaUlice: parseStr(address?.street),
          adresaMesto: parseStr(address?.city),
          adresaPsc: parseStr(address?.zip),
          strediskoId: parseInt2(h?.centre?.id),
          strediskoNazev: parseStr(h?.centre?.ids),
          cinnostId: parseInt2(h?.activity?.id),
          cinnostNazev: parseStr(h?.activity?.ids),
          zakazkaId: parseInt2(h?.contract?.id),
          zakazkaNazev: parseStr(h?.contract?.ids),
          oznaceniZaznamu: parseBool(h?.markRecord),
        });
      }
    }
  } catch (parseError) {
    console.error('Error parsing movement items:', parseError);
  }

  return items;
}

function itemToDbRow(item: MovementItem, columns: string[]): Record<string, unknown> {
  const row: Record<string, unknown> = {
    pohoda_id: item.pohodaId,
    synchronizovano: new Date().toISOString(),
  };

  const columnMap: Record<string, [string, unknown]> = {
    agenda: ['agenda', item.agenda],
    typ_pohybu: ['typ_pohybu', item.typPohybu],
    datum: ['datum', item.datum],
    cislo_dokladu: ['cislo_dokladu', item.cisloDokladu],
    reg_cislo: ['reg_cislo', item.regCislo],
    zasoba_kod: ['zasoba_kod', item.zasobaKod],
    zasoba_nazev: ['zasoba_nazev', item.zasobaNazev],
    zasoba_ean: ['zasoba_ean', item.zasobaEan],
    zasoba_plu: ['zasoba_plu', item.zasobaPlu],
    typ_zasoby: ['typ_zasoby', item.typZasoby],
    mnozstvi: ['mnozstvi', item.mnozstvi],
    merna_jednotka: ['merna_jednotka', item.mernaJednotka],
    stav_po_pohybu: ['stav_po_pohybu', item.stavPoPohybu],
    jednotkova_cena: ['jednotkova_cena', item.jednotkovaCena],
    celkova_cena: ['celkova_cena', item.celkovaCena],
    vazena_nakupni_cena: ['vazena_nakupni_cena', item.vazenaNakupniCena],
    oceneni: ['oceneni', item.oceneni],
    zisk_jednotka: ['zisk_jednotka', item.ziskJednotka],
    zisk_celkem: ['zisk_celkem', item.ziskCelkem],
    cenova_skupina: ['cenova_skupina_id', item.cenovaSkupinaId],
    adresa_firma: ['adresa_firma', item.adresaFirma],
    adresa_jmeno: ['adresa_jmeno', item.adresaJmeno],
    adresa_ulice: ['adresa_ulice', item.adresaUlice],
    adresa_mesto: ['adresa_mesto', item.adresaMesto],
    adresa_psc: ['adresa_psc', item.adresaPsc],
    stredisko: ['stredisko_id', item.strediskoId],
    cinnost: ['cinnost_id', item.cinnostId],
    zakazka: ['zakazka_id', item.zakazkaId],
    oznaceni_zaznamu: ['oznaceni_zaznamu', item.oznaceniZaznamu],
  };

  const pairedColumns: Record<string, string[]> = {
    cenova_skupina: ['cenova_skupina_nazev'],
    stredisko: ['stredisko_nazev'],
    cinnost: ['cinnost_nazev'],
    zakazka: ['zakazka_nazev'],
  };

  const pairedValues: Record<string, unknown> = {
    cenova_skupina_nazev: item.cenovaSkupinaNazev,
    stredisko_nazev: item.strediskoNazev,
    cinnost_nazev: item.cinnostNazev,
    zakazka_nazev: item.zakazkaNazev,
  };

  // Always include zasoba_id for reference
  row.zasoba_id = item.zasobaId;

  for (const col of columns) {
    const mapping = columnMap[col];
    if (mapping) {
      row[mapping[0]] = mapping[1];
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
    const parsed = parseBody(pohodaPohybySyncSchema, body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error }, { status: 400 });
    }
    const { url, username, password, ico, columns } = parsed.data;

    // Create running log entry
    const { data: logData } = await supabase
      .from('pohoda_sync_log')
      .insert({ typ: 'pohyby', stav: 'running' })
      .select('id')
      .single();
    logId = logData?.id ?? null;

    // Fetch from mServer
    const mserverUrl = `${url.replace(/\/$/, '')}/xml`;
    const authHeader = createAuthHeader(username, password);
    const xmlRequest = createPohybyExportRequest(ico);

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

    const items = parseMovementItems(xmlText);

    if (items.length === 0) {
      const duration = Date.now() - startTime;
      if (logId) {
        await supabase
          .from('pohoda_sync_log')
          .update({ stav: 'success', pocet_zaznamu: 0, trvani_ms: duration, zprava: 'Zadne pohyby k synchronizaci' })
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
      .from('pohoda_pohyby')
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
        .from('pohoda_pohyby')
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

    console.error('Pohoda pohyby sync error:', error);
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

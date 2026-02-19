import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/supabase/api-auth';
import { createClient } from '@/lib/supabase/server';

// Stores to generate prevodky for (must match rozdeleni/route.ts)
const DELIVERY_STORES = [
  'Bohnice', 'Brno', 'Butovice', 'Chodov', 'OC_Šestka', 'Prosek', 'Ústí', 'Vysočany', 'Zličín',
];

const SKIP_STORES = new Set(['Č_Most', 'ALL_Zdiby']);
const DEFICIT_THRESHOLD = 0.3;

interface Assignment {
  store: string;
  userId: string;
}

interface Product {
  name: string;
  code: string;
  ciloveStavy: Record<string, number>;
}

interface SalesRow {
  code: string;
  store: string;
  avg: number;
}

interface SalesZdibyRow {
  code: string;
  avg: number;
}

interface StockRow {
  code: string;
  store: string;
  qty: number;
}

interface ZdibyRow {
  code: string;
  qty: number;
  position: string;
}

interface RozdeleniData {
  products: Product[];
  sales: SalesRow[];
  salesZdiby: SalesZdibyRow[];
  stock: StockRow[];
  zdiby: ZdibyRow[];
}

interface DeliveryItem {
  code: string;
  name: string;
  pocetKusu: number;
  pozice: string;
}

/**
 * Generate next prevodka number: PV-YYYY-NNN
 */
async function getNextPrevodkaNumber(supabase: Awaited<ReturnType<typeof createClient>>): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `PV-${year}-`;

  const { data } = await supabase
    .from('prevodky')
    .select('cislo_prevodky')
    .like('cislo_prevodky', `${prefix}%`)
    .order('cislo_prevodky', { ascending: false })
    .limit(1);

  let nextNum = 1;
  if (data && data.length > 0) {
    const last = data[0].cislo_prevodky as string;
    const num = parseInt(last.replace(prefix, ''), 10);
    if (!isNaN(num)) nextNum = num + 1;
  }

  return `${prefix}${String(nextNum).padStart(3, '0')}`;
}

export async function POST(request: Request) {
  const { employee, error: authError } = await requireAdmin();
  if (authError) {
    const status = authError === 'Forbidden' ? 403 : 401;
    return NextResponse.json({ success: false, error: authError }, { status });
  }

  try {
    const body = await request.json();
    const assignments: Assignment[] = body.assignments;

    if (!assignments || !Array.isArray(assignments) || assignments.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Chybí přiřazení zaměstnanců k prodejnám' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 1. Fetch distribution data (same as rozdeleni/route.ts)
    const { data: rawData, error: rpcError } = await supabase.rpc('get_rozdeleni_data');

    if (rpcError) {
      console.error('[Prevodky] RPC error:', rpcError);
      return NextResponse.json(
        { success: false, error: 'Chyba při načítání dat z databáze' },
        { status: 500 }
      );
    }

    const data = rawData as RozdeleniData;

    if (!data.products || data.products.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Žádné produkty v podkladech cílových stavů' },
        { status: 400 }
      );
    }

    // 2. Build lookup maps (identical logic to rozdeleni/route.ts)
    const salesMap = new Map<string, number>();
    for (const s of data.sales) {
      salesMap.set(`${s.code}|${s.store}`, s.avg);
    }

    const salesZdibyMap = new Map<string, number>();
    for (const s of data.salesZdiby) {
      salesZdibyMap.set(s.code, s.avg);
    }

    const stockMap = new Map<string, number>();
    for (const s of data.stock) {
      stockMap.set(`${s.code}|${s.store}`, s.qty);
    }

    const zdibyMap = new Map<string, { qty: number; position: string }>();
    for (const z of data.zdiby) {
      zdibyMap.set(z.code, { qty: z.qty, position: z.position });
    }

    // 3. Calculate raw demands
    const rawDemands = new Map<string, Map<string, number>>();
    const productInfo = new Map<string, { name: string; code: string }>();

    for (const product of data.products) {
      const { code, name, ciloveStavy } = product;
      productInfo.set(code, { name, code });

      for (const store of DELIVERY_STORES) {
        if (SKIP_STORES.has(store)) continue;

        const cilVal = ciloveStavy[store];
        if (cilVal === undefined || cilVal <= 0) continue;

        const avgSales = salesMap.get(`${code}|${store}`) || 0;
        const target = avgSales > 0 ? avgSales : 1;
        const currentStock = stockMap.get(`${code}|${store}`) || 0;
        const deficit = target - currentStock;

        if (deficit <= target * DEFICIT_THRESHOLD) continue;

        const requested = Math.ceil(deficit);
        if (requested <= 0) continue;

        if (!rawDemands.has(code)) {
          rawDemands.set(code, new Map());
        }
        rawDemands.get(code)!.set(store, requested);
      }
    }

    // 4. Apply Zdiby constraint + proportional allocation
    const finalDeliveries = new Map<string, DeliveryItem[]>();
    for (const store of DELIVERY_STORES) {
      finalDeliveries.set(store, []);
    }

    for (const [code, storeDemands] of rawDemands) {
      const zdInfo = zdibyMap.get(code);
      const zasobaZdiby = zdInfo?.qty || 0;
      const pozice = zdInfo?.position || '';

      const avgZdiby = salesZdibyMap.get(code) || 0;
      const rezervaZdiby = avgZdiby / 2;

      const available = zasobaZdiby - rezervaZdiby;
      if (available <= 0) continue;

      let totalDemand = 0;
      for (const qty of storeDemands.values()) {
        totalDemand += qty;
      }

      const info = productInfo.get(code)!;

      if (available >= totalDemand) {
        for (const [store, qty] of storeDemands) {
          finalDeliveries.get(store)!.push({
            code,
            name: info.name,
            pocetKusu: qty,
            pozice,
          });
        }
      } else {
        const ratio = available / totalDemand;
        const allocated = new Map<string, number>();
        let allocatedTotal = 0;

        for (const [store, qty] of storeDemands) {
          const alloc = Math.floor(qty * ratio);
          allocated.set(store, alloc);
          allocatedTotal += alloc;
        }

        let remaining = Math.floor(available) - allocatedTotal;
        if (remaining > 0) {
          const losses: { store: string; loss: number }[] = [];
          for (const [store, qty] of storeDemands) {
            const ideal = qty * ratio;
            const actual = allocated.get(store)!;
            losses.push({ store, loss: ideal - actual });
          }
          losses.sort((a, b) => b.loss - a.loss);

          for (const { store } of losses) {
            if (remaining <= 0) break;
            allocated.set(store, allocated.get(store)! + 1);
            remaining--;
          }
        }

        for (const [store, qty] of allocated) {
          if (qty > 0) {
            finalDeliveries.get(store)!.push({
              code,
              name: info.name,
              pocetKusu: qty,
              pozice,
            });
          }
        }
      }
    }

    // 5. Create prevodky + items + tasks
    const assignmentMap = new Map<string, string>();
    for (const a of assignments) {
      assignmentMap.set(a.store, a.userId);
    }

    let createdCount = 0;
    const baseNumber = await getNextPrevodkaNumber(supabase);
    let baseNum = parseInt(baseNumber.split('-').pop()!, 10);

    for (const store of DELIVERY_STORES) {
      const items = finalDeliveries.get(store)!.filter((item) => item.pocetKusu > 0);
      if (items.length === 0) continue;

      const userId = assignmentMap.get(store);
      if (!userId) continue;

      const year = new Date().getFullYear();
      const cislo = `PV-${year}-${String(baseNum).padStart(3, '0')}`;
      baseNum++;

      // Create task first
      const taskId = `task-${crypto.randomUUID()}`;
      const { error: taskError } = await supabase.from('ukoly').insert({
        id: taskId,
        nazev: `Převodka ${cislo} → ${store}`,
        popis: `Vychystejte ${items.length} položek pro prodejnu ${store}.`,
        priorita: 'high',
        stav: 'new',
        vytvoril: employee!.id,
        vytvoreno: new Date().toISOString(),
        typ_prirazeni: 'employee',
        prirazeno_komu: userId,
        termin: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        opakovani: 'none',
        typ_ukolu: 'prevodka',
      });

      if (taskError) {
        console.error(`[Prevodky] Failed to create task for ${store}:`, taskError);
        continue;
      }

      // Create prevodka
      const prevodkaId = crypto.randomUUID();
      const { error: prevodkaError } = await supabase.from('prevodky').insert({
        id: prevodkaId,
        cislo_prevodky: cislo,
        zdrojovy_sklad: 'ALL_Zdiby',
        cilovy_sklad: store,
        stav: 'nova',
        prirazeno_komu: userId,
        vytvoril: employee!.id,
        ukol_id: taskId,
      });

      if (prevodkaError) {
        console.error(`[Prevodky] Failed to create prevodka for ${store}:`, prevodkaError);
        // Clean up task
        await supabase.from('ukoly').delete().eq('id', taskId);
        continue;
      }

      // Create items
      const sortedItems = items.sort((a, b) => a.pozice.localeCompare(b.pozice, 'cs'));
      const polozky = sortedItems.map((item, index) => ({
        prevodka_id: prevodkaId,
        kod: item.code,
        nazev: item.name,
        pozice: item.pozice || null,
        pozadovane_mnozstvi: item.pocetKusu,
        poradi: index,
      }));

      const { error: polozkyError } = await supabase.from('prevodky_polozky').insert(polozky);

      if (polozkyError) {
        console.error(`[Prevodky] Failed to create items for ${store}:`, polozkyError);
      }

      createdCount++;
    }

    return NextResponse.json({
      success: true,
      count: createdCount,
    });
  } catch (error) {
    console.error('[Prevodky] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Neznámá chyba';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

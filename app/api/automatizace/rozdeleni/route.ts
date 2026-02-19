import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { requireAdmin } from '@/lib/supabase/api-auth';
import { createClient } from '@/lib/supabase/server';

// Stores to generate sheets for (order = sheet order in Excel)
const DELIVERY_STORES = [
  'Bohnice', 'Brno', 'Butovice', 'Chodov', 'OC_Šestka', 'Prosek', 'Ústí', 'Vysočany', 'Zličín',
];

// Store names that don't have a Pohoda warehouse — skip delivery
const SKIP_STORES = new Set(['Č_Most', 'ALL_Zdiby']);

// Deficit threshold: only deliver when deficit > 30% of target
const DEFICIT_THRESHOLD = 0.3;

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

export async function GET() {
  const { error: authError } = await requireAdmin();
  if (authError) {
    const status = authError === 'Forbidden' ? 403 : 401;
    return NextResponse.json({ success: false, error: authError }, { status });
  }

  try {
    const supabase = await createClient();

    // 1. Fetch all data via RPC function
    const { data: rawData, error: rpcError } = await supabase.rpc('get_rozdeleni_data');

    if (rpcError) {
      console.error('[Rozdeleni] RPC error:', rpcError);
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

    // 2. Build lookup maps
    // Sales: code+store → avg monthly sales
    const salesMap = new Map<string, number>();
    for (const s of data.sales) {
      salesMap.set(`${s.code}|${s.store}`, s.avg);
    }

    // Zdiby sales: code → avg monthly sales from Vydané faktury
    const salesZdibyMap = new Map<string, number>();
    for (const s of data.salesZdiby) {
      salesZdibyMap.set(s.code, s.avg);
    }

    // Stock: code+store → current qty
    const stockMap = new Map<string, number>();
    for (const s of data.stock) {
      stockMap.set(`${s.code}|${s.store}`, s.qty);
    }

    // Zdiby: code → { qty, position }
    const zdibyMap = new Map<string, { qty: number; position: string }>();
    for (const z of data.zdiby) {
      zdibyMap.set(z.code, { qty: z.qty, position: z.position });
    }

    // 3. Calculate raw demands per product × store (before Zdiby constraint)
    // Structure: code → { store → requestedQty }
    const rawDemands = new Map<string, Map<string, number>>();
    const productInfo = new Map<string, { name: string; code: string }>();

    for (const product of data.products) {
      const { code, name, ciloveStavy } = product;
      productInfo.set(code, { name, code });

      for (const store of DELIVERY_STORES) {
        // Skip stores without Pohoda warehouse
        if (SKIP_STORES.has(store)) continue;

        // Check if product is configured for this store (value > 0)
        const cilVal = ciloveStavy[store];
        if (cilVal === undefined || cilVal <= 0) continue;

        // Target = average monthly sales, minimum 1 if configured for store
        const avgSales = salesMap.get(`${code}|${store}`) || 0;
        const target = avgSales > 0 ? avgSales : 1;

        // Current stock
        const currentStock = stockMap.get(`${code}|${store}`) || 0;

        // Deficit
        const deficit = target - currentStock;

        // Check 30% threshold
        if (deficit <= target * DEFICIT_THRESHOLD) continue;

        // Round up
        const requested = Math.ceil(deficit);
        if (requested <= 0) continue;

        if (!rawDemands.has(code)) {
          rawDemands.set(code, new Map());
        }
        rawDemands.get(code)!.set(store, requested);
      }
    }

    // 4. Apply Zdiby constraint + proportional allocation
    // Per product: check if Zdiby has enough stock
    const finalDeliveries = new Map<string, DeliveryItem[]>(); // store → items

    for (const store of DELIVERY_STORES) {
      finalDeliveries.set(store, []);
    }

    for (const [code, storeDemands] of rawDemands) {
      const zdInfo = zdibyMap.get(code);
      const zasobaZdiby = zdInfo?.qty || 0;
      const pozice = zdInfo?.position || '';

      // Reserve for Zdiby's own needs: half of monthly avg from Vydané faktury
      const avgZdiby = salesZdibyMap.get(code) || 0;
      const rezervaZdiby = avgZdiby / 2;

      const available = zasobaZdiby - rezervaZdiby;
      if (available <= 0) continue; // Nothing available to distribute

      // Total demand across all stores
      let totalDemand = 0;
      for (const qty of storeDemands.values()) {
        totalDemand += qty;
      }

      const info = productInfo.get(code)!;

      if (available >= totalDemand) {
        // Enough for all — deliver requested amounts
        for (const [store, qty] of storeDemands) {
          finalDeliveries.get(store)!.push({
            code,
            name: info.name,
            pocetKusu: qty,
            pozice: pozice,
          });
        }
      } else {
        // Proportional allocation
        const ratio = available / totalDemand;
        const allocated = new Map<string, number>();
        let allocatedTotal = 0;

        // First pass: floor allocation
        for (const [store, qty] of storeDemands) {
          const alloc = Math.floor(qty * ratio);
          allocated.set(store, alloc);
          allocatedTotal += alloc;
        }

        // Distribute remaining units to stores with largest fractional loss
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

        // Add to deliveries
        for (const [store, qty] of allocated) {
          if (qty > 0) {
            finalDeliveries.get(store)!.push({
              code,
              name: info.name,
              pocetKusu: qty,
              pozice: pozice,
            });
          }
        }
      }
    }

    // 5. Generate Excel
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'SYSTEM.PRO';
    workbook.created = new Date();

    for (const store of DELIVERY_STORES) {
      const items = finalDeliveries.get(store)!;

      // Filter items with pocetKusu > 0 and sort by pozice
      const sortedItems = items
        .filter((item) => item.pocetKusu > 0)
        .sort((a, b) => a.pozice.localeCompare(b.pozice, 'cs'));

      const worksheet = workbook.addWorksheet(store);

      // Column widths for A4 portrait
      worksheet.columns = [
        { header: 'Kód', key: 'kod', width: 18 },
        { header: 'Název', key: 'nazev', width: 40 },
        { header: 'Počet kusů', key: 'pocet', width: 10 },
        { header: 'Pozice', key: 'pozice', width: 12 },
      ];

      // Header style
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' },
      };

      // Add data rows
      for (const item of sortedItems) {
        worksheet.addRow({
          kod: item.code,
          nazev: item.name,
          pocet: item.pocetKusu,
          pozice: item.pozice,
        });
      }

      // Page setup for A4 portrait printing
      worksheet.pageSetup = {
        paperSize: 9, // A4
        orientation: 'portrait',
        fitToPage: false,
        printArea: sortedItems.length > 0
          ? `A1:D${sortedItems.length + 1}`
          : 'A1:D1',
      };

      // Repeat header on each page
      worksheet.pageSetup.printTitlesRow = '1:1';

      // Freeze header row
      worksheet.views = [{ state: 'frozen', ySplit: 1 }];
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const fileName = `rozdeleni-${new Date().toISOString().split('T')[0]}.xlsx`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('[Rozdeleni] Error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Neznámá chyba při generování';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

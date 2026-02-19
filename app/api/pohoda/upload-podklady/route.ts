import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import ExcelJS from 'exceljs';
import { requireAdmin } from '@/lib/supabase/api-auth';
import { createClient } from '@/lib/supabase/server';

const KNOWN_NON_STORE_COLUMNS = new Set([
  'Kód',
  'Kod',
  'Název',
  'Nazev',
  'Násobek_pro_ALL_Zdiby',
  'Nasobek_pro_ALL_Zdiby',
  'OBJ',
]);

const BATCH_SIZE = 500;

export async function POST(request: NextRequest) {
  const { error: authError } = await requireAdmin();
  if (authError) {
    const status = authError === 'Forbidden' ? 403 : 401;
    return NextResponse.json({ success: false, error: authError }, { status });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Nebyl nahran zadny soubor' },
        { status: 400 }
      );
    }

    const ext = path.extname(file.name).toLowerCase();
    if (ext !== '.xlsx') {
      return NextResponse.json(
        { success: false, error: 'Povoleny typ souboru: .xlsx' },
        { status: 400 }
      );
    }

    // Parse Excel
    const arrayBuffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      return NextResponse.json(
        { success: false, error: 'Excel neobsahuje zadny list' },
        { status: 400 }
      );
    }

    // Read header row
    const headerRow = worksheet.getRow(1);
    const headers: string[] = [];
    headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      headers[colNumber] = String(cell.text).trim();
    });

    // Find column indices
    const kodCol = headers.findIndex((h) => h === 'Kód' || h === 'Kod');
    const nazevCol = headers.findIndex((h) => h === 'Název' || h === 'Nazev');
    const nasobekCol = headers.findIndex(
      (h) => h === 'Násobek_pro_ALL_Zdiby' || h === 'Nasobek_pro_ALL_Zdiby'
    );
    const objCol = headers.findIndex((h) => h === 'OBJ');

    if (kodCol === -1) {
      return NextResponse.json(
        { success: false, error: 'Sloupec "Kód" nebyl nalezen v hlavicce' },
        { status: 400 }
      );
    }

    // Detect store columns (everything not in KNOWN_NON_STORE_COLUMNS)
    const storeColumns: { colIndex: number; name: string }[] = [];
    headers.forEach((h, i) => {
      if (h && !KNOWN_NON_STORE_COLUMNS.has(h)) {
        storeColumns.push({ colIndex: i, name: h });
      }
    });

    // Parse rows
    type RowData = {
      kod: string;
      nazev: string | null;
      cilove_stavy: Record<string, number>;
      nasobek_all_zdiby: number | null;
      obj: number;
      extra: Record<string, unknown>;
    };

    const rows: RowData[] = [];

    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return; // skip header

      // headers array is 1-indexed (from ExcelJS eachCell colNumber),
      // so findIndex already returns 1-based indices — no +1 needed for getCell
      const kodCell = row.getCell(kodCol);
      const kod = String(kodCell.text).trim();
      if (!kod) return;

      const nazev = nazevCol !== -1 ? String(row.getCell(nazevCol).text).trim() || null : null;

      const ciloveStavy: Record<string, number> = {};
      for (const sc of storeColumns) {
        const val = row.getCell(sc.colIndex).value;
        const num = typeof val === 'number' ? val : Number(val);
        if (!isNaN(num)) {
          ciloveStavy[sc.name] = num;
        }
      }

      let nasobekVal: number | null = null;
      if (nasobekCol !== -1) {
        const v = row.getCell(nasobekCol).value;
        const n = typeof v === 'number' ? v : Number(v);
        if (!isNaN(n)) nasobekVal = n;
      }

      let objVal = 0;
      if (objCol !== -1) {
        const v = row.getCell(objCol).value;
        const n = typeof v === 'number' ? v : Number(v);
        if (!isNaN(n)) objVal = n;
      }

      rows.push({
        kod,
        nazev,
        cilove_stavy: ciloveStavy,
        nasobek_all_zdiby: nasobekVal,
        obj: objVal,
        extra: {},
      });
    });

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Excel neobsahuje zadne radky s daty' },
        { status: 400 }
      );
    }

    // Write to DB
    const supabase = await createClient();

    // Delete all existing rows
    const { error: deleteError } = await supabase
      .from('podklady_cilovych_stavu')
      .delete()
      .gte('id', 0);

    if (deleteError) {
      console.error('Delete podklady error:', deleteError);
      return NextResponse.json(
        { success: false, error: 'Chyba pri mazani starych dat' },
        { status: 500 }
      );
    }

    // Batch insert
    const now = new Date().toISOString();
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE).map((r) => ({
        kod: r.kod,
        nazev: r.nazev,
        cilove_stavy: r.cilove_stavy,
        nasobek_all_zdiby: r.nasobek_all_zdiby,
        obj: r.obj,
        extra: r.extra,
        nahrano: now,
      }));

      const { error: insertError } = await supabase
        .from('podklady_cilovych_stavu')
        .insert(batch);

      if (insertError) {
        console.error(`Insert podklady batch ${i} error:`, insertError);
        return NextResponse.json(
          { success: false, error: `Chyba pri vkladani dat (batch ${Math.floor(i / BATCH_SIZE) + 1})` },
          { status: 500 }
        );
      }
    }

    // Update metadata
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    await supabase
      .from('pohoda_konfigurace')
      .update({
        posledni_upload_podkladu: now,
        podklady_pocet_radku: rows.length,
        podklady_nazev_souboru: sanitizedName,
      })
      .eq('id', 1);

    return NextResponse.json({
      success: true,
      pocetRadku: rows.length,
      sloupce: storeColumns.map((s) => s.name),
      filename: sanitizedName,
    });
  } catch (error) {
    console.error('Upload podklady error:', error);
    return NextResponse.json(
      { success: false, error: 'Chyba pri zpracovani souboru' },
      { status: 500 }
    );
  }
}

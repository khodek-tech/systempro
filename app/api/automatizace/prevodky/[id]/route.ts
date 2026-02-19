import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/api-auth';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError } = await requireAuth();
  if (authError) {
    return NextResponse.json({ success: false, error: authError }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const supabase = await createClient();

    // Update prevodka fields
    if (body.stav || body.poznamka !== undefined) {
      const updateData: Record<string, unknown> = {};

      if (body.stav) {
        updateData.stav = body.stav;

        // Set timestamps based on state
        const now = new Date().toISOString();
        switch (body.stav) {
          case 'picking':
            updateData.zahajeno = now;
            break;
          case 'vychystano':
            updateData.vychystano = now;
            break;
          case 'odeslano':
            updateData.odeslano = now;
            break;
          case 'potvrzeno':
            updateData.potvrzeno = now;
            break;
        }
      }

      if (body.poznamka !== undefined) {
        updateData.poznamka = body.poznamka;
      }

      const { error } = await supabase
        .from('prevodky')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('[Prevodky] Update failed:', error);
        return NextResponse.json(
          { success: false, error: 'Nepodařilo se aktualizovat převodku' },
          { status: 500 }
        );
      }
    }

    // Update item if polozkaId provided
    if (body.polozkaId) {
      const itemUpdate: Record<string, unknown> = {};

      if (body.skutecneMnozstvi !== undefined) {
        itemUpdate.skutecne_mnozstvi = body.skutecneMnozstvi;
      }
      if (body.vychystano !== undefined) {
        itemUpdate.vychystano = body.vychystano;
        if (body.vychystano) {
          itemUpdate.cas_vychystani = new Date().toISOString();
        }
      }

      const { error } = await supabase
        .from('prevodky_polozky')
        .update(itemUpdate)
        .eq('id', body.polozkaId);

      if (error) {
        console.error('[Prevodky] Item update failed:', error);
        return NextResponse.json(
          { success: false, error: 'Nepodařilo se aktualizovat položku' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Prevodky] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Neznámá chyba';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

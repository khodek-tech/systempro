import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/supabase/api-auth';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError } = await requireAdmin();
  if (authError) {
    const status = authError === 'Forbidden' ? 403 : 401;
    return NextResponse.json({ success: false, error: authError }, { status });
  }

  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get the prevodka to find its task
    const { data: prevodka, error: fetchError } = await supabase
      .from('prevodky')
      .select('id, stav, ukol_id')
      .eq('id', id)
      .single();

    if (fetchError || !prevodka) {
      return NextResponse.json(
        { success: false, error: 'Převodka nenalezena' },
        { status: 404 }
      );
    }

    if (prevodka.stav === 'zrusena') {
      return NextResponse.json(
        { success: false, error: 'Převodka je již zrušena' },
        { status: 400 }
      );
    }

    if (prevodka.stav === 'odeslano' || prevodka.stav === 'potvrzeno') {
      return NextResponse.json(
        { success: false, error: 'Nelze zrušit odeslanou nebo potvrzenou převodku' },
        { status: 400 }
      );
    }

    // Cancel the prevodka
    const { error: updateError } = await supabase
      .from('prevodky')
      .update({
        stav: 'zrusena',
        zruseno: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      console.error('[Prevodky] Cancel failed:', updateError);
      return NextResponse.json(
        { success: false, error: 'Nepodařilo se zrušit převodku' },
        { status: 500 }
      );
    }

    // Delete the associated task
    if (prevodka.ukol_id) {
      const { error: deleteError } = await supabase
        .from('ukoly')
        .delete()
        .eq('id', prevodka.ukol_id);

      if (deleteError) {
        console.error('[Prevodky] Failed to delete task:', deleteError);
        // Non-fatal: prevodka is already cancelled
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Prevodky] Cancel error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Neznámá chyba';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

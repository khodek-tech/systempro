import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const timestamp = new Date().toISOString();

  try {
    const supabase = await createClient();
    const { error } = await supabase.from('role').select('id').limit(1);

    if (error) {
      return NextResponse.json(
        { status: 'error', database: 'disconnected', timestamp },
        { status: 503 }
      );
    }

    return NextResponse.json({ status: 'ok', database: 'connected', timestamp });
  } catch {
    return NextResponse.json(
      { status: 'error', database: 'disconnected', timestamp },
      { status: 503 }
    );
  }
}

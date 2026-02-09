import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { requireAuth } from '@/lib/supabase/api-auth';
import { createClient } from '@/lib/supabase/server';

const ALLOWED_EXTENSIONS = ['.xlsx', '.xls', '.csv'];
const BUCKET = 'attachments';

export async function POST(request: NextRequest) {
  // Ověření přihlášení
  const { user, error: authError } = await requireAuth()
  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
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

    // Validace typu souboru
    const ext = path.extname(file.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        {
          success: false,
          error: `Nepovoleny typ souboru. Povolene typy: ${ALLOWED_EXTENSIONS.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Sanitizace nazvu souboru
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const timestamp = Date.now();
    const storagePath = `pohoda/${timestamp}-${sanitizedName}`;

    // Upload do Supabase Storage
    const supabase = await createClient();
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, file, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      });

    if (uploadError) {
      console.error('Pohoda upload error:', uploadError);
      return NextResponse.json(
        { success: false, error: 'Chyba pri nahravani souboru do uloziste' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      filename: sanitizedName,
      message: `Soubor ${sanitizedName} byl uspesne nahran`,
    });
  } catch (error) {
    console.error('Upload error:', error);

    return NextResponse.json(
      { success: false, error: 'Chyba pri nahravani souboru' },
      { status: 500 }
    );
  }
}

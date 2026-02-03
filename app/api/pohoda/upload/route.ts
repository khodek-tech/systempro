import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

const ALLOWED_EXTENSIONS = ['.xlsx', '.xls', '.csv'];
// Absolutni cesta k export slozce
const PROJECT_ROOT = path.resolve(process.cwd());
const EXPORT_DIR = path.join(PROJECT_ROOT, 'export');

export async function POST(request: NextRequest) {
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
    const filePath = path.join(EXPORT_DIR, sanitizedName);
    const gitFilePath = path.join('export', sanitizedName);

    console.log('Upload:', {
      originalName: file.name,
      sanitizedName,
      filePath,
      exportDir: EXPORT_DIR,
      projectRoot: PROJECT_ROOT,
    });

    // Zajistit ze slozka existuje
    await mkdir(EXPORT_DIR, { recursive: true });

    // Prevod souboru na buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ulozeni souboru
    await writeFile(filePath, buffer);
    console.log('Soubor ulozen:', filePath);

    // Pridat do gitu, commitnout a pushnout
    try {
      const gitOptions = { cwd: PROJECT_ROOT };

      // Pridat soubor do staged
      await execAsync(`git add "${gitFilePath}"`, gitOptions);

      // Zkontrolovat jestli jsou nejake staged zmeny
      try {
        await execAsync('git diff --staged --quiet', gitOptions);
        // Pokud projde bez chyby, nejsou zadne zmeny - soubor je stejny
        console.log('Soubor je stejny, zadne zmeny k commitnuti');
      } catch {
        // Jsou staged zmeny - commitnout a pushnout
        await execAsync(
          `git commit -m "Upload: ${sanitizedName}" --author="System <system@local>"`,
          gitOptions
        );
        await execAsync('git push', gitOptions);
        console.log('Soubor uspesne commitnut a pushnut');
      }
    } catch (gitError) {
      console.error('Git error:', gitError);
      // Soubor je ulozen, ale git selhal - stale vratime uspech
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

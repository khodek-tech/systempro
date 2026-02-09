import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { addMonths, addYears } from 'date-fns';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Fetch all approved tasks that have repeat != 'none'
  const { data: approvedTasks, error: tasksError } = await supabase
    .from('ukoly')
    .select('*')
    .eq('stav', 'approved')
    .neq('opakovani', 'none');

  if (tasksError || !approvedTasks) {
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }

  // Fetch all existing non-approved repeat children to avoid duplicates
  const sourceIds = approvedTasks.map((t) => t.id);
  const { data: existingRepeats } = await supabase
    .from('ukoly')
    .select('id, zdroj_opakovani')
    .in('zdroj_opakovani', sourceIds.length > 0 ? sourceIds : ['__none__'])
    .neq('stav', 'approved');

  const existingSourceIds = new Set((existingRepeats ?? []).map((t) => t.zdroj_opakovani));

  const now = new Date();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const newTasks: Record<string, any>[] = [];

  for (const task of approvedTasks) {
    if (existingSourceIds.has(task.id)) continue;

    const approvedAt = task.schvaleno ? new Date(task.schvaleno) : null;
    if (!approvedAt) continue;

    let shouldCreate = false;
    const taskDeadline = new Date(task.termin);
    let newDeadlineTime = taskDeadline.getTime();

    switch (task.opakovani) {
      case 'daily': {
        const daysSinceApproval = (now.getTime() - approvedAt.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceApproval >= 1) {
          shouldCreate = true;
          newDeadlineTime = taskDeadline.getTime() + (1000 * 60 * 60 * 24);
        }
        break;
      }
      case 'weekly': {
        const weeksSinceApproval = (now.getTime() - approvedAt.getTime()) / (1000 * 60 * 60 * 24 * 7);
        if (weeksSinceApproval >= 1) {
          shouldCreate = true;
          newDeadlineTime = taskDeadline.getTime() + (1000 * 60 * 60 * 24 * 7);
        }
        break;
      }
      case 'monthly': {
        const monthsSinceApproval = (now.getTime() - approvedAt.getTime()) / (1000 * 60 * 60 * 24 * 30);
        if (monthsSinceApproval >= 1) {
          shouldCreate = true;
          newDeadlineTime = addMonths(taskDeadline, 1).getTime();
        }
        break;
      }
      case 'yearly': {
        const yearsSinceApproval = (now.getTime() - approvedAt.getTime()) / (1000 * 60 * 60 * 24 * 365);
        if (yearsSinceApproval >= 1) {
          shouldCreate = true;
          newDeadlineTime = addYears(taskDeadline, 1).getTime();
        }
        break;
      }
    }

    if (shouldCreate) {
      newTasks.push({
        id: `task-${crypto.randomUUID()}`,
        nazev: task.nazev,
        popis: task.popis,
        priorita: task.priorita,
        stav: 'new',
        vytvoril: task.vytvoril,
        vytvoreno: new Date().toISOString(),
        typ_prirazeni: task.typ_prirazeni,
        prirazeno_komu: task.prirazeno_komu,
        termin: new Date(newDeadlineTime).toISOString(),
        opakovani: task.opakovani,
        zdroj_opakovani: task.id,
        precteno_prirazenym: false,
        precteno_zadavatelem: true,
      });
    }
  }

  if (newTasks.length > 0) {
    const { error: insertError } = await supabase.from('ukoly').insert(newTasks);
    if (insertError) {
      return NextResponse.json({ error: 'Failed to create repeating tasks', detail: insertError.message }, { status: 500 });
    }
  }

  return NextResponse.json({
    ok: true,
    checkedTasks: approvedTasks.length,
    createdTasks: newTasks.length,
  });
}

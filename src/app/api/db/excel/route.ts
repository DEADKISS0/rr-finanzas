import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { getSupabaseServer } from '@/lib/db/supabase';

function extractDashboard(ws: XLSX.WorkSheet) {
  const rows = XLSX.utils.sheet_to_json<(string | number | null)[]>(ws, { header: 1, defval: null });
  const snapshot: Record<string, unknown> = { synced_at: new Date().toISOString() };

  for (let i = 0; i < rows.length; i++) {
    const joined = (rows[i] || []).map((c) => String(c ?? '')).join(' ');
    if (joined.includes('DISPONIBLE HOY') && i + 1 < rows.length) {
      const next = rows[i + 1] || [];
      snapshot.disponible_hoy = Number(next[0]) || null;
      snapshot.runway_meses = Number(next[2]) || null;
      snapshot.semaforo = next[4] != null ? String(next[4]) : null;
      snapshot.burn_mensual = Number(next[6]) || null;
    }
  }
  return snapshot;
}

export async function POST(req: NextRequest) {
  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: 'Supabase no configurado. Set SUPABASE_URL y SUPABASE_SERVICE_KEY.' },
      { status: 503 }
    );
  }

  const form = await req.formData();
  const file = form.get('file');
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ ok: false, error: 'Archivo Excel requerido (field: file)' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const dashWs = wb.Sheets['00_Dashboard'];

  const runInsert = await supabase
    .from('sync_runs')
    .insert({ source: 'excel_finanzas', status: 'started' })
    .select('id')
    .single();

  const runId = runInsert.data?.id;
  let processed = 0;

  try {
    if (dashWs) {
      const snapshot = extractDashboard(dashWs);
      const { error } = await supabase.from('financial_snapshots').insert(snapshot);
      if (error) throw error;
      processed += 1;
    }

    if (runId) {
      await supabase.from('sync_runs').update({
        status: 'success',
        records_processed: processed,
        finished_at: new Date().toISOString(),
        details: { via: 'dashweb-upload', sheets: wb.SheetNames },
      }).eq('id', runId);
    }

    return NextResponse.json({ ok: true, processed, sheets: wb.SheetNames });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    if (runId) {
      await supabase.from('sync_runs').update({
        status: 'error',
        error_message: message,
        finished_at: new Date().toISOString(),
      }).eq('id', runId);
    }
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

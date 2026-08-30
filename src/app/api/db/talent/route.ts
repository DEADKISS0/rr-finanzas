import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/db/supabase';

export async function GET() {
  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ ok: false, candidates: [], source: 'none' });
  }

  const { data, error } = await supabase
    .from('talent_candidates')
    .select('id, local_id, rol_id, estado, nombre_completo, pool_de_talento, prioridad')
    .order('updated_at', { ascending: false });

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, candidates: data, source: 'supabase' });
}

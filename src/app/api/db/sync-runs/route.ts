import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/db/supabase';

export async function GET() {
  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ ok: false, runs: [], source: 'none' });
  }

  const { data, error } = await supabase
    .from('sync_runs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(30);

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, runs: data, source: 'supabase' });
}

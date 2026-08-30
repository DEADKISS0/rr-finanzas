import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/db/supabase';

export async function GET() {
  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ ok: false, snapshot: null, source: 'none' });
  }

  const { data, error } = await supabase
    .from('financial_snapshots')
    .select('*')
    .order('synced_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, snapshot: data, source: 'supabase' });
}
